// services/leadDbService.js
const pool = require('./db');

/**
 * Obtiene o crea un lead
 */
async function getOrCreateLead(botId, whatsappNumber) {
    try {
        // Intentar obtener lead existente
        let result = await pool.query(
            'SELECT * FROM leads WHERE bot_id = $1 AND whatsapp_number = $2',
            [botId, whatsappNumber]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Crear nuevo lead
        result = await pool.query(
            'INSERT INTO leads (bot_id, whatsapp_number, status) VALUES ($1, $2, $3) RETURNING *',
            [botId, whatsappNumber, 'capturing']
        );

        return result.rows[0];
    } catch (error) {
        console.error('❌ Error en getOrCreateLead:', error);
        return null;
    }
}

/**
 * Actualiza información del lead
 */
async function updateLeadInfo(leadId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.email) {
        fields.push(`email = $${paramCount++}`);
        values.push(data.email);
    }
    if (data.location) {
        fields.push(`location = $${paramCount++}`);
        values.push(data.location);
    }
    if (data.phone) {
        fields.push(`phone = $${paramCount++}`);
        values.push(data.phone);
    }

    if (fields.length > 0) {
        fields.push(`last_message_at = CURRENT_TIMESTAMP`);
        values.push(leadId);
        
        const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    return await getLeadById(leadId);
}

/**
 * Califica un lead
 */
async function qualifyLead(leadId) {
    const lead = await getLeadById(leadId);
    
    if (!lead) {
        throw new Error(`Lead ${leadId} no encontrado`);
    }

    let phoneToUse = lead.phone;
    if (!phoneToUse || phoneToUse.trim() === '') {
        phoneToUse = lead.whatsapp_number;
    }

    const result = await pool.query(
        'UPDATE leads SET status = $1, phone = $2, qualified_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        ['qualified', phoneToUse, leadId]
    );

    return result.rows[0];
}

/**
 * Asigna un lead a un vendedor
 */
async function assignLead(leadId, vendorEmail) {
    const result = await pool.query(
        'UPDATE leads SET status = $1, assigned_to = $2 WHERE id = $3 RETURNING *',
        ['assigned', vendorEmail, leadId]
    );
    return result.rows[0];
}

/**
 * Obtiene un lead por ID
 */
async function getLeadById(leadId) {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    return result.rows[0];
}

/**
 * Obtiene leads por bot
 */
async function getLeadsByBot(botId) {
    const result = await pool.query(
        'SELECT * FROM leads WHERE bot_id = $1 ORDER BY last_message_at DESC',
        [botId]
    );
    return result.rows;
}

/**
 * Obtiene leads calificados
 */
async function getQualifiedLeads(botId = null) {
    let query = 'SELECT * FROM leads WHERE status = $1 ORDER BY qualified_at DESC';
    let params = ['qualified'];

    if (botId) {
        query = 'SELECT * FROM leads WHERE bot_id = $1 AND status = $2 ORDER BY qualified_at DESC';
        params = [botId, 'qualified'];
    }

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Obtiene leads por vendedor
 */
async function getLeadsByVendor(vendorEmail) {
    const result = await pool.query(
        'SELECT * FROM leads WHERE assigned_to = $1 ORDER BY last_message_at DESC',
        [vendorEmail]
    );
    return result.rows;
}

/**
 * Añade un mensaje
 */
async function addLeadMessage(leadId, sender, message) {
    await pool.query(
        'INSERT INTO lead_messages (lead_id, sender, message) VALUES ($1, $2, $3)',
        [leadId, sender, message]
    );

    await pool.query(
        'UPDATE leads SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [leadId]
    );
}

/**
 * Obtiene mensajes de un lead
 */
async function getLeadMessages(leadId, limit = 1000) {
    const result = await pool.query(
        'SELECT * FROM lead_messages WHERE lead_id = $1 ORDER BY timestamp ASC LIMIT $2',
        [leadId, limit]
    );
    return result.rows;
}

/**
 * Verifica si un lead está completo
 */
function isLeadComplete(lead) {
    if (!lead) return false;
    return !!(lead.name && lead.email && lead.location);
}

module.exports = {
    getOrCreateLead,
    updateLeadInfo,
    qualifyLead,
    assignLead,
    getLeadById,
    getLeadsByBot,
    getQualifiedLeads,
    getLeadsByVendor,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete
};