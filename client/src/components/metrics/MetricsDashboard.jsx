import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MetricCard from './MetricCard';
import ConversionFunnel from './ConversionFunnel';
import TrendChart from './TrendChart';
import TopPerformers from './TopPerformers';

export default function MetricsDashboard({ metrics, stages }) {
  const { t } = useTranslation();

  // Calculate funnel data
  const funnelData = useMemo(() => {
    if (!stages || !metrics) return [];
    
    return stages.map(stage => ({
      name: stage.displayName,
      count: metrics.stageCounts?.[stage.id] || 0,
      value: metrics.stageValues?.[stage.id] || 0,
      color: stage.colorCode,
    }));
  }, [stages, metrics]);

  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    if (!metrics) return 0;
    if (metrics.totalLeads === 0) return 0;
    return ((metrics.convertedLeads / metrics.totalLeads) * 100).toFixed(1);
  }, [metrics]);

  return (
    <div className="metrics-dashboard">
      {/* KPI Cards Row */}
      <div className="kpi-cards">
        <MetricCard
          title={t('sales.metrics.totalLeads')}
          value={metrics?.totalLeads || 0}
          icon="users"
          trend={metrics?.leadsTrend}
          color="blue"
        />
        <MetricCard
          title={t('sales.metrics.conversionRate')}
          value={`${conversionRate}%`}
          icon="conversion"
          trend={metrics?.conversionTrend}
          color="green"
        />
        <MetricCard
          title={t('sales.metrics.pipelineValue')}
          value={formatCurrency(metrics?.pipelineValue)}
          icon="money"
          color="purple"
        />
        <MetricCard
          title={t('sales.metrics.responseTime')}
          value={formatTime(metrics?.avgResponseTime)}
          icon="clock"
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>{t('sales.metrics.trends')}</h3>
          <TrendChart data={metrics?.trendData || []} />
        </div>
        <div className="chart-container">
          <h3>{t('sales.metrics.conversionFunnel')}</h3>
          <ConversionFunnel data={funnelData} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <div className="section">
          <h3>{t('sales.metrics.topPerformers')}</h3>
          <TopPerformers performers={metrics?.topPerformers || []} />
        </div>
        <div className="section">
          <h3>{t('sales.metrics.quickStats')}</h3>
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">{t('sales.metrics.newToday')}</span>
              <span className="stat-value">{metrics?.newToday || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t('sales.metrics.convertedToday')}</span>
              <span className="stat-value">{metrics?.convertedToday || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t('sales.metrics.avgDealValue')}</span>
              <span className="stat-value">{formatCurrency(metrics?.avgDealValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatCurrency(value) {
  if (!value) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatTime(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.round(minutes / 60)}h`;
}
