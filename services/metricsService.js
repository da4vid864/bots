/**
 * metricsService.js
 * Business logic for sales metrics and KPIs
 * 
 * Phase 1: Database & Backend Foundation
 */

import { query as pool } from './db.js';

/**
 * @typedef {Object} SalesMetric
 * @property {string} id - Metric UUID
 * @property {string} tenant_id - Tenant UUID
 * @property {Date} metric_date - Date of metric
 * @property {string} metric_type - Metric type
 * @property {number|null} metric_value - Numeric value
 * @property {number} metric_count - Count value
 * @property {Object|null} metadata - Additional data
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} DashboardMetrics
 * @property {Object} leads - Lead metrics
 * @property {Object} conversion - Conversion metrics
 * @property {Object} revenue - Revenue metrics
 * @property {Object} response - Response time metrics
 * @property {Object[]} trends - Time series data
 */

/**
 * Get tenant ID from context
 * @returns {Promise<string>} Tenant UUID
 */
async function getCurrentTenantId() {
    const result = await pool(
        "SELECT current_setting('app.current_tenant', true)::uuid as tenant_id"
    );
    return result.rows[0]?.tenant_id;
}

/**
 * Gets dashboard metrics for a tenant
 * @param {Object} options - Options
 * @param {string} [options.period] - Period: today, week, month, quarter, year
 * @returns {Promise<DashboardMetrics>} Dashboard metrics
 */
async function getDashboardMetrics(options = {}) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { period = 'month' } = options;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'quarter':
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterMonth, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get lead metrics
    const leadMetrics = await pool(
        `SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_leads_period,
            COUNT(CASE WHEN qualification_status = 'qualified' THEN 1 END) as qualified_leads,
            COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) as converted_leads,
            COUNT(CASE WHEN qualification_status = 'disqualified' THEN 1 END) as lost_leads,
            COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_leads,
            COALESCE(AVG(lead_score), 0)::decimal(5,2) as avg_score,
            COUNT(CASE WHEN intent_level = 'high' THEN 1 END) as high_intent_leads
         FROM leads
         WHERE tenant_id = $2`,
        [startDate, tenantId]
    );

    const leadData = leadMetrics.rows[0];

    // Calculate rates
    const totalLeads = parseInt(leadData.total_leads, 10) || 1;
    const newLeadsPeriod = parseInt(leadData.new_leads_period, 10);
    const qualifiedLeads = parseInt(leadData.qualified_leads, 10);
    const convertedLeads = parseInt(leadData.converted_leads, 10);
    const lostLeads = parseInt(leadData.lost_leads, 10);

    const conversionRate = totalLeads > 0 
        ? ((convertedLeads / totalLeads) * 100).toFixed(2) 
        : 0;
    const qualificationRate = totalLeads > 0 
        ? ((qualifiedLeads / totalLeads) * 100).toFixed(2) 
        : 0;
    const winRate = (qualifiedLeads + convertedLeads + lostLeads) > 0
        ? ((convertedLeads / (qualifiedLeads + convertedLeads + lostLeads)) * 100).toFixed(2)
        : 0;

    // Get pipeline distribution
    const pipelineDist = await pool(
        `SELECT 
            ps.stage_type,
            ps.display_name,
            ps.color_code,
            COUNT(l.id) as count,
            COALESCE(AVG(l.lead_score), 0)::decimal(5,2) as avg_score
         FROM pipeline_stages ps
         LEFT JOIN leads l ON l.pipeline_stage_id = ps.id AND l.tenant_id = $1
         WHERE ps.tenant_id = $1 AND ps.is_active = true
         GROUP BY ps.id
         ORDER BY ps.display_order`,
        [tenantId]
    );

    // Get activity metrics
    const activityMetrics = await pool(
        `SELECT 
            activity_type,
            COUNT(*) as count
         FROM lead_activities
         WHERE lead_id IN (SELECT id FROM leads WHERE tenant_id = $1)
           AND created_at >= $2
         GROUP BY activity_type`,
        [tenantId, startDate]
    );

    // Get response time metrics (from conversation timestamps)
    const responseTime = await pool(
        `SELECT 
            COALESCE(AVG(
                EXTRACT(EPOCH FROM (lc2.created_at - lc1.created_at))
            ) / 60, 0)::decimal(10,2) as avg_response_minutes
         FROM lead_conversations lc1
         JOIN lead_conversations lc2 ON lc1.lead_id = lc2.lead_id
         JOIN leads l ON l.id = lc1.lead_id
         WHERE l.tenant_id = $1
           AND lc1.message_direction = 'inbound'
           AND lc2.message_direction = 'outbound'
           AND lc2.created_at > lc1.created_at
           AND lc1.created_at >= $2
         LIMIT 1`,
        [tenantId, startDate]
    );

    // Get top performers (vendors with most conversions)
    const topPerformers = await pool(
        `SELECT 
            au.id,
            au.name,
            au.email,
            COUNT(l.id) as converted_leads,
            COALESCE(AVG(l.lead_score), 0)::decimal(5,2) as avg_score
         FROM auth_users au
         JOIN leads l ON l.assigned_to = au.id
         WHERE l.tenant_id = $1
           AND l.qualification_status = 'converted'
           AND l.created_at >= $2
         GROUP BY au.id
         ORDER BY converted_leads DESC
         LIMIT 5`,
        [tenantId, startDate]
    );

    // Get recent trends (daily breakdown for last 7 days)
    const trends = await pool(
        `SELECT 
            DATE(created_at) as date,
            COUNT(*) as leads,
            COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) as conversions
         FROM leads
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`
    , [tenantId]);

    return {
        leads: {
            total: totalLeads,
            new: newLeadsPeriod,
            qualified: qualifiedLeads,
            converted: convertedLeads,
            lost: lostLeads,
            assigned: parseInt(leadData.assigned_leads, 10),
            avgScore: parseFloat(leadData.avg_score),
            highIntent: parseInt(leadData.high_intent_leads, 10)
        },
        conversion: {
            rate: parseFloat(conversionRate),
            qualificationRate: parseFloat(qualificationRate),
            winRate: parseFloat(winRate)
        },
        pipeline: pipelineDist.rows.map(p => ({
            stage: p.stage_type,
            displayName: p.display_name,
            color: p.color_code,
            count: parseInt(p.count, 10),
            avgScore: parseFloat(p.avg_score)
        })),
        activities: activityMetrics.rows.reduce((acc, row) => {
            acc[row.activity_type] = parseInt(row.count, 10);
            return acc;
        }, {}),
        responseTime: {
            avgMinutes: parseFloat(responseTime.rows[0]?.avg_response_minutes || 0)
        },
        topPerformers: topPerformers.rows.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            conversions: parseInt(p.converted_leads, 10),
            avgScore: parseFloat(p.avg_score)
        })),
        trends: trends.rows.map(t => ({
            date: t.date,
            leads: parseInt(t.leads, 10),
            conversions: parseInt(t.conversions, 10)
        })),
        period,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Records a metric
 * @param {string} metricType - Metric type
 * @param {number} value - Metric value
 * @param {number} [count=1] - Count increment
 * @param {Object} [metadata] - Additional data
 * @returns {Promise<SalesMetric>} Created/updated metric
 */
