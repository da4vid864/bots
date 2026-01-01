// services/leadDbService.js
import { pool } from './db.js';

/**
 * @typedef {Object} Lead
 * @property {number} id - Unique identifier for the lead.
 * @property {string} bot_id - ID of the bot associated with the lead.
 * @property {string} whatsapp_number - WhatsApp number of the lead.
 * @property {string} [name] - Name of the lead.
 * @property {string} [email] - Email address of the lead.
 * @property {string} [location] - Location or city of the lead.
 * @property {string} [phone] - Contact phone number (may differ from WhatsApp number).
 * @property {string} status - Current status of the lead (e.g., 'capturing', 'qualified', 'assigned').
 * @property {number} score - Lead score based on interactions.
 * @property {string[]} tags - Array of tags associated with the lead.
 * @property {string} [assigned_to] - Email of the vendor assigned to the lead.
 * @property {Date} [qualified_at] - Timestamp when the lead was qualified.
 * @property {Date} last_message_at - Timestamp of the last message exchanged.
 * @property {Date} created_at - Timestamp when the lead was created.
 */

/**
 * @typedef {Object} Message
 * @property {number} id - Unique identifier for the message.
 * @property {number} lead_id - ID of the lead associated with the message.
 * @property {string} sender - Sender of the message ('user' or 'bot').
 * @property {string} message - Content of the message.
 * @property {Date} timestamp - Timestamp when the message was created.
 */

/**
 * Retrieves an existing lead or creates a new one if it doesn't exist.
 * 
 * @param {string} botId - The ID of the bot.
 * @param {string} whatsappNumber - The WhatsApp number of the user.
 * @returns {Promise<Lead|null>} The existing or newly created lead object, or null on error.
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

        // Crear nuevo lead con tenant_id del contexto
        result = await pool.query(
            'INSERT INTO leads (bot_id, whatsapp_number, status, score, tags, tenant_id) VALUES ($1, $2, $3, 0, \'{}\', COALESCE(current_setting(\'app.current_tenant\', true), \'\')::uuid) RETURNING *',
            [botId, whatsappNumber, 'capturing']
        );

        return result.rows[0];
    } catch (error) {
        console.error('❌ Error en getOrCreateLead:', error);
        return null;
    }
}

/**
 * Updates the information of a specific lead.
 * 
 * @param {number} leadId - The ID of the lead to update.
 * @param {Object} data - Object containing the fields to update.
 * @param {string} [data.name] - New name for the lead.
 * @param {string} [data.email] - New email for the lead.
 * @param {string} [data.location] - New location for the lead.
 * @param {string} [data.phone] - New phone number for the lead.
 * @returns {Promise<Lead>} The updated lead object.
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
 * Updates the score and tags of a lead.
 * Note: Main logic is in scoringService.applyScoring. This is a wrapper.
 * 
 * @param {number} leadId - The ID of the lead.
 * @param {number} scoreDelta - The amount to adjust the score by.
 * @param {string[]} newTags - Array of new tags to add.
 * @returns {Promise<Lead>} The updated lead object.
 */
async function updateLeadScoreAndTags(leadId, scoreDelta, newTags) {
    // Esta función es un wrapper conveniente, pero la lógica principal
    // de cálculo está en scoringService.applyScoring.
    // Aquí podríamos implementar lógica adicional si fuera necesario.
    // Por ahora, scoringService maneja la actualización directa.
    return await getLeadById(leadId);
}

/**
 * Marks a lead as qualified and updates the qualified timestamp.
 * If phone is missing, it defaults to the WhatsApp number.
 * 
 * @param {number} leadId - The ID of the lead to qualify.
 * @returns {Promise<Lead>} The updated qualified lead object.
 * @throws {Error} If the lead is not found.
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
 * Assigns a lead to a specific vendor.
 * 
 * @param {number} leadId - The ID of the lead.
 * @param {string} vendorEmail - The email of the vendor to assign.
 * @returns {Promise<Lead>} The updated lead object.
 */
async function assignLead(leadId, vendorEmail) {
    const result = await pool.query(
        'UPDATE leads SET status = $1, assigned_to = $2 WHERE id = $3 RETURNING *',
        ['assigned', vendorEmail, leadId]
    );
    return result.rows[0];
}

