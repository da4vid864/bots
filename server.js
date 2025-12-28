// server.js - REST API for WhatsApp Bot Manager
require('dotenv').config();
const express = require('express');
const http = require('http');
const sseController = require('./controllers/sseController');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const multer = require('multer');
const cors = require('cors');

const botDbService = require('./services/botDbService');
const leadDbService = require('./services/leadDbService');
const botConfigService = require('./services/botConfigService');
const schedulerService = require('./services/schedulerService');
const userService = require('./services/userService');
const botImageService = require('./services/botImageService');
const baileysManager = require('./services/baileysManager');
const scoringService = require('./services/scoringService');
const productService = require('./services/productService');
const storageService = require('./services/storageService');
const statsService = require('./services/statsService');
const pipelineService = require('./services/pipelineService');
const deepseekService = require('./services/deepseekService');

const { startSchedulerExecutor } = require('./services/schedulerExecutor');
const authRoutes = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const { handleStripeWebhook } = require('./controllers/webhookController');

const { attachUser, requireAdmin, requireAuth } = require('./auth/authMiddleware');
const tenantMiddleware = require('./middleware/tenantMiddleware');

require('./auth/passport');

const app = express();
const server = http.createServer(app);

// Tweak server timeouts to be slightly higher than SSE heartbeat to avoid premature socket closes
server.keepAliveTimeout = 65000; // 65s
server.headersTimeout = 70000; // 70s

const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 3000;

// === TRUST PROXY (Importante para cookies en producción detrás de load balancer) ===
app.set('trust proxy', 1);

// === CONFIGURACIÓN DE MULTER (memoria; se sube a R2 con storageService) ===
const upload = multer({ storage: multer.memoryStorage() });

// =================================================================
// === 1. WEBHOOK DE STRIPE (Debe ir ANTES de express.json) ===
// =================================================================
app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// === 2. MIDDLEWARES GLOBALES ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// CORS configuration for React frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Compression: exclude SSE endpoints and requests that accept text/event-stream
app.use(
  compression({
    filter: (req, res) => {
      try {
        if (req.headers?.accept?.includes('text/event-stream')) return false;
        if (req.path?.startsWith('/api/events')) return false;
      } catch (e) {}
      return compression.filter(req, res);
    },
  })
);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use(attachUser);
app.use(tenantMiddleware); // Establecer contexto del tenant después de identificar al usuario

// CSP
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' wss: ws: https://api.stripe.com; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
      "font-src 'self'; "
  );
  next();
});

// === RUTAS ===
app.use('/auth', authRoutes);
app.use('/subs', subscriptionRoutes);
app.use('/api/compliance', complianceRoutes);

// === API ROUTES ===

// Login status endpoint
app.get('/api/auth/status', (req, res) => {
  if (req.user) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
      },
    });
  }
  res.json({ authenticated: false });
});

// Landing page data endpoint
app.get('/api/landing', (req, res) => {
  const paymentError = req.query.error === 'payment_init_failed' || req.query.payment === 'cancelled';

  res.json({
    pageTitle: 'Casos de éxito que hablan por sí solos - botinteligente.com.mx',
    pageDescription: 'Confía en la inteligencia que vende por ti',
    canonicalUrl: 'https://botinteligente.com.mx/',
    updatedTime: '2025-11-21T17:02:12.086Z',
    publishedTime: '2025-10-12T04:37:04+00:00',
    modifiedTime: '2025-11-21T17:02:12.086Z',
    paymentError,
  });
});

// Dashboard data endpoint - requires admin access
app.get('/api/dashboard', requireAdmin, (req, res) => {
  const paymentSuccess = req.query.payment === 'success';
  res.json({
    user: req.user,
    paymentSuccess,
  });
});

