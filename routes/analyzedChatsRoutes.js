// routes/analyzedChatsRoutes.js
/**
 * Routes for analyzed chats and pipeline management
 * Integrates with chatAnalysisService and ChatInterface
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../auth/authMiddleware');
const chatAnalysisService = require('../services/chatAnalysisService');
const botDbService = require('../services/botDbService');
const pool = require('../services/db');
const exportService = require('../services/exportService');

// === MIDDLEWARES ===

/**
 * Middleware para validar que el usuario es admin o propietario del bot
 */
async function verifyBotAccess(req, res, next) {
  try {
    const { botId } = req.params;
    const userEmail = req.user?.email;

    if (req.user?.role === 'admin') {
      return next();
    }

    const bot = await botDbService.getBotById(botId);
    if (!bot || bot.owner_email !== userEmail) {
      return res.status(403).json({ error: 'No tienes acceso a este bot' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// === GET ENDPOINTS ===

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
      limit = 50,
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

/**
 * GET /api/analyzed-chats/:id
 * Obtiene un chat analizado específico
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
 * GET /api/pipeline/statistics
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
 * GET /api/pipeline/categories
 * Obtiene todas las categorías del pipeline del tenant
 */
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(
      `SELECT * FROM pipeline_categories 
       WHERE tenant_id = $1 AND is_active = true
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

// === POST ENDPOINTS ===

/**
 * POST /api/analyzed-chats/analyze
 * Analiza un chat manualmente
 * Body: { botId, contactPhone, contactName?, contactEmail?, messages }
 */
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const {
      botId,
      contactPhone,
      contactName,
      contactEmail,
      messages,
      botPrompt
    } = req.body;

    if (!botId || !contactPhone || !messages) {
      return res.status(400).json({
        error: 'Parámetros requeridos: botId, contactPhone, messages'
      });
    }

    // Verificar acceso al bot
    const bot = await botDbService.getBotById(botId);
    if (!bot) {
      return res.status(404).json({ error: 'Bot no encontrado' });
    }

    // Ejecutar análisis
    const result = await chatAnalysisService.analyzeChatConversation(
      {
        botId,
        contactPhone,
        contactName,
        contactEmail,
        messages,
        botPrompt: botPrompt || bot.prompt
      },
      tenantId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analizando chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// === PUT/PATCH ENDPOINTS ===

/**
 * PATCH /api/analyzed-chats/:id/category
 * Cambia la categoría de un chat en el pipeline
 * Body: { newCategory, reason? }
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
 * Body: { userId }
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

// === EXPORT ENDPOINTS ===

/**
 * GET /api/analyzed-chats/export/all
 * Exporta todos los chats analizados en CSV
 */
router.get('/export/all', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { csv, filename, rowCount } = await exportService.exportAnalyzedChatsToCSV(tenantId);

    // Enviar como descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${rowCount} chats en ${filename}`);
  } catch (error) {
    console.error('Error exportando chats:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/**
 * GET /api/analyzed-chats/export/category/:category
 * Exporta chats de una categoría específica en CSV
 */
router.get('/export/category/:category', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { category } = req.params;

    const { csv, filename, rowCount } = await exportService.exportChatsByCategoryToCSV(tenantId, category);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${rowCount} chats de categoría "${category}"`);
  } catch (error) {
    console.error('Error exportando chats por categoría:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/**
 * GET /api/analyzed-chats/export/high-value
 * Exporta leads de alto valor (puntuación >= minScore)
 * Query param: minScore (default: 70)
 */
router.get('/export/high-value', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const minScore = parseInt(req.query.minScore) || 70;

    const { csv, filename, rowCount } = await exportService.exportHighValueLeadsToCSV(tenantId, minScore);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${rowCount} leads con puntuación >= ${minScore}`);
  } catch (error) {
    console.error('Error exportando leads de alto valor:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/**
 * GET /api/analyzed-chats/export/assigned/:assignedTo
 * Exporta chats asignados a un usuario específico en CSV
 */
router.get('/export/assigned/:assignedTo', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { assignedTo } = req.params;

    const { csv, filename, rowCount } = await exportService.exportAssignedChatsToCSV(tenantId, assignedTo);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Exportación completada: ${rowCount} chats asignados a "${assignedTo}"`);
  } catch (error) {
    console.error('Error exportando chats asignados:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

/**
 * GET /api/analyzed-chats/export/statistics
 * Exporta estadísticas del pipeline en CSV
 */
router.get('/export/statistics', requireAuth, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    const { csv, filename, rowCount } = await exportService.exportStatisticsToCSV(tenantId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    console.log(`✅ Estadísticas exportadas: ${rowCount} registros`);
  } catch (error) {
    console.error('Error exportando estadísticas:', error);
    res.status(500).json({ error: 'Error al exportar estadísticas' });
  }
});

module.exports = router;
