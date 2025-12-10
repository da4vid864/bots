// controllers/sseController.js
// SSE Controller for WhatsApp Bot Manager

// Array to manage connected clients with id, HTTP response, and userEmail
const connectedClients = [];

/**
 * Generate a unique client ID
 */
function generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handler for GET /api/events that establishes an SSE connection
 */
function eventsHandler(req, res) {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3001',
        'Access-Control-Allow-Credentials': 'true'
    });

    // Try to flush headers immediately (works in Node/Express)
    if (typeof res.flushHeaders === 'function') {
        try { res.flushHeaders(); } catch (e) { /* ignore */ }
    }

    // Ensure socket stays alive for SSE
    if (req.socket) {
        try {
            req.socket.setKeepAlive(true);
            req.socket.setTimeout(0);
        } catch (e) {}
    }

    // Create client object
    const clientId = generateClientId();
    const client = {
        id: clientId,
        response: res,
        userEmail: req.user.email,
        heartbeat: null
    };

    // Add client to connected clients array
    connectedClients.push(client);

    console.log(`🔗 SSE Client connected: ${clientId} for user: ${req.user.email}`);
    console.log(`📊 Total connected SSE clients: ${connectedClients.length}`);

    // Send initial connection event and a retry suggestion
    try {
        res.write(`retry: 10000\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { clientId, message: 'SSE connection established' } })}\n\n`);
    } catch (e) {
        console.error('❌ Error writing initial SSE data:', e);
    }

    // Heartbeat: send a comment every 25s to keep connection alive
    const hb = setInterval(() => {
        try {
            // Comment line is ignored by browsers but keeps proxies from closing
            client.response.write(`: heartbeat ${Date.now()}\n\n`);
        } catch (error) {
            console.error(`❌ SSE heartbeat error for client ${clientId}:`, error);
        }
    }, 25000);

    client.heartbeat = hb;

    // Handle client disconnect
    req.on('close', () => {
        console.log(`🔌 SSE Client disconnected: ${clientId}`);
        clearInterval(hb);

        // Remove client from connected clients
        const index = connectedClients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }

        console.log(`📊 Remaining SSE clients: ${connectedClients.length}`);
    });

    // Handle client errors
    req.on('error', (error) => {
        console.error(`❌ SSE Client error (${clientId}):`, error);
        clearInterval(hb);

        // Remove client from connected clients
        const index = connectedClients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }
    });
}

/**
 * Send event to specific user based on email
 */
function sendEventToUser(userEmail, type, data) {
    const userClients = connectedClients.filter(client => client.userEmail === userEmail);
    
    if (userClients.length === 0) {
        console.log(`📭 No SSE clients found for user: ${userEmail}`);
        return false;
    }

    const eventData = JSON.stringify({ type, data });
    let sentCount = 0;

    userClients.forEach(client => {
        try {
            client.response.write(`data: ${eventData}\n\n`);
            sentCount++;
        } catch (error) {
            console.error(`❌ Error sending SSE event to client ${client.id}:`, error);
            
            // Remove failed client
            const index = connectedClients.findIndex(c => c.id === client.id);
            if (index !== -1) {
                connectedClients.splice(index, 1);
            }
        }
    });

    console.log(`📤 Sent SSE event [${type}] to ${sentCount}/${userClients.length} clients for user: ${userEmail}`);
    return sentCount > 0;
}

/**
 * Broadcast event to all connected clients
 */
function broadcastEvent(type, data) {
    if (connectedClients.length === 0) {
        console.log('📭 No SSE clients connected for broadcast');
        return false;
    }

    const eventData = JSON.stringify({ type, data });
    let sentCount = 0;

    connectedClients.forEach(client => {
        try {
            client.response.write(`data: ${eventData}\n\n`);
            sentCount++;
        } catch (error) {
            console.error(`❌ Error broadcasting SSE event to client ${client.id}:`, error);
            
            // Remove failed client
            const index = connectedClients.findIndex(c => c.id === client.id);
            if (index !== -1) {
                connectedClients.splice(index, 1);
            }
        }
    });

    console.log(`📢 Broadcast SSE event [${type}] to ${sentCount}/${connectedClients.length} clients`);
    return sentCount > 0;
}

/**
 * Get connected clients count for monitoring
 */
function getConnectedClientsCount() {
    return connectedClients.length;
}

/**
 * Get connected clients by user email
 */
function getClientsByUser(userEmail) {
    return connectedClients.filter(client => client.userEmail === userEmail);
}

module.exports = {
    eventsHandler,
    sendEventToUser,
    broadcastEvent,
    getConnectedClientsCount,
    getClientsByUser
};