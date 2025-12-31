// services/chatAnalysisService.js
/**
 * Service for analyzing chats and classifying them into pipeline categories.
 * Uses DeepSeek AI for intelligent analysis and classification.
 */

const axios = require('axios');
const pool = require('./db');
const deepseekService = require('./deepseekService');
const botDbService = require('./botDbService');

// Categorías predeterminadas del pipeline
const DEFAULT_CATEGORIES = {
  'nuevos_contactos': { name: 'nuevos_contactos', minScore: 0, maxScore: 30 },
  'calientes': { name: 'calientes', minScore: 70, maxScore: 100 },
  'seguimiento': { name: 'seguimiento', minScore: 40, maxScore: 69 },
  'negociacion': { name: 'negociacion', minScore: 50, maxScore: 79 },
  'cerrar_venta': { name: 'cerrar_venta', minScore: 75, maxScore: 100 },
  'perdidos': { name: 'perdidos', minScore: 0, maxScore: 25 },
  'clientes': { name: 'clientes', minScore: 80, maxScore: 100 }
};

/**
 * Analiza una conversación completa y genera clasificación para el pipeline
 * @param {Object} chatData - Datos del chat
 * @param {string} chatData.botId - ID del bot
 * @param {string} chatData.contactPhone - Teléfono del contacto
 * @param {string} chatData.contactName - Nombre del contacto (opcional)
 * @param {string} chatData.contactEmail - Email del contacto (opcional)
 * @param {Array} chatData.messages - Array de mensajes {role, content, timestamp}
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<Object>} Resultados del análisis
 */
