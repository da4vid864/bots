const pool = require('./db');
const logger = require('../utils/logger');

const getLeads = async (userId) => {
    const { rows } = await pool.query(
        'SELECT l.id, l.name, l.phone, l.image_url, l.last_message, l.last_message_timestamp, l.is_qualified, l.journey_stage FROM leads l JOIN user_bots ub ON l.bot_jid = ub.bot_jid WHERE ub.user_id = $1 ORDER BY l.last_message_timestamp DESC',
        [userId]
    );
    return rows;
};

const getLeadMessages = async (leadId) => {
    const { rows } = await pool.query(
        'SELECT m.id, m.message, m.timestamp, m.from_me FROM messages m WHERE m.lead_id = $1 ORDER BY m.timestamp ASC',
        [leadId]
    );
    return rows;
};

const updateLeadJourneyStage = async (leadId, journeyStage) => {
    try {
        const { rows } = await pool.query(
            'UPDATE leads SET journey_stage = $1 WHERE id = $2 RETURNING *',
            [journeyStage, leadId]
        );
        return rows[0];
    } catch (error) {
        logger.error({ error: error.message }, "Error updating lead journey stage");
        throw error;
    }
};

module.exports = { getLeads, getLeadMessages, updateLeadJourneyStage };
