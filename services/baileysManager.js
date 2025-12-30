const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');
const pino = require('pino');
const { saveMessage } = require('./leadDbService');
const { extractLeadData } = require('./leadExtractionService');
const { addOrUpdateBot, getBotByJid, removeBot, getBotsByUserId } = require('./botDbService');
const logger = require('../utils/logger');

const bots = {}; // Almacena las instancias de los bots

const startBot = async (botConfig) => {
    const { bot_id, user_id } = botConfig;
    const sessionPath = path.join(__dirname, '..', 'sessions', bot_id.toString());
    
    logger.info({ bot_id }, "Starting bot...");

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Usar un logger compatible pero silenciado
        browser: ['BotInteligente', 'Chrome', '1.0.0']
    });

    bots[bot_id] = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            logger.info({ bot_id }, "QR Code available, please scan.");
            // TODO: Emitir QR al frontend vía SSE
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            logger.warn({ bot_id, error: lastDisconnect?.error }, `Connection closed. Reconnecting: ${shouldReconnect}`);

            delete bots[bot_id]; 

            if (shouldReconnect) {
                setTimeout(() => startBot(botConfig), 5000);
            } else {
                logger.info({ bot_id }, "Logged out. Cleaning session.");
                const fs = require('fs/promises');
                await fs.rm(sessionPath, { recursive: true, force: true }).catch(err => logger.error({err}, "Error cleaning session"));
                const botJid = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
                if(botJid) await removeBot(botJid).catch(err => logger.error({err}, "Error removing bot from DB"));
            }
        } else if (connection === 'open') {
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            logger.info({ bot_id, jid: botJid }, "Connection opened successfully.");
            bots[bot_id] = sock;
            await addOrUpdateBot({ bot_id: bot_id, user_id: user_id, jid: botJid, is_active: true });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        const botJid = sock.user?.id.split(':')[0] + '@s.whatsapp.net';
        if (!msg.key.fromMe && m.type === 'notify' && botJid) {
            try {
                logger.info({ bot_id, from: msg.key.remoteJid }, "Received message");
                const leadData = await extractLeadData(msg);
                await saveMessage(leadData, botJid);
            } catch (error) {
                logger.error({ bot_id, error: error.message }, "Error processing message");
            }
        }
    });

    return sock;
};

const sendMessage = async (botId, to, message) => {
    const sock = bots[botId];
    if (!sock || sock.ws.readyState !== 1) { // 1 = OPEN
        throw new Error(`Bot ${botId} not found or not connected.`);
    }
    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
    logger.info({ botId, to: jid }, 'Sending message from API');
    return await sock.sendMessage(jid, message);
};

const initializeBotsForUser = async (userId) => {
    logger.info({ userId }, "Initializing all bots for user");
    const userBots = await getBotsByUserId(userId);
    for (const bot of userBots) {
        if (bot.is_active) {
            await startBot({ bot_id: bot.bot_id, user_id: bot.user_id });
        }
    }
}

module.exports = {
    startBot,
    sendMessage,
    initializeBotsForUser,
    bots
};
