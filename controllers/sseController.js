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

module.exports = {
  eventsHandler,
  sendEventToUser,
  broadcastEvent,
  sendBotUpdate,          // ✅ Para sistema de bots
  sendNewMessageForSales, // ✅ Para sistema de bots
  getConnectedClientsCount,
  getClientsByUser,
};