// services/baileysManager.js
let baileys;
let Boom;
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const axios = require('axios');

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

const { getChatReply, detectUserIntent } = require('./deepseekService');
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
} = require('./leadDbService');

/**
 * In-memory Map for active sessions.
 * @type {Map<string, any>}
 */
const activeSessions = new Map();

/**
 * Initialize Baileys connection for a bot.
 */
async function initializeBaileysConnection(botConfig, onStatusUpdate) {
    const { id: botId, name: botName } = botConfig;

    console.log(`[${botId}] 🔍 Inicializando conexión Baileys para: ${botName}`);

    try {
        const { baileys } = await loadBaileys();
        const {
            makeWASocket,
            useMultiFileAuthState,
            DisconnectReason,
            fetchLatestBaileysVersion,
            makeCacheableSignalKeyStore,
        } = baileys;

        const authDir = path.join(__dirname, '..', 'auth-sessions', botId);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`[${botId}] 📦 Usando Baileys v${version.join('.')}, latest: ${isLatest}`);

        const logger = pino({ level: 'silent' });

        const socket = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        activeSessions.set(botId, {
            socket,
            botConfig,
            isReady: false,
            isPaused: botConfig.status === 'disabled',
            availableImages: [],
            availableProducts: [],
            saveCreds,
        });

        await loadBotImages(botId);
        await loadBotProducts(botId);

        setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason);

        return socket;
    } catch (error) {
        console.error(`[${botId}] ❌ Error inicializando Baileys:`, error);
        throw error;
    }
}

function setupEventHandlers(botId, socket, saveCreds, onStatusUpdate, DisconnectReason) {
    const session = activeSessions.get(botId);
    if (!session) return;

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log(`[${botId}] 🔌 Estado de conexión:`, connection);

        if (qr) {
            try {
                const qrCodeUrl = await QRCode.toDataURL(qr);
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
                botId,
            });

            onStatusUpdate('CONNECTED', {
                status: session.isPaused ? 'disabled' : 'enabled',
                runtimeStatus: statusReport,
            });

            if (!session.isPaused) {
                console.log(`[${botId}] 🔍 Cargando historial existente...`);
                loadExistingChats(botId);
            }
        } else if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(
                `[${botId}] ❌ Conexión cerrada. Reconectar: ${shouldReconnect}`,
                lastDisconnect?.error
            );

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

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (messageUpdate) => {
        if (!session.isReady || session.isPaused) return;

        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        for (const msg of messages) {
            await handleIncomingMessage(botId, msg);
        }
    });
}

