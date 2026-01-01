/**
 * salesLeads.js
 * API routes for lead management in the sales pipeline
 * 
 * Phase 1: Database & Backend Foundation
 */

import express from 'express';
const router = express.Router();
import leadService from '../services/leadService.js';
import sseController from '../controllers/sseController.js';

/**
 * Middleware to get tenant ID from request
 */
function getTenantId(req) {
    return req.user?.tenant_id || req.headers['x-tenant-id'];
}

/**
 * GET /api/sales/leads
 * List leads with filtering and pagination
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - search: Search term
 *   - pipeline_stage_id: Filter by stage
 *   - qualification_status: Filter by status
 *   - intent_level: Filter by intent
 *   - assigned_to: Filter by assigned user
 *   - bot_id: Filter by bot
 *   - min_score, max_score: Score range
 *   - sort_by, sort_order: Sorting
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

        const filters = {
            search: req.query.search,
            pipeline_stage_id: req.query.pipeline_stage_id,
            qualification_status: req.query.qualification_status,
            intent_level: req.query.intent_level,
            assigned_to: req.query.assigned_to,
            bot_id: req.query.bot_id,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            min_score: req.query.min_score ? parseFloat(req.query.min_score) : undefined,
            max_score: req.query.max_score ? parseFloat(req.query.max_score) : undefined,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };

        const pagination = {
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 20,
            sort_by: req.query.sort_by || 'created_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await leadService.getLeads(filters, pagination);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error en GET /api/sales/leads:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/leads/pipeline
 * Get leads grouped by pipeline stage (Kanban view)
 */
router.get('/pipeline', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const stages = await leadService.getLeadsByStage();

        res.json({
            success: true,
            stages
        });
    } catch (error) {
        console.error('Error en GET /api/sales/leads/pipeline:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/leads
 * Create a new lead
 */
router.post('/', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { bot_id, contact_phone, contact_name, contact_email, source, tags } = req.body;

        if (!bot_id || !contact_phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'bot_id y contact_phone son requeridos' 
            });
        }

        const lead = await leadService.createLead({
            bot_id,
            contact_phone,
            contact_name,
            contact_email,
            source,
            tags
        });

        // Broadcast new lead via SSE (legacy)
        sseController.broadcastEvent('NEW_LEAD', { lead });
        
        // Broadcast new lead via sales-specific event
        sseController.salesEvents.emitLeadCreated(lead);

        res.status(201).json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en POST /api/sales/leads:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({ success: false, error: error.message });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/leads/:id
 * Get lead details
 */
router.get('/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const lead = await leadService.getLeadById(req.params.id);

        if (!lead) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en GET /api/sales/leads/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/sales/leads/:id
 * Update lead information
 */
router.put('/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const lead = await leadService.updateLead(req.params.id, req.body);

        if (!lead) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        // Broadcast update via SSE (legacy)
        sseController.broadcastEvent('LEAD_UPDATED', { lead });
        
        // Broadcast update via sales-specific event
        sseController.salesEvents.emitLeadUpdated(lead);

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en PUT /api/sales/leads/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/sales/leads/:id
 * Delete a lead
 */
router.delete('/:id', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const deleted = await leadService.deleteLead(req.params.id);

        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        // Broadcast deletion via SSE (legacy)
        sseController.broadcastEvent('LEAD_DELETED', { leadId: req.params.id });
        
        // Broadcast deletion via sales-specific event
        sseController.salesEvents.emitLeadDeleted(req.params.id, tenantId);

        res.json({
            success: true,
            message: 'Lead eliminado'
        });
    } catch (error) {
        console.error('Error en DELETE /api/sales/leads/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/sales/leads/:id/stage
 * Update lead pipeline stage
 */
router.patch('/:id/stage', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { stage_id } = req.body;

        if (!stage_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'stage_id es requerido' 
            });
        }

        const userId = req.user?.id;
        const lead = await leadService.updateLeadStage(req.params.id, stage_id, userId);

        if (!lead) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        // Broadcast stage change via SSE (legacy)
        sseController.broadcastEvent('LEAD_STAGE_CHANGED', { lead, stageId: stage_id });
        
        // Broadcast stage change via sales-specific event
        sseController.salesEvents.emitStageChanged(req.params.id, null, stage_id, lead);

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en PATCH /api/sales/leads/:id/stage:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/sales/leads/:id/assign
 * Assign lead to a vendor
 */
router.patch('/:id/assign', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'user_id es requerido' 
            });
        }

        const lead = await leadService.assignLead(req.params.id, user_id);

        if (!lead) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        // Broadcast assignment via SSE (legacy)
        sseController.broadcastEvent('LEAD_ASSIGNED', { lead, assignedTo: user_id });
        
        // Broadcast assignment via sales-specific event
        sseController.salesEvents.emitLeadAssigned(req.params.id, user_id, lead);

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en PATCH /api/sales/leads/:id/assign:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/leads/:id/score
 * Calculate/recalculate lead score
 */
router.post('/:id/score', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const newScore = await leadService.calculateLeadScore(req.params.id);

        res.json({
            success: true,
            leadScore: newScore
        });
    } catch (error) {
        console.error('Error en POST /api/sales/leads/:id/score:', error);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/leads/:id/qualify
 * Qualify a lead
 */
router.post('/:id/qualify', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const lead = await leadService.qualifyLead(req.params.id);

        if (!lead) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lead no encontrado' 
            });
        }

        // Broadcast qualification via SSE (legacy)
        sseController.broadcastEvent('LEAD_QUALIFIED', { lead });
        
        // Broadcast qualification via sales-specific event
        sseController.salesEvents.emitLeadQualified(req.params.id, lead);

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en POST /api/sales/leads/:id/qualify:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/leads/:id/conversations
 * Get conversation history for a lead
 */
router.get('/:id/conversations', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const conversations = await leadService.getLeadConversations(req.params.id, {
            limit: parseInt(req.query.limit, 10) || 100,
            offset: parseInt(req.query.offset, 10) || 0,
            direction: req.query.direction
        });

        res.json({
            success: true,
            count: conversations.length,
            conversations
        });
    } catch (error) {
        console.error('Error en GET /api/sales/leads/:id/conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/leads/:id/notes
 * Add a note to a lead
 */
router.post('/:id/notes', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ 
                success: false, 
                error: 'note es requerido' 
            });
        }

        const userId = req.user?.id;
        const activity = await leadService.addLeadNote(req.params.id, note, userId);

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Error en POST /api/sales/leads/:id/notes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/leads/:id/activities
 * Get activity history for a lead
 */
router.get('/:id/activities', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const activities = await leadService.getLeadActivities(req.params.id, 50);

        res.json({
            success: true,
            count: activities.length,
            activities
        });
    } catch (error) {
        console.error('Error en GET /api/sales/leads/:id/activities:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
