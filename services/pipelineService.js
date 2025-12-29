// services/pipelineService.js
const pool = require('./db');

/**
 * Retrieves all pipelines for the current tenant.
 * Includes nested stages.
 * 
 * @returns {Promise<Object[]>}
 */
async function getPipelines() {
    // 1. Get Pipelines
    const pipelinesResult = await pool.query(
        `SELECT * FROM pipelines 
         WHERE tenant_id = COALESCE(current_setting('app.current_tenant', true), '')::uuid 
         ORDER BY is_default DESC, created_at ASC`
    );
    const pipelines = pipelinesResult.rows;

    if (pipelines.length === 0) {
        return [];
    }

    // 2. Get Stages for all retrieved pipelines
    const pipelineIds = pipelines.map(p => p.id);
    const stagesResult = await pool.query(
        `SELECT * FROM pipeline_stages 
         WHERE pipeline_id = ANY($1::uuid[]) 
         ORDER BY position ASC`,
        [pipelineIds]
    );
    const stages = stagesResult.rows;

    // 3. Nest stages under pipelines
    return pipelines.map(pipeline => ({
        ...pipeline,
        stages: stages.filter(s => s.pipeline_id === pipeline.id)
    }));
}

/**
 * Creates a new pipeline with default stages.
 * 
 * @param {string} name - Name of the pipeline
 * @returns {Promise<Object>} The created pipeline with stages
 */
async function createPipeline(name) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create Pipeline
        const pipelineResult = await client.query(
            `INSERT INTO pipelines (name, tenant_id) 
             VALUES ($1, COALESCE(current_setting('app.current_tenant', true), '')::uuid) 
             RETURNING *`,
            [name]
        );
        const pipeline = pipelineResult.rows[0];

        // Create Default Stages
        const defaultStages = [
            { name: 'Lead', position: 0, color: '#e2e8f0', type: 'OPEN' },
            { name: 'Contacted', position: 1, color: '#fef3c7', type: 'OPEN' },
            { name: 'Proposal', position: 2, color: '#dbeafe', type: 'OPEN' },
            { name: 'Won', position: 3, color: '#dcfce7', type: 'WON' },
            { name: 'Lost', position: 4, color: '#fee2e2', type: 'LOST' }
        ];

        const stages = [];
        for (const stage of defaultStages) {
            const stageResult = await client.query(
                `INSERT INTO pipeline_stages (pipeline_id, tenant_id, name, position, color, type)
                 VALUES ($1, COALESCE(current_setting('app.current_tenant', true), '')::uuid, $2, $3, $4, $5)
                 RETURNING *`,
                [pipeline.id, stage.name, stage.position, stage.color, stage.type]
            );
            stages.push(stageResult.rows[0]);
        }

        await client.query('COMMIT');

        return {
            ...pipeline,
            stages
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Updates stage positions (Reorder).
 * 
 * @param {Array<{id: string, position: number}>} stageUpdates 
 */
async function reorderStages(stageUpdates) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const update of stageUpdates) {
            await client.query(
                `UPDATE pipeline_stages SET position = $1 
                 WHERE id = $2 AND tenant_id = COALESCE(current_setting('app.current_tenant', true), '')::uuid`,
                [update.position, update.id]
            );
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Moves a lead to a specific stage.
 * Records the event in lead_stage_events.
 * 
 * @param {number} leadId 
 * @param {string} pipelineId 
 * @param {string} stageId 
 * @param {string} userEmail - For audit
 */
async function moveLead(leadId, pipelineId, stageId, userEmail) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get current state
        const leadResult = await client.query(
            `SELECT stage_id FROM leads WHERE id = $1`,
            [leadId]
        );
        const oldStageId = leadResult.rows[0]?.stage_id;

        // Update Lead
        await client.query(
            `UPDATE leads 
             SET pipeline_id = $1, stage_id = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [pipelineId, stageId, leadId]
        );

        // Record Event
        if (oldStageId !== stageId) {
            await client.query(
                `INSERT INTO lead_stage_events (lead_id, tenant_id, old_stage_id, new_stage_id, changed_by)
                 VALUES ($1, COALESCE(current_setting('app.current_tenant', true), '')::uuid, $2, $3, $4)`,
                [leadId, oldStageId, stageId, userEmail]
            );
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getPipelines,
    createPipeline,
    reorderStages,
    moveLead
};