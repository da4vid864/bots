/**
 * salesMetrics.js
 * API routes for sales metrics and KPIs
 * 
 * Phase 1: Database & Backend Foundation
 */

const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');

/**
 * Middleware to get tenant ID from request
 */
function getTenantId(req) {
    return req.user?.tenant_id || req.headers['x-tenant-id'];
}

/**
 * GET /api/sales/metrics/dashboard
 * Get dashboard KPIs
 * Query params:
 *   - period: today, week, month, quarter, year (default: month)
 */
router.get('/dashboard', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const period = req.query.period || 'month';

        const metrics = await metricsService.getDashboardMetrics({ period });

        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/dashboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/metrics/pipeline
 * Get pipeline metrics (funnel analysis)
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

        const metrics = await metricsService.getPipelineMetrics();

        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/pipeline:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/metrics/trends
 * Get trend data for a metric type
 * Query params:
 *   - type: Metric type (leads_received, leads_converted, etc.)
 *   - from: Start date (ISO format)
 *   - to: End date (ISO format)
 */
router.get('/trends', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { type, from, to } = req.query;

        if (!type) {
            return res.status(400).json({ 
                success: false, 
                error: 'type es requerido' 
            });
        }

        const validTypes = [
            'leads_received', 'leads_converted', 'stage_progression',
            'response_time', 'conversion_rate', 'avg_deal_value',
            'revenue', 'calls_completed', 'emails_sent'
        ];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                error: `type debe ser uno de: ${validTypes.join(', ')}` 
            });
        }

        // Default date range: last 30 days
        const dateRange = {
            from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: to || new Date().toISOString()
        };

        const trends = await metricsService.getMetricsTrend(type, dateRange);

        res.json({
            success: true,
            metricType: type,
            dateRange,
            trends
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/trends:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/metrics/performance
 * Get performance metrics (top performers)
 * Query params:
 *   - from: Start date (ISO format)
 *   - to: End date (ISO format)
 *   - limit: Number of performers (default: 10)
 */
router.get('/performance', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { from, to, limit } = req.query;

        // Default date range: current month
        const dateRange = {
            from: from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            to: to || new Date().toISOString()
        };

        const topPerformers = await metricsService.getTopPerformers(
            dateRange,
            parseInt(limit, 10) || 10
        );

        res.json({
            success: true,
            dateRange,
            topPerformers
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/performance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/metrics/conversion
 * Get conversion rate for a date range
 * Query params:
 *   - from: Start date (ISO format)
 *   - to: End date (ISO format)
 */
router.get('/conversion', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { from, to } = req.query;

        // Default date range: last 30 days
        const dateRange = {
            from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: to || new Date().toISOString()
        };

        const conversionData = await metricsService.calculateConversionRate(dateRange);

        res.json({
            success: true,
            conversion: conversionData
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/conversion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sales/metrics/daily
 * Get daily metrics for charts
 * Query params:
 *   - days: Number of days (default: 30)
 */
router.get('/daily', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const days = parseInt(req.query.days, 10) || 30;

        const dailyMetrics = await metricsService.getDailyMetrics(days);

        res.json({
            success: true,
            days,
            metrics: dailyMetrics
        });
    } catch (error) {
        console.error('Error en GET /api/sales/metrics/daily:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sales/metrics/record
 * Record a new metric
 * Body:
 *   - type: Metric type
 *   - value: Metric value
 *   - count: Count increment (default: 1)
 *   - metadata: Additional data
 */
router.post('/record', async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID requerido' 
            });
        }

        const { type, value, count, metadata } = req.body;

        if (!type || value === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'type y value son requeridos' 
            });
        }

        const metric = await metricsService.recordMetric(
            type,
            parseFloat(value),
            parseInt(count, 10) || 1,
            metadata
        );

        res.status(201).json({
            success: true,
            metric
        });
    } catch (error) {
        console.error('Error en POST /api/sales/metrics/record:', error);
        
        if (error.message.includes('Invalid metric type')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
