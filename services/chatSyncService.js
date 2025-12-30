// services/chatSyncService.js
const { extractLeadInfo } = require('./leadExtractionService');
const scoringService = require('./scoringService');
const sseController = require('../controllers/sseController');
const {
    getOrCreateLead,
    updateLeadInfo,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    qualifyLead,
} = require('./leadDbService');

/**
 * Sincroniza chats existentes de WhatsApp cuando el bot se conecta
 * @param {string} botId - ID del bot
 * @param {object} socket - Socket de Baileys
 * @param {object} session - Sesión activa del bot
 */
async function syncExistingChats(botId, socket, session) {
    console.log(`[${botId}] 🔄 Iniciando sincronización de chats existentes...`);

    try {
        // Obtener store si está disponible
        const store = socket.store;
        
        if (!store) {
            console.log(`[${botId}] ⚠️ Store no disponible, usando método alternativo...`);
            await syncChatsWithoutStore(botId, socket, session);
            return;
        }

        // Obtener todos los chats del store
        const chats = store.chats?.all?.() || [];
        console.log(`[${botId}] 📚 Encontrados ${chats.length} chats en store`);

        let processedCount = 0;
        let leadsCreated = 0;
        let leadsUpdated = 0;

        for (const chat of chats) {
            // Ignorar grupos (terminan en @g.us) y broadcasts
            if (chat.id.endsWith('@g.us') || chat.id.endsWith('@broadcast')) {
                continue;
            }

            // Solo procesar chats individuales (@s.whatsapp.net)
            if (!chat.id.endsWith('@s.whatsapp.net')) {
                continue;
            }

            try {
                const result = await processChatHistory(botId, socket, chat.id, session);
                processedCount++;
                
                if (result.created) leadsCreated++;
                if (result.updated) leadsUpdated++;

                // Pequeña pausa para no sobrecargar
                if (processedCount % 10 === 0) {
                    await sleep(500);
                }
            } catch (chatError) {
                console.error(`[${botId}] ❌ Error procesando chat ${chat.id}:`, chatError.message);
            }
        }

        console.log(`[${botId}] ✅ Sincronización completada:`);
        console.log(`   📊 Chats procesados: ${processedCount}`);
        console.log(`   🆕 Leads creados: ${leadsCreated}`);
        console.log(`   📝 Leads actualizados: ${leadsUpdated}`);

        // Notificar al frontend
        if (session.botConfig?.ownerEmail) {
            sseController.sendEventToUser(session.botConfig.ownerEmail, 'SYNC_COMPLETED', {
                botId,
                processedChats: processedCount,
                leadsCreated,
                leadsUpdated,
            });
        }

    } catch (error) {
        console.error(`[${botId}] ❌ Error en sincronización:`, error);
    }
}

/**
 * Método alternativo sin store - obtiene mensajes directamente
 */
async function syncChatsWithoutStore(botId, socket, session) {
    console.log(`[${botId}] 🔍 Sincronizando sin store...`);
    
    try {
        // Intentar obtener chats recientes usando el método de Baileys
        // Nota: Este método puede variar según la versión de Baileys
        
        // Opción 1: Si el socket tiene contactos cargados
        if (socket.user) {
            console.log(`[${botId}] ℹ️ Conectado como: ${socket.user.id}`);
        }

        // La sincronización sin store es limitada
        // Los nuevos mensajes se procesarán normalmente cuando lleguen
        console.log(`[${botId}] ⚠️ Sincronización limitada sin store. Los chats se procesarán al recibir mensajes.`);
        
    } catch (error) {
        console.error(`[${botId}] ❌ Error en sync sin store:`, error);
    }
}

/**
 * Procesa el historial de un chat individual
 */