// Sales data endpoint - requires authentication
app.get('/api/sales', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// === SSE EVENTS ROUTE ===
app.get('/api/events', requireAuth, sseController.eventsHandler);

// === FUNCIÓN: Obtener estado runtime del bot ===
function getRuntimeStatus(bot) {
  if (bot.status === 'disabled') return 'DISABLED';
  return baileysManager.getBotStatus(bot.id);
}

// === SSE: Stats update al owner ===
async function broadcastStatsUpdate(ownerEmail) {
  try {
    if (!ownerEmail) return;
    const stats = await statsService.getDashboardStats(ownerEmail);

    // ✅ SOLO al owner
    sseController.sendEventToUser(ownerEmail, 'STATS_UPDATE', { stats });
  } catch (error) {
    console.error('Error broadcasting stats update:', error);
  }
}

// Broadcast general (bots/leads a todos los dashboards conectados)
function broadcastToDashboard(message) {
  sseController.broadcastEvent(message.type, message.data);
}

// === MANEJO DE MENSAJES DE BOTS ===
async function handleBotMessage(botId, type, data) {
  switch (type) {
    case 'QR_GENERATED': {
      const botWithQR = await botDbService.getBotById(botId);
      broadcastToDashboard({
        type: 'UPDATE_BOT',
        data: { ...botWithQR, runtimeStatus: 'PENDING_QR', qr: data.qr },
      });
      break;
    }

    case 'CONNECTED': {
      const bot = await botDbService.getBotById(botId);
      broadcastToDashboard({
        type: 'UPDATE_BOT',
        data: { ...bot, runtimeStatus: 'CONNECTED' },
      });

      const ownerEmail = bot?.owneremail || bot?.ownerEmail;
      if (ownerEmail) await broadcastStatsUpdate(ownerEmail);
      break;
    }

    case 'DISCONNECTED': {
      const bot = await botDbService.getBotById(botId);
      broadcastToDashboard({
        type: 'UPDATE_BOT',
        data: { ...bot, runtimeStatus: 'DISCONNECTED' },
      });

      const ownerEmail = bot?.owneremail || bot?.ownerEmail;
      if (ownerEmail) await broadcastStatsUpdate(ownerEmail);
      break;
    }

    case 'UPDATE_BOT': {
      broadcastToDashboard({ type: 'UPDATE_BOT', data });
      break;
    }

    case 'NEW_QUALIFIED_LEAD': {
      broadcastToDashboard({ type: 'NEW_QUALIFIED_LEAD', data: data.lead });

      const bot = await botDbService.getBotById(botId);
      const ownerEmail = bot?.owneremail || bot?.ownerEmail;
      if (ownerEmail) await broadcastStatsUpdate(ownerEmail);
      break;
    }

    case 'NEW_MESSAGE_FOR_SALES': {
      broadcastToDashboard({ type: 'NEW_MESSAGE_FOR_SALES', data });
      break;
    }

    default:
      break;
  }
}

// === FUNCIÓN: Lanzar bot ===
async function launchBot(botConfig) {
  console.log(
    `🚀 Inicializando Baileys para bot: ${botConfig.name} (Estado inicial: ${botConfig.status})`
  );

  try {
    await baileysManager.initializeBaileysConnection(botConfig, (type, data) => {
      handleBotMessage(botConfig.id, type, data);
    });

    // Set initial status
    baileysManager.setBotStatus(botConfig.id, botConfig.status);
  } catch (error) {
    console.error(`❌ Error inicializando bot ${botConfig.id}:`, error);
    const bot = await botDbService.getBotById(botConfig.id);
    if (bot) {
      broadcastToDashboard({
        type: 'UPDATE_BOT',
        data: { ...bot, runtimeStatus: 'DISCONNECTED' },
      });

      const ownerEmail = bot?.owneremail || bot?.ownerEmail;
      if (ownerEmail) await broadcastStatsUpdate(ownerEmail);
    }
  }
}

// === FUNCIÓN: Matar bot (Solo para eliminar) ===
async function stopBot(botId) {
  console.log(`☠️ Desconectando sesión Baileys para bot ${botId}`);
  await baileysManager.disconnectBot(botId);
}

// === API: DESHABILITAR BOT ===
app.post('/api/disable-bot/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const ownerEmail = req.user.email;

  const bot = await botDbService.getBotByIdAndOwner(id, ownerEmail);
  if (!bot) return res.status(404).json({ message: 'Bot no encontrado' });

  await botDbService.updateBotStatus(id, 'disabled');
  baileysManager.setBotStatus(id, 'disabled');

  // refrescar stats owner
  await broadcastStatsUpdate(req.user.email);

  res.json({ message: 'Bot deshabilitado (Pausado)' });
});

