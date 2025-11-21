// botInstance.js
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { getChatReply } = require('./services/deepseekService');
const { extractLeadInfo, generateFollowUpQuestion } = require('./services/leadExtractionService');
const { 
    getOrCreateLead, 
    updateLeadInfo, 
    qualifyLead, 
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    getLeadById
} = require('./services/leadDbService');

let botConfig;
let isReady = false; // ✅ NUEVO: Bandera para saber si el bot está listo

function sendStatusToDashboard(type, data = {}) {
    if (process.send) {
        process.send({ type, ...data, botId: botConfig.id });
    }
}

process.on('message', (msg) => {
    if (msg.type === 'INIT') {
        botConfig = msg.config;
        console.log(`[${botConfig.id}] Inicializando con nombre "${botConfig.name}"...`);
        initializeWhatsApp();
    } else if (msg.type === 'SEND_MESSAGE') {
        handleOutgoingMessage(msg.to, msg.message);
    }
});

let whatsappClient;

function initializeWhatsApp() {
    console.log(`[${botConfig.id}] 🔍 DEBUG: Inicializando WhatsApp Client...`);
    
    try {
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: botConfig.id }),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-features=VizDisplayCompositor'
                ],
                headless: true,
                timeout: 120000,
                ignoreHTTPSErrors: true,
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false
            },
            takeoverOnConflict: false,
            takeoverTimeoutMs: 0,
            restartOnAuthFail: true,
            qrMaxRetries: 5,
            authTimeoutMs: 120000,
            bypassCSP: true
        });

        whatsappClient = client;

        client.on('qr', async (qr) => {
            console.log(`[${botConfig.id}] 🔍 DEBUG: QR Code received`);
            try {
                const qrCodeUrl = await QRCode.toDataURL(qr);
                sendStatusToDashboard('QR_GENERATED', { qr: qrCodeUrl });
            } catch (error) {
                console.error(`[${botConfig.id}] ❌ Error generating QR code:`, error);
            }
        });

        client.on('loading_screen', (percent, message) => {
            console.log(`[${botConfig.id}] 🔍 DEBUG: Loading screen - ${percent}%: ${message}`);
        });

        client.on('authenticated', () => {
            console.log(`[${botConfig.id}] 🔍 DEBUG: Client authenticated successfully`);
        });

        client.on('auth_failure', (message) => {
            console.error(`[${botConfig.id}] 🔍 DEBUG: Authentication failure:`, message);
        });

        client.on('ready', async () => {
            console.log(`[${botConfig.id}] ✅ WhatsApp conectado!`);
            sendStatusToDashboard('CONNECTED');
            
            try {
                console.log(`[${botConfig.id}] 🔍 DEBUG: Cargando historial existente (sin responder)...`);
                await loadExistingChats();
                console.log(`[${botConfig.id}] 🔍 DEBUG: Historial cargado completamente`);
                
                // ✅ IMPORTANTE: Marcar bot como listo DESPUÉS de cargar el historial
                isReady = true;
                console.log(`[${botConfig.id}] ✅ Bot listo para responder mensajes nuevos`);
            } catch (error) {
                console.error(`[${botConfig.id}] ❌ Error in loadExistingChats:`, error);
            }
        });

        client.on('disconnected', (reason) => {
            console.log(`[${botConfig.id}] ❌ Desconectado:`, reason);
            isReady = false; // ✅ Marcar como no listo
            sendStatusToDashboard('DISCONNECTED');
        });

        client.on('error', (error) => {
            console.error(`[${botConfig.id}] ❌ WhatsApp Client Error:`, error);
        });
    
        client.on('message', async (msg) => {
            // ✅ IMPORTANTE: Solo procesar si el bot está listo (después de cargar historial)
            if (!isReady) {
                console.log(`[${botConfig.id}] ⏸️ Mensaje ignorado (bot aún cargando historial)`);
                return;
            }
            
            console.log(`[${botConfig.id}] 📨 Nuevo mensaje recibido en tiempo real`);
            
            if (!msg || !msg.from || !msg.body) {
                console.log(`[${botConfig.id}] 🔍 DEBUG: Mensaje inválido omitido`);
                return;
            }
            
            if (msg.from.endsWith('@g.us')) return; // Ignorar grupos

            const senderId = msg.from;
            const userMessage = msg.body;
            console.log(`[${botConfig.id}] 📩 Mensaje de ${senderId}: ${userMessage}`);

            try {
                let lead = await getOrCreateLead(botConfig.id, senderId);
                
                if (!lead || !lead.id) {
                    console.error(`[${botConfig.id}] ❌ Lead no válido para ${senderId}`);
                    return;
                }
                
                // Guardar el mensaje
                console.log(`[${botConfig.id}] 💾 Guardando mensaje para lead ${lead.id}`);
                await addLeadMessage(lead.id, 'user', userMessage);

                // Verificar si el lead ya está asignado a ventas
                if (lead.status === 'assigned') {
                    console.log(`[${botConfig.id}] 👤 Lead asignado a ventas, notificando dashboard`);
                    sendStatusToDashboard('NEW_MESSAGE_FOR_SALES', {
                        leadId: lead.id,
                        from: senderId,
                        message: userMessage
                    });
                    return; // ✅ No responder automáticamente
                }

                // Sistema de captura inteligente
                if (lead.status === 'capturing') {
                    console.log(`[${botConfig.id}] 🔍 Procesando lead en captura`);
                    const extractedInfo = await extractLeadInfo(userMessage);
                    
                    if (Object.keys(extractedInfo).length > 0) {
                        lead = await updateLeadInfo(lead.id, extractedInfo);
                        console.log(`[${botConfig.id}] ℹ️ Información extraída:`, extractedInfo);
                    }
                    
                    if (isLeadComplete(lead)) {
                        console.log(`[${botConfig.id}] ✅ Lead completo, calificando...`);
                        lead = await qualifyLead(lead.id);
                        
                        let botReply;
                        if (lead.phone === lead.whatsapp_number) {
                            botReply = "¡Perfecto! Ya tengo toda tu información. Un miembro de nuestro equipo se pondrá en contacto contigo por este mismo número de WhatsApp muy pronto. ¡Gracias! 🎉";
                        } else {
                            botReply = "¡Perfecto! Ya tengo toda tu información. Un miembro de nuestro equipo se pondrá en contacto contigo muy pronto. ¡Gracias! 🎉";
                        }
                        
                        await msg.reply(botReply);
                        await addLeadMessage(lead.id, 'bot', botReply);
                        
                        sendStatusToDashboard('NEW_QUALIFIED_LEAD', { lead });
                        return;
                    }

                    // Generar respuesta del bot
                    console.log(`[${botConfig.id}] 🤖 Generando respuesta...`);
                    const followUpQuestion = await generateFollowUpQuestion(lead);
                    let botReply;
                    
                    // Obtener historial para contexto
                    const messages = await getLeadMessages(lead.id, 20);
                    const history = messages.map(m => ({
                        role: m.sender === 'user' ? 'user' : 'assistant',
                        content: m.message
                    }));
                    
                    if (followUpQuestion) {
                        const contextReply = await getChatReply(userMessage, history, botConfig.prompt);
                        botReply = `${contextReply}\n\n${followUpQuestion}`;
                    } else {
                        botReply = await getChatReply(userMessage, history, botConfig.prompt);
                    }
                    
                    console.log(`[${botConfig.id}] 💬 Enviando respuesta: ${botReply.substring(0, 50)}...`);
                    await msg.reply(botReply);
                    await addLeadMessage(lead.id, 'bot', botReply);
                }

            } catch (error) {
                console.error(`[${botConfig.id}] ❌ Error procesando mensaje:`, error);
                try {
                    await msg.reply("Ups, algo salió mal. Intenta de nuevo.");
                } catch (replyError) {
                    console.error(`[${botConfig.id}] ❌ Error enviando mensaje de error:`, replyError);
                }
            }
        });

        const initializationTimeout = setTimeout(() => {
            console.error(`[${botConfig.id}] ❌ WhatsApp client initialization timeout (120s)`);
        }, 120000);
        
        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptInitialization = async () => {
            try {
                console.log(`[${botConfig.id}] 🔍 DEBUG: Initialization attempt ${retryCount + 1}/${maxRetries}`);
                await client.initialize();
                clearTimeout(initializationTimeout);
                console.log(`[${botConfig.id}] ✅ WhatsApp client initialized successfully`);
            } catch (error) {
                clearTimeout(initializationTimeout);
                console.error(`[${botConfig.id}] ❌ Error inicializando (attempt ${retryCount + 1}):`, error.message);
                
                if (error.message.includes('Execution context was destroyed')) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        const retryDelay = Math.pow(2, retryCount) * 1000;
                        console.log(`[${botConfig.id}] 🔄 Retry en ${retryDelay}ms...`);
                        setTimeout(attemptInitialization, retryDelay);
                        return;
                    }
                }
                
                console.error(`[${botConfig.id}] ❌ Initialization failed after ${retryCount + 1} attempts`);
            }
        };
        
        attemptInitialization();
        
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error en initializeWhatsApp:`, error);
    }
}

/**
 * Obtiene todos los chats de WhatsApp
 */
async function getAllChats() {
    if (!whatsappClient) {
        console.error('Cliente de WhatsApp no inicializado');
        return [];
    }

    try {
        const chats = await whatsappClient.getChats();
        const individualChats = chats.filter(chat => !chat.isGroup);
        console.log(`[${botConfig.id}] 📚 Encontrados ${individualChats.length} chats individuales`);
        return individualChats;
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error obteniendo chats:`, error);
        return [];
    }
}

