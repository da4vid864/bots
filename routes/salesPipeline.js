/**
 * salesPipeline.js
 * API routes for pipeline stage management
 * 
 * Phase 1: Database & Backend Foundation
 */

const express = require('express');
const router = express.Router();
const pipelineStageService = require('../services/pipelineStageService');
const sseController = require('../controllers/sseController');

/**
 * Middleware to get tenant ID from request
 */
function getTenantId(req) {
    return req.user?.tenant_id || req.headers['x-tenant-id'];
}

/**
 * GET /api/sales/pipeline
 * Get all pipeline stages
 */
router.get('/', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const activeOnly = req.query.active_only !== 'false';
        const stages = await pipelineStageService.getPipelineStages(activeOnly);

        res.json({
            success: true,
            count: stages.length,
            stages
        });
    } catch (error) {
        console.error('Error en GET /api/sales/pipeline:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/pipeline/stages/types
 * Get available stage types
 */
router.get('/stages/types', (req, res) => {
    try {
        const types = pipelineStageService.getStageTypes();
        
        res.json({
            success: true,
            types
        });
    } catch (error) {
        console.error('Error en GET /api/sales/pipeline/stages/types:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/pipeline/stages/:id
 * Get a specific stage
 */
router.get('/stages/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const stage = await pipelineStageService.getStageById(req.params.id);

        if (!stage) {
            return res.status(404).json({ 
                success: false, 
                error: 'Stage no encontrada' 
            });
        }

        res.json({
            success: true,
            stage
        });
    } catch (error) {
        console.error('Error en GET /api/sales/pipeline/stages/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/pipeline/stages
 * Create a new pipeline stage
 */
router.post('/stages', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { name, display_name, description, color_code, stage_type, display_order } = req.body;

        if (!name || !display_name || !stage_type) {
            return res.status(400).json({ 
                success: false, 
                error: 'name, display_name y stage_type son requeridos' 
            });
        }

        const stage = await pipelineStageService.createStage({
            name,
            display_name,
            description,
            color_code,
            stage_type,
            display_order
        });

        // Broadcast new stage via SSE
        sseController.broadcastEvent('PIPELINE_STAGE_CREATED', { stage });

        res.status(201).json({
            success: true,
            stage
        });
    } catch (error) {
        console.error('Error en POST /api/sales/pipeline/stages:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({ success: false, error: error.message });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/sales/pipeline/stages/:id
 * Update a pipeline stage
 */
router.put('/stages/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const stage = await pipelineStageService.updateStage(req.params.id, req.body);

        if (!stage) {
            return res.status(404).json({ 
                success: false, 
                error: 'Stage no encontrada' 
            });
        }

        // Broadcast update via SSE
        sseController.broadcastEvent('PIPELINE_STAGE_UPDATED', { stage });

        res.json({
            success: true,
            stage
        });
    } catch (error) {
        console.error('Error en PUT /api/sales/pipeline/stages/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/sales/pipeline/stages/:id
 * Delete a pipeline stage
 */
router.delete('/stages/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const deleted = await pipelineStageService.deleteStage(req.params.id);

        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: 'Stage no encontrada' 
            });
        }

        // Broadcast deletion via SSE
        sseController.broadcastEvent('PIPELINE_STAGE_DELETED', { stageId: req.params.id });

        res.json({
            success: true,
            message: 'Stage eliminada'
        });
    } catch (error) {
        console.error('Error en DELETE /api/sales/pipeline/stages/:id:', error);
        
        if (error.message.includes('Cannot delete')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/sales/pipeline/stages/reorder
 * Reorder pipeline stages
 */
router.patch('/stages/reorder', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { stage_ids } = req.body;

        if (!Array.isArray(stage_ids) || stage_ids.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'stage_ids debe ser un array no vacío' 
            });
        }

        await pipelineStageService.reorderStages(stage_ids);

        // Get updated stages
        const stages = await pipelineStageService.getPipelineStages();

        // Broadcast reorder via SSE
        sseController.broadcastEvent('PIPELINE_REORDERED', { stages });

        res.json({
            success: true,
            message: 'Stages reordenadas',
            stages
        });
    } catch (error) {
        console.error('Error en PATCH /api/sales/pipeline/stages/reorder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/pipeline/stats
 * Get pipeline statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const dateRange = {
            from: req.query.date_from,
            to: req.query.date_to
        };

        const stats = await pipelineStageService.getPipelineStats(dateRange);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error en GET /api/sales/pipeline/stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
