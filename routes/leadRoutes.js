const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/baileysManager');
const { getLeads, getLeadMessages } = require('../services/leadDbService');
const { requireAuth } = require('../auth/authMiddleware'); // Corregido
const logger = require('../utils/logger');

router.use(requireAuth); // Corregido

// Endpoint para enviar un mensaje desde el panel de ventas
router.post('/send-message', async (req, res) => {
    const { botId, leadPhone, messageText } = req.body;
    const userId = req.user.id; // Asumiendo que el middleware de auth añade el usuario

    if (!botId || !leadPhone || !messageText) {
        return res.status(400).json({ error: 'botId, leadPhone, and messageText are required' });
    }

    try {
        // TODO: Verificar que el botId pertenece al userId para seguridad
        await sendMessage(botId, leadPhone, { text: messageText });
        
        // Guardar el mensaje saliente en la base de datos
        const { getBotById } = require('../services/botDbService'); // Carga circular? Mejorar luego
        // const bot = await getBotById(botId);
        // await saveMessage({
        //     phone: leadPhone,
        //     name: 'Agent', // O el nombre del agente
        //     message: messageText,
        //     timestamp: Math.floor(Date.now() / 1000),
        //     from_me: true,
        // }, bot.jid);

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        logger.error({ error: error.message }, "Failed to send message from API");
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para obtener todos los leads de un usuario
router.get('/', async (req, res) => {
    try {
        const leads = await getLeads(req.user.id);
        res.json(leads);
    } catch (error) {
        logger.error(error);
        res.status(500).send('Error fetching leads');
    }
});

// Endpoint para obtener los mensajes de un lead específico
router.get('/:leadId/messages', async (req, res) => {
    try {
        const messages = await getLeadMessages(req.params.leadId);
        res.json(messages);
    } catch (error) {
        logger.error(error);
        res.status(500).send('Error fetching messages');
    }
});


module.exports = router;
