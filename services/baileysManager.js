// services/baileysManager.js - VERSIÓN COMPLETA CON ANÁLISIS AUTOMÁTICO
let baileys;
let Boom;
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const axios = require('axios');

// Dynamically import ESM modules
async function loadBaileys() {
    if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
    }
    if (!Boom) {
        Boom = (await import('@hapi/boom')).Boom;
    }
    return { baileys, Boom };
}

const { getChatReply, detectUserIntent } = require('./deepseekService');
const { extractLeadInfo, generateFollowUpQuestion } = require('./leadExtractionService');
const botImageService = require('./botImageService');
const scoringService = require('./scoringService');
const productService = require('./productService');
const sseController = require('../controllers/sseController');
const chatAnalysisService = require('./chatAnalysisService');
const sessionPersistenceService = require('./sessionPersistenceService');
const { usePostgresAuthState } = require('./baileysAuthService');
const bulkAnalysisService = require('./bulkAnalysisService'); // NUEVO SERVICIO

const {
    getOrCreateLead,
    updateLeadInfo,
    qualifyLead,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    getLeadsByBot,
    getLeadById,
} = require('./leadDbService');

/**
 * In-memory Map for active sessions.
 * @type {Map<string, any>}
 */
const activeSessions = new Map();

/**
 * Initialize Baileys connection for a bot.
 */
async function initializeBaileysConnection(botConfig, onStatusUpdate) {
    const { id: botId, name: botName } = botConfig;

    console.log(`[${botId}] 🔍 Inicializando conexión Baileys para: ${botName}`);

    // 🆕 Verificar si hay credenciales válidas guardadas
    const hasValidCreds = await sessionPersistenceService.hasValidSessionCredentials(botId);
    if (hasValidCreds) {
        console.log(`[${botId}] ♻️  Reutilizando sesión anterior (sin necesidad de QR)`);
    }

    try {
        let fullBotConfig = botConfig;
        if (!botConfig.tenantId && !botConfig.tenant_id) {
            const botDbService = require('./botDbService');
            // Al no establecer un contexto, esto se ejecuta en el contexto del sistema/público
            // Si las políticas RLS lo permiten, obtendremos el bot.
            // Si necesitamos tenant_id, el bot devuelto debe tenerlo.
            const fullBot = await botDbService.getBotById(botId);
            if (fullBot) {
                fullBotConfig = fullBot;
                console.log(`[${botId}] ✅ Tenant ID recuperado: ${fullBot.tenantId || fullBot.tenant_id}`);
            } else {
                console.warn(`[${botId}] ⚠️ No se pudo obtener configuración completa del bot (¿Problema de RLS?)`);
            }
        }

        const { baileys } = await loadBaileys();
        const {
            makeWASocket,
            DisconnectReason,
            fetchLatestBaileysVersion,
            makeCacheableSignalKeyStore,
        } = baileys;

        // Use Postgres Auth State
        const { state, saveCreds } = await usePostgresAuthState(botId);

        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`[${botId}] 📦 Usando Baileys v${version.join('.')}, latest: ${isLatest}`);

        const logger = pino({ level: 'silent' });

        const socket = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        activeSessions.set(botId, {
            socket,
            botConfig: fullBotConfig,
            isReady: false,
            isPaused: fullBotConfig.status === 'disabled',
            availableImages: [],
            availableProducts: [],
            saveCreds,
            tenantId: fullBotConfig.tenantId || fullBotConfig.tenant_id,
        });

        await loadBotImages(botId);
        await loadBotProducts(botId);

        setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason);

        return socket;
    } catch (error) {
        console.error(`[${botId}] ❌ Error inicializando Baileys:`, error);
        throw error;
    }
}

function setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason) {
    const session = activeSessions.get(botId);
    if (!session) return;

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log(`[${botId}] 🔌 Estado de conexión:`, connection);

        if (qr) {
            try {
                const qrCodeUrl = await QRCode.toDataURL(qr);
                const botOwnerEmail = session.botConfig.ownerEmail;

                sseController.sendEventToUser(botOwnerEmail, 'QR_GENERATED', { qr: qrCodeUrl, botId });
                onStatusUpdate('QR_GENERATED', { qr: qrCodeUrl });
            } catch (error) {
                console.error(`[${botId}] ❌ Error generando QR:`, error);
            }
        }

        if (connection === 'open') {
  console.log(`[${botId}] ✅ WhatsApp conectado!`);
  session.isReady = true;

  const statusReport = session.isPaused ? 'DISABLED' : 'CONNECTED';
  const botOwnerEmail = session.botConfig.ownerEmail;

  // 🆕 CORREGIDO: Solo guardar metadata si hay tenantId
  try {
    const creds = session.socket?.authState?.creds || {};
    const tenantId = session.tenantId;
    
    if (tenantId) {
      await sessionPersistenceService.saveSessionMetadata(botId, {
        phoneNumber: creds.me?.id || null,
        status: 'connected',
        authenticatedAt: new Date(),
        metadata: {
          version: require('../package.json').version,
          connectedAt: new Date().toISOString()
        }
      });
    } else {
      console.log(`[${botId}] ℹ️  Skipping session metadata - no tenantId`);
    }
  } catch (err) {
    console.log(`[${botId}] ℹ️  No se pudo guardar metadata: ${err.message}`);
  }

  sseController.sendEventToUser(botOwnerEmail, 'CONNECTED', {
    status: session.isPaused ? 'disabled' : 'enabled',
    runtimeStatus: statusReport,
    botId,
  });

  onStatusUpdate('CONNECTED', {
    status: session.isPaused ? 'disabled' : 'enabled',
    runtimeStatus: statusReport,
  });

  // 🆕 NUEVO: Sincronizar y analizar TODOS los chats históricos
  if (!session.isPaused && session.tenantId) {
    console.log(`[${botId}] 🔄 Iniciando sincronización forzada...`);
    setTimeout(async () => {
      await forceHistorySync(botId);
      
      // Análisis masivo solo si hay tenantId
      setTimeout(async () => {
        if (session.tenantId) {
          console.log(`[${botId}] 🚀 Iniciando análisis automático de TODOS los chats...`);
          await autoAnalyzeAllChatsOnConnect(botId, socket, session);
        } else {
          console.log(`[${botId}] ⚠️  Skipping auto-analysis - no tenantId`);
        }
      }, 2000);
    }, 3000);
  }
} else if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(
                `[${botId}] ❌ Conexión cerrada. Reconectar: ${shouldReconnect}`,
                lastDisconnect?.error
            );

            session.isReady = false;

            // 🆕 Indicar si se necesitará QR en el próximo intento
            if (shouldReconnect) {
                sessionPersistenceService.hasValidSessionCredentials(botId).then(hasValidCreds => {
                    if (hasValidCreds) {
                        console.log(`[${botId}] ℹ️  Próximo reconexión: sin QR (credenciales válidas)`);
                    } else {
                        console.log(`[${botId}] ⚠️  Próximo reconexión: necesitará escanear QR`);
                    }
                });
            }

            const botOwnerEmail = session.botConfig.ownerEmail;
            sseController.sendEventToUser(botOwnerEmail, 'DISCONNECTED', { botId });
            onStatusUpdate('DISCONNECTED', {});

            if (shouldReconnect) {
                console.log(`[${botId}] 🔄 Intentando reconectar...`);
                setTimeout(() => initializeBaileysConnection(session.botConfig, onStatusUpdate), 5000);
            }
        }
    });

    socket.ev.on('creds.update', saveCreds);

    // También escuchar el evento de historial por si Baileys lo envía
    socket.ev.on('messaging-history.set', async ({ chats, contacts, messages, isLatest }) => {
        const currentSession = activeSessions.get(botId);
        if (!currentSession || currentSession.isPaused) return;

        console.log(`[${botId}] 📚 Evento de historial recibido: ${chats?.length || 0} chats, ${messages?.length || 0} mensajes`);

        if (messages && messages.length > 0) {
            processHistorySync(botId, chats || [], messages, currentSession).catch(err => {
                console.error(`[${botId}] ❌ Error procesando historial:`, err);
            });
        }
    });

    socket.ev.on('messages.upsert', async (messageUpdate) => {
        const currentSession = activeSessions.get(botId);
        console.log(`[${botId}] 📨 messages.upsert evento - Ready: ${currentSession?.isReady}, Paused: ${currentSession?.isPaused}`);
        
        if (!currentSession || !currentSession.isReady || currentSession.isPaused) {
            console.log(`[${botId}] ⏭️  Ignorando mensaje: ${!currentSession ? 'sin sesión' : currentSession.isReady ? 'pausado' : 'no listo'}`);
            return;
        }

        const { messages, type } = messageUpdate;
        console.log(`[${botId}] 📨 Mensajes recibidos: ${messages.length}, tipo: ${type}`);
        
        if (type !== 'notify') {
            console.log(`[${botId}] ⏭️  Tipo de mensaje ignorado: ${type} (solo 'notify' se procesa)`);
            return;
        }

        console.log(`[${botId}] ✅ Procesando ${messages.length} mensaje(s) de tipo 'notify'`);
        
        for (const msg of messages) {
            if (currentSession.tenantId) {
                const { runWithTenant } = require('./db');
                await runWithTenant(currentSession.tenantId, async () => {
                    await handleIncomingMessage(botId, msg);
                });
            } else {
                // Intento fallback de obtener el tenantId de la sesión si no está en el if
                console.warn(`[${botId}] ⚠️ Procesando mensaje SIN contexto de tenant explícito`);
                await handleIncomingMessage(botId, msg);
            }
        }
    });

    socket.ev.on('messages.update', async (updates) => {
        // Listener for message status changes
    });
}

/**
 * 🆕 Función para analizar automáticamente TODOS los chats al conectar
 */
async function autoAnalyzeAllChatsOnConnect(botId, socket, session) {
    try {
        console.log(`[${botId}] 🤖 Iniciando análisis automático de TODOS los chats...`);
        
        const tenantId = session.tenantId;
        
        if (!tenantId) {
            console.log(`[${botId}] ⚠️ No se encontró tenantId para análisis automático`);
            return;
        }

        console.log(`[${botId}] 📊 Analizando todos los chats para tenant: ${tenantId}`);
        
        // Usar el nuevo servicio de análisis masivo
        const result = await bulkAnalysisService.analyzeAllBotChats(botId, tenantId, socket);
        
        console.log(`[${botId}] ✅ Análisis automático completado:`);
        console.log(`[${botId}]    - Procesados: ${result.processed}`);
        console.log(`[${botId}]    - Nuevos analizados: ${result.created}`);
        console.log(`[${botId}]    - Actualizados: ${result.updated}`);
        console.log(`[${botId}]    - Errores: ${result.errors}`);
        
        // Notificar al frontend
        const botOwnerEmail = session.botConfig?.ownerEmail;
        if (botOwnerEmail) {
            sseController.sendEventToUser(
                botOwnerEmail,
                'AUTO_ANALYSIS_COMPLETED',
                { 
                    botId, 
                    message: 'Todos los chats han sido analizados automáticamente',
                    result: result,
                    timestamp: new Date().toISOString()
                }
            );
        }
        
    } catch (error) {
        console.error(`[${botId}] ❌ Error en análisis automático:`, error);
    }
}