// === API: HABILITAR BOT ===
app.post('/api/enable-bot/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const ownerEmail = req.user.email;

  const bot = await botDbService.getBotByIdAndOwner(id, ownerEmail);
  if (!bot) return res.status(404).json({ message: 'Bot no encontrado' });

  await botDbService.updateBotStatus(id, 'enabled');
  baileysManager.setBotStatus(id, 'enabled');

  // refrescar stats owner
  await broadcastStatsUpdate(req.user.email);

  res.json({ message: 'Bot habilitado (Reanudado)' });
});

// === MANEJO DE LEADS Y MENSAJES ===
async function handleAssignLead(leadId, vendorEmail) {
  try {
    const lead = await leadDbService.assignLead(leadId, vendorEmail);
    broadcastToDashboard({ type: 'LEAD_ASSIGNED', data: lead });
  } catch (error) {
    console.error('Error asignando lead:', error);
  }
}

async function handleSendMessage(leadId, message, vendorEmail) {
  try {
    const lead = await leadDbService.getLeadById(leadId);
    if (!lead) return;

    await leadDbService.addLeadMessage(leadId, vendorEmail, message);

    if (baileysManager.isBotReady(lead.bot_id)) {
      await baileysManager.sendMessage(lead.bot_id, lead.whatsapp_number, message);
    }

    broadcastToDashboard({
      type: 'MESSAGE_SENT',
      data: { leadId, sender: vendorEmail, message, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
  }
}

async function handleGetLeadMessages(userEmail, leadId) {
  try {
    const messages = await leadDbService.getLeadMessages(leadId, 1000);
    const lead = await leadDbService.getLeadById(leadId);

    sseController.sendEventToUser(userEmail, 'LEAD_MESSAGES', {
      leadId,
      lead,
      messages,
      totalMessages: messages.length,
    });
  } catch (error) {}
}

// === API ENDPOINTS FOR LEAD OPERATIONS ===
app.post('/api/assign-lead', requireAuth, async (req, res) => {
  const { leadId } = req.body;
  try {
    await handleAssignLead(leadId, req.user.email);
    res.json({ message: 'Lead assigned successfully' });
  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({ message: 'Error assigning lead' });
  }
});

app.post('/api/send-message', requireAuth, async (req, res) => {
  const { leadId, message } = req.body;
  try {
    await handleSendMessage(leadId, message, req.user.email);
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

app.get('/api/lead-messages/:leadId', requireAuth, async (req, res) => {
  const { leadId } = req.params;
  try {
    await handleGetLeadMessages(req.user.email, leadId);
    res.json({ message: 'Lead messages request sent' });
  } catch (error) {
    console.error('Error getting lead messages:', error);
    res.status(500).json({ message: 'Error getting lead messages' });
  }
});

// === API ENDPOINTS FOR PIPELINES ===

app.get('/api/pipelines', requireAuth, async (req, res) => {
  try {
    const pipelines = await pipelineService.getPipelines();
    res.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ message: 'Error fetching pipelines' });
  }
});

app.post('/api/pipelines', requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const pipeline = await pipelineService.createPipeline(name);
    res.json(pipeline);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({ message: 'Error creating pipeline' });
  }
});

app.put('/api/pipelines/stages/reorder', requireAuth, async (req, res) => {
  const { stages } = req.body;
  try {
    await pipelineService.reorderStages(stages);
    res.json({ message: 'Stages reordered' });
  } catch (error) {
    console.error('Error reordering stages:', error);
    res.status(500).json({ message: 'Error reordering stages' });
  }
});

app.post('/api/leads/:id/move', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { pipelineId, stageId } = req.body;
  try {
    await pipelineService.moveLead(id, pipelineId, stageId, req.user.email);
    res.json({ message: 'Lead moved successfully' });
  } catch (error) {
    console.error('Error moving lead:', error);
    res.status(500).json({ message: 'Error moving lead' });
  }
});

// === AI SUGGESTION ENDPOINT ===
app.post('/api/ai/suggest-reply', requireAuth, async (req, res) => {
  const { leadId, context, tone } = req.body;
  try {
    // 1. Fetch data
    const lead = await leadDbService.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    
    const messages = await leadDbService.getLeadMessages(leadId, 15); // limit 15
    const products = await productService.getProductsByBot(lead.bot_id); // for context

    // 2. Format history
    const historyText = messages.map(m => 
      `${m.sender === 'user' ? 'Customer' : 'Agent'}: ${m.message}`
    ).join('\n');

    // 3. Build System Prompt
    const systemPrompt = `
      Role: You are a helpful sales assistant.
      Context: You are replying to a customer on WhatsApp.
      Tone: ${tone || 'Professional yet friendly'}.
      Constraint: Keep replies under 60 words unless detailed info is requested.
      Customer Name: ${lead.name || 'Unknown'}
      Interested In Tags: ${lead.tags?.join(', ') || 'None'}
      Available Products: ${products.map(p => p.name).join(', ')}
      
      Instruction: Suggest the next reply to move the sale forward. Plain text only.
    `;

    // 4. Call DeepSeek (using existing service wrapper)
    // We pass history empty array because we included history in the prompt text for better control here,
    // or we can pass it as history. Let's pass it as a user message block to keep deepseekService simple.
    
    const prompt = `Here is the conversation history:\n${historyText}\n\nAdditional Context: ${context || ''}\n\nSuggest the next reply.`;
    
    const suggestion = await deepseekService.getChatReply(prompt, [], systemPrompt);
    
    res.json({ suggestion });

  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    res.status(500).json({ message: 'Error generating suggestion' });
  }
});


// === INITIAL DATA ENDPOINTS FOR SSE CLIENTS ===
app.get('/api/initial-data', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    let stats = null;
    try {
      stats = await statsService.getDashboardStats(user.email);
    } catch (e) {
      console.error('Stats error (non-fatal):', e.message);
      // fallback seguro
      stats = {
        botsTotal: 0,
        botsConnected: 0,
        botsDisconnected: 0,
        totalLeads: 0,
        qualifiedLeads: 0,
        newLeadsToday: 0,
      };
    }

    let botsData = [];
    let leadsData = [];

    if (user.role === 'admin') {
      const allBots = await botDbService.getAllBots();
      const userBots = allBots.filter((bot) => (bot.owneremail ?? bot.ownerEmail) === user.email);

      botsData = userBots.map((bot) => ({
        ...bot,
        runtimeStatus: getRuntimeStatus(bot),
      }));
    }

    try {
      const qualifiedLeads = await leadDbService.getQualifiedLeads();
      leadsData = qualifiedLeads;
    } catch (error) {
      console.error('Error getting qualified leads:', error);
    }

    // SSE (si ya está conectado)
    sseController.sendEventToUser(user.email, 'INIT', { bots: botsData });
    sseController.sendEventToUser(user.email, 'INIT_LEADS', { leads: leadsData });
    sseController.sendEventToUser(user.email, 'STATS_INIT', { stats });

    // Fallback JSON (para que el front cargue aunque falle SSE timing)
    res.json({ bots: botsData, leads: leadsData, stats });
  } catch (error) {
    console.error('Error sending initial data:', error);
    res.status(500).json({ message: 'Error sending initial data' });
  }
});