async function handleIncomingMessage(botId, msg) {
    const session = activeSessions.get(botId);
    if (!session || !session.isReady || session.isPaused) return;

    if (!msg.message || msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) return;

    const senderId = msg.key.remoteJid;
    const userMessage = getMessageContent(msg.message);

    if (!userMessage) return;

    console.log(`[${botId}] 📩 Mensaje de ${senderId}: ${userMessage}`);

    try {
        let lead = await getOrCreateLead(botId, senderId);
        if (!lead || !lead.id) return;

        await addLeadMessage(lead.id, 'user', userMessage);

        // === SCORING & AUTOMATION START ===
        let skipAiGeneration = false;

        // === INTENT DETECTION START ===
        try {
            const isImageIntent = await detectUserIntent(userMessage);
            if (isImageIntent) {
                console.log(`[${botId}] [Intent] Usuario pidió imagen.`);

                const msgLower = userMessage.toLowerCase();

                // 1) Preferir PRODUCTOS si hay (para “foto de la pluma” normalmente es un producto)
                let matchedProduct = null;
                if (session.availableProducts && session.availableProducts.length > 0) {
                    matchedProduct = session.availableProducts.find((p) => {
                        const name = (p.name || '').toLowerCase();
                        const sku = (p.sku || '').toLowerCase();
                        const desc = (p.description || '').toLowerCase();
                        const tags = Array.isArray(p.tags)
                            ? p.tags.join(' ').toLowerCase()
                            : (p.tags || '').toLowerCase();

                        const msgWords = msgLower.split(/\s+/).filter(Boolean);

                        return (
                            (sku && msgLower.includes(sku)) ||
                            (name && msgLower.includes(name)) ||
                            (tags && tags.split(/\s+/).some((t) => t && msgLower.includes(t))) ||
                            (desc &&
                                desc.length > 0 &&
                                msgWords.some((w) => w.length >= 4 && desc.includes(w)))
                        );
                    });

                    // fallback suave: si hay productos y no matcheó, usa el primero
                    if (!matchedProduct) matchedProduct = session.availableProducts[0];
                }

                if (matchedProduct?.image_url) {
                    const caption =
                        `*${matchedProduct.name}*\n` +
                        `${matchedProduct.description ? matchedProduct.description + '\n\n' : '\n'}` +
                        `💰 Precio: ${matchedProduct.price} ${matchedProduct.currency}\n` +
                        `📦 Stock: ${matchedProduct.stock_status || 'in_stock'}`;

                    await sendImageUrl(botId, senderId, matchedProduct.image_url, caption);
                    await addLeadMessage(
                        lead.id,
                        'bot',
                        `[Imagen de producto enviada: ${matchedProduct.sku || matchedProduct.name}]`
                    );
                    skipAiGeneration = true;
                } else {
                    // 2) Si no hay imagen de producto, intentar imágenes del banco (availableImages)
                    let imageMedia = null;
                    const caption = '¡Aquí tienes una imagen! 📸';

                    if (session.availableImages && session.availableImages.length > 0) {
                        const matchedImage = session.availableImages.find((img) =>
                            msgLower.includes((img.keyword || '').toLowerCase())
                        );
                        const imageToUse = matchedImage || session.availableImages[0];

                        if (imageToUse) {
                            imageMedia = await botImageService.getImageMedia(imageToUse.keyword, botId);
                            if (imageMedia) imageMedia.caption = caption;
                        }
                    }

                    if (imageMedia) {
                        await sendImage(botId, senderId, imageMedia);
                        await addLeadMessage(lead.id, 'bot', `[Imagen enviada: ${caption}]`);
                        skipAiGeneration = true;
                    } else {
                        // 3) No inventar URL como texto
                        const noImgMsg =
                            'Puedo enviarte fotos, pero por ahora no tengo una imagen disponible para esa opción. ' +
                            '¿Qué modelo te interesa (o cuál SKU) para enviarte la foto exacta?';
                        await sendMessage(botId, senderId, noImgMsg);
                        await addLeadMessage(lead.id, 'bot', noImgMsg);
                        skipAiGeneration = true;
                    }
                }
            }
        } catch (intentError) {
            console.error(`[${botId}] ⚠️ Error in intent detection:`, intentError);
        }
        // === INTENT DETECTION END ===

        try {
            const evaluation = await scoringService.evaluateMessage(botId, userMessage);

            if (evaluation.scoreDelta !== 0 || evaluation.tags.length > 0) {
                lead = await scoringService.applyScoring(lead.id, evaluation);
                console.log(
                    `[${botId}] 🎯 Scoring aplicado: ${evaluation.scoreDelta} pts, Tags: ${evaluation.tags.join(', ')}`
                );
            }

            if (evaluation.responses && evaluation.responses.length > 0) {
                for (const responseText of evaluation.responses) {
                    await sendMessage(botId, senderId, responseText);
                    await addLeadMessage(lead.id, 'bot', responseText);
                }
                skipAiGeneration = true;
                console.log(`[${botId}] 🤖 Respuesta automática enviada, saltando IA.`);
            }

            if (lead.score >= 50 && lead.status === 'capturing') {
                lead = await qualifyLead(lead.id);
                const qualMsg =
                    '¡Felicidades! Has calificado para atención prioritaria. Un asesor revisará tu caso pronto.';
                await sendMessage(botId, senderId, qualMsg);
                await addLeadMessage(lead.id, 'bot', qualMsg);

                const botOwnerEmail = session.botConfig.ownerEmail;
                sseController.sendEventToUser(botOwnerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                return;
            }
        } catch (scoringError) {
            console.error(`[${botId}] ❌ Error en scoring:`, scoringError);
        }
        // === SCORING & AUTOMATION END ===

        if (lead.status === 'assigned') {
            const botOwnerEmail = session.botConfig.ownerEmail;
            sseController.sendEventToUser(botOwnerEmail, 'NEW_MESSAGE_FOR_SALES', {
                leadId: lead.id,
                from: senderId,
                message: userMessage,
                botId,
            });
            return;
        }

        if (lead.status === 'capturing' && !skipAiGeneration) {
            const extractedInfo = await extractLeadInfo(userMessage);
            if (Object.keys(extractedInfo).length > 0) {
                lead = await updateLeadInfo(lead.id, extractedInfo);
            }

            if (isLeadComplete(lead)) {
                lead = await qualifyLead(lead.id);
                const finalMsg = '¡Perfecto! Ya tengo toda tu información. Un asesor te contactará pronto. 🎉';
                await sendMessage(botId, senderId, finalMsg);
                await addLeadMessage(lead.id, 'bot', finalMsg);

                const botOwnerEmail = session.botConfig.ownerEmail;
                sseController.sendEventToUser(botOwnerEmail, 'NEW_QUALIFIED_LEAD', { lead, botId });
                return;
            }

            const followUpQuestion = await generateFollowUpQuestion(lead);
            let promptWithContext = session.botConfig.prompt;

            if (session.availableImages.length > 0) {
                const keywords = session.availableImages.map((img) => img.keyword).join(', ');
                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE IMÁGENES]:
                Tienes acceso a imágenes visuales sobre los siguientes temas: [${keywords}].
                Si el usuario pregunta explícitamente por alguno de estos temas o si crees que una imagen ayudaría a vender mejor,
                DEBES incluir la etiqueta [ENVIAR_IMAGEN: palabra_clave] al final de tu respuesta.`;
            }

            if (session.availableProducts && session.availableProducts.length > 0) {
                const productList = session.availableProducts
                    .map((p) => `[SKU: ${p.sku}] ${p.name} - ${p.price} ${p.currency}`)
                    .join('\n');

                promptWithContext += `\n\n[INSTRUCCIÓN DEL SISTEMA DE PRODUCTOS]:
                Tienes acceso a los siguientes productos:
                ${productList}

                Si el usuario pregunta por uno de estos productos o muestra interés claro, usa la etiqueta $$ SEND_PRODUCT: SKU $$ para enviarlo.
                No inventes productos que no estén en la lista.`;
            }

            const messages = await getLeadMessages(lead.id, 20);
            const historyMessages = messages.slice(0, -1);

            const history = historyMessages.map((m) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.message,
            }));

            const aiResponse = await getChatReply(userMessage, history, promptWithContext);
            let botReply = followUpQuestion ? `${aiResponse}\n\n${followUpQuestion}` : aiResponse;

            // Image tag handling
            const imageTagRegex = /
$$
ENVIAR_IMAGEN:\s*([^
$$]+)\]/i;
            const match = botReply.match(imageTagRegex);
            let imageMedia = null;

            if (match) {
                const keyword = match[1].trim().toLowerCase();
                console.log(`[${botId}] 🖼️ IA solicitó imagen con keyword: "${keyword}"`);

                imageMedia = await botImageService.getImageMedia(keyword, botId);
                botReply = botReply.replace(match[0], '').trim();
            }

            // Product tag handling
            const productTagRegex = /\$\$\s*SEND_PRODUCT:\s*([\w-]+)\s*\$\$/i;
            const productMatch = botReply.match(productTagRegex);
            let productToSend = null;

            if (productMatch) {
                const sku = productMatch[1].trim();
                console.log(`[${botId}] 🛍️ IA solicitó producto con SKU: "${sku}"`);

                productToSend = session.availableProducts.find((p) => p.sku === sku);
                botReply = botReply.replace(productMatch[0], '').trim();
            }

            if (botReply) {
                await sendMessage(botId, senderId, botReply);
                await addLeadMessage(lead.id, 'bot', botReply);
            }

            if (imageMedia) {
                try {
                    await sendImage(botId, senderId, imageMedia);
                    await addLeadMessage(lead.id, 'bot', `[Imagen enviada: ${imageMedia.caption}]`);
                } catch (imgError) {
                    console.error(`[${botId}] ❌ Error enviando imagen:`, imgError);
                }
            }

            if (productToSend) {
                try {
                    const caption =
                        `*${productToSend.name}*\n\n` +
                        `${productToSend.description || ''}\n\n` +
                        `💰 Precio: ${productToSend.price} ${productToSend.currency}`;

                    if (productToSend.image_url) {
                        await sendImageUrl(botId, senderId, productToSend.image_url, caption);
                    } else {
                        await sendMessage(botId, senderId, caption);
                    }

                    await addLeadMessage(lead.id, 'bot', `[Producto enviado: ${productToSend.sku}]`);

                    await scoringService.applyScoring(lead.id, {
                        scoreDelta: 10,
                        tags: ['interested_in_product', `product_${productToSend.sku}`],
                        responses: [],
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

function getMessageContent(message) {
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    return null;
}

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

async function loadExistingChats(botId) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket) return;

    try {
        const chats = await session.socket.groupFetchAllParticipating();
        console.log(`[${botId}] 📚 Cargados ${Object.keys(chats).length} chats existentes`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error cargando chats existentes:`, error);
    }
}

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

async function sendImage(botId, to, mediaObject) {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo para enviar imágenes`);
    }

    try {
        await session.socket.sendMessage(to, mediaObject);
        console.log(`[${botId}] ✅ Imagen enviada a ${to}`);
    } catch (error) {
        console.error(`[${botId}] ❌ Error enviando imagen:`, error);
        throw error;
    }
}

/**
 * ✅ NUEVO: Enviar imagen REAL por URL, con fallback a Buffer
 */
async function sendImageUrl(botId, to, imageUrl, caption = '') {
    const session = activeSessions.get(botId);
    if (!session || !session.socket || !session.isReady) {
        throw new Error(`Bot ${botId} no está listo para enviar imágenes`);
    }

    try {
        await session.socket.sendMessage(to, {
            image: { url: imageUrl },
            caption,
        });
        console.log(`[${botId}] ✅ Imagen(URL) enviada a ${to}`);
        return;
    } catch (err) {
        console.warn(`[${botId}] ⚠️ Falló envío por URL, intentando Buffer...`, err?.message);
    }

    const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);

    await session.socket.sendMessage(to, {
        image: buffer,
        caption,
    });
    console.log(`[${botId}] ✅ Imagen(Buffer) enviada a ${to}`);
}

function setBotStatus(botId, status) {
    const session = activeSessions.get(botId);
    if (!session) return;

    session.isPaused = status === 'disabled';

    console.log(`[${botId}] ${session.isPaused ? '⏸️ Bot PAUSADO' : '▶️ Bot REANUDADO'}`);

    const botOwnerEmail = session.botConfig.ownerEmail;
    sseController.sendEventToUser(botOwnerEmail, 'UPDATE_BOT', {
        status,
        runtimeStatus: session.isPaused ? 'DISABLED' : 'CONNECTED',
        botId,
    });
}

async function refreshBotImages(botId) {
    console.log(`[${botId}] 🔄 Recargando imágenes`);
    await loadBotImages(botId);
}

function getBotStatus(botId) {
    const session = activeSessions.get(botId);
    if (!session) return 'DISCONNECTED';

    if (session.isPaused) return 'DISABLED';
    if (!session.isReady) return 'STARTING';
    return 'CONNECTED';
}

function isBotReady(botId) {
    const session = activeSessions.get(botId);
    return !!(session && session.isReady && !session.isPaused);
}

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
    sendImageUrl,
    setBotStatus,
    refreshBotImages,
    getBotStatus,
    isBotReady,
    disconnectBot,
    loadBaileys,
};