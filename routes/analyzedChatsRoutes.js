// routes/analyzedChatsRoutes.js - VERSIÓN CORREGIDA COMPLETA
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth/authMiddleware');
const chatAnalysisService = require('../services/chatAnalysisService');
const botDbService = require('../services/botDbService');
const pool = require('../services/db');

// ========== GET ENDPOINTS (RUTAS ESPECÍFICAS PRIMERO) ==========

/**
 * GET /api/analyzed-chats/unprocessed-count
 * Obtiene cantidad de chats no analizados
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id
 */
router.get('/unprocessed-count', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT l.whatsapp_number) as unprocessed_count,
        COUNT(DISTINCT l.bot_id) as bots_with_unprocessed
      FROM leads l
      WHERE l.bot_id IN (
        SELECT id FROM bots WHERE tenant_id = $1
      )
      AND NOT EXISTS (
        SELECT 1 FROM analyzed_chats ac 
        WHERE ac.bot_id = l.bot_id 
        AND ac.contact_phone = l.whatsapp_number
        AND ac.tenant_id = $1
      )`,
      [tenantId]
    );
    
    res.json({
      success: true,
      data: result.rows[0] || { unprocessed_count: 0, bots_with_unprocessed: 0 }
    });
    
  } catch (error) {
    console.error('Error obteniendo conteo no procesado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analyzed-chats/categories
 * Obtiene todas las categorías del pipeline del tenant
 */
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(
      `SELECT * FROM pipeline_categories 
       WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active = true
       ORDER BY position ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analyzed-chats/statistics
 * Obtiene estadísticas del pipeline
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { dateFrom, dateTo } = req.query;

    const stats = await chatAnalysisService.getPipelineStatistics(
      tenantId,
      dateFrom || null,
      dateTo || null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analyzed-chats/category/:category
 * Obtiene chats por categoría del pipeline
 */
router.get('/category/:category', requireAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const tenantId = req.user?.tenant_id;

    const chats = await chatAnalysisService.getChatsByCategory(
      tenantId,
      category,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: chats,
      category,
      pagination: { limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error obteniendo chats por categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analyzed-chats
 * Obtiene todos los chats analizados del tenant
 * Query params: category, botId, minScore, searchTerm, assignedTo, limit, offset
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const {
      category,
      botId,
      minScore,
      searchTerm,
      assignedTo,
      limit = 100,
      offset = 0
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (botId) filters.botId = botId;
    if (minScore) filters.minScore = parseInt(minScore);
    if (searchTerm) filters.searchTerm = searchTerm;
    if (assignedTo) filters.assignedTo = assignedTo;

    const chats = await chatAnalysisService.getAllAnalyzedChats(
      tenantId,
      filters,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: chats,
      pagination: { limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error obteniendo chats analizados:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== EXPORT ENDPOINTS ==========

/**
 * GET /api/analyzed-chats/export/all
 * Exporta todos los chats analizados en CSV
 */
router.get('/export/all', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    // Obtener chats
    const chats = await chatAnalysisService.getAllAnalyzedChats(tenantId, {}, 1000, 0);
    
    // Convertir a CSV simple
    const headers = ['ID', 'Teléfono', 'Nombre', 'Score', 'Categoría', 'Asignado a', 'Fecha Análisis'];
    const csvRows = [
      headers.join(','),
      ...chats.map(chat => [
        chat.id,
        `"${chat.contact_phone || ''}"`,
        `"${chat.contact_name || ''}"`,
        chat.lead_score || 0,
        `"${chat.pipeline_category || ''}"`,
        `"${chat.assigned_to || ''}"`,
        `"${chat.analyzed_at || ''}"`
      ].join(','))
    ];
    
    const csv = csvRows.join('\n');
    const filename = `chats-analizados-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${chats.length} chats`);
  } catch (error) {
    console.error('Error exportando chats:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/**
 * GET /api/analyzed-chats/export/high-value
 * Exporta leads de alto valor (puntuación >= minScore)
 */
router.get('/export/high-value', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const minScore = parseInt(req.query.minScore) || 70;

    const chats = await chatAnalysisService.getAllAnalyzedChats(
      tenantId, 
      { minScore }, 
      1000, 
      0
    );
    
    const headers = ['ID', 'Teléfono', 'Nombre', 'Score', 'Categoría', 'Análisis'];
    const csvRows = [
      headers.join(','),
      ...chats.map(chat => [
        chat.id,
        `"${chat.contact_phone || ''}"`,
        `"${chat.contact_name || ''}"`,
        chat.lead_score || 0,
        `"${chat.pipeline_category || ''}"`,
        `"${JSON.stringify(chat.analysis_results || {}).replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const csv = csvRows.join('\n');
    const filename = `leads-alto-valor-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${chats.length} leads con puntuación >= ${minScore}`);
  } catch (error) {
    console.error('Error exportando leads de alto valor:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

// ========== POST ENDPOINTS ==========

/**
 * POST /api/analyzed-chats/analyze-unprocessed
 * Analiza automáticamente chats no procesados
 */
router.post('/analyze-unprocessed', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    // Obtener conteo de no procesados
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT l.whatsapp_number) as unprocessed_count
       FROM leads l
       WHERE l.bot_id IN (
         SELECT id FROM bots WHERE tenant_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM analyzed_chats ac 
         WHERE ac.bot_id = l.bot_id 
         AND ac.contact_phone = l.whatsapp_number
         AND ac.tenant_id = $1
       )`,
      [tenantId]
    );
    
    const unprocessedCount = countResult.rows[0]?.unprocessed_count || 0;
    
    if (unprocessedCount === 0) {
      return res.json({
        success: true,
        message: 'No hay chats pendientes por analizar',
        processed: 0
      });
    }
    
    // Obtener bots del tenant
    const bots = await pool.query(
      `SELECT id, name FROM bots WHERE tenant_id = $1 AND status = 'enabled'`,
      [tenantId]
    );
    
    let totalProcessed = 0;
    
    for (const bot of bots.rows) {
      // Obtener chats no analizados de este bot
      const unprocessedChats = await pool.query(
        `SELECT DISTINCT l.whatsapp_number as contact_phone, l.name as contact_name
         FROM leads l
         WHERE l.bot_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM analyzed_chats ac 
           WHERE ac.bot_id = l.bot_id 
           AND ac.contact_phone = l.whatsapp_number
           AND ac.tenant_id = $2
         )
         LIMIT 50`,
        [bot.id, tenantId]
      );
      
      // Procesar cada chat
      for (const chat of unprocessedChats.rows) {
        try {
          // Obtener mensajes del lead
          const messages = await pool.query(
            `SELECT sender, message, timestamp 
             FROM lead_messages lm
             JOIN leads l ON lm.lead_id = l.id
             WHERE l.bot_id = $1 AND l.whatsapp_number = $2
             ORDER BY timestamp ASC
             LIMIT 50`,
            [bot.id, chat.contact_phone]
          );
          
          if (messages.rows.length > 0) {
            // Formatear mensajes para análisis
            const formattedMessages = messages.rows.map(msg => ({
              role: msg.sender === 'bot' ? 'assistant' : 'user',
              content: msg.message,
              timestamp: msg.timestamp
            }));
            
            // Ejecutar análisis
            await chatAnalysisService.analyzeChatConversation(
              {
                botId: bot.id,
                contactPhone: chat.contact_phone,
                contactName: chat.contact_name,
                contactEmail: null,
                messages: formattedMessages,
                botPrompt: ''
              },
              tenantId
            );
            
            totalProcessed++;
            console.log(`✅ Chat analizado: ${chat.contact_phone}`);
          }
        } catch (error) {
          console.error(`❌ Error analizando ${chat.contact_phone}:`, error.message);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Se analizaron ${totalProcessed} chats no procesados`,
      processed: totalProcessed
    });
    
  } catch (error) {
    console.error('Error analizando no procesados:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== RUTAS CON PARÁMETROS (DEBEN IR AL FINAL) ==========

/**
 * GET /api/analyzed-chats/:id
 * Obtiene un chat analizado específico
 * IMPORTANTE: Esta ruta debe estar AL FINAL
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    const chat = await chatAnalysisService.getAnalyzedChatById(id, tenantId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // Obtener análisis detallado
    const analysisDetail = await pool.query(
      `SELECT * FROM chat_analysis_details WHERE chat_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Obtener movimientos en pipeline
    const movements = await pool.query(
      `SELECT * FROM pipeline_movements 
       WHERE chat_id = $1 AND tenant_id = $2
       ORDER BY moved_at DESC
       LIMIT 10`,
      [id, tenantId]
    );

    res.json({
      success: true,
      data: {
        ...chat,
        analysis_detail: analysisDetail.rows[0] || null,
        pipeline_movements: movements.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/analyzed-chats/:id/category
 * Cambia la categoría de un chat en el pipeline
 */
router.patch('/:id/category', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newCategory, reason } = req.body;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;

    if (!newCategory) {
      return res.status(400).json({ error: 'newCategory requerido' });
    }

    const result = await chatAnalysisService.updateChatCategory(
      id,
      newCategory,
      tenantId,
      userId,
      reason || ''
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/analyzed-chats/:id/assign
 * Asigna un chat a un vendedor
 */
router.patch('/:id/assign', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const tenantId = req.user?.tenant_id;

    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const chat = await chatAnalysisService.assignChatToUser(id, userId, tenantId);

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error asignando chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/analyzed-chats/:id/unassign
 * Desasigna un chat
 */
router.patch('/:id/unassign', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(
      `UPDATE analyzed_chats 
       SET assigned_to = NULL, assigned_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error desasignando chat:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;