async function analyzeChatConversation(chatData, tenantId) {
  try {
    const {
      botId,
      contactPhone,
      contactName,
      contactEmail,
      messages,
      botPrompt = ''
    } = chatData;

    console.log(`📊 [CHAT_ANALYSIS] Iniciando análisis de ${contactPhone} (Bot: ${botId})`);
    console.log(`📊 [CHAT_ANALYSIS] Mensajes a analizar: ${messages.length}`);

    // 1. Obtener el bot para contexto
    const bot = await botDbService.getBotById(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} no encontrado`);
    }

    console.log(`📊 [CHAT_ANALYSIS] Bot encontrado: ${bot.name}`);

    // 2. Preparar datos para análisis
    const conversationText = formatConversationForAnalysis(messages);
    const contextPrompt = buildAnalysisPrompt(bot, botPrompt);

    console.log(`📊 [CHAT_ANALYSIS] Llamando DeepSeek API...`);
    
    // 3. Ejecutar análisis con DeepSeek
    const analysisResult = await performDeepseekAnalysis(
      conversationText,
      contextPrompt,
      messages
    );

    console.log(`📊 [CHAT_ANALYSIS] DeepSeek respondió - Intención: ${analysisResult.intension}, Confianza: ${analysisResult.confianza}`);

    // 4. Calcular lead score
    const leadScore = calculateLeadScore(analysisResult);

    console.log(`📊 [CHAT_ANALYSIS] Score calculado: ${leadScore}`);

    // 5. Clasificar en categoría del pipeline
    const pipelineCategory = classifyIntoPipelineCategory(
      analysisResult,
      leadScore
    );

    console.log(`📊 [CHAT_ANALYSIS] Categoría clasificada: ${pipelineCategory}`);

    // 6. Extraer productos mencionados
    const productsMentioned = extractProductMentions(
      analysisResult,
      conversationText
    );

    console.log(`📊 [CHAT_ANALYSIS] Productos mencionados: ${productsMentioned.length}`);

    // 7. Guardar análisis detallado en BD
    const analyzedChat = await saveAnalyzedChat({
      tenantId,
      botId,
      contactPhone,
      contactName,
      contactEmail,
      messages,
      analysisResults: analysisResult,
      leadScore,
      pipelineCategory,
      productsMentioned
    });

    console.log(`📊 [CHAT_ANALYSIS] Chat guardado en BD con ID: ${analyzedChat.id}`);

    // 8. Guardar detalles del análisis
    await saveAnalysisDetails(analyzedChat.id, tenantId, analysisResult);

    console.log(`✅ Chat analizado: ${contactPhone} - Score: ${leadScore} - Categoría: ${pipelineCategory}`);

    return {
      success: true,
      chatId: analyzedChat.id,
      leadScore,
      pipelineCategory,
      analysisResults: analysisResult,
      productsMentioned,
      suggestedNextSteps: analysisResult.proximoPaso
    };
  } catch (error) {
    console.error('❌ Error analizando chat:', error.message);
    throw error;
  }
}

/**
 * Realiza el análisis principal con DeepSeek
 */
async function performDeepseekAnalysis(conversationText, contextPrompt, messages) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY no configurada');
  }

  const systemPrompt = `${contextPrompt}

Analiza la conversación y proporciona un JSON con el siguiente formato (SOLO JSON, sin comentarios):
{
  "intencion": "compra|consulta|soporte|reclamacion",
  "confianza": 0.0-1.0,
  "engagement": 0.0-1.0,
  "interesProducto": true|false,
  "urgencia": 0.0-1.0,
  "sentimiento": -1.0-1.0,
  "productosInteresados": ["nombre_producto1", "nombre_producto2"],
  "proximoPaso": "acción recomendada",
  "resumen": "resumen corto de la conversación",
  "puntosClave": ["punto1", "punto2"],
  "banderaBuena": ["señal positiva 1", "señal positiva 2"],
  "banderaRoja": ["señal negativa 1", "señal negativa 2"]
}`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" } // 🆕 FORZAR RESPUESTA JSON
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('📄 Raw DeepSeek response:', content.substring(0, 200) + '...');
    
    // Intentar parsear directamente
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      // Si falla, extraer JSON del texto
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }
    }
    
    // 🆕 VALIDAR Y COMPLETAR CAMPOS FALTANTES
    return {
      intencion: analysis.intencion || 'consulta',
      confianza: analysis.confianza || 0.5,
      engagement: analysis.engagement || 0.5,
      interesProducto: analysis.interesProducto || false,
      urgencia: analysis.urgencia || 0.5,
      sentimiento: analysis.sentimiento || 0,
      productosInteresados: analysis.productosInteresados || [],
      proximoPaso: analysis.proximoPaso || 'Seguimiento en 24 horas',
      resumen: analysis.resumen || 'Conversación analizada',
      puntosClave: analysis.puntosClave || [],
      banderaBuena: analysis.banderaBuena || [],
      banderaRoja: analysis.banderaRoja || []
    };
    
  } catch (error) {
    console.error('❌ Error en DeepSeek analysis:', error.message);
    // Retornar análisis por defecto mejorado
    return {
      intencion: 'consulta',
      confianza: 0.5,
      engagement: 0.5,
      interesProducto: false,
      urgencia: 0.5,
      sentimiento: 0,
      productosInteresados: [],
      proximoPaso: 'Recontactar en 24 horas',
      resumen: 'Conversación analizada automáticamente',
      puntosClave: [],
      banderaBuena: [],
      banderaRoja: ['Análisis automático por fallo en API']
    };
  }
}

/**
 * Construye el prompt de contexto para el análisis
 */
function buildAnalysisPrompt(bot, botPrompt) {
  return `Eres un experto en análisis de conversaciones de ventas. 
Tu tarea es analizar conversaciones entre clientes y un bot de ventas.

El bot es: ${bot.name}
${botPrompt ? `Descripción del bot: ${botPrompt}` : ''}

Analiza la siguiente conversación considerando:
1. INTENCIÓN del cliente: ¿Qué busca? (compra, consulta, soporte, reclamación)
2. ENGAGEMENT: ¿Qué tan interesado está el cliente? (0-1)
3. INTERÉS EN PRODUCTOS: ¿Mostró interés en productos específicos?
4. URGENCIA: ¿Con qué urgencia necesita? (0-1)
5. SENTIMIENTO: ¿Positivo (-1), neutral (0) o negativo (1)?
6. SEÑALES POSITIVAS: Indicadores de potencial de venta
7. SEÑALES NEGATIVAS: Obstáculos o resistencias
8. PRÓXIMO PASO: Acción recomendada para el vendedor

Responde SOLO con un JSON válido, sin explicaciones adicionales.`;
}

/**
 * Calcula el score del lead basado en el análisis
 * Fórmula: (engagement * 0.3 + confianza * 0.25 + urgencia * 0.2 + interesProducto * 0.15 + sentimiento * 0.1) * 100
 */
function calculateLeadScore(analysis) {
  try {
    const {
      engagement = 0.5,
      confianza = 0.5,
      urgencia = 0.5,
      interesProducto = false,
      sentimiento = 0
    } = analysis;

    const score =
      (engagement * 0.3 +
        confianza * 0.25 +
        urgencia * 0.2 +
        (interesProducto ? 0.15 : 0) +
        ((sentimiento + 1) / 2) * 0.1) *
      100;

    return Math.min(100, Math.max(0, Math.round(score)));
  } catch (error) {
    console.warn('Error calculando score, retornando 50:', error.message);
    return 50;
  }
}

/**
 * Clasifica el chat en una categoría del pipeline
 */
function classifyIntoPipelineCategory(analysis, leadScore) {
  try {
    const { intencion = 'consulta', urgencia = 0.5, interesProducto = false } = analysis;

    // Lógica de clasificación por score y otros factores
    if (leadScore >= 70 && interesProducto) {
      return 'calientes';
    } else if (leadScore >= 50 && intencion === 'compra') {
      return 'negociacion';
    } else if (leadScore >= 75) {
      return 'cerrar_venta';
    } else if (leadScore < 25) {
      return 'perdidos';
    } else if (urgencia >= 0.7) {
      return 'seguimiento';
    } else {
      return 'nuevos_contactos';
    }
  } catch (error) {
    console.warn('Error clasificando, categoría por defecto:', error.message);
    return 'nuevos_contactos';
  }
}

/**
 * Extrae productos mencionados de la conversación
 */
function extractProductMentions(analysis, conversationText) {
  try {
    const { productosInteresados = [] } = analysis;
    
    return productosInteresados.map(product => ({
      name: product,
      mention_count: (conversationText.match(new RegExp(product, 'gi')) || []).length,
      intent: 'consulta'
    }));
  } catch (error) {
    console.warn('Error extrayendo productos:', error.message);
    return [];
  }
}

/**
 * Formatea la conversación para análisis
 */
function formatConversationForAnalysis(messages) {
  return messages
    .map(msg => {
      const sender = msg.role === 'user' ? 'Cliente' : 'Bot';
      return `${sender}: ${msg.content}`;
    })
    .join('\n');
}

/**
 * Guarda el chat analizado en la BD
 */
async function saveAnalyzedChat(data) {
  const {
    tenantId,
    botId,
    contactPhone,
    contactName,
    contactEmail,
    messages,
    analysisResults,
    leadScore,
    pipelineCategory,
    productsMentioned
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO analyzed_chats (
        tenant_id, bot_id, contact_phone, contact_name, contact_email,
        analysis_results, lead_score, pipeline_category,
        messages_count, last_message_content, last_message_at, products_mentioned,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (tenant_id, bot_id, contact_phone)
      DO UPDATE SET
        contact_name = EXCLUDED.contact_name,
        contact_email = EXCLUDED.contact_email,
        analysis_results = EXCLUDED.analysis_results,
        lead_score = EXCLUDED.lead_score,
        pipeline_category = EXCLUDED.pipeline_category,
        messages_count = EXCLUDED.messages_count,
        last_message_content = EXCLUDED.last_message_content,
        last_message_at = EXCLUDED.last_message_at,
        products_mentioned = EXCLUDED.products_mentioned,
        analyzed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        tenantId,
        botId,
        contactPhone,
        contactName,
        contactEmail,
        JSON.stringify(analysisResults),
        leadScore,
        pipelineCategory,
        messages.length,
        messages[messages.length - 1]?.content || '',
        messages[messages.length - 1]?.timestamp || new Date().toISOString(),
        JSON.stringify(productsMentioned),
        'analyzed'
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error guardando chat analizado:', error);
    throw error;
  }
}

/**
 * Guarda los detalles técnicos del análisis
 */
async function saveAnalysisDetails(chatId, tenantId, analysisResults) {
  try {
    await pool.query(
      `INSERT INTO chat_analysis_details (
        tenant_id, chat_id, raw_analysis,
        intent_classification, sentiment_score, engagement_level
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        chatId,
        JSON.stringify(analysisResults),
        analysisResults.intencion || 'consulta',
        (analysisResults.sentimiento || 0),
        analysisResults.engagement >= 0.7 ? 'alto' : analysisResults.engagement >= 0.4 ? 'medio' : 'bajo'
      ]
    );
  } catch (error) {
    console.error('Error guardando detalles de análisis:', error);
    // No lanzar error, es información secundaria
  }
}

