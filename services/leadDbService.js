const pool = require('./db');

const saveMessage = async (leadData, botJid) => {
    const { phone, name, message, timestamp } = leadData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Buscar el bot_id usando el jid
        const botRes = await client.query('SELECT bot_id FROM bots WHERE jid = $1', [botJid]);
        if (botRes.rows.length === 0) {
            throw new Error(`Bot with JID ${botJid} not found.`);
        }
        const botId = botRes.rows[0].bot_id;

        // Buscar o crear el lead
        let leadRes = await client.query('SELECT id FROM leads WHERE phone = $1 AND bot_id = $2', [phone, botId]);
        let leadId;
        if (leadRes.rows.length > 0) {
            leadId = leadRes.rows[0].id;
            // Actualizar el nombre si es necesario
            await client.query('UPDATE leads SET name = $1, last_contacted_at = NOW() WHERE id = $2', [name, leadId]);
        } else {
            leadRes = await client.query(
                'INSERT INTO leads (phone, name, bot_id, score) VALUES ($1, $2, $3, 0) RETURNING id',
                [phone, name, botId]
            );
            leadId = leadRes.rows[0].id;
        }

        // Guardar el mensaje
        await client.query(
            'INSERT INTO messages (lead_id, content, timestamp, from_me) VALUES ($1, $2, to_timestamp($3), $4)',
            [leadId, message, timestamp, false]
        );

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const getLeads = async (userId) => {
    const res = await pool.query(`
        SELECT l.* 
        FROM leads l
        JOIN bots b ON l.bot_id = b.bot_id
        WHERE b.user_id = $1
        ORDER BY l.last_contacted_at DESC
    `, [userId]);
    return res.rows;
}

const getLeadMessages = async (leadId) => {
    const res = await pool.query('SELECT * FROM messages WHERE lead_id = $1 ORDER BY timestamp ASC', [leadId]);
    return res.rows;
}

module.exports = { saveMessage, getLeads, getLeadMessages };
