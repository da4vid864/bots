// controllers/sseController.js
// SSE Controller for WhatsApp Bot Manager

/**
 * Estructuras:
 * - clientsById: Map<clientId, client>
 * - clientsByUser: Map<userEmail, Set<clientId>>
 */
const clientsById = new Map();
const clientsByUser = new Map();

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function addClient(client) {
  clientsById.set(client.id, client);

  const email = client.userEmail;
  if (!clientsByUser.has(email)) clientsByUser.set(email, new Set());
  clientsByUser.get(email).add(client.id);
}

function removeClient(clientId) {
  const client = clientsById.get(clientId);
  if (!client) return;

  // limpiar heartbeat
  if (client.heartbeat) {
    try {
      clearInterval(client.heartbeat);
    } catch (e) {}
  }

  // eliminar de mapa principal
  clientsById.delete(clientId);

  // eliminar del índice por usuario
  const email = client.userEmail;
  const set = clientsByUser.get(email);
  if (set) {
    set.delete(clientId);
    if (set.size === 0) clientsByUser.delete(email);
  }
}

function safeWrite(res, payload) {
  try {
    res.write(payload);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Handler for GET /api/events that establishes an SSE connection
 */
function eventsHandler(req, res) {
  // Nota: /api/events normalmente es same-origin. Si es cross-origin, necesitas CORS correcto.
  const origin = process.env.FRONTEND_URL || 'http://localhost:3001';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',

    // CORS (solo si estás sirviendo frontend en otro origen)
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  });

  // flush headers
  if (typeof res.flushHeaders === 'function') {
    try {
      res.flushHeaders();
    } catch (e) {}
  }

  // keepalive socket
  if (req.socket) {
    try {
      req.socket.setKeepAlive(true);
      req.socket.setTimeout(0);
    } catch (e) {}
  }

  const clientId = generateClientId();
  const userEmail = req.user?.email;

  const client = {
    id: clientId,
    response: res,
    userEmail,
    heartbeat: null,
  };

  addClient(client);

  console.log(`🔗 SSE Client connected: ${clientId} for user: ${userEmail}`);
  console.log(`📊 Total connected SSE clients: ${clientsById.size}`);

  // reconexión sugerida
  safeWrite(res, `retry: 10000\n\n`);

  // evento inicial
  safeWrite(
    res,
    `data: ${JSON.stringify({
      type: 'CONNECTED',
      data: { clientId, message: 'SSE connection established' },
    })}\n\n`
  );

  // ✅ NUEVO: Enviar evento INIT después de conectar
  // Esto es lo que el sistema de bots espera
  setTimeout(() => {
    safeWrite(
      res,
      `data: ${JSON.stringify({
        type: 'INIT',
        data: { message: 'Initializing connection' },
      })}\n\n`
    );
  }, 100);

  // Heartbeat: comentario cada 25s para evitar cierre por proxies
  client.heartbeat = setInterval(() => {
    const ok = safeWrite(res, `: heartbeat ${Date.now()}\n\n`);
    if (!ok) {
      console.error(`❌ SSE heartbeat write failed for client ${clientId}, removing client`);
      removeClient(clientId);
      try {
        res.end();
      } catch (e) {}
    }
  }, 25000);

  // Limpieza en desconexión
  const cleanup = () => {
    console.log(`🔌 SSE Client disconnected: ${clientId}`);
    removeClient(clientId);
    console.log(`📊 Remaining SSE clients: ${clientsById.size}`);
  };

  // Usar res.on('close') es más fiable que req.on('close') en SSE
  res.on('close', cleanup);
  req.on('aborted', cleanup);
  req.on('error', (err) => {
    console.error(`❌ SSE Client error (${clientId}):`, err);
    cleanup();
  });
}

/**
 * Send event to specific user based on email
 */
