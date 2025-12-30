/**
 * Data Integrity Monitoring Routes
 * 
 * Provides API endpoints for monitoring and managing data integrity
 * in the WhatsApp bot system.
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../services/dataIntegrityMonitor');
const authMiddleware = require('../auth/authMiddleware');

/**
 * @route GET /api/data-integrity/status
 * @desc Get current data integrity status
 * @access Private (Admin only)
 */
router.get('/status', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const summary = await monitor.getSummary();
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error getting data integrity status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data integrity status',
            message: error.message
        });
    }
});

/**
 * @route GET /api/data-integrity/report
 * @desc Get detailed data integrity report
 * @access Private (Admin only)
 */
router.get('/report', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const report = await monitor.getDetailedReport();
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating data integrity report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate data integrity report',
            message: error.message
        });
    }
});

/**
 * @route POST /api/data-integrity/run-checks
 * @desc Manually run all data integrity checks
 * @access Private (Admin only)
 */
router.post('/run-checks', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const results = await monitor.runAllChecks();
        
        const criticalCount = results.filter(r => r.status === 'critical').length;
        const warningCount = results.filter(r => r.status === 'warning').length;
        
        res.json({
            success: true,
            data: {
                checksRun: results.length,
                criticalIssues: criticalCount,
                warningIssues: warningCount,
                results: results.map(r => ({
                    checkName: r.checkName,
                    status: r.status,
                    issueCount: r.issues.length,
                    issues: r.issues.slice(0, 5) // Return first 5 issues only
                }))
            },
            message: `Ran ${results.length} checks. Found ${criticalCount} critical and ${warningCount} warning issues.`
        });
    } catch (error) {
        console.error('Error running data integrity checks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run data integrity checks',
            message: error.message
        });
    }
});

/**
 * @route POST /api/data-integrity/fix-issues
 * @desc Attempt to automatically fix common data integrity issues
 * @access Private (Admin only)
 */
router.post('/fix-issues', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const fixResults = await monitor.fixIssues();
        
        res.json({
            success: true,
            data: fixResults,
            message: `Applied ${fixResults.fixesApplied} fixes to data integrity issues.`
        });
    } catch (error) {
        console.error('Error fixing data integrity issues:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fix data integrity issues',
            message: error.message
        });
    }
});

/**
 * @route GET /api/data-integrity/alerts
 * @desc Get recent data integrity alerts
 * @access Private (Admin only)
 */
router.get('/alerts', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        // Get alerts from the last 7 days from database
        const { pool } = require('../services/db');
        const alerts = await pool.query(`
            SELECT * FROM audit_logs 
            WHERE action = 'DATA_INTEGRITY_ALERT'
            AND created_at >= NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
            LIMIT 50
        `);
        
        res.json({
            success: true,
            data: {
                alerts: alerts.rows,
                total: alerts.rows.length
            }
        });
    } catch (error) {
        console.error('Error getting data integrity alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data integrity alerts',
            message: error.message
        });
    }
});

/**
 * @route GET /api/data-integrity/metrics
 * @desc Get data integrity metrics for dashboard
 * @access Private (Admin only)
 */
router.get('/metrics', authMiddleware.requireAuth, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const { pool } = require('../services/db');
        
        // Get database size
        const dbSize = await pool.query(`
            SELECT pg_database_size(current_database()) as size_bytes
        `);
        
        // Get table row counts
        const tableStats = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
            ORDER BY n_live_tup DESC
            LIMIT 10
        `);
        
        // Get recent growth rate (last 7 days)
        const growthRate = await pool.query(`
            SELECT 
                COUNT(*) as total_leads,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_last_7_days,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as leads_last_1_day
            FROM leads
        `);
        
        // Get data quality metrics
        const dataQuality = await pool.query(`
            SELECT 
                -- Completeness
                ROUND(AVG(CASE WHEN email IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 2) as email_completeness,
                ROUND(AVG(CASE WHEN name IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 2) as name_completeness,
                -- Validity
                ROUND(AVG(CASE WHEN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 1.0 ELSE 0.0 END) * 100, 2) as email_validity,
                ROUND(AVG(CASE WHEN whatsapp_number ~* '^\+[1-9]\d{1,14}$' THEN 1.0 ELSE 0.0 END) * 100, 2) as phone_validity
            FROM leads
        `);
        
        res.json({
            success: true,
            data: {
                database: {
                    sizeBytes: parseInt(dbSize.rows[0].size_bytes),
                    sizeMB: Math.round(parseInt(dbSize.rows[0].size_bytes) / (1024 * 1024) * 100) / 100
                },
                tables: tableStats.rows,
                growth: growthRate.rows[0] || {},
                dataQuality: dataQuality.rows[0] || {}
            }
        });
    } catch (error) {
        console.error('Error getting data integrity metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get data integrity metrics',
            message: error.message
        });
    }
});

/**
 * @route GET /api/data-integrity/health
 * @desc Health check endpoint for monitoring systems
 * @access Public (for monitoring)
 */
router.get('/health', async (req, res) => {
    try {
        // Quick health check - can we connect to database?
        const { pool } = require('../services/db');
        await pool.query('SELECT 1');
        
        // Run a quick integrity check
        const summary = await monitor.getSummary();
        
        const isHealthy = summary.criticalChecks === 0;
        
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            checks: {
                total: summary.totalChecks,
                healthy: summary.healthyChecks,
                warning: summary.warningChecks,
                critical: summary.criticalChecks
            },
            database: {
                connected: true
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                connected: false
            }
        });
    }
});

module.exports = router;