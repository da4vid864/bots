const pool = require('./db');

const addOrUpdateBot = async (botData) => {
    const { bot_id, user_id, jid, is_active } = botData;
    const existingBot = await pool.query('SELECT * FROM bots WHERE bot_id = $1', [bot_id]);

    if (existingBot.rows.length > 0) {
        return await pool.query(
            'UPDATE bots SET user_id = $1, jid = $2, is_active = $3, updated_at = NOW() WHERE bot_id = $4 RETURNING *',
            [user_id, jid, is_active, bot_id]
        );
    } else {
        return await pool.query(
            'INSERT INTO bots (bot_id, user_id, jid, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [bot_id, user_id, jid, is_active]
        );
    }
};

const getBotByJid = async (jid) => {
    const result = await pool.query('SELECT * FROM bots WHERE jid = $1', [jid]);
    return result.rows[0];
};

const getBotsByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM bots WHERE user_id = $1', [userId]);
    return result.rows;
};

const removeBot = async (jid) => {
    return await pool.query('DELETE FROM bots WHERE jid = $1', [jid]);
};

module.exports = { addOrUpdateBot, getBotByJid, getBotsByUserId, removeBot };