async function recordMetric(metricType, value, count = 1, metadata = {}) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const validTypes = [
        'leads_received', 'leads_converted', 'stage_progression',
        'response_time', 'conversion_rate', 'avg_deal_value',
        'revenue', 'calls_completed', 'emails_sent'
    ];

    if (!validTypes.includes(metricType)) {
        throw new Error(`Invalid metric type. Must be one of: ${validTypes.join(', ')}`);
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await pool(
        `INSERT INTO sales_metrics (tenant_id, metric_date, metric_type, metric_value, metric_count, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, metric_date, metric_type)
         DO UPDATE SET 
             metric_value = $4,
             metric_count = sales_metrics.metric_count + $5,
             metadata = $6,
             created_at = NOW()
         RETURNING *`,
        [tenantId, today, metricType, value, count, JSON.stringify(metadata)]
    );

    return result.rows[0];
}

/**
 * Gets metrics trend for a specific metric type
 * @param {string} metricType - Metric type
 * @param {Object} dateRange - Date range
 * @param {Date} dateRange.from - Start date
 * @param {Date} dateRange.to - End date
 * @returns {Promise<Object[]>} Trend data
 */
async function getMetricsTrend(metricType, dateRange) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { from, to } = dateRange;

    const result = await pool(
        `SELECT 
            metric_date as date,
            metric_type,
            metric_value,
            metric_count,
            metadata
         FROM sales_metrics
         WHERE tenant_id = $1
           AND metric_type = $2
           AND metric_date >= $3
           AND metric_date <= $4
         ORDER BY metric_date ASC`,
        [tenantId, metricType, from, to]
    );

    return result.rows;
}

/**
 * Calculates conversion rate for a date range
 * @param {Object} dateRange - Date range
 * @returns {Promise<Object>} Conversion rate data
 */
async function calculateConversionRate(dateRange) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { from, to } = dateRange;

    const result = await pool(
        `SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) as converted,
            COUNT(CASE WHEN qualification_status = 'disqualified' THEN 1 END) as lost,
            COUNT(CASE WHEN qualification_status = 'qualified' THEN 1 END) as qualified,
            COUNT(CASE WHEN qualification_status = 'new' THEN 1 END) as new
         FROM leads
         WHERE tenant_id = $1
           AND created_at >= $2
           AND created_at <= $3`,
        [tenantId, from, to]
    );

    const data = result.rows[0];
    const total = parseInt(data.total_leads, 10) || 1;
    const converted = parseInt(data.converted, 10);
    const lost = parseInt(data.lost, 10);
    const qualified = parseInt(data.qualified, 10);

    return {
        total,
        converted,
        lost,
        qualified,
        new: parseInt(data.new, 10),
        conversionRate: parseFloat(((converted / total) * 100).toFixed(2)),
        winRate: parseFloat(((converted / (converted + lost + qualified)) * 100).toFixed(2)),
        period: { from, to }
    };
}