/**
 * Obtiene chats analizados por categoría
 */
async function getChatsByCategory(tenantId, category, limit = 50, offset = 0) {
  try {
    const result = await pool.query(
      `SELECT 
        ac.*,
        u.email as assigned_to_email,
        pc.display_name as category_display_name,
        pc.color_code
      FROM analyzed_chats ac
      LEFT JOIN users u ON ac.assigned_to = u.id
      LEFT JOIN pipeline_categories pc ON ac.pipeline_category = pc.name
      WHERE ac.tenant_id = $1 
        AND ac.pipeline_category = $2
        AND ac.status IN ('analyzed', 'classified', 'assigned')
      ORDER BY ac.lead_score DESC, ac.analyzed_at DESC
      LIMIT $3 OFFSET $4`,
      [tenantId, category, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Error obteniendo chats por categoría:', error);
    throw error;
  }
}

/**
 * Obtiene todos los chats analizados
 */
async function getAllAnalyzedChats(tenantId, filters = {}, limit = 100, offset = 0) {
  try {
    let query = `
      SELECT 
        ac.*,
        u.email as assigned_to_email,
        pc.display_name as category_display_name,
        pc.color_code
      FROM analyzed_chats ac
      LEFT JOIN users u ON ac.assigned_to = u.id
      LEFT JOIN pipeline_categories pc ON ac.pipeline_category = pc.name
      WHERE ac.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramCount = 2;

    // Aplicar filtros
    if (filters.category) {
      query += ` AND ac.pipeline_category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.botId) {
      query += ` AND ac.bot_id = $${paramCount}`;
      params.push(filters.botId);
      paramCount++;
    }

    if (filters.minScore !== undefined) {
      query += ` AND ac.lead_score >= $${paramCount}`;
      params.push(filters.minScore);
      paramCount++;
    }

    if (filters.searchTerm) {
      query += ` AND (ac.contact_name ILIKE $${paramCount} OR ac.contact_phone ILIKE $${paramCount} OR ac.contact_email ILIKE $${paramCount})`;
      params.push(`%${filters.searchTerm}%`);
      paramCount++;
    }

    if (filters.assignedTo) {
      query += ` AND ac.assigned_to = $${paramCount}`;
      params.push(filters.assignedTo);
      paramCount++;
    }

    query += ` ORDER BY ac.lead_score DESC, ac.analyzed_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo chats analizados:', error);
    throw error;
  }
}

/**
 * Obtiene un chat analizado por ID
 */
async function getAnalyzedChatById(chatId, tenantId) {
  try {
    const result = await pool.query(
      `SELECT 
        ac.*,
        u.email as assigned_to_email,
        pc.display_name as category_display_name,
        pc.color_code
      FROM analyzed_chats ac
      LEFT JOIN users u ON ac.assigned_to = u.id
      LEFT JOIN pipeline_categories pc ON ac.pipeline_category = pc.name
      WHERE ac.id = $1 AND ac.tenant_id = $2`,
      [chatId, tenantId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error obteniendo chat analizado:', error);
    throw error;
  }
}

/**
 * Actualiza la categoría del pipeline de un chat
 */
async function updateChatCategory(chatId, newCategory, tenantId, movedBy, reason = '') {
  try {
    const chat = await getAnalyzedChatById(chatId, tenantId);
    if (!chat) {
      throw new Error('Chat no encontrado');
    }

    const oldCategory = chat.pipeline_category;

    // Actualizar el chat
    await pool.query(
      `UPDATE analyzed_chats SET pipeline_category = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND tenant_id = $3`,
      [newCategory, chatId, tenantId]
    );

    // Registrar el movimiento
    await pool.query(
      `INSERT INTO pipeline_movements (
        tenant_id, chat_id, from_category, to_category, moved_by, reason
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, chatId, oldCategory, newCategory, movedBy, reason]
    );

    return { success: true, oldCategory, newCategory };
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    throw error;
  }
}

