/**
 * complianceAlertsService.js
 * Sistema automático de alertas y monitoreo de compliance LGPD/LFPDPPP
 * Extiende complianceService existente con capacidades proactivas
 */

import { query as pool } from './db.js';

class ComplianceAlertsService {
  constructor() {
    this.alertLevels = {
      CRITICAL: 'critical',
      WARNING: 'warning',
      INFO: 'info'
    };
    
    this.alertTypes = {
      MISSING_CONSENT: 'missing_consent',
      DATA_RETENTION_EXPIRED: 'data_retention_expired',
      PII_DETECTED: 'pii_detected',
      SUSPICIOUS_ACCESS: 'suspicious_access',
      AUDIT_REQUIRED: 'audit_required',
      ARCO_TIMEOUT: 'arco_timeout'
    };
  }

  /**
   * Inicia monitoreo automático de compliance
   */
  async startComplianceMonitoring(tenantId) {
    try {
      console.log(`🛡️ Iniciando monitoreo de compliance para tenant ${tenantId}`);

      // Ejecutar verificaciones periódicas
      this._schedulePeriodicChecks(tenantId);

      return { success: true, message: 'Monitoreo iniciado' };
    } catch (error) {
      console.error('❌ Error iniciando monitoreo:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detecta consentimientos faltantes en leads
   */
  async checkMissingConsents(tenantId) {
    try {
      const missingConsents = await pool(
        `SELECT l.id, l.email, l.name, l.created_at
         FROM leads l
         LEFT JOIN privacy_consents pc ON l.id = pc.lead_id AND l.tenant_id = pc.tenant_id
         WHERE l.tenant_id = $1 
         AND pc.id IS NULL
         AND l.created_at < NOW() - INTERVAL '24 hours'
         LIMIT 50`,
        [tenantId]
      );

      if (missingConsents.rows.length > 0) {
        await this._createAlert(
          tenantId,
          this.alertLevels.WARNING,
          this.alertTypes.MISSING_CONSENT,
          `${missingConsents.rows.length} leads sin consentimiento registrado`,
          { affectedLeads: missingConsents.rows.length }
        );

        return {
          found: true,
          count: missingConsents.rows.length,
          leads: missingConsents.rows.slice(0, 5) // Primeros 5
        };
      }

      return { found: false, count: 0 };
    } catch (error) {
      console.error('❌ Error en checkMissingConsents:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Detecta datos personales sensibles en mensajes
   */
  async scanForPII(tenantId) {
    try {
      const piiPatterns = {
        creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        phone: /\b\d{10,}\b/g,
        passport: /\b[A-Z]{2}\d{6}\b/g,
        rfc: /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/g, // RFC México
        cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g // CPF Brasil
      };

      let detectedPII = [];

      // Escanear mensajes recientes
      const messages = await pool(
        `SELECT id, lead_id, content, created_at FROM lead_messages
         WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'
         LIMIT 500`,
        [tenantId]
      );

      for (const msg of messages.rows) {
        for (const [piiType, pattern] of Object.entries(piiPatterns)) {
          if (pattern.test(msg.content)) {
            detectedPII.push({
              messageId: msg.id,
              leadId: msg.lead_id,
              piiType,
              timestamp: msg.created_at
            });

            pattern.lastIndex = 0; // Reset regex
          }
        }
      }

      if (detectedPII.length > 0) {
        await this._createAlert(
          tenantId,
          this.alertLevels.CRITICAL,
          this.alertTypes.PII_DETECTED,
          `Se detectaron ${detectedPII.length} mensajes con datos sensibles`,
          { 
            detectedCount: detectedPII.length,
            types: [...new Set(detectedPII.map(p => p.piiType))]
          }
        );

        // Automáticamente marcar mensajes como sensibles
        for (const pii of detectedPII.slice(0, 10)) {
          await pool(
            `UPDATE lead_messages SET contains_pii = true WHERE id = $1`,
            [pii.messageId]
          );
        }
      }

      return {
        found: detectedPII.length > 0,
        count: detectedPII.length,
        samples: detectedPII.slice(0, 5)
      };
    } catch (error) {
      console.error('❌ Error en scanForPII:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Verifica solicitudes ARCO pendientes
   */
  async checkARCORequests(tenantId) {
    try {
      // Buscar solicitudes cerca de timeout
      const pendingARCO = await pool(
        `SELECT id, request_type, created_at,
                EXTRACT(DAY FROM NOW() - created_at) as days_elapsed
         FROM privacy_requests
         WHERE tenant_id = $1 
         AND status = 'pending'
         AND created_at > NOW() - INTERVAL '30 days'
         ORDER BY created_at ASC`,
        [tenantId]
      );

      const alerts = [];

      for (const request of pendingARCO.rows) {
        const daysRemaining = 30 - request.days_elapsed;

        // En México: 30 días; Brasil: 15 días; Colombia: 30 días
        const timeoutDays = this._getTimeoutDays(request.request_type);
        const isNearTimeout = daysRemaining < 5;

        if (isNearTimeout) {
          alerts.push({
            requestId: request.id,
            type: request.request_type,
            daysRemaining,
            status: 'urgent'
          });

          await this._createAlert(
            tenantId,
            this.alertLevels.CRITICAL,
            this.alertTypes.ARCO_TIMEOUT,
            `Solicitud ARCO vence en ${daysRemaining} días`,
            { 
              requestId: request.id,
              requestType: request.request_type,
              daysRemaining
            }
          );
        }
      }

      return {
        found: alerts.length > 0,
        urgentCount: alerts.length,
        requests: alerts
      };
    } catch (error) {
      console.error('❌ Error en checkARCORequests:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Detecta patrones de acceso sospechosos
   */
  async checkSuspiciousAccess(tenantId) {
    try {
      // Detectar múltiples accesos desde ubicaciones diferentes
      const suspiciousPatterns = await pool(
        `SELECT user_id, COUNT(DISTINCT ip_address) as unique_ips, COUNT(*) as access_count
         FROM audit_logs
         WHERE tenant_id = $1 
         AND created_at > NOW() - INTERVAL '1 hour'
         AND action IN ('data_access', 'data_export')
         GROUP BY user_id
         HAVING COUNT(DISTINCT ip_address) > 5`,
        [tenantId]
      );

      if (suspiciousPatterns.rows.length > 0) {
        await this._createAlert(
          tenantId,
          this.alertLevels.WARNING,
          this.alertTypes.SUSPICIOUS_ACCESS,
          `Accesos sospechosos detectados de ${suspiciousPatterns.rows.length} usuarios`,
          { affectedUsers: suspiciousPatterns.rows }
        );

        return {
          found: true,
          count: suspiciousPatterns.rows.length,
          patterns: suspiciousPatterns.rows
        };
      }

      return { found: false };
    } catch (error) {
      console.error('❌ Error en checkSuspiciousAccess:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Obtiene status de compliance general
   */
  async getComplianceStatus(tenantId) {
    try {
      const [
        missedConsents,
        piiDetected,
        arcoStatus,
        suspiciousAccess
      ] = await Promise.all([
        this.checkMissingConsents(tenantId),
        this.scanForPII(tenantId),
        this.checkARCORequests(tenantId),
        this.checkSuspiciousAccess(tenantId)
      ]);

      // Calcular score de compliance (0-100)
      let complianceScore = 100;
      if (missedConsents.found) complianceScore -= 15;
      if (piiDetected.found) complianceScore -= 25;
      if (arcoStatus.found) complianceScore -= 10;
      if (suspiciousAccess.found) complianceScore -= 10;

      return {
        overallScore: Math.max(0, complianceScore),
        status: complianceScore >= 80 ? 'compliant' : complianceScore >= 60 ? 'at-risk' : 'critical',
        timestamp: new Date(),
        findings: {
          missedConsents,
          piiDetected,
          arcoStatus,
          suspiciousAccess
        }
      };
    } catch (error) {
      console.error('❌ Error en getComplianceStatus:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Obtiene alertas recientes
   */
  async getRecentAlerts(tenantId, limit = 20) {
    try {
      const alerts = await pool(
        `SELECT * FROM compliance_alerts
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [tenantId, limit]
      );

      return alerts.rows;
    } catch (error) {
      console.error('❌ Error en getRecentAlerts:', error.message);
      return [];
    }
  }

  /**
   * Genera reporte de compliance para auditoría
   */
  async generateComplianceReport(tenantId, startDate, endDate) {
    try {
      const report = {
        tenantId,
        period: { startDate, endDate },
        generatedAt: new Date(),
        sections: {}
      };

      // Resumen de alertas
      const alerts = await pool(
        `SELECT level, type, COUNT(*) as count FROM compliance_alerts
         WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY level, type`,
        [tenantId, startDate, endDate]
      );

      report.sections.alerts = alerts.rows;

      // Solicitudes ARCO procesadas
      const arcoClosed = await pool(
        `SELECT request_type, COUNT(*) as count FROM privacy_requests
         WHERE tenant_id = $1 AND status = 'completed' 
         AND completed_at BETWEEN $2 AND $3
         GROUP BY request_type`,
        [tenantId, startDate, endDate]
      );

      report.sections.arcoRequests = arcoClosed.rows;

      // Consentimientos registrados
      const consents = await pool(
        `SELECT COUNT(*) as total FROM privacy_consents
         WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`,
        [tenantId, startDate, endDate]
      );

      report.sections.consentsCollected = consents.rows[0].total;

      // Auditoría de accesos
      const auditedAccess = await pool(
        `SELECT action, COUNT(*) as count FROM audit_logs
         WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY action`,
        [tenantId, startDate, endDate]
      );

      report.sections.accessAudit = auditedAccess.rows;

      return report;
    } catch (error) {
      console.error('❌ Error en generateComplianceReport:', error.message);
      return { error: error.message };
    }
  }

  // ========== Helpers Privados ==========

  /**
   * Crea una alerta en BD
   */
  async _createAlert(tenantId, level, type, message, metadata = {}) {
    try {
      await pool(
        `INSERT INTO compliance_alerts 
         (tenant_id, level, type, message, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenantId, level, type, message, JSON.stringify(metadata), new Date()]
      );

      // Notificar a administradores si es crítico
      if (level === this.alertLevels.CRITICAL) {
        await this._notifyAdmins(tenantId, type, message);
      }
    } catch (error) {
      console.warn('⚠️ Error creando alerta:', error.message);
    }
  }

  /**
   * Obtiene días de timeout según legislación
   */
  _getTimeoutDays(requestType) {
    // Simplificado, en producción consultar por país de tenant
    return 30; // Todos 30 días para MVP
  }

  /**
   * Notifica a admins sobre alertas críticas
   */
  async _notifyAdmins(tenantId, alertType, message) {
    try {
      // Implementación futura: enviar email/SMS a admins
      console.log(`🚨 ALERTA CRÍTICA [${tenantId}]: ${alertType} - ${message}`);
    } catch (error) {
      console.warn('⚠️ Error notificando admins:', error.message);
    }
  }

  /**
   * Programar verificaciones periódicas
   */
  _schedulePeriodicChecks(tenantId) {
    // Cada 6 horas
    setInterval(() => {
      this.getComplianceStatus(tenantId).catch(err => 
        console.error('⚠️ Error en verificación periódica:', err)
      );
    }, 6 * 3600000);
  }
}

export default new ComplianceAlertsService();