// === RESTO DE RUTAS API (CRUD BOTS, ETC) ===
app.post('/api/create-bot', requireAdmin, async (req, res) => {
  const { name, id, prompt } = req.body;
  const ownerEmail = req.user.email;

  if (!name || !id || !prompt) return res.status(400).json({ message: 'Datos incompletos' });

  try {
    const lastPort = await botDbService.getLastPort();
    const botConfig = {
      id,
      name,
      port: lastPort + 1,
      prompt,
      status: 'enabled',
      ownerEmail,
    };

    await botDbService.addBot(botConfig);
    await botConfigService.createBotFeatures(id);

    launchBot(botConfig);

    broadcastToDashboard({ type: 'NEW_BOT', data: { ...botConfig, runtimeStatus: 'STARTING' } });

    // stats del owner cambian (botsTotal)
    await broadcastStatsUpdate(ownerEmail);

    res.json({ message: 'Bot creado', bot: botConfig });
  } catch (error) {
    console.error('Error creando bot:', error);
    res.status(500).json({ message: 'Error creando bot' });
  }
});

app.patch('/api/edit-bot/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { prompt } = req.body;

  await botDbService.updateBotPrompt(id, prompt);
  stopBot(id);
  const bot = await botDbService.getBotById(id);
  if (bot.status !== 'disabled') launchBot(bot);

  // stats puede cambiar si el bot reconecta
  const ownerEmail = bot?.owneremail || bot?.ownerEmail;
  if (ownerEmail) await broadcastStatsUpdate(ownerEmail);

  res.json({ message: 'Prompt actualizado' });
});

