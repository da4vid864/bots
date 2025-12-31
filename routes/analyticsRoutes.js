/**
 * analyticsRoutes.js
 * API endpoints para dashboards de métricas y analytics
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const complianceAlertsService = require('../services/complianceAlertsService');

/**
 * GET /api/analytics/dashboard
 * Dashboard general de métricas
 */
router.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    const { days = 30 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const startDate = new Date(Date.now() - days * 24 * 3600000);
    const endDate = new Date();

    // Obtener métricas generales
    const metrics = await analyticsService.getMetricsReport(
      tenantId,
      startDate,
      endDate
    );

    // Obtener salud del sistema
    const health = await analyticsService.getSystemHealth(tenantId);

    // Tendencias de leads
    const leadTrends = await analyticsService.getTrends(
      tenantId,
      'lead',
      parseInt(days)
    );

    // Tendencias de IA
    const aiTrends = await analyticsService.getTrends(
      tenantId,
      'ai',
      parseInt(days)
    );

    res.json({
      success: true,
      dashboard: {
        period: { startDate, endDate, days },
        metrics,
        health,
        trends: {
          leads: leadTrends,
          ai: aiTrends
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en /dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/health
 * Estado actual del sistema
 */
router.get('/health', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const health = await analyticsService.getSystemHealth(tenantId);

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('❌ Error en /health:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/trends/:metricType
 * Tendencias de métrica específica
 */
router.get('/trends/:metricType', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    const { metricType } = req.params;
    const { days = 7 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const trends = await analyticsService.getTrends(
      tenantId,
      metricType,
      parseInt(days)
    );

    res.json({
      success: true,
      metricType,
      period: { days },
      trends
    });
  } catch (error) {
    console.error('❌ Error en /trends:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/channels
 * Análisis por canal
 */
router.get('/channels', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    const { days = 30 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const channels = ['whatsapp', 'email', 'web'];
    const channelMetrics = {};

    for (const channel of channels) {
      const startDate = new Date(Date.now() - days * 24 * 3600000);
      const metrics = await analyticsService.getMetricsReport(
        tenantId,
        startDate,
        new Date(),
        channel
      );
      channelMetrics[channel] = metrics;
    }

    res.json({
      success: true,
      channels: channelMetrics,
      period: { days }
    });
  } catch (error) {
    console.error('❌ Error en /channels:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/event
 * Registra evento manualmente
 */
router.post('/event', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    const { eventType, data } = req.body;

    if (!tenantId || !eventType) {
      return res.status(400).json({ error: 'Parámetros requeridos' });
    }

    const result = await analyticsService.logEvent(
      tenantId,
      eventType,
      data || {}
    );

    res.json({
      success: result.success,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('❌ Error en /event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
