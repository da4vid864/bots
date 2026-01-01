/**
 * leadService.js
 * Business logic for lead management in the sales pipeline
 * 
 * Phase 1: Database & Backend Foundation
 */

import { query as pool } from './db.js';

/**
 * @typedef {Object} Lead
 * @property {string} id - Lead UUID
 * @property {string} tenant_id - Tenant UUID
 * @property {string} bot_id - Bot UUID
 * @property {string|null} pipeline_stage_id - Pipeline stage UUID
 * @property {string|null} contact_name - Contact name
 * @property {string} contact_phone - Contact phone number
 * @property {string|null} contact_email - Contact email
 * @property {number} lead_score - Lead score (0-100)
 * @property {Object|null} score_breakdown - Score breakdown by category
 * @property {string} qualification_status - new|qualified|disqualified|converted
 * @property {string|null} intent_level - high|medium|low|none
 * @property {string|null} assigned_to - User UUID
 * @property {Date|null} assigned_at - Assignment timestamp
 * @property {Date|null} converted_at - Conversion timestamp
 * @property {string|null} source - Lead source
 * @property {string[]} tags - Tags array
 * @property {string|null} notes - Notes
 * @property {Object|null} metadata - Additional metadata
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * Get tenant ID from context or database
 * @returns {Promise<string>} Tenant UUID
 */
async function getCurrentTenantId() {
    const result = await pool(
        "SELECT current_setting('app.current_tenant', true)::uuid as tenant_id"
    );
    return result.rows[0]?.tenant_id;
}

/**
 * Creates a new lead
 * @param {Object} data - Lead data
 * @param {string} data.bot_id - Bot UUID
 * @param {string} data.contact_phone - Contact phone number
 * @param {string} [data.contact_name] - Contact name
 * @param {string} [data.contact_email] - Contact email
 * @param {string} [data.source] - Lead source
 * @param {string[]} [data.tags] - Tags array
 * @returns {Promise<Lead>} Created lead
 */
async function createLead(data) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { bot_id, contact_phone, contact_name, contact_email, source, tags } = data;

    // Validate required fields
    if (!bot_id || !contact_phone) {
        throw new Error('bot_id and contact_phone are required');
    }

    // Check if lead already exists for this bot and phone
    const existingLead = await pool(
        `SELECT id FROM leads 
         WHERE tenant_id = $1 AND bot_id = $2 AND contact_phone = $3`,
        [tenantId, bot_id, contact_phone]
    );

    if (existingLead.rows.length > 0) {
        throw new Error('Lead with this phone number already exists for this bot');
    }

    // Get default pipeline stage (first 'new' stage)
    const defaultStage = await pool(
        `SELECT id FROM pipeline_stages 
         WHERE tenant_id = $1 AND stage_type = 'new' AND is_active = true 
         ORDER BY display_order ASC LIMIT 1`,
        [tenantId]
    );

    const result = await pool(
        `INSERT INTO leads (
            tenant_id, bot_id, pipeline_stage_id, contact_phone, 
            contact_name, contact_email, source, tags, lead_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
        RETURNING *`,
        [
            tenantId, 
            bot_id, 
            defaultStage.rows[0]?.id || null, 
            contact_phone, 
            contact_name || null, 
            contact_email || null, 
            source || null, 
            tags || []
        ]
    );

    const lead = result.rows[0];

    // Log activity
    await logActivity(lead.id, 'stage_change', { 
        from_stage: null, 
        to_stage: defaultStage.rows[0]?.id || null 
    });

    return lead;
}

/**
 * Gets leads with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Leads with pagination metadata
 */