app.delete('/api/delete-bot/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  stopBot(id);
  await schedulerService.deleteSchedulesByBot(id);
  await botConfigService.deleteBotFeatures(id);

  const bot = await botDbService.getBotById(id); // para ownerEmail antes de borrar
  await botDbService.deleteBotById(id);

  broadcastToDashboard({ type: 'BOT_DELETED', data: { id } });

  const ownerEmail = bot?.owneremail || bot?.ownerEmail || req.user.email;
  await broadcastStatsUpdate(ownerEmail);

  res.json({ message: 'Bot eliminado' });
});

// === RUTAS IMÁGENES (R2) ===
app.post('/api/bot/:botId/images', requireAdmin, upload.single('image'), async (req, res) => {
  const { botId } = req.params;
  const { keyword } = req.body;
  const file = req.file;

  if (!file || !keyword) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const { key, url } = await storageService.uploadImage(file.buffer, file.originalname, file.mimetype);

    const image = await botImageService.addImage(
      botId,
      key, // storageKey
      file.originalname,
      keyword,
      url
    );

    baileysManager.refreshBotImages(botId);

    res.json(image);
  } catch (error) {
    console.error('Error guardando imagen:', error);
    res.status(500).json({ message: 'Error guardando imagen' });
  }
});

app.get('/api/bot/:botId/images', requireAdmin, async (req, res) => {
  try {
    const images = await botImageService.getImagesByBot(req.params.botId);
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
});

app.delete('/api/images/:imageId', requireAdmin, async (req, res) => {
  try {
    const deleted = await botImageService.deleteImage(req.params.imageId);

    if (deleted && deleted.storage_key) {
      await storageService.deleteImage(deleted.storage_key);
      baileysManager.refreshBotImages(deleted.bot_id);
    }

    res.json({ message: 'Eliminada' });
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ message: 'Error' });
  }
});

// === APIs TEAM, FEATURES, SCHEDULES ===

// 1. API FEATURES (Configuración del Bot)
app.get('/api/bot/:id/features', requireAuth, async (req, res) => {
  try {
    const features = await botConfigService.getBotFeatures(req.params.id);
    res.json(features);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo features' });
  }
});