/**
 * Retrieves a lead by its ID.
 * 
 * @param {number} leadId - The ID of the lead.
 * @returns {Promise<Lead|undefined>} The lead object or undefined if not found.
 */
async function getLeadById(leadId) {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    return result.rows[0];
}

/**
 * Retrieves all leads associated with a specific bot, ordered by last message.
 * 
 * @param {string} botId - The ID of the bot.
 * @returns {Promise<Lead[]>} An array of lead objects.
 */
async function getLeadsByBot(botId) {
    const result = await pool.query(
        'SELECT * FROM leads WHERE bot_id = $1 ORDER BY last_message_at DESC',
        [botId]
    );
    return result.rows;
}

/**
 * Retrieves all qualified leads, optionally filtered by bot ID.
 * 
 * @param {string} [botId=null] - The ID of the bot (optional).
 * @returns {Promise<Lead[]>} An array of qualified lead objects.
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
 * Retrieves all leads assigned to a specific vendor.
 * 
 * @param {string} vendorEmail - The email of the vendor.
 * @returns {Promise<Lead[]>} An array of assigned lead objects.
 */
async function getLeadsByVendor(vendorEmail) {
    const result = await pool.query(
        'SELECT * FROM leads WHERE assigned_to = $1 ORDER BY last_message_at DESC',
        [vendorEmail]
    );
    return result.rows;
}

/**
 * Adds a message to the lead's message history and updates the last message timestamp.
 * 
 * @param {number} leadId - The ID of the lead.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} message - The content of the message.
 * @returns {Promise<void>}
 */
async function addLeadMessage(leadId, sender, message) {
    await pool.query(
        'INSERT INTO lead_messages (lead_id, sender, message, tenant_id) VALUES ($1, $2, $3, current_setting(\'app.current_tenant\')::uuid)',
        [leadId, sender, message]
    );

    await pool.query(
        'UPDATE leads SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [leadId]
    );
}

/**
 * Retrieves the message history for a lead.
 * 
 * @param {number} leadId - The ID of the lead.
 * @param {number} [limit=1000] - The maximum number of messages to retrieve.
 * @returns {Promise<Message[]>} An array of message objects.
 */
async function getLeadMessages(leadId, limit = 1000) {
    const result = await pool.query(
        'SELECT * FROM lead_messages WHERE lead_id = $1 ORDER BY timestamp ASC LIMIT $2',
        [leadId, limit]
    );
    return result.rows;
}

/**
 * Checks if a lead has all necessary information (name, email, location).
 * 
 * @param {Lead} lead - The lead object to check.
 * @returns {boolean} True if the lead is complete, false otherwise.
 */
function isLeadComplete(lead) {
    if (!lead) return false;
    return !!(lead.name && lead.email && lead.location);
}
// Añadir al final del archivo, antes del module.exports:

/**
 * Gets all leads for the current tenant with pipeline/stage information
 * 
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Lead[]>} Array of leads with pipeline data
 */
