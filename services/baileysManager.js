// services/baileysManager.js
let baileys;
let Boom;
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino'); // Added pino import

// Dynamically import ESM modules
async function loadBaileys() {
    if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
    }
    if (!Boom) {
        Boom = (await import('@hapi/boom')).Boom;
    }
    return { baileys, Boom };
}

const { getChatReply } = require('./deepseekService');
const { extractLeadInfo, generateFollowUpQuestion } = require('./leadExtractionService');
const botImageService = require('./botImageService');
const scoringService = require('./scoringService');
const productService = require('./productService');
const sseController = require('../controllers/sseController');
const {
    getOrCreateLead,
    updateLeadInfo,
    qualifyLead,
    addLeadMessage,
    getLeadMessages,
    isLeadComplete,
    getLeadById
} = require('./leadDbService');

// In-memory Map for active sessions: Map<botId, socket>
const activeSessions = new Map();


/**
 * Initialize Baileys connection for a bot
 */
async function initializeBaileysConnection(botConfig, onStatusUpdate) {
    const { id: botId, name: botName } = botConfig;
    
    console.log(`[${botId}] 🔍 Inicializando conexión Baileys para: ${botName}`);
    
    try {
        // Load baileys module
        const { baileys, Boom } = await loadBaileys();
        const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys;
        
        // Create bot-specific auth directory
        const authDir = path.join(__dirname, '..', 'auth-sessions', botId);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }
        
        // Load or create auth state
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        // Fetch latest version
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`[${botId}] 📦 Usando Baileys v${version.join('.')}, latest: ${isLatest}`);
        
        // Create pino logger instance
        const logger = pino({ level: 'silent' });

        // Configure socket
        const socket = makeWASocket({
            version,
            logger, // Pass the pino logger instance
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger), // Pass logger here too if needed by store
            },
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });
        
        // Store session
        activeSessions.set(botId, {
            socket,
            botConfig,
            isReady: false,
            isPaused: botConfig.status === 'disabled',
            availableImages: [],
            availableProducts: [],
            saveCreds
        });
        
        // Load bot images and products
        await loadBotImages(botId);
        await loadBotProducts(botId);
        
        // Set up event handlers
        setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason);
        
        return socket;
        
    } catch (error) {
        console.error(`[${botId}] ❌ Error inicializando Baileys:`, error);
        throw error;
    }
}

/**
 * Set up event handlers for Baileys socket
 */
function setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason) {
    const session = activeSessions.get(botId);
    if (!session) return;
    
    // Connection updates
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log(`[${botId}] 🔌 Estado de conexión:`, connection);
        
        if (qr) {
            // Generate QR code for display
            try {
                const qrCodeUrl = await QRCode.toDataURL(qr);
                // Get bot owner email from botConfig to send event to specific user
                const botOwnerEmail = session.botConfig.ownerEmail;
                sseController.sendEventToUser(botOwnerEmail, 'QR_GENERATED', { qr: qrCodeUrl, botId });
                onStatusUpdate('QR_GENERATED', { qr: qrCodeUrl });
            } catch (error) {
                console.error(`[${botId}] ❌ Error generando QR:`, error);
            }
        }
        
        if (connection === 'open') {
            console.log(`[${botId}] ✅ WhatsApp conectado!`);
            session.isReady = true;
            
            const statusReport = session.isPaused ? 'DISABLED' : 'CONNECTED';
            const botOwnerEmail = session.botConfig.ownerEmail;
            sseController.sendEventToUser(botOwnerEmail, 'CONNECTED', {
                status: session.isPaused ? 'disabled' : 'enabled',
                runtimeStatus: statusReport,
                botId
            });
            onStatusUpdate('CONNECTED', {
                status: session.isPaused ? 'disabled' : 'enabled',
                runtimeStatus: statusReport
            });
            
            if (!session.isPaused) {
                console.log(`[${botId}] 🔍 Cargando historial existente...`);
                loadExistingChats(botId);
            }
            
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[${botId}] ❌ Conexión cerrada. Reconectar: ${shouldReconnect}`, lastDisconnect?.error);
            
            session.isReady = false;
            const botOwnerEmail = session.botConfig.ownerEmail;
            sseController.sendEventToUser(botOwnerEmail, 'DISCONNECTED', { botId });
            onStatusUpdate('DISCONNECTED', {});
            
            if (shouldReconnect) {
                console.log(`[${botId}] 🔄 Intentando reconectar...`);
                setTimeout(() => initializeBaileysConnection(session.botConfig, onStatusUpdate), 5000);
            }
        }
    });
    
    // Credentials update
    socket.ev.on('creds.update', saveCreds);
    
    // Message handling
    socket.ev.on('messages.upsert', async (messageUpdate) => {
        if (!session.isReady || session.isPaused) return;
        
        const { messages, type } = messageUpdate;
        
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            await handleIncomingMessage(botId, msg);
        }
    });
}

/**
 * Handle incoming messages
 */
async function handleIncomingMessage(botId, msg) {
    const session = activeSessions.get(botId);
    if (!session || !session.isReady || session.isPaused) return;
    
    // Skip group messages and status updates
    if (!msg.message || msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) return;
    
    const senderId = msg.key.remoteJid;
    const userMessage = getMessageContent(msg.message);
    
    if (!userMessage) return;
    
    console.log(`[${botId}] 📩 Mensaje de ${senderId}: ${userMessage}`);
    
    try {
        let lead = await getOrCreateLead(botId, senderId);
        if (!lead || !lead.id) return;
        
        // Save user message to database
        await addLeadMessage(lead.id, 'user', userMessage);

        // === SCORING & AUTOMATION START ===
        let skipAiGeneration = false;
        try {
            // 1. Evaluate message
            const evaluation = await scoringService.evaluateMessage(botId, userMessage);
            
            // 2. Apply scoring updates
            if (evaluation.scoreDelta !== 0 || evaluation.tags.length > 0) {
                lead = await scoringService.applyScoring(lead.id, evaluation);
                console.log(`[${botId}] 🎯 Scoring aplicado: ${evaluation.scoreDelta} pts, Tags: ${evaluation.tags.join(', ')}`);
            }

            // 3. Send automated responses
            if (evaluation.responses && evaluation.responses.length > 0) {
                for (const responseText of evaluation.responses) {
                    await sendMessage(botId, senderId, responseText);
                    await addLeadMessage(lead.id, 'bot', responseText);
                }
                // If we sent an automated response, we might want to skip AI generation
                // to avoid double replying. For now, we skip AI if any rule triggered a response.
                skipAiGeneration = true;
                console.log(`[${botId}] 🤖 Respuesta automática enviada, saltando IA.`);
            }

            // 4. Check for auto-qualification (e.g., score >= 50)
            if (lead.score >= 50 && lead.status === 'capturing') {
                lead = await qualifyLead(lead.id);
                const qualMsg = "¡Felicidades! Has calificado para atención prioritaria. Un asesor revisará tu caso pronto.";
                await sendMessage(botId, senderId, qualMsg);
                await addLeadMessage(lead.id, 'bot', qualMsg);
                
                const botOwnerEmail = session.botConfig.ownerEmail;
                sseController.sendEventToUser(botOwnerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                return; // Stop processing
            }

        } catch (scoringError) {
            console.error(`[${botId}] ❌ Error en scoring:`, scoringError);
        }
        // === SCORING & AUTOMATION END ===
        
        if (lead.status === 'assigned') {
            // Get bot owner email from session to send event to specific user
            const botOwnerEmail = session.botConfig.ownerEmail;
            sseController.sendEventToUser(botOwnerEmail, 'NEW_MESSAGE_FOR_SALES', {
                leadId: lead.id,
                from: senderId,
                message: userMessage,
                botId
            });
            return;
        }
        
        if (lead.status === 'capturing' && !skipAiGeneration) {
            // Lead extraction logic
            const extractedInfo = await extractLeadInfo(userMessage);
            if (Object.keys(extractedInfo).length > 0) {
                lead = await updateLeadInfo(lead.id, extractedInfo);
            }
            
            if (isLeadComplete(lead)) {
                lead = await qualifyLead(lead.id);
                const finalMsg = "¡Perfecto! Ya tengo toda tu información. Un asesor te contactará pronto. 🎉";
                await sendMessage(botId, senderId, finalMsg);
                await addLeadMessage(lead.id, 'bot', finalMsg);
                const botOwnerEmail = session.botConfig.ownerEmail;
                sseController.sendEventToUser(botOwnerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                return;
            }
            
            // Generate response with images
            const followUpQuestion = await generateFollowUpQuestion(lead);
            let promptWithContext = session.botConfig.prompt;
            
            if (session.availableImages.length > 0) {
                const keywords = session.availableImages.map(img => img.keyword).join(', ');
                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE IMÁGENES]:
                Tienes acceso a imágenes visuales sobre los siguientes temas: [${keywords}].
                Si el usuario pregunta explícitamente por alguno de estos temas o si crees que una imagen ayudaría a vender mejor,
                DEBES incluir la etiqueta [ENVIAR_IMAGEN: palabra_clave] al final de tu respuesta.`;
            }

            if (session.availableProducts && session.availableProducts.length > 0) {
                const productList = session.availableProducts
                    .map(p => `[SKU: ${p.sku}] ${p.name} - ${p.price} ${p.currency}`)
                    .join('\n');
                
                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE PRODUCTOS]:
                Tienes acceso a los siguientes productos:
                ${productList}
                
                Si el usuario pregunta por uno de estos productos o muestra interés claro, usa la etiqueta $$ SEND_PRODUCT: SKU $$ para enviarlo.
                No inventes productos que no estén en la lista.`;
            }
            
            // Get message history
            const messages = await getLeadMessages(lead.id, 20);
            const historyMessages = messages.slice(0, -1); // Remove last message (current one)
            
            const history = historyMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.message
            }));
            
            let botReply;
            const aiResponse = await getChatReply(userMessage, history, promptWithContext);
            
            if (followUpQuestion) {
                botReply = `${aiResponse}\n\n${followUpQuestion}`;
            } else {
                botReply = aiResponse;
            }
            
            // Image handling
            const imageTagRegex = /\$\$\s*ENVIAR_IMAGEN:\s*([\s\S]+?)\s*\$\$/i;
            const match = botReply.match(imageTagRegex);
            let imageToSend = null;
            
            if (match) {
                const keyword = match[1].trim().toLowerCase();
                console.log(`[${botId}] 🖼️ IA solicitó imagen con keyword: "${keyword}"`);
                
                imageToSend = session.availableImages.find(img => img.keyword === keyword);
                
                // Clean image tag from text
                botReply = botReply.replace(match[0], '').trim();
            }

            // Product handling
            const productTagRegex = /\$\$\s*SEND_PRODUCT:\s*([\w-]+)\s*\$\$/i;
            const productMatch = botReply.match(productTagRegex);
            let productToSend = null;

            if (productMatch) {
                const sku = productMatch[1].trim();
                console.log(`[${botId}] 🛍️ IA solicitó producto con SKU: "${sku}"`);
                
                productToSend = session.availableProducts.find(p => p.sku === sku);
                
                // Clean product tag from text
                botReply = botReply.replace(productMatch[0], '').trim();
            }
            
            if (botReply) {
                await sendMessage(botId, senderId, botReply);
                await addLeadMessage(lead.id, 'bot', botReply);
            }
            
            if (imageToSend) {
                try {
                    const imagePath = path.join(__dirname, '..', 'public', 'uploads', imageToSend.filename);
                    if (fs.existsSync(imagePath)) {
                        await sendImage(botId, senderId, imagePath, imageToSend.original_name);
                        await addLeadMessage(lead.id, 'bot', `[Imagen enviada: ${imageToSend.original_name}]`);
                    }
                } catch (imgError) {
                    console.error(`[${botId}] ❌ Error enviando imagen:`, imgError);
                }
            }

            if (productToSend) {
                try {
                    const caption = `*${productToSend.name}*\n\n${productToSend.description}\n\n💰 Precio: ${productToSend.price} ${productToSend.currency}`;
                    
                    if (productToSend.image_url) {
                        await session.socket.sendMessage(senderId, {
                            image: { url: productToSend.image_url },
                            caption: caption
                        });
                    } else {
                        await sendMessage(botId, senderId, caption);
                    }
                    
                    await addLeadMessage(lead.id, 'bot', `[Producto enviado: ${productToSend.sku}]`);
                    
                    // Lead Scoring Integration
                    await scoringService.applyScoring(lead.id, {
                        scoreDelta: 10,
                        tags: ['interested_in_product', `product_${productToSend.sku}`],
                        responses: []
                    });
                    console.log(`[${botId}] 🎯 Scoring aplicado por envío de producto: +10 pts`);
                    
                } catch (prodError) {
                    console.error(`[${botId}] ❌ Error enviando producto:`, prodError);
                }
            }
        }
        
    } catch (error) {
        console.error(`[${botId}] ❌ Error procesando mensaje:`, error);
    }
}

/**
 * Extract message content from different message types
 */
function getMessageContent(message) {
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    return null;
}

/**
 * Load bot images
 */
async function loadBotImages(botId) {
    const session = activeSessions.get(botId);
    if (!session) return;
    
    try {
        session.availableImages = await botImageService.getImagesByBot(botId);
        console.log(`[${botId}] 🖼️ Imágenes cargadas en memoria: ${session.availableImages.length}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando imágenes:`, error);
    }
}

/**
 * Load bot products
 */
async function loadBotProducts(botId) {
    const session = activeSessions.get(botId);
    if (!session) return;
    
    try {
        session.availableProducts = await productService.getProductsByBot(botId);
        console.log(`[${botId}] 🛍️ Productos cargados en memoria: ${session.availableProducts.length}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando productos:`, error);
    }
}

/**
 * Load existing chats and messages
 */
async function loadExistingChats(botId) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket) return;
    
    try {
        const chats = await session.socket.groupFetchAllParticipating();
        // Implementation for loading existing chat history would go here
        console.log(`[${botId}] 📚 Cargados ${Object.keys(chats).length} chats existentes`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando chats existentes:`, error);
    }
}