/**
 * 🆕 Fuerza la sincronización del historial desde la DB
 */
async function forceHistorySync(botId) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        console.log(`[${botId}] ⚠️ Bot no está listo para sincronizar`);
        return;
    }

    console.log(`[${botId}] 🔄 Sincronización forzada iniciada...`);

    const tenantId = session.tenantId;
    let processedLeads = 0;
    let leadsUpdated = 0;

    try {
        const processLeadsFromDB = async () => {
            // Obtener todos los leads existentes del bot
            const existingLeads = await getLeadsByBot(botId);
            
            console.log(`[${botId}] 📋 Leads existentes en DB: ${existingLeads.length}`);

            for (const lead of existingLeads) {
                try {
                    // Si el lead ya tiene toda la info, saltar
                    if (isLeadComplete(lead)) {
                        processedLeads++;
                        continue;
                    }

                    // Obtener mensajes del lead de nuestra DB
                    const messages = await getLeadMessages(lead.id, 20);
                    
                    if (messages.length === 0) {
                        processedLeads++;
                        continue;
                    }

                    // Filtrar solo mensajes del usuario
                    const userMessages = messages
                        .filter(m => m.sender === 'user')
                        .map(m => m.message);

                    if (userMessages.length === 0) {
                        processedLeads++;
                        continue;
                    }

                    // Combinar últimos mensajes para análisis
                    const combinedText = userMessages.slice(-10).join('\n');

                    // Extraer información
                    console.log(`[${botId}] 🤖 Analizando lead ${lead.id} (${lead.whatsapp_number})...`);
                    
                    const extractedInfo = await extractLeadInfo(combinedText);
                    
                    if (Object.keys(extractedInfo).length > 0) {
                        const updateData = {};
                        if (extractedInfo.name && !lead.name) updateData.name = extractedInfo.name;
                        if (extractedInfo.email && !lead.email) updateData.email = extractedInfo.email;
                        if (extractedInfo.location && !lead.location) updateData.location = extractedInfo.location;
                        if (extractedInfo.phone && !lead.phone) updateData.phone = extractedInfo.phone;

                        if (Object.keys(updateData).length > 0) {
                            await updateLeadInfo(lead.id, updateData);
                            leadsUpdated++;
                            console.log(`[${botId}] ✅ Lead ${lead.id} actualizado:`, JSON.stringify(updateData));
                        }
                    }

                    // Aplicar scoring
                    const scoringResult = await scoringService.evaluateMessage(botId, combinedText);
                    if (scoringResult.scoreDelta !== 0 || scoringResult.tags.length > 0) {
                        await scoringService.applyScoring(lead.id, scoringResult);
                        console.log(`[${botId}] 🎯 Scoring: +${scoringResult.scoreDelta} pts`);
                    }

                    // Verificar si ahora está completo
                    const updatedLead = await getLeadById(lead.id);
                    if (updatedLead && updatedLead.status === 'capturing' && isLeadComplete(updatedLead)) {
                        await qualifyLead(lead.id);
                        leadsUpdated++;
                        console.log(`[${botId}] 🏆 Lead ${lead.id} calificado`);
                    }

                    processedLeads++;

                    // Pausa cada 3 leads para no sobrecargar la API de IA
                    if (processedLeads % 3 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (leadError) {
                    console.error(`[${botId}] ⚠️ Error procesando lead ${lead.id}:`, leadError.message);
                    processedLeads++;
                }
            }
        };

        // Ejecutar con tenant context
        if (tenantId) {
            const { runWithTenant } = require('./db');
            await runWithTenant(tenantId, processLeadsFromDB);
        } else {
            await processLeadsFromDB();
        }

        console.log(`[${botId}] ✅ Sincronización forzada completada:`);
        console.log(`   📊 Leads procesados: ${processedLeads}`);
        console.log(`   📝 Leads actualizados: ${leadsUpdated}`);

        // Notificar al frontend
        const botOwnerEmail = session.botConfig?.ownerEmail;
        if (botOwnerEmail) {
            sseController.sendEventToUser(botOwnerEmail, 'SYNC_COMPLETED', {
                botId,
                processedChats: processedLeads,
                leadsCreated: 0,
                leadsUpdated,
            });
        }

    } catch (error) {
        console.error(`[${botId}] ❌ Error en sincronización forzada:`, error);
    }
}

/**
 * Procesa el historial de mensajes enviado por Baileys
 */
async function processHistorySync(botId, chats, messages, session) {
    console.log(`[${botId}] 🔄 Procesando historial de Baileys...`);

    const tenantId = session.tenantId;
    let processedChats = 0;
    let leadsCreated = 0;
    let leadsUpdated = 0;

    // Agrupar mensajes por chat
    const messagesByChat = {};
    for (const msg of messages) {
        const chatId = msg.key?.remoteJid;
        if (!chatId) continue;
        
        if (chatId.endsWith('@g.us') || chatId.endsWith('@broadcast')) continue;
        
        if (!messagesByChat[chatId]) {
            messagesByChat[chatId] = [];
        }
        messagesByChat[chatId].push(msg);
    }

    console.log(`[${botId}] 📊 Chats individuales: ${Object.keys(messagesByChat).length}`);

    for (const [chatId, chatMessages] of Object.entries(messagesByChat)) {
        try {
            const result = await processSingleChatHistory(botId, chatId, chatMessages, tenantId, session);
            processedChats++;
            
            if (result.created) leadsCreated++;
            if (result.updated) leadsUpdated++;

            if (processedChats % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`[${botId}] ❌ Error procesando chat ${chatId}:`, error.message);
        }
    }

    console.log(`[${botId}] ✅ Historial procesado:`);
    console.log(`   📊 Chats: ${processedChats}`);
    console.log(`   🆕 Creados: ${leadsCreated}`);
    console.log(`   📝 Actualizados: ${leadsUpdated}`);

    const botOwnerEmail = session.botConfig?.ownerEmail;
    if (botOwnerEmail) {
        sseController.sendEventToUser(botOwnerEmail, 'SYNC_COMPLETED', {
            botId,
            processedChats,
            leadsCreated,
            leadsUpdated,
        });
    }
}

/**
 * Procesa un chat individual del historial
 */
async function processSingleChatHistory(botId, chatId, messages, tenantId, session) {
    const result = { created: false, updated: false };

    const processChat = async () => {
        let lead = await getOrCreateLead(botId, chatId);
        if (!lead) {
            return result;
        }

        const existingMessages = await getLeadMessages(lead.id, 1);
        if (existingMessages.length === 0) {
            result.created = true;
            console.log(`[${botId}] 🆕 Nuevo lead: ${chatId}`);
        }

        const userMessages = [];
        
        const sortedMessages = messages.sort((a, b) => {
            const timeA = Number(a.messageTimestamp) || 0;
            const timeB = Number(b.messageTimestamp) || 0;
            return timeA - timeB;
        });

        for (const msg of sortedMessages) {
            const content = getMessageContent(msg.message);
            if (!content) continue;

            const isFromMe = msg.key?.fromMe || false;
            const sender = isFromMe ? 'bot' : 'user';

            if (result.created) {
                try {
                    await addLeadMessage(lead.id, sender, content);
                } catch (e) {
                    // Ignorar duplicados
                }
            }

            if (!isFromMe) {
                userMessages.push(content);
            }
        }

        if (userMessages.length > 0 && !isLeadComplete(lead)) {
            const combinedText = userMessages.slice(-10).join('\n');
            
            try {
                console.log(`[${botId}] 🤖 Analizando ${chatId}...`);
                const extractedInfo = await extractLeadInfo(combinedText);
                
                if (Object.keys(extractedInfo).length > 0) {
                    const updateData = {};
                    if (extractedInfo.name && !lead.name) updateData.name = extractedInfo.name;
                    if (extractedInfo.email && !lead.email) updateData.email = extractedInfo.email;
                    if (extractedInfo.location && !lead.location) updateData.location = extractedInfo.location;
                    if (extractedInfo.phone && !lead.phone) updateData.phone = extractedInfo.phone;

                    if (Object.keys(updateData).length > 0) {
                        lead = await updateLeadInfo(lead.id, updateData);
                        result.updated = true;
                        console.log(`[${botId}] ✅ Actualizado:`, JSON.stringify(updateData));
                    }
                }

                const scoringResult = await scoringService.evaluateMessage(botId, combinedText);
                if (scoringResult.scoreDelta !== 0 || scoringResult.tags.length > 0) {
                    await scoringService.applyScoring(lead.id, scoringResult);
                    result.updated = true;
                }

                lead = await getLeadById(lead.id);

                if (lead && lead.status === 'capturing' && isLeadComplete(lead)) {
                    await qualifyLead(lead.id);
                    result.updated = true;
                    console.log(`[${botId}] 🏆 Lead calificado: ${lead.id}`);

                    if (session.botConfig?.ownerEmail) {
                        sseController.sendEventToUser(session.botConfig.ownerEmail, 'NEW_QUALIFIED_LEAD', {
                            lead,
                            botId,
                            source: 'sync',
                        });
                    }
                }

            } catch (aiError) {
                console.error(`[${botId}] ⚠️ Error IA:`, aiError.message);
            }
        }

        return result;
    };

    if (tenantId) {
        const { runWithTenant } = require('./db');
        return await runWithTenant(tenantId, processChat);
    } else {
        return await processChat();
    }
}

async function handleIncomingMessage(botId, msg) {
    const session = activeSessions.get(botId);
    if (!session || !session.isReady || session.isPaused) return;

    if (!msg.message || msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) return;

    const senderId = msg.key.remoteJid;
    const userMessage = getMessageContent(msg.message);

    if (!userMessage) return;

    console.log(`[${botId}] 📩 Mensaje de ${senderId}: ${userMessage}`);

    try {
        let lead;
        
        // Función auxiliar para operaciones con leads
        const processLeadOperations = async () => {
            lead = await getOrCreateLead(botId, senderId);
            if (!lead || !lead.id) return;
    
            await addLeadMessage(lead.id, 'user', userMessage);
        };

        // Si tenemos tenantId en la sesión y NO estamos ya en un contexto (chequeo simple), usamos runWithTenant
        // Nota: Si handleIncomingMessage ya fue llamado dentro de runWithTenant en upsert, esto es anidado seguro.
        if (session.tenantId) {
             const { runWithTenant } = require('./db');
             await runWithTenant(session.tenantId, processLeadOperations);
        } else {
             await processLeadOperations();
        }
        
        if (!lead || !lead.id) return;

        let skipAiGeneration = false;

        // Intent detection
        try {
            const isImageIntent = await detectUserIntent(userMessage);
            if (isImageIntent) {
                console.log(`[${botId}] [Intent] Usuario pidió imagen.`);

                const msgLower = userMessage.toLowerCase();

                let matchedProduct = null;
                if (session.availableProducts && session.availableProducts.length > 0) {
                    matchedProduct = session.availableProducts.find((p) => {
                        const name = (p.name || '').toLowerCase();
                        const sku = (p.sku || '').toLowerCase();
                        const desc = (p.description || '').toLowerCase();
                        const tags = Array.isArray(p.tags)
                            ? p.tags.join(' ').toLowerCase()
                            : (p.tags || '').toLowerCase();

                        const msgWords = msgLower.split(/\s+/).filter(Boolean);

                        return (
                            (sku && msgLower.includes(sku)) ||
                            (name && msgLower.includes(name)) ||
                            (tags && tags.split(/\s+/).some((t) => t && msgLower.includes(t))) ||
                            (desc && desc.length > 0 && msgWords.some((w) => w.length >= 4 && desc.includes(w)))
                        );
                    });

                    if (!matchedProduct) matchedProduct = session.availableProducts[0];
                }

                if (matchedProduct?.image_url) {
                    const caption =
                        `*${matchedProduct.name}*\n` +
                        `${matchedProduct.description ? matchedProduct.description + '\n\n' : '\n'}` +
                        `💰 Precio: ${matchedProduct.price} ${matchedProduct.currency}\n` +
                        `📦 Stock: ${matchedProduct.stock_status || 'in_stock'}`;

                    await sendImageUrl(botId, senderId, matchedProduct.image_url, caption);
                    await addLeadMessage(lead.id, 'bot', `[Imagen de producto enviada: ${matchedProduct.sku || matchedProduct.name}]`);
                    skipAiGeneration = true;
                } else {
                    let imageMedia = null;
                    const caption = '¡Aquí tienes una imagen! 📸';

                    if (session.availableImages && session.availableImages.length > 0) {
                        const matchedImage = session.availableImages.find((img) =>
                            msgLower.includes((img.keyword || '').toLowerCase())
                        );
                        const imageToUse = matchedImage || session.availableImages[0];

                        if (imageToUse) {
                            imageMedia = await botImageService.getImageMedia(imageToUse.keyword, botId);
                            if (imageMedia) imageMedia.caption = caption;
                        }
                    }

                    if (imageMedia) {
                        await sendImage(botId, senderId, imageMedia);
                        await addLeadMessage(lead.id, 'bot', `[Imagen enviada: ${caption}]`);
                        skipAiGeneration = true;
                    } else {
                        const noImgMsg =
                            'Puedo enviarte fotos, pero por ahora no tengo una imagen disponible para esa opción. ' +
                            '¿Qué modelo te interesa (o cuál SKU) para enviarte la foto exacta?';
                        await sendMessage(botId, senderId, noImgMsg);
                        await addLeadMessage(lead.id, 'bot', noImgMsg);
                        skipAiGeneration = true;
                    }
                }
            }
        } catch (intentError) {
            console.error(`[${botId}] ⚠️ Error in intent detection:`, intentError);
        }

        // Scoring
        try {
            const evaluation = await scoringService.evaluateMessage(botId, userMessage);

            if (evaluation.scoreDelta !== 0 || evaluation.tags.length > 0) {
                lead = await scoringService.applyScoring(lead.id, evaluation);
                console.log(`[${botId}] 🎯 Scoring: ${evaluation.scoreDelta} pts, Tags: ${evaluation.tags.join(', ')}, Score actual: ${lead.score}`);
            }

            if (evaluation.responses && evaluation.responses.length > 0) {
                for (const responseText of evaluation.responses) {
                    await sendMessage(botId, senderId, responseText);
                    await addLeadMessage(lead.id, 'bot', responseText);
                }
                skipAiGeneration = true;
            }

            console.log(`[${botId}] 📊 Check calificación - Score: ${lead.score} (>=50?), Status: ${lead.status} (capturing?)`);
            
            if (lead.score >= 50 && lead.status === 'capturing') {
                console.log(`[${botId}] ✅ CALIFICANDO LEAD: ${senderId}`);
                lead = await qualifyLead(lead.id);
                const qualMsg = '¡Felicidades! Has calificado para atención prioritaria. Un asesor revisará tu caso pronto.';
                await sendMessage(botId, senderId, qualMsg);
                await addLeadMessage(lead.id, 'bot', qualMsg);

                sseController.sendEventToUser(session.botConfig.ownerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                
                // 🆕 Analizar el chat completo cuando se califica
                console.log(`[${botId}] 📊 Llamando analyzeLeadChat después de calificación...`);
                await analyzeLeadChat(botId, lead, session.tenantId);
                return;
            }
        } catch (scoringError) {
            console.error(`[${botId}] ❌ Error en scoring:`, scoringError);
        }

        if (lead.status === 'assigned') {
            console.log(`[${botId}] 📊 Lead asignado - Analizando chat incrementalmente...`);
            
            // 🆕 Analizar chats de leads asignados para mantener pipeline actualizado
            await analyzeLeadChat(botId, lead, session.tenantId);
            
            sseController.sendEventToUser(session.botConfig.ownerEmail, 'NEW_MESSAGE_FOR_SALES', {
                leadId: lead.id,
                from: senderId,
                message: userMessage,
                botId,
            });
            return;
        }

        if (lead.status === 'capturing' && !skipAiGeneration) {
            const extractedInfo = await extractLeadInfo(userMessage);
            if (Object.keys(extractedInfo).length > 0) {
                lead = await updateLeadInfo(lead.id, extractedInfo);
            }

            if (isLeadComplete(lead)) {
                lead = await qualifyLead(lead.id);
                const finalMsg = '¡Perfecto! Ya tengo toda tu información. Un asesor te contactará pronto. 🎉';
                await sendMessage(botId, senderId, finalMsg);
                await addLeadMessage(lead.id, 'bot', finalMsg);

                sseController.sendEventToUser(session.botConfig.ownerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                
                // 🆕 Analizar el chat completo cuando se califica
                await analyzeLeadChat(botId, lead, session.tenantId);
                return;
            }

            const followUpQuestion = await generateFollowUpQuestion(lead);
            let promptWithContext = session.botConfig.prompt;

            if (session.availableImages.length > 0) {
                const keywords = session.availableImages.map((img) => img.keyword).join(', ');
                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE IMÁGENES]:
                Tienes acceso a imágenes visuales sobre los siguientes temas: [${keywords}].
                Si el usuario pregunta explícitamente por alguno de estos temas o si crees que una imagen ayudaría a vender mejor,
                DEBES incluir la etiqueta [ENVIAR_IMAGEN: palabra_clave] al final de tu respuesta.`;
            }

            if (session.availableProducts && session.availableProducts.length > 0) {
                const productList = session.availableProducts
                    .map((p) => `[SKU: ${p.sku}] ${p.name} - ${p.price} ${p.currency}`)
                    .join('\n');

                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE PRODUCTOS]:
                Tienes acceso a los siguientes productos:
                ${productList}

                Si el usuario pregunta por uno de estos productos o muestra interés claro, usa la etiqueta $$ SEND_PRODUCT: SKU $$ para enviarlo.
                No inventes productos que no estén en la lista.`;
            }

            const messages = await getLeadMessages(lead.id, 20);
            const historyMessages = messages.slice(0, -1);

            const history = historyMessages.map((m) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.message,
            }));

            const aiResponse = await getChatReply(userMessage, history, promptWithContext);
            let botReply = followUpQuestion ? `${aiResponse}\n\n${followUpQuestion}` : aiResponse;

            const imageTagRegex = /$$ENVIAR_IMAGEN:\s*([^$$]+)\]/i;
            const match = botReply.match(imageTagRegex);
            let imageMedia = null;

            if (match) {
                const keyword = match[1].trim().toLowerCase();
                imageMedia = await botImageService.getImageMedia(keyword, botId);
                botReply = botReply.replace(match[0], '').trim();
            }

            const productTagRegex = /\$\$\s*SEND_PRODUCT:\s*([\w-]+)\s*\$\$/i;
            const productMatch = botReply.match(productTagRegex);
            let productToSend = null;

            if (productMatch) {
                const sku = productMatch[1].trim();
                productToSend = session.availableProducts.find((p) => p.sku === sku);
                botReply = botReply.replace(productMatch[0], '').trim();
            }

            if (botReply) {
                await sendMessage(botId, senderId, botReply);
                await addLeadMessage(lead.id, 'bot', botReply);
            }

            if (imageMedia) {
                try {
                    await sendImage(botId, senderId, imageMedia);
                    await addLeadMessage(lead.id, 'bot', `[Imagen enviada: ${imageMedia.caption}]`);
                } catch (imgError) {
                    console.error(`[${botId}] ❌ Error enviando imagen:`, imgError);
                }
            }

            if (productToSend) {
                try {
                    const caption =
                        `*${productToSend.name}*\n\n` +
                        `${productToSend.description || ''}\n\n` +
                        `💰 Precio: ${productToSend.price} ${productToSend.currency}`;

                    if (productToSend.image_url) {
                        await sendImageUrl(botId, senderId, productToSend.image_url, caption);
                    } else {
                        await sendMessage(botId, senderId, caption);
                    }

                    await addLeadMessage(lead.id, 'bot', `[Producto enviado: ${productToSend.sku}]`);

                    await scoringService.applyScoring(lead.id, {
                        scoreDelta: 10,
                        tags: ['interested_in_product', `product_${productToSend.sku}`],
                        responses: [],
                    });
                } catch (prodError) {
                    console.error(`[${botId}] ❌ Error enviando producto:`, prodError);
                }
            }
        }
    } catch (error) {
        console.error(`[${botId}] ❌ Error procesando mensaje:`, error);
        
        if (error.message && (error.message.includes('Bad MAC') || error.message.includes('decrypt'))) {
            console.warn(`[${botId}] ⚠️ Error de decryption detectado.`);
            const currentSession = activeSessions.get(botId);
            if (currentSession && currentSession.socket) {
                try {
                    await currentSession.socket.end();
                } catch (closeError) {
                    console.error(`[${botId}] Error cerrando socket:`, closeError);
                }
            }
        }
    }
}

