const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const complianceAlertsService = require('../services/complianceAlertsService');
const { requireAuth, requireAdmin } = require('../auth/authMiddleware');

// ========== Rutas Legacy ==========
// Submit a request (Access, Rectify, Cancel, Oppose)
router.post('/request', requireAuth, complianceController.submitRequest);

// List my requests (for the user) or all requests (for the admin)
router.get('/requests', requireAuth, complianceController.listRequests);

// Admin approves/rejects a request
router.post('/requests/:id/review', requireAdmin, complianceController.reviewRequest);

// ========== Rutas Nuevas - Alertas y Monitoreo ==========

/**
 * GET /api/compliance/status
 * Obtiene estado general de compliance
 */
router.get('/status', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const status = await complianceAlertsService.getComplianceStatus(tenantId);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Error en /status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/compliance/alerts
 * Lista alertas de compliance
 */
router.get('/alerts', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { limit = 20 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const alerts = await complianceAlertsService.getRecentAlerts(
      tenantId,
      parseInt(limit)
    );

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('❌ Error en /alerts:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/check-consents
 * Verifica consentimientos faltantes
 */
router.post('/check-consents', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const result = await complianceAlertsService.checkMissingConsents(tenantId);

    res.json({
      success: !result.error,
      result
    });
  } catch (error) {
    console.error('❌ Error en /check-consents:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/scan-pii
 * Escanea por datos personales sensibles
 */
router.post('/scan-pii', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const result = await complianceAlertsService.scanForPII(tenantId);

    res.json({
      success: !result.error,
      result
    });
  } catch (error) {
    console.error('❌ Error en /scan-pii:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/check-arco
 * Verifica solicitudes ARCO vencidas
 */
router.post('/check-arco', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const result = await complianceAlertsService.checkARCORequests(tenantId);

    res.json({
      success: !result.error,
      result
    });
  } catch (error) {
    console.error('❌ Error en /check-arco:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/check-access
 * Detecta accesos sospechosos
 */
router.post('/check-access', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const result = await complianceAlertsService.checkSuspiciousAccess(tenantId);

    res.json({
      success: !result.error,
      result
    });
  } catch (error) {
    console.error('❌ Error en /check-access:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/compliance/report
 * Genera reporte de compliance para auditoría
 */
router.get('/report', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { startDate, endDate } = req.query;

    if (!tenantId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Parámetros requeridos' });
    }

    const report = await complianceAlertsService.generateComplianceReport(
      tenantId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: !report.error,
      report
    });
  } catch (error) {
    console.error('❌ Error en /report:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/start-monitoring
 * Inicia monitoreo automático de compliance
 */
router.post('/start-monitoring', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const result = await complianceAlertsService.startComplianceMonitoring(tenantId);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Error en /start-monitoring:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;