async function processChatHistory(botId, socket, chatId, session) {
    const result = { created: false, updated: false };
    
    console.log(`[${botId}] 📖 Procesando chat: ${chatId}`);

    // Crear o obtener el lead
    let lead = await getOrCreateLead(botId, chatId);
    if (!lead) {
        console.error(`[${botId}] ❌ No se pudo crear lead para ${chatId}`);
        return result;
    }

    // Verificar si es un lead nuevo (sin mensajes previos)
    const existingMessages = await getLeadMessages(lead.id, 1);
    const isNewLead = existingMessages.length === 0;
    
    if (isNewLead) {
        result.created = true;
    }

    // Obtener mensajes del chat
    let messages = [];
    
    try {
        // Intentar obtener del store primero
        if (socket.store?.messages) {
            const storedMessages = socket.store.messages[chatId];
            if (storedMessages) {
                messages = storedMessages.array?.() || Object.values(storedMessages) || [];
            }
        }

        // Si no hay mensajes en store, intentar fetch
        if (messages.length === 0) {
            try {
                // Cargar mensajes recientes (últimos 50)
                const fetchedMessages = await socket.fetchMessageHistory(chatId, 50);
                messages = fetchedMessages || [];
            } catch (fetchError) {
                // fetchMessageHistory puede no estar disponible en todas las versiones
                console.log(`[${botId}] ℹ️ fetchMessageHistory no disponible para ${chatId}`);
            }
        }

    } catch (error) {
        console.error(`[${botId}] ❌ Error obteniendo mensajes de ${chatId}:`, error.message);
    }

    if (messages.length === 0) {
        console.log(`[${botId}] ℹ️ Sin mensajes para procesar en ${chatId}`);
        return result;
    }

    console.log(`[${botId}] 📬 Procesando ${messages.length} mensajes de ${chatId}`);

    // Procesar cada mensaje
    const userMessages = [];
    
    for (const msg of messages) {
        try {
            const messageContent = getMessageContent(msg.message);
            if (!messageContent) continue;

            const isFromMe = msg.key?.fromMe || false;
            const sender = isFromMe ? 'bot' : 'user';
            const timestamp = msg.messageTimestamp 
                ? new Date(Number(msg.messageTimestamp) * 1000)
                : new Date();

            // Guardar mensaje en la base de datos (si no existe)
            if (isNewLead) {
                await addLeadMessage(lead.id, sender, messageContent);
            }

            // Acumular mensajes del usuario para extracción
            if (!isFromMe) {
                userMessages.push(messageContent);
            }
        } catch (msgError) {
            console.error(`[${botId}] ⚠️ Error procesando mensaje:`, msgError.message);
        }
    }

    // Extraer información de todos los mensajes del usuario
    if (userMessages.length > 0) {
        const combinedText = userMessages.join('\n');
        const wasUpdated = await extractAndUpdateLead(botId, lead, combinedText, session);
        
        if (wasUpdated) {
            result.updated = true;
        }
    }

    return result;
}

/**
 * Extrae información y actualiza el lead
 */
async function extractAndUpdateLead(botId, lead, combinedMessages, session) {
    let updated = false;

    try {
        // 1. Extraer información con IA
        console.log(`[${botId}] 🤖 Extrayendo info del lead ${lead.id}...`);
        const extractedInfo = await extractLeadInfo(combinedMessages);

        if (Object.keys(extractedInfo).length > 0) {
            console.log(`[${botId}] 📋 Info extraída:`, extractedInfo);
            
            // Solo actualizar campos que no existan
            const updateData = {};
            if (extractedInfo.name && !lead.name) updateData.name = extractedInfo.name;
            if (extractedInfo.email && !lead.email) updateData.email = extractedInfo.email;
            if (extractedInfo.location && !lead.location) updateData.location = extractedInfo.location;
            if (extractedInfo.phone && !lead.phone) updateData.phone = extractedInfo.phone;

            if (Object.keys(updateData).length > 0) {
                lead = await updateLeadInfo(lead.id, updateData);
                updated = true;
                console.log(`[${botId}] ✅ Lead ${lead.id} actualizado con:`, updateData);
            }
        }

        // 2. Aplicar scoring basado en el historial
        const scoringResult = await scoringService.evaluateMessage(botId, combinedMessages);
        
        if (scoringResult.scoreDelta !== 0 || scoringResult.tags.length > 0) {
            lead = await scoringService.applyScoring(lead.id, scoringResult);
            updated = true;
            console.log(`[${botId}] 🎯 Scoring aplicado: +${scoringResult.scoreDelta} pts, tags: ${scoringResult.tags.join(', ')}`);
        }

        // 3. Verificar si el lead está completo para calificarlo
        if (lead.status === 'capturing' && isLeadComplete(lead)) {
            lead = await qualifyLead(lead.id);
            updated = true;
            console.log(`[${botId}] 🏆 Lead ${lead.id} calificado automáticamente`);

            // Notificar al frontend
            if (session.botConfig?.ownerEmail) {
                sseController.sendEventToUser(session.botConfig.ownerEmail, 'NEW_QUALIFIED_LEAD', {
                    lead,
                    botId,
                    source: 'sync',
                });
            }
        }

    } catch (error) {
        console.error(`[${botId}] ❌ Error extrayendo/actualizando lead:`, error);
    }

    return updated;
}

/**
 * Extrae el contenido de texto de un mensaje de Baileys
 */
function getMessageContent(message) {
    if (!message) return null;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    if (message.documentMessage?.caption) return message.documentMessage.caption;
    return null;
}

/**
 * Helper para pausas
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sincroniza un chat individual (para uso manual o cuando llega un mensaje nuevo)
 */
async function syncSingleChat(botId, socket, chatId, session) {
    try {
        const result = await processChatHistory(botId, socket, chatId, session);
        return result;
    } catch (error) {
        console.error(`[${botId}] ❌ Error sincronizando chat ${chatId}:`, error);
        return { created: false, updated: false };
    }
}

module.exports = {
    syncExistingChats,
    syncSingleChat,
    extractAndUpdateLead,
};