/**
 * Carga el historial de mensajes de un chat
 */
async function loadHistory(chat, limit = 100) {
    if (!whatsappClient) {
        console.error('Cliente de WhatsApp no inicializado');
        return [];
    }

    try {
        const messages = await chat.fetchMessages({ limit });
        console.log(`[${botConfig.id}] 📖 Cargados ${messages.length} mensajes`);
        return messages;
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error cargando historial:`, error);
        return [];
    }
}

/**
 * Carga mensajes existentes SIN generar respuestas automáticas
 * Solo guarda en BD y extrae información
 */
async function loadMessages(chat, limit = 50) {
    try {
        if (!chat || !chat.id || !chat.id._serialized) {
            console.error(`[${botConfig.id}] ❌ Chat object inválido`);
            return null;
        }
        
        const senderId = chat.id._serialized;
        console.log(`[${botConfig.id}] 📂 Procesando historial de: ${senderId}`);
        
        const messages = await loadHistory(chat, limit);
        
        let lead = await getOrCreateLead(botConfig.id, senderId);
        
        if (!lead || !lead.id) {
            console.error(`[${botConfig.id}] ❌ Lead no válido`);
            return null;
        }
        
        // Procesar cada mensaje del historial (solo guardar, NO responder)
        for (const message of messages) {
            if (!message || message.fromMe) continue;
            
            const userMessage = message.body;
            if (!userMessage || userMessage.trim() === '') continue;
            
            // Verificar si ya está guardado
            const storedMessages = await getLeadMessages(lead.id, 1000);
            const isAlreadyStored = storedMessages.some(storedMsg =>
                storedMsg.message === userMessage && storedMsg.sender === 'user'
            );
            
            if (!isAlreadyStored) {
                // Solo guardar, NO responder
                await addLeadMessage(lead.id, 'user', userMessage);
                
                // Extraer información
                try {
                    const extractedInfo = await extractLeadInfo(userMessage);
                    if (Object.keys(extractedInfo).length > 0) {
                        lead = await updateLeadInfo(lead.id, extractedInfo);
                    }
                } catch (extractError) {
                    console.error(`[${botConfig.id}] ❌ Error extrayendo info:`, extractError);
                }
            }
        }
        
        // Verificar si está completo (sin notificar ni responder)
        if (isLeadComplete(lead) && lead.status === 'capturing') {
            lead = await qualifyLead(lead.id);
            console.log(`[${botConfig.id}] ✅ Lead ${lead.id} calificado del historial (sin notificar)`);
            // ✅ NO enviar notificación aquí para evitar duplicados
        }
        
        return lead;
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error en loadMessages:`, error);
        return null;
    }
}