function getMessageContent(message) {
    if (!message) return null;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    if (message.documentMessage?.caption) return message.documentMessage.caption;
    return null;
}

async function loadBotImages(botId) {
    const session = activeSessions.get(botId);
    if (!session) return;

    try {
        session.availableImages = await botImageService.getImagesByBot(botId);
        console.log(`[${botId}] 🖼️ Imágenes cargadas: ${session.availableImages.length}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando imágenes:`, error);
    }
}

async function loadBotProducts(botId) {
    const session = activeSessions.get(botId);
    if (!session) return;

    try {
        session.availableProducts = await productService.getProductsByBot(botId);
        console.log(`[${botId}] 🛍️ Productos cargados: ${session.availableProducts.length}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando productos:`, error);
    }
}

async function sendMessage(botId, to, message) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo`);
    }

    try {
        await session.socket.sendMessage(to, { text: message });
        console.log(`[${botId}] ✅ Mensaje enviado a ${to}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error enviando mensaje:`, error);
        throw error;
    }
}

async function sendImage(botId, to, mediaObject) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo`);
    }

    try {
        await session.socket.sendMessage(to, mediaObject);
        console.log(`[${botId}] ✅ Imagen enviada a ${to}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error enviando imagen:`, error);
        throw error;
    }
}

