const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/baileysManager');
const { getLeads, getLeadMessages, updateLeadJourneyStage } = require('../services/leadDbService');
const { requireAuth } = require('../auth/authMiddleware');
const logger = require('../utils/logger');

router.use(requireAuth);

router.post('/send-message', async (req, res) => {
    const { botId, leadPhone, messageText } = req.body;
    const userId = req.user.id;

    if (!botId || !leadPhone || !messageText) {
        return res.status(400).json({ error: 'botId, leadPhone, and messageText are required' });
    }

    try {
        await sendMessage(botId, leadPhone, { text: messageText });
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        logger.error({ error: error.message }, "Failed to send message from API");
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const leads = await getLeads(req.user.id);
        res.json(leads);
    } catch (error) {
        logger.error(error);
        res.status(500).send('Error fetching leads');
    }
});

router.get('/:leadId/messages', async (req, res) => {
    try {
        const messages = await getLeadMessages(req.params.leadId);
        res.json(messages);
    } catch (error) {
        logger.error(error);
        res.status(500).send('Error fetching messages');
    }
});

router.put('/:leadId/journey-stage', async (req, res) => {
    const { leadId } = req.params;
    const { journeyStage } = req.body;

    try {
        const updatedLead = await updateLeadJourneyStage(leadId, journeyStage);
        res.json(updatedLead);
    } catch (error) {
        res.status(500).send('Error updating lead journey stage');
    }
});

module.exports = router;