/**
 * Gets top performers for a date range
 * @param {Object} dateRange - Date range
 * @param {number} [limit=10] - Number of performers to return
 * @returns {Promise<Object[]>} Top performers
 */
async function getTopPerformers(dateRange, limit = 10) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const { from, to } = dateRange;

    const result = await pool(
        `SELECT 
            au.id,
            au.name,
            au.email,
            COUNT(l.id) as total_assigned,
            COUNT(CASE WHEN l.qualification_status = 'converted' THEN 1 END) as conversions,
            COUNT(CASE WHEN l.qualification_status = 'qualified' THEN 1 END) as qualifications,
            COALESCE(AVG(l.lead_score), 0)::decimal(5,2) as avg_score,
            SUM(CASE WHEN l.qualification_status = 'converted' THEN 1 ELSE 0 END)::decimal / 
                NULLIF(COUNT(CASE WHEN l.qualification_status IN ('converted', 'lost') THEN 1 END), 0) * 100 as win_rate
         FROM auth_users au
         JOIN leads l ON l.assigned_to = au.id
         WHERE l.tenant_id = $1
           AND l.assigned_at >= $2
           AND l.assigned_at <= $3
         GROUP BY au.id
         ORDER BY conversions DESC
         LIMIT $4`,
        [tenantId, from, to, limit]
    );

    return result.rows.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        totalAssigned: parseInt(p.total_assigned, 10),
        conversions: parseInt(p.conversions, 10),
        qualifications: parseInt(p.qualifications, 10),
        avgScore: parseFloat(p.avg_score),
        winRate: parseFloat(p.win_rate || 0)
    }));
}

/**
 * Gets pipeline metrics (funnel analysis)
 * @returns {Promise<Object>} Pipeline funnel data
 */
async function getPipelineMetrics() {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const stages = await pool(
        `SELECT 
            ps.id,
            ps.name,
            ps.display_name,
            ps.color_code,
            ps.stage_type,
            ps.display_order,
            COUNT(l.id) as leads_in_stage,
            COUNT(l.id)::decimal / NULLIF(
                (SELECT COUNT(*) FROM leads WHERE tenant_id = $1), 0
            ) * 100 as percentage_of_total,
            COALESCE(AVG(l.lead_score), 0)::decimal(5,2) as avg_score,
            COUNT(CASE WHEN l.assigned_to IS NOT NULL THEN 1 END) as assigned_count
         FROM pipeline_stages ps
         LEFT JOIN leads l ON l.pipeline_stage_id = ps.id AND l.tenant_id = $1
         WHERE ps.tenant_id = $1 AND ps.is_active = true
         GROUP BY ps.id
         ORDER BY ps.display_order`,
        [tenantId]
    );

    // Calculate stage transitions
    const transitions = await pool(
        `SELECT 
            ps.stage_type,
            COUNT(*) as transitions_in
         FROM lead_activities la
         JOIN leads l ON la.lead_id = l.id
         JOIN pipeline_stages ps ON (la.activity_data->>'to_stage')::uuid = ps.id
         WHERE l.tenant_id = $1 AND la.activity_type = 'stage_change'
         GROUP BY ps.stage_type`,
        [tenantId]
    );

    // Get total leads for calculations
    const totalResult = await pool(
        'SELECT COUNT(*) as total FROM leads WHERE tenant_id = $1',
        [tenantId]
    );
    const totalLeads = parseInt(totalResult.rows[0].total, 10) || 1;

    return {
        stages: stages.rows.map(s => ({
            id: s.id,
            name: s.name,
            displayName: s.display_name,
            color: s.color_code,
            stageType: s.stage_type,
            order: s.display_order,
            leads: parseInt(s.leads_in_stage, 10),
            percentageOfTotal: parseFloat(s.percentage_of_total),
            avgScore: parseFloat(s.avg_score),
            assignedCount: parseInt(s.assigned_count, 10)
        })),
        transitions: transitions.rows.reduce((acc, t) => {
            acc[t.stage_type] = parseInt(t.transitions_in, 10);
            return acc;
        }, {}),
        totalLeads,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Gets daily metrics for charts
 * @param {number} [days=30] - Number of days to retrieve
 * @returns {Promise<Object[]>} Daily metrics
 */
async function getDailyMetrics(days = 30) {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
        throw new Error('Tenant context not available');
    }

    const result = await pool(
        `SELECT 
            DATE(created_at) as date,
            COUNT(*) as leads,
            COUNT(CASE WHEN qualification_status = 'qualified' THEN 1 END) as qualified,
            COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) as converted,
            COUNT(CASE WHEN qualification_status = 'disqualified' THEN 1 END) as lost,
            COALESCE(AVG(lead_score), 0)::decimal(5,2) as avg_score
         FROM leads
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [tenantId]
    );

    return result.rows;
}

export {
    getDashboardMetrics,
    recordMetric,
    getMetricsTrend,
    calculateConversionRate,
    getTopPerformers,
    getPipelineMetrics,
    getDailyMetrics
};

export default {
    getDashboardMetrics,
    recordMetric,
    getMetricsTrend,
    calculateConversionRate,
    getTopPerformers,
    getPipelineMetrics,
    getDailyMetrics
};