async function sendImageUrl(botId, to, imageUrl, caption = '') {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo`);
    }

    try {
        await session.socket.sendMessage(to, {
            image: { url: imageUrl },
            caption,
        });
        console.log(`[${botId}] ✅ Imagen(URL) enviada a ${to}`);
        return;
    } catch (err) {
        console.warn(`[${botId}] ⚠️ Falló URL, intentando Buffer...`);
    }

    const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);

    await session.socket.sendMessage(to, {
        image: buffer,
        caption,
    });
    console.log(`[${botId}] ✅ Imagen(Buffer) enviada a ${to}`);
}

function setBotStatus(botId, status) {
    const session = activeSessions.get(botId);
    if (!session) return;

    session.isPaused = status === 'disabled';
    console.log(`[${botId}] ${session.isPaused ? '⏸️ PAUSADO' : '▶️ REANUDADO'}`);

    sseController.sendEventToUser(session.botConfig.ownerEmail, 'UPDATE_BOT', {
        status,
        runtimeStatus: session.isPaused ? 'DISABLED' : 'CONNECTED',
        botId,
    });
}

async function refreshBotImages(botId) {
    console.log(`[${botId}] 🔄 Recargando imágenes`);
    await loadBotImages(botId);
}

function getBotStatus(botId) {
    const session = activeSessions.get(botId);
    if (!session) return 'DISCONNECTED';
    if (session.isPaused) return 'DISABLED';
    if (!session.isReady) return 'STARTING';
    return 'CONNECTED';
}

/**
 * Analiza un chat después de procesar mensajes
 * Se llama automáticamente para crear/actualizar el registro en analyzed_chats
 */
async function analyzeLeadChat(botId, lead, tenantId) {
    try {
        if (!tenantId || !lead || !lead.id) {
            console.log(`[${botId}] ⏭️  analyzeLeadChat abortado: tenantId=${!!tenantId}, lead=${!!lead}, leadId=${lead?.id}`);
            return;
        }

        console.log(`[${botId}] 🔍 Iniciando análisis de chat para lead ${lead.whatsapp_number}...`);

        // Obtener los últimos mensajes del lead
        const messages = await getLeadMessages(lead.id, 50);
        console.log(`[${botId}] 📝 Mensajes encontrados: ${messages.length}`);
        
        if (messages.length < 2) {
            console.log(`[${botId}] ⏭️  Insuficientes mensajes para análisis (${messages.length} < 2)`);
            return;
        }

        // Formatear mensajes para análisis
        const formattedMessages = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.message
        }));

        const session = activeSessions.get(botId);
        const botPrompt = session?.botConfig?.prompt || '';

        console.log(`[${botId}] 🤖 Llamando chatAnalysisService.analyzeChatConversation...`);
        
        // Ejecutar análisis con chatAnalysisService
        await chatAnalysisService.analyzeChatConversation(
            {
                botId,
                contactPhone: lead.whatsapp_number,
                contactName: lead.name || null,
                contactEmail: lead.email || null,
                messages: formattedMessages,
                botPrompt
            },
            tenantId
        );

        console.log(`[${botId}] ✅ Chat de ${lead.whatsapp_number} analizado y clasificado`);

        // Notificar al frontend sobre el nuevo chat analizado
        if (session?.botConfig?.ownerEmail) {
            sseController.sendEventToUser(
                session.botConfig.ownerEmail,
                'CHAT_ANALYZED',
                {
                    botId,
                    leadId: lead.id,
                    phone: lead.whatsapp_number,
                    message: 'Chat analizado y clasificado en pipeline'
                }
            );
        }
    } catch (error) {
        console.error(`[${botId}] ⚠️ Error analizando chat:`, error.message);
        // No lanzar error, es una tarea secundaria
    }
}

/**
 * 🆕 Sincronizar y analizar TODOS los chats históricos cuando se conecta
 * @param {string} botId - ID del bot
 * @param {object} socket - Socket de Baileys
 * @param {string} tenantId - ID del tenant
 */
async function syncAndAnalyzeAllChats(botId, socket, tenantId) {
    try {
        console.log(`[${botId}] 📚 Iniciando sincronización de TODOS los chats históricos...`);

        if (!socket || !socket.store || !socket.store.chats) {
            console.log(`[${botId}] ⚠️  No hay datos de chats disponibles en el socket`);
            return;
        }

        const allChats = socket.store.chats.all ? socket.store.chats.all() : [];
        
        if (!allChats || allChats.length === 0) {
            console.log(`[${botId}] ℹ️  Sin chats para sincronizar`);
            return;
        }

        console.log(`[${botId}] 📊 Encontrados ${allChats.length} chats para sincronizar`);

        let processedCount = 0;
        let analyzedCount = 0;
        let errorCount = 0;

        // Procesar cada chat
        for (const chat of allChats) {
            try {
                // Solo procesar chats individuales (@c.us o @s.whatsapp.net)
                if (!chat.id.endsWith('@c.us') && !chat.id.endsWith('@s.whatsapp.net')) {
                    continue; // Saltar grupos y canales
                }

                const contactPhone = chat.id.replace(/@c\.us|@s\.whatsapp\.net/g, '');
                const contactName = chat.name || contactPhone;

                console.log(`[${botId}] 📱 Procesando: ${contactName}`);

                // Obtener mensajes de este chat
                const messages = await getMessagesFromChat(socket, chat.id, contactPhone);

                if (messages.length < 2) {
                    console.log(`[${botId}] ⏭️  Sin suficientes mensajes: ${contactPhone}`);
                    continue;
                }

                // Formatear para análisis
                const formattedMessages = messages.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.message,
                    timestamp: m.timestamp
                }));

                console.log(`[${botId}] 🔍 Analizando ${messages.length} mensajes de ${contactPhone}...`);

                // Analizar chat
                await chatAnalysisService.analyzeChatConversation(
                    {
                        botId,
                        contactPhone,
                        contactName,
                        contactEmail: null,
                        messages: formattedMessages,
                        botPrompt: ''
                    },
                    tenantId
                );

                console.log(`[${botId}] ✅ Chat analizado: ${contactPhone}`);
                analyzedCount++;

                processedCount++;

                // Pausa para no sobrecargar
                if (processedCount % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

            } catch (error) {
                errorCount++;
                console.error(`[${botId}] ❌ Error procesando chat:`, error.message);
            }
        }

        console.log(`[${botId}] 🎉 Sincronización completada:`);
        console.log(`[${botId}]    - Total chats: ${allChats.length}`);
        console.log(`[${botId}]    - Procesados: ${processedCount}`);
        console.log(`[${botId}]    - Analizados: ${analyzedCount}`);
        console.log(`[${botId}]    - Errores: ${errorCount}`);

    } catch (error) {
        console.error(`[${botId}] ❌ Error en sincronización de chats:`, error.message);
    }
}

/**
 * Obtener mensajes de un chat específico
 * @param {object} socket - Socket de Baileys
 * @param {string} chatId - ID del chat
 * @param {string} contactPhone - Teléfono del contacto
 * @returns {Promise<array>} Mensajes formateados
 */
async function getMessagesFromChat(socket, chatId, contactPhone) {
    try {
        if (!socket || !socket.store || !socket.store.messages) {
            return [];
        }

        const messages = socket.store.messages.all ? socket.store.messages.all() : [];
        
        if (!messages || messages.length === 0) {
            return [];
        }

        // Filtrar mensajes de este chat
        const chatMessages = messages
            .filter(msg => {
                const msgChatId = msg.key?.remoteJid;
                return msgChatId === chatId || msgChatId === `${contactPhone}@c.us` || msgChatId === `${contactPhone}@s.whatsapp.net`;
            })
            .sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0))
            .slice(-100); // Últimos 100 mensajes

        // Extraer y formatear contenido
        return chatMessages
            .map(msg => {
                const text = extractMessageContent(msg);
                return {
                    sender: msg.key?.fromMe ? 'bot' : 'user',
                    message: text,
                    timestamp: msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now()
                };
            })
            .filter(msg => msg.message && msg.message.trim().length > 0);

    } catch (error) {
        console.error('Error obteniendo mensajes:', error.message);
        return [];
    }
}

/**
 * Extraer contenido de texto de un mensaje
 * @param {object} msg - Mensaje de Baileys
 * @returns {string} Texto extraído
 */
function extractMessageContent(msg) {
    try {
        if (!msg || !msg.message) return '';

        if (msg.message.conversation) {
            return msg.message.conversation;
        }
        if (msg.message.extendedTextMessage?.text) {
            return msg.message.extendedTextMessage.text;
        }
        if (msg.message.imageMessage?.caption) {
            return msg.message.imageMessage.caption;
        }
        if (msg.message.videoMessage?.caption) {
            return msg.message.videoMessage.caption;
        }
        if (msg.message.documentMessage?.fileName) {
            return `[Archivo: ${msg.message.documentMessage.fileName}]`;
        }
        if (msg.message.audioMessage) {
            return '[Nota de voz]';
        }
        return '';
    } catch (error) {
        return '';
    }
}

function isBotReady(botId) {
    const session = activeSessions.get(botId);
    return !!(session && session.isReady && !session.isPaused);
}

async function disconnectBot(botId) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket) return;

    try {
        const { Boom } = await loadBaileys();
        await session.socket.end(new Boom('Bot disconnected by user'));
        console.log(`[${botId}] 🔌 Desconectado`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error desconectando:`, error);
    } finally {
        activeSessions.delete(botId);
    }
}

module.exports = {
    initializeBaileysConnection,
    sendMessage,
    sendImage,
    sendImageUrl,
    setBotStatus,
    refreshBotImages,
    getBotStatus,
    isBotReady,
    disconnectBot,
    loadBaileys,
    analyzeLeadChat,
    syncAndAnalyzeAllChats,
    autoAnalyzeAllChatsOnConnect, // 🆕 EXPORTAR LA NUEVA FUNCIÓN
};