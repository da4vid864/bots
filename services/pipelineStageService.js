/**
 * pipelineStageService.js
 * Business logic for pipeline stage management
 * 
 * Phase 1: Database & Backend Foundation
 */

const pool = require('./db');

/**
 * @typedef {Object} PipelineStage
 * @property {string} id - Stage UUID
 * @property {string} tenant_id - Tenant UUID
 * @property {string} name - Internal name
 * @property {string} display_name - Display name
 * @property {string|null} description - Stage description
 * @property {string} color_code - HEX color code
 * @property {string} stage_type - new|contacted|scheduled|proposal|negotiation|won|lost
 * @property {number} display_order - Order in pipeline
 * @property {boolean} is_active - Active status
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * Get tenant ID from context
 * @returns {Promise<string>} Tenant UUID
 */
async function getCurrentTenantId() {
    const result = await pool.query(
        "SELECT current_setting('app.current_tenant', true)::uuid as tenant_id"
    );
    return result.rows[0]?.tenant_id;
}

/**
 * Gets all pipeline stages for a tenant
 * @param {boolean} [activeOnly=true] - Only return active stages
 * @returns {Promise<PipelineStage[]>} Array of stages ordered by display_order
 */
async function getPipelineStages(activeOnly = true) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    let query = `
        SELECT * FROM pipeline_stages 
        WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (activeOnly) {
        query += ` AND is_active = true`;
    }

    query += ` ORDER BY display_order ASC`;

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Gets a single pipeline stage by ID
 * @param {string} stageId - Stage UUID
 * @returns {Promise<PipelineStage|null>} Stage or null
 */
async function getStageById(stageId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool.query(
        'SELECT * FROM pipeline_stages WHERE id = $1 AND tenant_id = $2',
        [stageId, tenantId]
    );

    return result.rows[0] || null;
}

/**
 * Creates a new pipeline stage
 * @param {Object} data - Stage data
 * @param {string} data.name - Internal name (unique per tenant)
 * @param {string} data.display_name - Display name
 * @param {string} [data.description] - Description
 * @param {string} [data.color_code] - HEX color (default: #3B82F6)
 * @param {string} data.stage_type - Stage type
 * @param {number} [data.display_order] - Display order
 * @returns {Promise<PipelineStage>} Created stage
 */
async function createStage(data) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { name, display_name, description, color_code, stage_type, display_order } = data;

    // Validate required fields
    if (!name || !display_name || !stage_type) {
        throw new Error('name, display_name, and stage_type are required');
    }

    // Validate stage_type
    const validTypes = ['new', 'contacted', 'scheduled', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validTypes.includes(stage_type)) {
        throw new Error(`stage_type must be one of: ${validTypes.join(', ')}`);
    }

    // Check for duplicate name
    const existing = await pool.query(
        'SELECT id FROM pipeline_stages WHERE tenant_id = $1 AND name = $2',
        [tenantId, name]
    );

    if (existing.rows.length > 0) {
        throw new Error('A stage with this name already exists');
    }

    // Get next display order if not provided
    let order = display_order;
    if (order === undefined || order === null) {
        const maxOrder = await pool.query(
            'SELECT MAX(display_order) FROM pipeline_stages WHERE tenant_id = $1',
            [tenantId]
        );
        order = (maxOrder.rows[0].max || 0) + 1;
    }

    const result = await pool.query(
        `INSERT INTO pipeline_stages (
            tenant_id, name, display_name, description, color_code, stage_type, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            tenantId,
            name,
            display_name,
            description || null,
            color_code || '#3B82F6',
            stage_type,
            order
        ]
    );

    return result.rows[0];
}

/**
 * Updates a pipeline stage
 * @param {string} stageId - Stage UUID
 * @param {Object} data - Update data
 * @returns {Promise<PipelineStage>} Updated stage
 */
async function updateStage(stageId, data) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { display_name, description, color_code, stage_type, display_order, is_active } = data;

    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        params.push(display_name);
    }

    if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(description);
    }

    if (color_code !== undefined) {
        updateFields.push(`color_code = $${paramIndex++}`);
        params.push(color_code);
    }

    if (stage_type !== undefined) {
        const validTypes = ['new', 'contacted', 'scheduled', 'proposal', 'negotiation', 'won', 'lost'];
        if (!validTypes.includes(stage_type)) {
            throw new Error(`stage_type must be one of: ${validTypes.join(', ')}`);
        }
        updateFields.push(`stage_type = $${paramIndex++}`);
        params.push(stage_type);
    }

    if (display_order !== undefined) {
        updateFields.push(`display_order = $${paramIndex++}`);
        params.push(display_order);
    }

    if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        params.push(is_active);
    }

    if (updateFields.length === 0) {
        return getStageById(stageId);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(stageId, tenantId);

    const result = await pool.query(
        `UPDATE pipeline_stages 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
         RETURNING *`,
        params
    );

    if (result.rows.length === 0) {
        throw new Error('Stage not found');
    }

    return result.rows[0];
}