app.patch('/api/bot/:id/features', requireAuth, async (req, res) => {
  try {
    const updated = await botConfigService.updateBotFeatures(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando features' });
  }
});

// 2. API TEAM (Gestión de Equipo)
app.get('/api/team', requireAdmin, async (req, res) => {
  try {
    const members = await userService.getTeamMembers(req.user.email);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo equipo' });
  }
});

app.post('/api/team', requireAdmin, async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  try {
    const newMember = await userService.addTeamMember(email, role, req.user.email);
    res.json(newMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/team/:id/toggle', requireAdmin, async (req, res) => {
  try {
    await userService.toggleUserStatus(req.params.id, req.user.email);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando estado' });
  }
});

app.delete('/api/team/:id', requireAdmin, async (req, res) => {
  try {
    await userService.removeTeamMember(req.params.id, req.user.email);
    res.json({ message: 'Miembro eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando miembro' });
  }
});

// 3. API SCHEDULES (Horarios)
app.get('/api/bot/:id/schedules', requireAdmin, async (req, res) => {
  try {
    const schedules = await schedulerService.getSchedulesByBot(req.params.id);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo horarios' });
  }
});

app.post('/api/schedules', requireAdmin, async (req, res) => {
  const { botId, action, scheduledAt } = req.body;
  try {
    const schedule = await schedulerService.createSchedule(botId, action, scheduledAt, req.user.email);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creando horario' });
  }
});

app.delete('/api/schedules/:id', requireAdmin, async (req, res) => {
  try {
    await schedulerService.cancelSchedule(req.params.id);
    res.json({ message: 'Horario cancelado' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelando horario' });
  }
});

// === SCORING RULES API ===
app.get('/api/scoring-rules/:botId', requireAuth, async (req, res) => {
  try {
    const rules = await scoringService.getScoringRules(req.params.botId);
    res.json(rules);
  } catch (error) {
    console.error('Error getting scoring rules:', error);
    res.status(500).json({ message: 'Error getting scoring rules' });
  }
});

app.post('/api/scoring-rules/:botId', requireAdmin, async (req, res) => {
  try {
    const rule = await scoringService.createScoringRule(req.params.botId, req.body);
    res.json(rule);
  } catch (error) {
    console.error('Error creating scoring rule:', error);
    res.status(500).json({ message: 'Error creating scoring rule' });
  }
});

app.delete('/api/scoring-rules/:ruleId', requireAdmin, async (req, res) => {
  try {
    const { botId } = req.query;
    if (!botId) return res.status(400).json({ message: 'Bot ID required' });

    await scoringService.deleteScoringRule(req.params.ruleId, botId);
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    res.status(500).json({ message: 'Error deleting scoring rule' });
  }
});

// === PRODUCT CATALOG API ===
app.get('/api/products/:botId', requireAuth, async (req, res) => {
  try {
    const products = await productService.getProductsByBot(req.params.botId);
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Error getting products' });
  }
});

app.post('/api/products/:botId', requireAdmin, async (req, res) => {
  try {
    const product = await productService.addProduct(req.params.botId, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});
// === PRODUCT IMAGE UPLOAD (R2) ===
app.post('/api/products/:id/image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Imagen requerida' });

    // Subir a Cloudflare R2
    const { key, url } = await storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Guardar en BD (image_url y opcionalmente storage key)
    const updated = await productService.updateProductImage(req.params.id, {
      image_url: url,
      image_storage_key: key,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error subiendo imagen de producto:', error);
    res.status(500).json({ message: 'Error subiendo imagen de producto' });
  }
});

// 4. Catch-All for Frontend Routing (MUST BE LAST)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// ==========================================
// === INICIO SERVIDOR ===
async function startServer() {
  try {
    const { initializeDatabase } = require('./services/initDb');
    await initializeDatabase();

    startSchedulerExecutor(async (botId, action) => {
      console.log(`⏰ Ejecutando tarea programada: ${action} para ${botId}`);

      await botDbService.updateBotStatus(botId, action === 'enable' ? 'enabled' : 'disabled');

      const status = action === 'enable' ? 'enabled' : 'disabled';
      baileysManager.setBotStatus(botId, status);

      const bot = await botDbService.getBotById(botId);

      broadcastToDashboard({
        type: 'UPDATE_BOT',
        data: {
          ...bot,
          status,
          runtimeStatus: status === 'enabled' ? 'CONNECTED' : 'DISABLED',
        },
      });

      // ✅ stats update al owner del bot
      const ownerEmail = bot?.owneremail || bot?.ownerEmail;
      if (ownerEmail) await broadcastStatsUpdate(ownerEmail);
    });

    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 API Server corriendo en puerto ${PORT}`);

      const allBots = await botDbService.getAllBots();
      allBots.forEach((bot) => launchBot(bot));
    });
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

startServer();