/**
 * Send text message
 */
async function sendMessage(botId, to, message) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo para enviar mensajes`);
    }
    
    try {
        await session.socket.sendMessage(to, { text: message });
        console.log(`[${botId}] ✅ Mensaje enviado a ${to}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error enviando mensaje:`, error);
        throw error;
    }
}

/**
 * Send image message
 */
async function sendImage(botId, to, imagePath, caption = '') {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo para enviar imágenes`);
    }
    
    try {
        await session.socket.sendMessage(to, {
            image: { url: imagePath },
            caption: caption
        });
        console.log(`[${botId}] ✅ Imagen enviada a ${to}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error enviando imagen:`, error);
        throw error;
    }
}

/**
 * Set bot status (enabled/disabled)
 */
function setBotStatus(botId, status) {
    const session = activeSessions.get(botId);
    if (!session) return;
    
    session.isPaused = status === 'disabled';
    
    console.log(`[${botId}] ${session.isPaused ? '⏸️ Bot PAUSADO' : '▶️ Bot REANUDADO'}`);
    
    const botOwnerEmail = session.botConfig.ownerEmail;
    sseController.sendEventToUser(botOwnerEmail, 'UPDATE_BOT', {
        status: status,
        runtimeStatus: session.isPaused ? 'DISABLED' : 'CONNECTED',
        botId
    });
}

/**
 * Refresh bot images
 */
async function refreshBotImages(botId) {
    console.log(`[${botId}] 🔄 Recargando imágenes`);
    await loadBotImages(botId);
}

/**
 * Get bot session status
 */
function getBotStatus(botId) {
    const session = activeSessions.get(botId);
    if (!session) return 'DISCONNECTED';
    
    if (session.isPaused) return 'DISABLED';
    if (!session.isReady) return 'STARTING';
    return 'CONNECTED';
}

/**
 * Check if bot is connected and ready
 */
function isBotReady(botId) {
    const session = activeSessions.get(botId);
    return !!(session && session.isReady && !session.isPaused);
}

/**
 * Disconnect and remove bot session
 */
async function disconnectBot(botId) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket) return;
    
    try {
        const { Boom } = await loadBaileys();
        await session.socket.end(new Boom('Bot disconnected by user'));
        console.log(`[${botId}] 🔌 Sesión Baileys desconectada`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error desconectando sesión:`, error);
    } finally {
        activeSessions.delete(botId);
    }
}

module.exports = {
    initializeBaileysConnection,
    sendMessage,
    sendImage,
    setBotStatus,
    refreshBotImages,
    getBotStatus,
    isBotReady,
    disconnectBot,
    loadBaileys
};