async function getLeads(filters = {}, pagination = {}) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const {
        search,
        pipeline_stage_id,
        qualification_status,
        intent_level,
        assigned_to,
        bot_id,
        tags,
        min_score,
        max_score,
        date_from,
        date_to
    } = filters;

    const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC'
    } = pagination;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['l.tenant_id = $1'];
    let paramIndex = 2;
    const params = [tenantId];

    if (search) {
        whereConditions.push(`(
            l.contact_name ILIKE $${paramIndex} OR 
            l.contact_phone ILIKE $${paramIndex} OR 
            l.contact_email ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (pipeline_stage_id) {
        whereConditions.push(`l.pipeline_stage_id = $${paramIndex}`);
        params.push(pipeline_stage_id);
        paramIndex++;
    }

    if (qualification_status) {
        whereConditions.push(`l.qualification_status = $${paramIndex}`);
        params.push(qualification_status);
        paramIndex++;
    }

    if (intent_level) {
        whereConditions.push(`l.intent_level = $${paramIndex}`);
        params.push(intent_level);
        paramIndex++;
    }

    if (assigned_to) {
        whereConditions.push(`l.assigned_to = $${paramIndex}`);
        params.push(assigned_to);
        paramIndex++;
    }

    if (bot_id) {
        whereConditions.push(`l.bot_id = $${paramIndex}`);
        params.push(bot_id);
        paramIndex++;
    }

    if (tags && tags.length > 0) {
        whereConditions.push(`l.tags && $${paramIndex}::text[]`);
        params.push(tags);
        paramIndex++;
    }

    if (min_score !== undefined) {
        whereConditions.push(`l.lead_score >= $${paramIndex}`);
        params.push(min_score);
        paramIndex++;
    }

    if (max_score !== undefined) {
        whereConditions.push(`l.lead_score <= $${paramIndex}`);
        params.push(max_score);
        paramIndex++;
    }

    if (date_from) {
        whereConditions.push(`l.created_at >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
    }

    if (date_to) {
        whereConditions.push(`l.created_at <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
    }

    // Count total leads
    const countQuery = `SELECT COUNT(*) FROM leads l WHERE ${whereConditions.join(' AND ')}`;
    const countResult = await pool(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get leads with pagination
    const validSortColumns = ['created_at', 'lead_score', 'contact_name', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const selectQuery = `
        SELECT l.*, 
               ps.display_name as stage_name,
               ps.color_code as stage_color,
               ps.stage_type as stage_type,
               au.name as assigned_user_name,
               au.email as assigned_user_email
        FROM leads l
        LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
        LEFT JOIN auth_users au ON l.assigned_to = au.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY l.${sortColumn} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool(selectQuery, params);

    return {
        leads: result.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Gets a single lead by ID
 * @param {string} leadId - Lead UUID
 * @returns {Promise<Lead|null>} Lead or null if not found
 */
async function getLeadById(leadId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool(
        `SELECT l.*,
                ps.display_name as stage_name,
                ps.color_code as stage_color,
                ps.stage_type as stage_type,
                au.name as assigned_user_name,
                au.email as assigned_user_email
         FROM leads l
         LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
         LEFT JOIN auth_users au ON l.assigned_to = au.id
         WHERE l.id = $1 AND l.tenant_id = $2`,
        [leadId, tenantId]
    );

    return result.rows[0] || null;
}

/**
 * Updates a lead
 * @param {string} leadId - Lead UUID
 * @param {Object} data - Update data
 * @returns {Promise<Lead>} Updated lead
 */
async function updateLead(leadId, data) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const {
        contact_name,
        contact_phone,
        contact_email,
        intent_level,
        tags,
        notes,
        metadata
    } = data;

    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (contact_name !== undefined) {
        updateFields.push(`contact_name = $${paramIndex++}`);
        params.push(contact_name);
    }

    if (contact_phone !== undefined) {
        updateFields.push(`contact_phone = $${paramIndex++}`);
        params.push(contact_phone);
    }

    if (contact_email !== undefined) {
        updateFields.push(`contact_email = $${paramIndex++}`);
        params.push(contact_email);
    }

    if (intent_level !== undefined) {
        updateFields.push(`intent_level = $${paramIndex++}`);
        params.push(intent_level);
    }

    if (tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        params.push(tags);
    }

    if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        params.push(notes);
    }

    if (metadata !== undefined) {
        updateFields.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(metadata));
    }

    if (updateFields.length === 0) {
        return getLeadById(leadId);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(leadId, tenantId);

    const result = await pool(
        `UPDATE leads 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
         RETURNING *`,
        params
    );

    return result.rows[0];
}

/**
 * Deletes a lead
 * @param {string} leadId - Lead UUID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteLead(leadId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool(
        'DELETE FROM leads WHERE id = $1 AND tenant_id $2 RETURNING id',
        [leadId, tenantId]
    );

    return result.rows.length > 0;
}

/**
 * Updates lead pipeline stage
 * @param {string} leadId - Lead UUID
 * @param {string} stageId - New stage UUID
 * @param {string} [userId] - User performing the action
 * @returns {Promise<Lead>} Updated lead
 */
async function updateLeadStage(leadId, stageId, userId = null) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    // Get current stage
    const currentLead = await pool(
        'SELECT pipeline_stage_id FROM leads WHERE id = $1 AND tenant_id = $2',
        [leadId, tenantId]
    );

    if (currentLead.rows.length === 0) {
        throw new Error('Lead not found');
    }

    const oldStageId = currentLead.rows[0].pipeline_stage_id;

    // Update stage
    const result = await pool(
        `UPDATE leads 
         SET pipeline_stage_id = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3
         RETURNING *`,
        [stageId, leadId, tenantId]
    );

    // Log activity
    await logActivity(leadId, 'stage_change', {
        from_stage: oldStageId,
        to_stage: stageId
    }, userId);

    // If moving to 'won' stage, update qualification status
    const stageResult = await pool(
        'SELECT stage_type FROM pipeline_stages WHERE id = $1',
        [stageId]
    );

    if (stageResult.rows[0]?.stage_type === 'won') {
        await pool(
            `UPDATE leads 
             SET qualification_status = 'converted', converted_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [leadId]
        );
        await logActivity(leadId, 'converted', { stage: stageId }, userId);
    }

    // If moving to 'lost' stage, update qualification status
    if (stageResult.rows[0]?.stage_type === 'lost') {
        await pool(
            `UPDATE leads 
             SET qualification_status = 'disqualified', updated_at = NOW()
             WHERE id = $1`,
            [leadId]
        );
        await logActivity(leadId, 'lost', { stage: stageId }, userId);
    }

    return result.rows[0];
}

/**
 * Assigns a lead to a vendor/user
 * @param {string} leadId - Lead UUID
 * @param {string} userId - User UUID to assign to
 * @returns {Promise<Lead>} Updated lead
 */
async function assignLead(leadId, userId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool(
        `UPDATE leads 
         SET assigned_to = $1, assigned_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3
         RETURNING *`,
        [userId, leadId, tenantId]
    );

    if (result.rows.length === 0) {
        throw new Error('Lead not found');
    }

    // Log activity
    await logActivity(leadId, 'assignment', {
        assigned_to: userId
    }, userId);

    return result.rows[0];
}

/**
 * Calculates lead score based on various factors
 * @param {string} leadId - Lead UUID
 * @returns {Promise<number>} Calculated score
 */
async function calculateLeadScore(leadId) {
    const lead = await getLeadById(leadId);
    
    if (!lead) {
        throw new Error('Lead not found');
    }

    let totalScore = 0;
    const breakdown = {};

    // Base score from qualification status
    const statusScores = {
        'new': 10,
        'qualified': 30,
        'converted': 50,
        'disqualified': 0
    };
    breakdown.qualification = statusScores[lead.qualification_status] || 0;

    // Intent level scoring
    const intentScores = {
        'high': 25,
        'medium': 15,
        'low': 5,
        'none': 0
    };
    breakdown.intent = intentScores[lead.intent_level] || 0;

    // Completeness scoring
    let completeness = 0;
    if (lead.contact_name) completeness += 5;
    if (lead.contact_email) completeness += 5;
    if (lead.tags && lead.tags.length > 0) completeness += 5;
    breakdown.completeness = completeness;

    // Activity scoring - count recent activities
    const activityCount = await pool(
        `SELECT COUNT(*) FROM lead_activities 
         WHERE lead_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [leadId]
    );
    const recentActivities = parseInt(activityCount.rows[0].count, 10);
    breakdown.recent_activities = Math.min(recentActivities * 2, 10);

    // Conversation scoring
    const messageCount = await pool(
        `SELECT COUNT(*) FROM lead_conversations 
         WHERE lead_id = $1 AND message_direction = 'inbound'`,
        [leadId]
    );
    const inboundMessages = parseInt(messageCount.rows[0].count, 10);
    breakdown.conversations = Math.min(inboundMessages, 10);

    // Stage progression scoring
    const stageScores = {
        'new': 0,
        'contacted': 5,
        'scheduled': 10,
        'proposal': 15,
        'negotiation': 20,
        'won': 25,
        'lost': 0
    };
    
    const stageResult = await pool(
        `SELECT ps.stage_type FROM leads l
         JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
         WHERE l.id = $1`,
        [leadId]
    );
    breakdown.stage_progression = stageScores[stageResult.rows[0]?.stage_type] || 0;

    // Calculate total
    totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    totalScore = Math.min(totalScore, 100); // Cap at 100

    // Update lead with new score
    await pool(
        `UPDATE leads SET lead_score = $1, score_breakdown = $2, updated_at = NOW()
         WHERE id = $3`,
        [totalScore, JSON.stringify(breakdown), leadId]
    );

    // Log activity
    await logActivity(leadId, 'score_updated', { 
        new_score: totalScore, 
        breakdown 
    });

    return totalScore;
}

/**
 * Qualifies a lead
 * @param {string} leadId - Lead UUID
 * @returns {Promise<Lead>} Updated lead
 */
async function qualifyLead(leadId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool(
        `UPDATE leads 
         SET qualification_status = 'qualified', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [leadId, tenantId]
    );

    if (result.rows.length === 0) {
        throw new Error('Lead not found');
    }

    // Calculate and update score
    await calculateLeadScore(leadId);

    // Log activity
    await logActivity(leadId, 'qualified', {});

    return result.rows[0];
}

/**
 * Gets conversation history for a lead
 * @param {string} leadId - Lead UUID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Conversations
 */
async function getLeadConversations(leadId, options = {}) {
    const { limit = 100, offset = 0, direction = null } = options;

    let query = `
        SELECT * FROM lead_conversations 
        WHERE lead_id = $1
    `;
    const params = [leadId];
    let paramIndex = 2;

    if (direction) {
        query += ` AND message_direction = $${paramIndex}`;
        params.push(direction);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool(query, params);
    return result.rows;
}

/**
 * Adds a note to a lead
 * @param {string} leadId - Lead UUID
 * @param {string} note - Note content
 * @param {string} [userId] - User adding the note
 * @returns {Promise<Object>} Activity record
 */
async function addLeadNote(leadId, note, userId = null) {
    // Update lead notes
    await pool(
        `UPDATE leads SET notes = CONCAT(COALESCE(notes, ''), '\n', $1), updated_at = NOW()
         WHERE id = $2`,
        [note, leadId]
    );

    // Log activity
    return await logActivity(leadId, 'note_added', { note }, userId);
}

/**
 * Logs a lead activity
 * @param {string} leadId - Lead UUID
 * @param {string} activityType - Activity type
 * @param {Object} activityData - Activity data
 * @param {string} [performedBy] - User UUID
 * @returns {Promise<Object>} Activity record
 */
async function logActivity(leadId, activityType, activityData = {}, performedBy = null) {
    const result = await pool(
        `INSERT INTO lead_activities (lead_id, activity_type, activity_data, performed_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [leadId, activityType, JSON.stringify(activityData), performedBy]
    );

    return result.rows[0];
}

/**
 * Gets activities for a lead
 * @param {string} leadId - Lead UUID
 * @param {number} [limit=50] - Max activities to return
 * @returns {Promise<Object[]>} Activities
 */
async function getLeadActivities(leadId, limit = 50) {
    const result = await pool(
        `SELECT la.*, au.name as user_name, au.email as user_email
         FROM lead_activities la
         LEFT JOIN auth_users au ON la.performed_by = au.id
         WHERE la.lead_id = $1
         ORDER BY la.created_at DESC
         LIMIT $2`,
        [leadId, limit]
    );

    return result.rows;
}

/**
 * Gets leads by stage for pipeline view
 * @param {string} pipelineId - Pipeline UUID (optional)
 * @returns {Promise<Object>} Leads grouped by stage
 */
async function getLeadsByStage(pipelineId = null) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    let query = `
        SELECT ps.id as stage_id, ps.name, ps.display_name, ps.color_code, ps.stage_type, ps.display_order,
               COUNT(l.id) as lead_count,
               AVG(l.lead_score) as avg_score
        FROM pipeline_stages ps
        LEFT JOIN leads l ON l.pipeline_stage_id = ps.id AND l.tenant_id = $1
        WHERE ps.tenant_id = $1 AND ps.is_active = true
    `;
    const params = [tenantId];

    if (pipelineId) {
        // Filter by specific pipeline if needed
        // This would require a pipeline_id field on stages
    }

    query += ` GROUP BY ps.id ORDER BY ps.display_order`;

    const result = await pool(query, params);

    // Get leads for each stage
    const stagesWithLeads = await Promise.all(
        result.rows.map(async (stage) => {
            const leadsResult = await pool(
                `SELECT l.*, 
                        au.name as assigned_user_name
                 FROM leads l
                 LEFT JOIN auth_users au ON l.assigned_to = au.id
                 WHERE l.pipeline_stage_id = $1 AND l.tenant_id = $2
                 ORDER BY l.lead_score DESC
                 LIMIT 50`,
                [stage.stage_id, tenantId]
            );

            return {
                ...stage,
                leads: leadsResult.rows
            };
        })
    );

    return stagesWithLeads;
}

export {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    updateLeadStage,
    assignLead,
    calculateLeadScore,
    qualifyLead,
    getLeadConversations,
    addLeadNote,
    getLeadActivities,
    getLeadsByStage
};

export default {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    updateLeadStage,
    assignLead,
    calculateLeadScore,
    qualifyLead,
    getLeadConversations,
    addLeadNote,
    getLeadActivities,
    getLeadsByStage
};
