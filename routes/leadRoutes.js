/**
 * leadRoutes.js
 * API endpoints para manejo de leads en el pipeline
 */

const express = require('express');
const router = express.Router();
const leadDbService = require('../services/leadDbService');
const pipelineService = require('../services/pipelineService');

/**
 * GET /api/leads
 * Get all leads for current tenant
 */
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID requerido' });
        }

        const leads = await leadDbService.getAllLeads(tenantId);
        
        res.json({
            success: true,
            count: leads.length,
            leads
        });
    } catch (error) {
        console.error('Error en GET /api/leads:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/leads/search
 * Search leads with filters
 */
router.get('/search', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const filters = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID requerido' });
        }

        const leads = await leadDbService.searchLeads(tenantId, {
            search: filters.search,
            pipeline_id: filters.pipeline_id,
            stage_id: filters.stage_id,
            status: filters.status,
            assigned_to: filters.assigned_to,
            min_score: filters.min_score ? parseInt(filters.min_score) : undefined,
            max_score: filters.max_score ? parseInt(filters.max_score) : undefined
        });

        res.json({
            success: true,
            count: leads.length,
            leads
        });
    } catch (error) {
        console.error('Error en GET /api/leads/search:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/leads/:id
 * Get specific lead by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const leadId = req.params.id;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID requerido' });
        }

        const lead = await leadDbService.getLeadById(leadId);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        // Verify tenant access
        // (Assuming tenant_id is stored in leads table)
        
        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en GET /api/leads/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/leads/:id
 * Update lead information
 */
router.put('/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const leadId = req.params.id;
        const updates = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID requerido' });
        }

        const updatedLead = await leadDbService.updateLead(leadId, tenantId, updates);
        
        if (!updatedLead) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        res.json({
            success: true,
            lead: updatedLead
        });
    } catch (error) {
        console.error('Error en PUT /api/leads/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/pipelines/:pipelineId/leads
 * Get leads by pipeline
 */
router.get('/pipeline/:pipelineId', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const pipelineId = req.params.pipelineId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID requerido' });
        }

        const leads = await leadDbService.getLeadsByPipeline(tenantId, pipelineId);
        
        res.json({
            success: true,
            count: leads.length,
            leads
        });
    } catch (error) {
        console.error('Error en GET /api/pipelines/:pipelineId/leads:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/leads/:id/assign
 * Assign lead to current user
 */
router.post('/:id/assign', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const leadId = req.params.id;
        const userEmail = req.user?.email;

        if (!tenantId || !userEmail) {
            return res.status(400).json({ error: 'Datos requeridos incompletos' });
        }

        const lead = await leadDbService.assignLead(leadId, userEmail);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        res.json({
            success: true,
            lead
        });
    } catch (error) {
        console.error('Error en POST /api/leads/:id/assign:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;