/**
 * Carga y procesa todos los chats existentes al conectar
 * Solo guarda historial, NO genera respuestas
 */
async function loadExistingChats() {
    try {
        console.log(`[${botConfig.id}] 🕐 Iniciando carga de historial...`);
        const chats = await getAllChats();
        
        let processedCount = 0;
        let qualifiedCount = 0;
        
        for (const chat of chats) {
            try {
                const lead = await loadMessages(chat, 50);
                if (lead) {
                    processedCount++;
                    if (lead.status === 'qualified') {
                        qualifiedCount++;
                    }
                }
            } catch (chatError) {
                console.error(`[${botConfig.id}] ❌ Error procesando chat:`, chatError);
            }
        }
        
        console.log(`[${botConfig.id}] ✅ Historial procesado: ${processedCount} chats, ${qualifiedCount} leads calificados`);
        console.log(`[${botConfig.id}] 🎯 Ahora el bot solo responderá a mensajes NUEVOS en tiempo real`);
        
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error cargando chats existentes:`, error);
    }
}

/**
 * Maneja el envío de mensajes salientes (desde el panel de ventas)
 */
async function handleOutgoingMessage(to, message) {
    if (!whatsappClient) {
        console.error('Cliente de WhatsApp no inicializado');
        return;
    }

    try {
        await whatsappClient.sendMessage(to, message);
        console.log(`[${botConfig.id}] ✅ Mensaje enviado a ${to}`);
    } catch (error) {
        console.error(`[${botConfig.id}] ❌ Error enviando mensaje:`, error);
    }
}