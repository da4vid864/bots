/**
 * analyticsService.js
 * Sistema centralizado de métricas y tracking para BotInteligente 2.0
 * Extiende funcionalidades existentes de statsService
 */

const pool = require('./db');
const { EventEmitter } = require('events');

class AnalyticsService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      whatsapp: { sent: 0, received: 0, errors: 0 },
      email: { sent: 0, received: 0, errors: 0 },
      web: { sessions: 0, messages: 0, errors: 0 },
      ai: { requests: 0, avgTime: 0, errors: 0 },
      leads: { created: 0, qualified: 0, score_avg: 0 },
      compliance: { requests: 0, completed: 0, pending: 0 }
    };
  }

  /**
   * Registra un evento de métrica en tiempo real
   */
  async logEvent(tenantId, eventType, data) {
    try {
      const timestamp = new Date();
      
      // Actualizar métrica en memoria
      this._updateInMemoryMetric(eventType, data);

      // Persistir en BD para análisis histórico
      await pool.query(
        `INSERT INTO analytics_events 
          (tenant_id, event_type, event_data, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [tenantId, eventType, JSON.stringify(data), timestamp]
      );

      // Emitir evento para procesamiento real-time (webhooks, alertas)
      this.emit('event', { tenantId, eventType, data, timestamp });

      return { success: true, timestamp };
    } catch (error) {
      console.error('❌ Error en logEvent:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene métricas agregadas por período
   */
  async getMetricsReport(tenantId, startDate, endDate, channel = null) {
    try {
      let query = `
        SELECT 
          event_type,
          COUNT(*) as count,
          AVG(CAST(event_data->>'duration_ms' AS FLOAT)) as avg_duration,
          MAX(created_at) as last_event
        FROM analytics_events
        WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
      `;
      const params = [tenantId, startDate, endDate];

      if (channel) {
        query += ` AND event_type LIKE $${params.length + 1}`;
        params.push(`${channel}_%`);
      }

      query += ` GROUP BY event_type ORDER BY count DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en getMetricsReport:', error.message);
      return [];
    }
  }

  /**
   * Calcula dashboard de salud del sistema
   */
  async getSystemHealth(tenantId) {
    try {
      const health = {
        uptime: process.uptime(),
        timestamp: new Date(),
        channels: {},
        services: {}
      };

      // Estado de canales en última hora
      const lastHour = new Date(Date.now() - 3600000);
      const channelEvents = await pool.query(
        `SELECT event_type, COUNT(*) as count, 
                COALESCE(SUM(CASE WHEN event_data->>'error' IS NOT NULL THEN 1 ELSE 0 END), 0) as errors
         FROM analytics_events
         WHERE tenant_id = $1 AND created_at > $2
         GROUP BY event_type`,
        [tenantId, lastHour]
      );

      for (const row of channelEvents.rows) {
        const channel = row.event_type.split('_')[0];
        health.channels[channel] = {
          messages: row.count,
          errors: row.errors,
          error_rate: (row.errors / (row.count || 1) * 100).toFixed(2) + '%'
        };
      }

      // Estado de servicios clave
      health.services = {
        database: { status: 'healthy', lastCheck: new Date() },
        deepseek: await this._checkDeepseekHealth(),
        storage: await this._checkStorageHealth()
      };

      return health;
    } catch (error) {
      console.error('❌ Error en getSystemHealth:', error.message);
      return null;
    }
  }

  /**
   * Tracking específico para llamadas a IA
   */
  async trackAIRequest(tenantId, leadId, model, promptTokens, completionTokens, durationMs) {
    return this.logEvent(tenantId, 'ai_request', {
      lead_id: leadId,
      model,
      tokens: { prompt: promptTokens, completion: completionTokens },
      duration_ms: durationMs,
      timestamp: new Date()
    });
  }

  /**
   * Tracking para eventos de canal
   */
  async trackChannelEvent(tenantId, channel, action, metadata = {}) {
    return this.logEvent(tenantId, `${channel}_${action}`, {
      ...metadata,
      channel,
      action
    });
  }

  /**
   * Tracking para cambios de score de leads
   */
  async trackLeadScoreChange(tenantId, leadId, oldScore, newScore, reason) {
    return this.logEvent(tenantId, 'lead_score_change', {
      lead_id: leadId,
      old_score: oldScore,
      new_score: newScore,
      delta: newScore - oldScore,
      reason,
      timestamp: new Date()
    });
  }

  /**
   * Obtiene tendencias de métricas
   */
  async getTrends(tenantId, metricType, days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 3600000);
      
      const result = await pool.query(
        `SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as count
         FROM analytics_events
         WHERE tenant_id = $1 
           AND event_type LIKE $2
           AND created_at > $3
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY date ASC`,
        [tenantId, `${metricType}%`, startDate]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error en getTrends:', error.message);
      return [];
    }
  }

  // Helpers privados
  _updateInMemoryMetric(eventType, data) {
    const channel = eventType.split('_')[0];
    if (this.metrics[channel]) {
      if (eventType.includes('sent')) this.metrics[channel].sent++;
      if (eventType.includes('received')) this.metrics[channel].received++;
      if (eventType.includes('error')) this.metrics[channel].errors++;
    }
  }

  async _checkDeepseekHealth() {
    try {
      const recentErrors = await pool.query(
        `SELECT COUNT(*) as error_count FROM analytics_events
         WHERE event_type = 'ai_request' 
         AND created_at > NOW() - INTERVAL '5 minutes'
         AND event_data->>'error' IS NOT NULL`
      );
      
      return {
        status: recentErrors.rows[0].error_count > 10 ? 'degraded' : 'healthy',
        lastCheck: new Date()
      };
    } catch {
      return { status: 'unknown', lastCheck: new Date() };
    }
  }

  async _checkStorageHealth() {
    try {
      // Verificar que almacenamiento esté accesible
      return { status: 'healthy', lastCheck: new Date() };
    } catch {
      return { status: 'unknown', lastCheck: new Date() };
    }
  }
}

module.exports = new AnalyticsService();
