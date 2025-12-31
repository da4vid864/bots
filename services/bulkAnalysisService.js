/**
 * Servicio para análisis masivo de chats
 * Analiza TODOS los chats de WhatsApp y los guarda en analyzed_chats
 */

const chatAnalysisService = require('./chatAnalysisService');
const botDbService = require('./botDbService');
const pool = require('./db');

/**
 * Analiza TODOS los chats de un bot y los guarda en analyzed_chats
 * @param {string} botId - ID del bot
 * @param {string} tenantId - ID del tenant
 * @param {object} socket - Socket de Baileys (opcional)
 */
async function analyzeAllBotChats(botId, tenantId, socket = null) {
  console.log(`🚀 Iniciando análisis MASIVO de todos los chats para bot: ${botId}`);
  
  try {
    // 1. Obtener el bot
    const bot = await botDbService.getBotById(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} no encontrado`);
    }

    // 2. Obtener todos los chats del bot desde WhatsApp
    const allChats = await getAllWhatsAppChats(botId, socket);
    console.log(`📚 Total de chats encontrados: ${allChats.length}`);

    // 3. Procesar cada chat
    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const chat of allChats) {
      try {
        const result = await processSingleChatAnalysis(bot, chat, tenantId, socket);
        processed++;
        
        if (result.created) created++;
        if (result.updated) updated++;
        
        // Pequeña pausa para no sobrecargar la API
        if (processed % 5 === 0) {
          await sleep(1000);
        }
        
        console.log(`✅ Chat ${processed}/${allChats.length}: ${chat.contactPhone} - Score: ${result.score}`);
      } catch (error) {
        console.error(`❌ Error procesando chat ${chat.contactPhone}:`, error.message);
        errors++;
      }
    }

    console.log(`🎯 Análisis masivo COMPLETADO:`);
    console.log(`   📊 Total procesados: ${processed}`);
    console.log(`   🆕 Nuevos analizados: ${created}`);
    console.log(`   📝 Actualizados: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);

    return { processed, created, updated, errors };

  } catch (error) {
    console.error('❌ Error en análisis masivo:', error);
    throw error;
  }
}

/**
 * Obtiene todos los chats de WhatsApp de un bot
 */
async function getAllWhatsAppChats(botId, socket) {
  const chats = [];
  
  try {
    // Método 1: Desde store de Baileys (si hay socket activo)
    if (socket && socket.store && socket.store.chats) {
      const storeChats = socket.store.chats.all?.() || Object.values(socket.store.chats) || [];
      
      for (const storeChat of storeChats) {
        // Filtrar solo chats individuales (no grupos)
        if (storeChat.id && storeChat.id.endsWith('@s.whatsapp.net')) {
          chats.push({
            contactPhone: storeChat.id.replace('@s.whatsapp.net', ''),
            contactName: storeChat.name || storeChat.notify || null,
            isGroup: false
          });
        }
      }
      console.log(`📱 Chats desde store: ${chats.length}`);
    }

    // Método 2: Desde BD de leads (backup)
    if (chats.length === 0) {
      const leadResult = await pool.query(
        `SELECT DISTINCT whatsapp_number as contact_phone, name as contact_name
         FROM leads WHERE bot_id = $1`,
        [botId]
      );
      
      leadResult.rows.forEach(lead => {
        chats.push({
          contactPhone: lead.contact_phone,
          contactName: lead.contact_name,
          isGroup: false,
          fromLeads: true
        });
      });
      console.log(`💾 Chats desde BD leads: ${chats.length}`);
    }

    return chats;
    
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    return chats;
  }
}

/**
 * Procesa y analiza un chat individual
 */
async function processSingleChatAnalysis(bot, chat, tenantId, socket) {
  const { contactPhone, contactName } = chat;
  
  // 1. Obtener mensajes del chat
  const messages = await getChatMessages(bot.id, contactPhone, socket);
  
  if (messages.length === 0) {
    console.log(`ℹ️ Chat ${contactPhone} sin mensajes, usando análisis básico`);
    
    // Análisis básico para chats sin mensajes
    const basicAnalysis = {
      intencion: 'consulta',
      confianza: 0.3,
      engagement: 0.5,
      interesProducto: false,
      urgencia: 0.3,
      sentimiento: 0,
      productosInteresados: [],
      proximoPaso: 'Recontactar en 24 horas',
      resumen: 'Chat sin mensajes - Cliente registrado en sistema',
      puntosClave: [],
      banderaBuena: [],
      banderaRoja: ['Chat sin interacción']
    };
    
    const leadScore = 25; // Score bajo por falta de interacción
    
    // Guardar en BD
    return await chatAnalysisService.saveAnalyzedChat({
      tenantId,
      botId: bot.id,
      contactPhone,
      contactName,
      messages: [{
        role: 'user',
        content: 'Cliente registrado en sistema',
        timestamp: new Date()
      }],
      analysisResults: basicAnalysis,
      leadScore,
      pipelineCategory: 'nuevos_contactos',
      productsMentioned: []
    });
  }
  
  // 2. Análisis completo con mensajes existentes
  return await chatAnalysisService.analyzeChatConversation({
    botId: bot.id,
    contactPhone,
    contactName,
    messages,
    botPrompt: bot.prompt || ''
  }, tenantId);
}

