/**
 * emailAutomationService.js
 * Manejador de automatización de email para secuencias multicanal
 * Integración preparada para SendGrid/Mailchimp (implementación futura)
 */

const pool = require('./db');

class EmailAutomationService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid'; // sendgrid, mailchimp, smtp
    this.apiKey = process.env.EMAIL_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'no-reply@botinteligente.com';
    this.sequences = new Map(); // Cache de secuencias activas
  }

  /**
   * Envía email a través del proveedor configurado
   */
  async sendEmail(tenantId, recipientEmail, subject, htmlContent, leadId = null) {
    try {
      // Validación básica
      if (!recipientEmail || !recipientEmail.includes('@')) {
        throw new Error('Email inválido');
      }

      // Registrar intención de envío
      const emailRecord = {
        tenant_id: tenantId,
        lead_id: leadId,
        recipient_email: recipientEmail,
        subject,
        status: 'pending',
        created_at: new Date(),
        sent_at: null,
        opened_at: null,
        clicked_at: null
      };

      // Persistir en BD
      const result = await pool.query(
        `INSERT INTO email_history 
         (tenant_id, lead_id, recipient_email, subject, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [tenantId, leadId, recipientEmail, subject, 'pending', new Date()]
      );

      const emailId = result.rows[0].id;

      // Enviar según proveedor
      const sendResult = await this._sendByProvider(
        recipientEmail,
        subject,
        htmlContent,
        { emailId, tenantId, leadId }
      );

      if (sendResult.success) {
        // Actualizar estado
        await pool.query(
          `UPDATE email_history SET status = $1, sent_at = $2, external_id = $3
           WHERE id = $4`,
          ['sent', new Date(), sendResult.externalId, emailId]
        );

        console.log(`✅ Email enviado: ${recipientEmail} (ID: ${emailId})`);
        return { success: true, emailId, externalId: sendResult.externalId };
      } else {
        await pool.query(
          `UPDATE email_history SET status = $1, error_message = $2 WHERE id = $3`,
          ['failed', sendResult.error, emailId]
        );
        throw new Error(sendResult.error);
      }
    } catch (error) {
      console.error('❌ Error en sendEmail:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea una secuencia de emails automática
   */
  async createEmailSequence(tenantId, sequenceName, steps) {
    try {
      // Validar estructura de steps
      for (let i = 0; i < steps.length; i++) {
        if (!steps[i].delayHours || !steps[i].subject || !steps[i].htmlContent) {
          throw new Error(`Paso ${i} incompleto: requiere delayHours, subject, htmlContent`);
        }
      }

      const result = await pool.query(
        `INSERT INTO email_sequences 
         (tenant_id, name, steps, status, created_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tenantId, sequenceName, JSON.stringify(steps), 'active', new Date()]
      );

      const sequenceId = result.rows[0].id;
      
      // Cache en memoria
      this.sequences.set(sequenceId, { tenantId, sequenceName, steps });

      console.log(`✅ Secuencia creada: ${sequenceName} (ID: ${sequenceId})`);
      return { success: true, sequenceId };
    } catch (error) {
      console.error('❌ Error en createEmailSequence:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Asigna un lead a una secuencia de email
   */
  async assignLeadToSequence(tenantId, leadId, sequenceId) {
    try {
      const lead = await pool.query(
        'SELECT email FROM leads WHERE id = $1 AND tenant_id = $2',
        [leadId, tenantId]
      );

      if (lead.rows.length === 0) {
        throw new Error('Lead no encontrado');
      }

      const leadEmail = lead.rows[0].email;
      if (!leadEmail) {
        throw new Error('Lead sin email registrado');
      }

      // Crear registro de asignación
      const assignment = await pool.query(
        `INSERT INTO email_sequence_assignments 
         (tenant_id, lead_id, sequence_id, status, started_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tenantId, leadId, sequenceId, 'active', new Date()]
      );

      const assignmentId = assignment.rows[0].id;

      // Obtener sequence
      const sequence = await pool.query(
        'SELECT steps FROM email_sequences WHERE id = $1',
        [sequenceId]
      );

      if (sequence.rows.length === 0) {
        throw new Error('Secuencia no encontrada');
      }

      const steps = JSON.parse(sequence.rows[0].steps);

      // Programar primer email
      const firstStep = steps[0];
      await this._scheduleEmailStep(
        tenantId, leadId, assignmentId, sequenceId, 0, firstStep, leadEmail
      );

      console.log(`✅ Lead ${leadId} asignado a secuencia ${sequenceId}`);
      return { success: true, assignmentId };
    } catch (error) {
      console.error('❌ Error en assignLeadToSequence:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Programación automática de pasos de secuencia
   */
  async _scheduleEmailStep(tenantId, leadId, assignmentId, sequenceId, stepIndex, step, email) {
    try {
      const scheduledTime = new Date(Date.now() + step.delayHours * 3600000);

      await pool.query(
        `INSERT INTO email_schedule 
         (tenant_id, lead_id, assignment_id, sequence_id, step_index, scheduled_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, leadId, assignmentId, sequenceId, stepIndex, scheduledTime, 'pending']
      );

      // Aquí se podría usar agenda/bullmq para procesamiento en background
      console.log(`📧 Paso ${stepIndex} programado para: ${scheduledTime.toISOString()}`);
    } catch (error) {
      console.error('⚠️ Error en _scheduleEmailStep:', error.message);
    }
  }

  /**
   * Procesa emails programados (debe ejecutarse cada minuto vía cron/scheduler)
   */
  async processScheduledEmails() {
    try {
      // Obtener emails pendientes de envío
      const pending = await pool.query(
        `SELECT es.*, email_seq.steps 
         FROM email_schedule es
         JOIN email_sequences email_seq ON es.sequence_id = email_seq.id
         WHERE es.status = 'pending' AND es.scheduled_time <= NOW()
         LIMIT 10`
      );

      for (const record of pending.rows) {
        try {
          const steps = JSON.parse(record.steps);
          const currentStep = steps[record.step_index];

          // Obtener email del lead
          const lead = await pool.query(
            'SELECT email FROM leads WHERE id = $1',
            [record.lead_id]
          );

          if (lead.rows.length === 0) continue;

          const email = lead.rows[0].email;

          // Enviar email
          const result = await this.sendEmail(
            record.tenant_id,
            email,
            currentStep.subject,
            currentStep.htmlContent,
            record.lead_id
          );

          if (result.success) {
            // Marcar como enviado
            await pool.query(
              'UPDATE email_schedule SET status = $1, sent_at = $2 WHERE id = $3',
              ['sent', new Date(), record.id]
            );

            // Programar próximo paso si existe
            if (record.step_index < steps.length - 1) {
              await this._scheduleEmailStep(
                record.tenant_id,
                record.lead_id,
                record.assignment_id,
                record.sequence_id,
                record.step_index + 1,
                steps[record.step_index + 1],
                email
              );
            } else {
              // Marcar secuencia como completa
              await pool.query(
                `UPDATE email_sequence_assignments SET status = $1, completed_at = $2
                 WHERE id = $3`,
                ['completed', new Date(), record.assignment_id]
              );
            }
          } else {
            await pool.query(
              'UPDATE email_schedule SET status = $1 WHERE id = $2',
              ['failed', record.id]
            );
          }
        } catch (error) {
          console.error(`⚠️ Error procesando email ${record.id}:`, error.message);
        }
      }

      console.log(`✅ Procesados ${pending.rows.length} emails programados`);
    } catch (error) {
      console.error('❌ Error en processScheduledEmails:', error.message);
    }
  }

  /**
   * Obtiene estadísticas de una secuencia
   */
  async getSequenceStats(tenantId, sequenceId) {
    try {
      const stats = await pool.query(
        `SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM email_history
         WHERE tenant_id = $1 AND email_sequence_id = $2`,
        [tenantId, sequenceId]
      );

      const row = stats.rows[0];
      const totalSent = parseInt(row.total_sent) || 0;

      return {
        totalSent,
        opened: parseInt(row.opened) || 0,
        clicked: parseInt(row.clicked) || 0,
        failed: parseInt(row.failed) || 0,
        openRate: totalSent > 0 ? `${((row.opened / totalSent) * 100).toFixed(2)}%` : '0%',
        clickRate: totalSent > 0 ? `${((row.clicked / totalSent) * 100).toFixed(2)}%` : '0%'
      };
    } catch (error) {
      console.error('❌ Error en getSequenceStats:', error.message);
      return null;
    }
  }

  // ========== Helpers Privados ==========

  /**
   * Envía email a través del proveedor específico
   */
  async _sendByProvider(email, subject, htmlContent, metadata) {
    if (this.provider === 'sendgrid') {
      return this._sendViaSendGrid(email, subject, htmlContent, metadata);
    } else if (this.provider === 'mailchimp') {
      return this._sendViaMailchimp(email, subject, htmlContent, metadata);
    } else {
      // Mock para desarrollo
      return { success: true, externalId: `mock_${Date.now()}` };
    }
  }

  /**
   * Implementación SendGrid (placeholder)
   */
  async _sendViaSendGrid(email, subject, htmlContent, metadata) {
    try {
      // Implementación futura con librería SendGrid
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send({ ... });
      
      console.log(`📧 [SendGrid] Email a ${email}: ${subject}`);
      return { success: true, externalId: `sg_${Date.now()}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Implementación Mailchimp (placeholder)
   */
  async _sendViaMailchimp(email, subject, htmlContent, metadata) {
    try {
      // Implementación futura con Mailchimp API
      console.log(`📧 [Mailchimp] Email a ${email}: ${subject}`);
      return { success: true, externalId: `mc_${Date.now()}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailAutomationService();