/**
 * Asigna un chat a un vendedor
 */
async function assignChatToUser(chatId, userId, tenantId) {
  try {
    const result = await pool.query(
      `UPDATE analyzed_chats 
       SET assigned_to = $1, assigned_at = CURRENT_TIMESTAMP, status = 'assigned', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [userId, chatId, tenantId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error asignando chat:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas del pipeline
 */
async function getPipelineStatistics(tenantId, dateFrom = null, dateTo = null) {
  try {
    const query = `
      SELECT 
        pipeline_category,
        COUNT(*) as total_chats,
        AVG(lead_score) as avg_score,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
        COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_count
      FROM analyzed_chats
      WHERE tenant_id = $1
        AND status IN ('analyzed', 'classified', 'assigned', 'converted')
        ${dateFrom ? 'AND created_at >= $2' : ''}
        ${dateTo ? `AND created_at <= $${dateFrom ? '3' : '2'}` : ''}
      GROUP BY pipeline_category
      ORDER BY COUNT(*) DESC
    `;

    const params = [tenantId];
    if (dateFrom) params.push(dateFrom);
    if (dateTo) params.push(dateTo);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

module.exports = {
  analyzeChatConversation,
  getChatsByCategory,
  getAllAnalyzedChats,
  getAnalyzedChatById,
  updateChatCategory,
  assignChatToUser,
  getPipelineStatistics,
  DEFAULT_CATEGORIES
};