async function getAllLeads(tenantId) {
    try {
        const result = await pool.query(
            `SELECT 
                l.*,
                p.name as pipeline_name,
                ps.name as stage_name,
                ps.color as stage_color,
                ps.type as stage_type
             FROM leads l
             LEFT JOIN pipelines p ON l.pipeline_id = p.id
             LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
             WHERE l.tenant_id = $1
             ORDER BY l.last_message_at DESC`,
            [tenantId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getAllLeads:', error);
        return [];
    }
}

/**
 * Updates lead information including pipeline and stage
 * 
 * @param {number} leadId - Lead ID
 * @param {string} tenantId - Tenant ID
 * @param {Object} updates - Updates object
 * @returns {Promise<Lead>} Updated lead
 */
async function updateLead(leadId, tenantId, updates) {
    try {
        const {
            name,
            email,
            phone,
            pipeline_id,
            stage_id,
            score,
            status,
            assigned_to,
            notes
        } = updates;

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (phone !== undefined) {
            updateFields.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (pipeline_id !== undefined) {
            updateFields.push(`pipeline_id = $${paramIndex++}`);
            values.push(pipeline_id);
        }
        if (stage_id !== undefined) {
            updateFields.push(`stage_id = $${paramIndex++}`);
            values.push(stage_id);
        }
        if (score !== undefined) {
            updateFields.push(`score = $${paramIndex++}`);
            values.push(score);
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (assigned_to !== undefined) {
            updateFields.push(`assigned_to = $${paramIndex++}`);
            values.push(assigned_to);
        }
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex++}`);
            values.push(notes);
        }

        // Always update timestamp
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updateFields.length === 0) {
            return await getLeadById(leadId);
        }

        values.push(leadId, tenantId);
        
        const query = `
            UPDATE leads 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error in updateLead:', error);
        throw error;
    }
}

/**
 * Gets leads by pipeline
 * 
 * @param {string} tenantId - Tenant ID
 * @param {string} pipelineId - Pipeline ID
 * @returns {Promise<Lead[]>} Array of leads in the pipeline
 */
async function getLeadsByPipeline(tenantId, pipelineId) {
    try {
        const result = await pool.query(
            `SELECT l.*, ps.name as stage_name, ps.color as stage_color
             FROM leads l
             LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
             WHERE l.tenant_id = $1 AND l.pipeline_id = $2
             ORDER BY l.last_message_at DESC`,
            [tenantId, pipelineId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getLeadsByPipeline:', error);
        return [];
    }
}

/**
 * Searches leads by various criteria
 * 
 * @param {string} tenantId - Tenant ID
 * @param {Object} filters - Search filters
 * @returns {Promise<Lead[]>} Array of matching leads
 */
async function searchLeads(tenantId, filters = {}) {
    try {
        const {
            search,
            pipeline_id,
            stage_id,
            status,
            assigned_to,
            min_score,
            max_score
        } = filters;

        let query = `
            SELECT l.*, p.name as pipeline_name, ps.name as stage_name
            FROM leads l
            LEFT JOIN pipelines p ON l.pipeline_id = p.id
            LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
            WHERE l.tenant_id = $1
        `;
        
        const values = [tenantId];
        let paramIndex = 2;

        if (search) {
            query += ` AND (
                l.name ILIKE $${paramIndex} OR
                l.email ILIKE $${paramIndex} OR
                l.phone ILIKE $${paramIndex} OR
                l.whatsapp_number ILIKE $${paramIndex}
            )`;
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (pipeline_id) {
            query += ` AND l.pipeline_id = $${paramIndex}`;
            values.push(pipeline_id);
            paramIndex++;
        }

        if (stage_id) {
            query += ` AND l.stage_id = $${paramIndex}`;
            values.push(stage_id);
            paramIndex++;
        }

        if (status) {
            query += ` AND l.status = $${paramIndex}`;
            values.push(status);
            paramIndex++;
        }

        if (assigned_to) {
            query += ` AND l.assigned_to = $${paramIndex}`;
            values.push(assigned_to);
            paramIndex++;
        }

        if (min_score !== undefined) {
            query += ` AND l.score >= $${paramIndex}`;
            values.push(min_score);
            paramIndex++;
        }

        if (max_score !== undefined) {
            query += ` AND l.score <= $${paramIndex}`;
            values.push(max_score);
            paramIndex++;
        }

        query += ` ORDER BY l.last_message_at DESC`;
        
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error in searchLeads:', error);
        return [];
    }
}

// Añadir al module.exports:
export {
    getOrCreateLead,
    updateLeadInfo,
    updateLead,          // <-- NUEVA
    qualifyLead,
    assignLead,
    getLeadById,
    getLeadsByBot,
    getQualifiedLeads,
    getLeadsByVendor,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    getAllLeads,         // <-- NUEVA
    getLeadsByPipeline,  // <-- NUEVA
    searchLeads          // <-- NUEVA
};

export default {
    getOrCreateLead,
    updateLeadInfo,
    updateLead,
    qualifyLead,
    assignLead,
    getLeadById,
    getLeadsByBot,
    getQualifiedLeads,
    getLeadsByVendor,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    getAllLeads,
    getLeadsByPipeline,
    searchLeads
};