/**
 * Deletes a pipeline stage
 * @param {string} stageId - Stage UUID
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteStage(stageId) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    // Check if any leads are in this stage
    const leadsInStage = await pool.query(
        'SELECT COUNT(*) FROM leads WHERE pipeline_stage_id = $1 AND tenant_id = $2',
        [stageId, tenantId]
    );

    if (parseInt(leadsInStage.rows[0].count, 10) > 0) {
        throw new Error('Cannot delete stage with leads. Move leads first.');
    }

    const result = await pool.query(
        'DELETE FROM pipeline_stages WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [stageId, tenantId]
    );

    return result.rows.length > 0;
}

/**
 * Reorders pipeline stages
 * @param {string[]} stageIds - Array of stage IDs in desired order
 * @returns {Promise<void>}
 */
async function reorderStages(stageIds) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
        throw new Error('stageIds must be a non-empty array');
    }

    // Update each stage's display order
    for (let i = 0; i < stageIds.length; i++) {
        await pool.query(
            `UPDATE pipeline_stages 
             SET display_order = $1, updated_at = NOW()
             WHERE id = $2 AND tenant_id = $3`,
            [i + 1, stageIds[i], tenantId]
        );
    }
}

/**
 * Gets pipeline statistics for a tenant
 * @param {Object} dateRange - Date range for stats
 * @param {Date} [dateRange.from] - Start date
 * @param {Date} [dateRange.to] - End date
 * @returns {Promise<Object>} Pipeline statistics
 */
async function getPipelineStats(dateRange = {}) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { from, to } = dateRange;

    // Get stage distribution
    const stageStats = await pool.query(
        `SELECT 
            ps.id,
            ps.name,
            ps.display_name,
            ps.color_code,
            ps.stage_type,
            COUNT(l.id) as lead_count,
            COALESCE(AVG(l.lead_score), 0)::decimal(5,2) as avg_score,
            COALESCE(SUM(CASE WHEN l.qualification_status = 'qualified' THEN 1 ELSE 0 END), 0) as qualified_count
         FROM pipeline_stages ps
         LEFT JOIN leads l ON l.pipeline_stage_id = ps.id AND l.tenant_id = $1
         WHERE ps.tenant_id = $1 AND ps.is_active = true
         GROUP BY ps.id
         ORDER BY ps.display_order`,
        [tenantId]
    );

    // Get overall metrics
    let dateFilter = '';
    const dateParams = [tenantId];

    if (from) {
        dateFilter += ` AND created_at >= $${dateParams.length + 1}`;
        dateParams.push(from);
    }

    if (to) {
        dateFilter += ` AND created_at <= $${dateParams.length + 1}`;
        dateParams.push(to);
    }

    const overallStats = await pool.query(
        `SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN qualification_status = 'qualified' THEN 1 END) as qualified_leads,
            COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) as converted_leads,
            COUNT(CASE WHEN qualification_status = 'disqualified' THEN 1 END) as lost_leads,
            COALESCE(AVG(lead_score), 0)::decimal(5,2) as avg_score,
            COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_leads
         FROM leads
         WHERE tenant_id = $1 ${dateFilter}`,
        dateParams
    );

    // Get stage progression (moves between stages)
    const progressionStats = await pool.query(
        `SELECT 
            ps.stage_type,
            COUNT(*) as transitions
         FROM lead_activities la
         JOIN pipeline_stages ps ON (la.activity_data->>'to_stage')::uuid = ps.id
         WHERE la.activity_type = 'stage_change'
           AND ps.tenant_id = $1
           ${from ? `AND la.created_at >= $2` : ''}
           ${to ? `AND la.created_at <= ${from ? '$3' : '$2'}` : ''}
         GROUP BY ps.stage_type
         ORDER BY transitions DESC`,
        from ? [tenantId, from, to] : [tenantId]
    );

    // Calculate conversion rate
    const total = parseInt(overallStats.rows[0].total_leads, 10) || 1;
    const converted = parseInt(overallStats.rows[0].converted_leads, 10);
    const conversionRate = ((converted / total) * 100).toFixed(2);

    // Calculate qualification rate
    const qualified = parseInt(overallStats.rows[0].qualified_leads, 10);
    const qualificationRate = ((qualified / total) * 100).toFixed(2);

    return {
        stages: stageStats.rows,
        overall: {
            totalLeads: parseInt(overallStats.rows[0].total_leads, 10),
            qualifiedLeads: qualified,
            convertedLeads: converted,
            lostLeads: parseInt(overallStats.rows[0].lost_leads, 10),
            assignedLeads: parseInt(overallStats.rows[0].assigned_leads, 10),
            avgScore: parseFloat(overallStats.rows[0].avg_score),
            conversionRate: parseFloat(conversionRate),
            qualificationRate: parseFloat(qualificationRate)
        },
        progression: progressionStats.rows
    };
}

/**
 * Gets stage types available
 * @returns {string[]} Array of valid stage types
 */
function getStageTypes() {
    return ['new', 'contacted', 'scheduled', 'proposal', 'negotiation', 'won', 'lost'];
}

/**
 * Gets stage by type
 * @param {string} stageType - Stage type
 * @returns {Promise<PipelineStage|null>} Stage or null
 */
async function getStageByType(stageType) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool.query(
        'SELECT * FROM pipeline_stages WHERE tenant_id = $1 AND stage_type = $2 AND is_active = true ORDER BY display_order ASC LIMIT 1',
        [tenantId, stageType]
    );

    return result.rows[0] || null;
}

module.exports = {
    getPipelineStages,
    getStageById,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    getPipelineStats,
    getStageTypes,
    getStageByType
};