function sendEventToUser(userEmail, type, data) {
  const set = clientsByUser.get(userEmail);

  if (!set || set.size === 0) {
    // (no spamear logs si quieres, puedes comentar)
    console.log(`📭 No SSE clients found for user: ${userEmail}`);
    return false;
  }

  const eventData = JSON.stringify({ type, data });
  let sentCount = 0;
  const idsToRemove = [];

  for (const clientId of set) {
    const client = clientsById.get(clientId);
    if (!client) {
      idsToRemove.push(clientId);
      continue;
    }

    const ok = safeWrite(client.response, `data: ${eventData}\n\n`);
    if (ok) sentCount++;
    else idsToRemove.push(clientId);
  }

  // limpiar los que fallaron
  idsToRemove.forEach(removeClient);

  console.log(`📤 Sent SSE event [${type}] to ${sentCount}/${set.size} clients for user: ${userEmail}`);
  return sentCount > 0;
}

/**
 * Broadcast event to all connected clients
 */
function broadcastEvent(type, data) {
  if (clientsById.size === 0) {
    console.log('📭 No SSE clients connected for broadcast');
    return false;
  }

  const eventData = JSON.stringify({ type, data });
  let sentCount = 0;
  const idsToRemove = [];

  for (const [clientId, client] of clientsById.entries()) {
    const ok = safeWrite(client.response, `data: ${eventData}\n\n`);
    if (ok) sentCount++;
    else idsToRemove.push(clientId);
  }

  idsToRemove.forEach(removeClient);

  console.log(`📢 Broadcast SSE event [${type}] to ${sentCount}/${clientsById.size} clients`);
  return sentCount > 0;
}

/**
 * Send bot status update (para sistema de bots existente)
 */
function sendBotUpdate(botId, status, data = {}) {
  const eventData = JSON.stringify({
    type: 'UPDATE_BOT',
    data: { id: botId, status, ...data }
  });
  
  let sentCount = 0;
  const idsToRemove = [];

  for (const [clientId, client] of clientsById.entries()) {
    const ok = safeWrite(client.response, `data: ${eventData}\n\n`);
    if (ok) sentCount++;
    else idsToRemove.push(clientId);
  }

  idsToRemove.forEach(removeClient);

  console.log(`🤖 Sent bot update [${botId}:${status}] to ${sentCount} clients`);
  return sentCount > 0;
}

/**
 * Send new message for sales (para sistema de bots existente)
 */
function sendNewMessageForSales(leadId, messageData) {
  const eventData = JSON.stringify({
    type: 'NEW_MESSAGE_FOR_SALES',
    data: { leadId, ...messageData }
  });
  
  let sentCount = 0;
  const idsToRemove = [];

  for (const [clientId, client] of clientsById.entries()) {
    const ok = safeWrite(client.response, `data: ${eventData}\n\n`);
    if (ok) sentCount++;
    else idsToRemove.push(clientId);
  }

  idsToRemove.forEach(removeClient);

  console.log(`💬 Sent new message for sales [${leadId}] to ${sentCount} clients`);
  return sentCount > 0;
}

function getConnectedClientsCount() {
  return clientsById.size;
}

function getClientsByUser(userEmail) {
  const set = clientsByUser.get(userEmail);
  if (!set) return [];
  return [...set].map((id) => clientsById.get(id)).filter(Boolean);
}

/**
 * Broadcast event to specific tenant users
 */
function broadcastToTenant(tenantId, type, event) {
  if (!tenantId) {
    // Broadcast to all users if no tenant specified
    return broadcastEvent(type, event);
  }
  
  // For tenant-based broadcasting, we broadcast to all clients
  // The client-side should filter based on tenant
  return broadcastEvent(type, event);
}

/**
 * Broadcast event to specific user
 */
function broadcastToUser(userEmail, type, event) {
  return sendEventToUser(userEmail, type, event);
}

/**
 * Sales-specific event emitters for real-time sales updates
 */