/**
 * Obtiene mensajes de un chat específico
 */
async function getChatMessages(botId, contactPhone, socket) {
  const messages = [];
  
  try {
    // Intentar desde store de Baileys
    if (socket && socket.store && socket.store.messages) {
      const chatId = `${contactPhone}@s.whatsapp.net`;
      const storedMessages = socket.store.messages[chatId];
      
      if (storedMessages) {
        const msgArray = storedMessages.array?.() || Object.values(storedMessages) || [];
        
        msgArray.forEach(msg => {
          const content = extractMessageContent(msg.message);
          if (content) {
            messages.push({
              role: msg.key?.fromMe ? 'assistant' : 'user',
              content,
              timestamp: msg.messageTimestamp ? 
                new Date(Number(msg.messageTimestamp) * 1000) : new Date()
            });
          }
        });
      }
    }
    
    // Si no hay mensajes en store, buscar en BD
    if (messages.length === 0) {
      const dbMessages = await pool.query(
        `SELECT sender, message, timestamp 
         FROM lead_messages lm
         JOIN leads l ON lm.lead_id = l.id
         WHERE l.bot_id = $1 AND l.whatsapp_number = $2
         ORDER BY timestamp ASC`,
        [botId, contactPhone]
      );
      
      dbMessages.rows.forEach(msg => {
        messages.push({
          role: msg.sender === 'bot' ? 'assistant' : 'user',
          content: msg.message,
          timestamp: msg.timestamp
        });
      });
    }
    
    return messages;
    
  } catch (error) {
    console.error(`Error obteniendo mensajes de ${contactPhone}:`, error);
    return [];
  }
}

/**
 * Extrae contenido de mensaje de Baileys
 */
function extractMessageContent(message) {
  if (!message) return null;
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica chats no analizados y los analiza
 */
async function checkAndAnalyzeUnprocessedChats(tenantId) {
  try {
    console.log(`🔍 Buscando chats no analizados para tenant: ${tenantId}`);
    
    // Obtener bots del tenant
    const bots = await pool.query(
      `SELECT id, name FROM bots WHERE tenant_id = $1 AND status = 'enabled'`,
      [tenantId]
    );
    
    if (bots.rows.length === 0) {
      console.log('ℹ️ No hay bots activos para este tenant');
      return 0;
    }
    
    let totalProcessed = 0;
    
    for (const bot of bots.rows) {
      console.log(`🤖 Procesando bot: ${bot.name} (${bot.id})`);
      
      // Obtener chats de WhatsApp que no están en analyzed_chats
      const unprocessedChats = await pool.query(
        `SELECT DISTINCT l.whatsapp_number as contact_phone, l.name as contact_name
         FROM leads l
         WHERE l.bot_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM analyzed_chats ac 
           WHERE ac.bot_id = l.bot_id 
           AND ac.contact_phone = l.whatsapp_number
           AND ac.tenant_id = $2
         )`,
        [bot.id, tenantId]
      );
      
      console.log(`📊 Chats sin analizar para ${bot.name}: ${unprocessedChats.rows.length}`);
      
      // Procesar cada chat no analizado
      for (const chat of unprocessedChats.rows) {
        try {
          // Análisis básico
          await chatAnalysisService.analyzeChatConversation({
            botId: bot.id,
            contactPhone: chat.contact_phone,
            contactName: chat.contact_name,
            messages: [{
              role: 'user',
              content: 'Cliente registrado en sistema',
              timestamp: new Date()
            }],
            botPrompt: ''
          }, tenantId);
          
          totalProcessed++;
          console.log(`✅ Chat analizado: ${chat.contact_phone}`);
          
        } catch (error) {
          console.error(`❌ Error analizando ${chat.contact_phone}:`, error.message);
        }
      }
    }
    
    console.log(`🎯 Total de chats nuevos analizados: ${totalProcessed}`);
    return totalProcessed;
    
  } catch (error) {
    console.error('Error en checkAndAnalyzeUnprocessedChats:', error);
    throw error;
  }
}

module.exports = {
  analyzeAllBotChats,
  checkAndAnalyzeUnprocessedChats,
  getAllWhatsAppChats
};