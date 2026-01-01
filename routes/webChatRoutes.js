/**
 * webChatRoutes.js
 * API endpoints para chat web widget y captura de leads omnicanal
 */

import express from 'express';
const router = express.Router();
import pool from '../services/db.js';
import analyticsService from '../services/analyticsService.js';
import predictiveEngineService from '../services/predictiveEngineService.js';
import emailAutomationService from '../services/emailAutomationService.js';
import { getChatReply } from '../services/deepseekService.js';
import { extractLeadInfo } from '../services/leadExtractionService.js';

/**
 * POST /api/web-chat/init
 * Inicializa sesión de chat para visitante web
 */
router.post('/init', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID requerido' });
    }

    const { source, userAgent, referrer } = req.body;

    // Crear nueva sesión de lead desde web
    const leadResult = await pool.query(
      `INSERT INTO leads 
       (tenant_id, name, phone, email, source, metadata, created_at, last_message_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        'Web Visitor',
        null,
        null,
        source || 'web_widget',
        JSON.stringify({
          userAgent,
          referrer,
          ipAddress: req.ip,
          initialTimestamp: new Date()
        }),
        new Date(),
        new Date()
      ]
    );

    const lead = leadResult.rows[0];

    // Crear sesión
    const sessionResult = await pool.query(
      `INSERT INTO web_chat_sessions 
       (tenant_id, lead_id, started_at, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tenantId, lead.id, new Date(), 'active']
    );

    // Log evento
    await analyticsService.trackChannelEvent(
      tenantId,
      'web',
      'session_started',
      { leadId: lead.id }
    );

    res.json({
      success: true,
      lead: {
        id: lead.id,
        session_id: sessionResult.rows[0].id,
        created_at: lead.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error en /init:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/web-chat/message
 * Procesa mensajes del chat web
 */
router.post('/message', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const leadId = req.headers['x-lead-id'];
    const { message, sessionId } = req.body;

    if (!tenantId || !leadId || !message) {
      return res.status(400).json({ error: 'Parámetros requeridos incompletos' });
    }

    // Guardar mensaje del usuario
    await pool.query(
      `INSERT INTO lead_messages 
       (tenant_id, lead_id, role, content, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, leadId, 'user', message, new Date()]
    );

    // Analizar intención
    const intention = await predictiveEngineService.analyzeMessageIntention(
      tenantId,
      message,
      leadId
    );

    // Obtener sistema de prompts del bot/tenant
    const botConfig = await pool.query(
      `SELECT system_prompt FROM bots WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );

    const systemPrompt = botConfig.rows[0]?.system_prompt || 
      'Eres un asistente de ventas amable. Ayuda al cliente y califica su interés.';

    // Obtener histórico reciente
    const history = await pool.query(
      `SELECT role, content FROM lead_messages 
       WHERE lead_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [leadId, tenantId]
    );

    const messagesHistory = history.rows
      .reverse()
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Obtener respuesta de DeepSeek
    const reply = await getChatReply(message, messagesHistory, systemPrompt);

    // Guardar respuesta del bot
    await pool.query(
      `INSERT INTO lead_messages 
       (tenant_id, lead_id, role, content, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, leadId, 'assistant', reply, new Date()]
    );

    // Recalcular score predictivo
    const updatedScore = await predictiveEngineService.calculateAdvancedLeadScore(
      tenantId,
      leadId
    );

    // Actualizar lead con nueva información
    await pool.query(
      `UPDATE leads 
       SET last_message_date = $1, score = $2
       WHERE id = $3`,
      [new Date(), updatedScore.score, leadId]
    );

    // Log evento
    await analyticsService.trackChannelEvent(
      tenantId,
      'web',
      'message_processed',
      { 
        leadId,
        intentionScore: intention.score,
        predictiveScore: updatedScore.score
      }
    );

    // Obtener lead actualizado
    const updatedLead = await pool.query(
      'SELECT id, name, email, phone, score FROM leads WHERE id = $1',
      [leadId]
    );

    res.json({
      success: true,
      reply,
      intention,
      updatedLead: updatedLead.rows[0],
      metadata: {
        recommendation: updatedScore.recommendation,
        churnRisk: updatedScore.churnRisk
      }
    });
  } catch (error) {
    console.error('❌ Error en /message:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/web-chat/lead-info
 * Captura información del lead durante conversación
 */
router.post('/lead-info', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { leadId, field, value } = req.body;

    if (!tenantId || !leadId || !field || !value) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // Whitelist de campos actualizables
    const allowedFields = ['name', 'email', 'phone', 'company', 'interest_level'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo no permitido' });
    }

    // Actualizar lead
    const updateQuery = `UPDATE leads SET ${field} = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await pool.query(updateQuery, [value, leadId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // Log evento
    await analyticsService.trackLeadScoreChange(
      tenantId,
      leadId,
      result.rows[0].score,
      result.rows[0].score,
      `Info capturada: ${field}`
    );

    res.json({
      success: true,
      updatedLead: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en /lead-info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/web-chat/qualify
 * Califica lead basado en criterios
 */
router.post('/qualify', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { leadId } = req.body;

    const lead = await pool.query(
      'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2',
      [leadId, tenantId]
    );

    if (lead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const leadData = lead.rows[0];

    // Criterios de calificación
    const isQualified = leadData.score >= 50 && leadData.email && leadData.name;

    // Actualizar estado
    await pool.query(
      `UPDATE leads SET status = $1 WHERE id = $2`,
      [isQualified ? 'qualified' : 'prospect', leadId]
    );

    // Si es calificado y tiene email, agregar a secuencia de nurturing
    if (isQualified && leadData.email) {
      // Obtener secuencia de nurturing del tenant
      const sequence = await pool.query(
        `SELECT id FROM email_sequences 
         WHERE tenant_id = $1 AND status = 'active'
         LIMIT 1`,
        [tenantId]
      );

      if (sequence.rows.length > 0) {
        await emailAutomationService.assignLeadToSequence(
          tenantId,
          leadId,
          sequence.rows[0].id
        );
      }
    }

    res.json({
      success: true,
      isQualified,
      leadStatus: isQualified ? 'qualified' : 'prospect'
    });
  } catch (error) {
    console.error('❌ Error en /qualify:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/web-chat/analytics
 * Obtiene analytics del chat web
 */
router.get('/analytics', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { days = 7 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 3600000);

    const analytics = await analyticsService.getMetricsReport(
      tenantId,
      startDate,
      new Date(),
      'web'
    );

    res.json({
      success: true,
      period: { days, startDate },
      metrics: analytics
    });
  } catch (error) {
    console.error('❌ Error en /analytics:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