const salesEvents = {
  /**
   * Emit lead created event
   * @param {Object} lead - Created lead object
   */
  emitLeadCreated: (lead) => {
    const event = {
      type: 'LEAD_CREATED',
      payload: lead,
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting LEAD_CREATED:', lead?.id);
    broadcastToTenant(lead?.tenantId, 'LEAD_CREATED', event);
  },

  /**
   * Emit lead updated event
   * @param {Object} lead - Updated lead object
   */
  emitLeadUpdated: (lead) => {
    const event = {
      type: 'LEAD_UPDATED',
      payload: lead,
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting LEAD_UPDATED:', lead?.id);
    broadcastToTenant(lead?.tenantId, 'LEAD_UPDATED', event);
  },

  /**
   * Emit stage changed event
   * @param {string} leadId - Lead ID
   * @param {string} oldStageId - Previous stage ID
   * @param {string} newStageId - New stage ID
   * @param {Object} lead - Updated lead object
   */
  emitStageChanged: (leadId, oldStageId, newStageId, lead) => {
    const event = {
      type: 'STAGE_CHANGED',
      payload: { leadId, oldStageId, newStageId, lead },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting STAGE_CHANGED:', { leadId, oldStageId, newStageId });
    broadcastToTenant(null, 'STAGE_CHANGED', event);
  },

  /**
   * Emit lead assigned event
   * @param {string} leadId - Lead ID
   * @param {string} userId - Assigned user ID
   * @param {Object} lead - Updated lead object
   */
  emitLeadAssigned: (leadId, userId, lead) => {
    const event = {
      type: 'LEAD_ASSIGNED',
      payload: { leadId, userId, lead },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting LEAD_ASSIGNED:', { leadId, userId });
    // Send to specific user
    broadcastToUser(null, 'LEAD_ASSIGNED', event);
    // Also broadcast to all for visibility
    broadcastEvent('LEAD_ASSIGNED', event);
  },

  /**
   * Emit new message event
   * @param {string} leadId - Lead ID
   * @param {Object} message - Message object
   */
  emitNewMessage: (leadId, message) => {
    const event = {
      type: 'NEW_MESSAGE',
      payload: { leadId, message },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting NEW_MESSAGE:', { leadId, messageId: message?.id });
    broadcastToTenant(null, 'NEW_MESSAGE', event);
  },

  /**
   * Emit metrics update event
   * @param {string} tenantId - Tenant ID
   * @param {Object} metrics - Updated metrics data
   */
  emitMetricsUpdate: (tenantId, metrics) => {
    const event = {
      type: 'METRICS_UPDATE',
      payload: metrics,
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting METRICS_UPDATE');
    broadcastToTenant(tenantId, 'METRICS_UPDATE', event);
  },

  /**
   * Emit lead score changed event
   * @param {string} leadId - Lead ID
   * @param {number} oldScore - Previous score
   * @param {number} newScore - New score
   * @param {Object} lead - Updated lead object
   */
  emitScoreChanged: (leadId, oldScore, newScore, lead) => {
    const event = {
      type: 'SCORE_CHANGED',
      payload: { leadId, oldScore, newScore, lead },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting SCORE_CHANGED:', { leadId, oldScore, newScore });
    broadcastToTenant(lead?.tenantId, 'SCORE_CHANGED', event);
  },

  /**
   * Emit lead qualified event
   * @param {string} leadId - Lead ID
   * @param {Object} lead - Updated lead object
   */
  emitLeadQualified: (leadId, lead) => {
    const event = {
      type: 'LEAD_QUALIFIED',
      payload: { leadId, lead },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting LEAD_QUALIFIED:', leadId);
    broadcastToTenant(lead?.tenantId, 'LEAD_QUALIFIED', event);
  },

  /**
   * Emit lead deleted event
   * @param {string} leadId - Deleted lead ID
   * @param {string} tenantId - Tenant ID
   */
  emitLeadDeleted: (leadId, tenantId) => {
    const event = {
      type: 'LEAD_DELETED',
      payload: { leadId },
      timestamp: new Date().toISOString(),
    };
    console.log('[SalesEvents] Emitting LEAD_DELETED:', leadId);
    broadcastToTenant(tenantId, 'LEAD_DELETED', event);
  },
};

module.exports = {
  eventsHandler,
  sendEventToUser,
  broadcastEvent,
  broadcastToTenant,
  broadcastToUser,
  sendBotUpdate,          // For bot system
  sendNewMessageForSales, // For bot system
  getConnectedClientsCount,
  getClientsByUser,
  salesEvents,           // Sales-specific event emitters
};