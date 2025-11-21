// services/botDbService.js
const pool = require('./db');

/**
 * Normalizar bot object para el frontend
 */
function normalizeBotData(bot) {
    if (!bot) return null;
    
    return {
        id: bot.id,
        name: bot.name,
        port: bot.port,
        prompt: bot.prompt,
        status: bot.status,
        ownerEmail: bot.owner_email,  // Convertir a camelCase
        createdAt: bot.created_at
    };
}

/**
 * Inicializar tabla de bots
 */
async function initBotTable() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        port INTEGER UNIQUE NOT NULL,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'enabled',
        owner_email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('✅ Tabla bots inicializada');
    } catch (error) {
        console.error('❌ Error creando tabla bots:', error);
    }
}

/**
 * Añade la configuración de un nuevo bot a la base de datos.
 */
async function addBot(botConfig) {
    const { id, name, port, prompt, ownerEmail } = botConfig;
    const query = 'INSERT INTO bots (id, name, port, prompt, status, owner_email) VALUES ($1, $2, $3, $4, $5, $6)';
    await pool.query(query, [id, name, port, prompt, 'enabled', ownerEmail]);
}

/**
 * Actualiza el estado de un bot
 */
async function updateBotStatus(id, status) {
    const query = 'UPDATE bots SET status = $1 WHERE id = $2';
    await pool.query(query, [status, id]);
}

/**
 * Actualiza el prompt de un bot
 */
async function updateBotPrompt(id, prompt) {
    const query = 'UPDATE bots SET prompt = $1 WHERE id = $2';
    await pool.query(query, [prompt, id]);
}

/**
 * Obtiene un bot por ID
 */
async function getBotById(id) {
    const query = 'SELECT * FROM bots WHERE id = $1';
    const result = await pool.query(query, [id]);
    return normalizeBotData(result.rows[0]);
}

/**
 * Obtiene un bot por ID y owner
 */
async function getBotByIdAndOwner(id, ownerEmail) {
    const query = 'SELECT * FROM bots WHERE id = $1 AND owner_email = $2';
    const result = await pool.query(query, [id, ownerEmail]);
    return normalizeBotData(result.rows[0]);
}

/**
 * Obtiene todos los bots
 */
async function getAllBots() {
    const query = 'SELECT * FROM bots ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows.map(bot => normalizeBotData(bot));
}

/**
 * Obtiene bots por owner
 */
async function getBotsByOwner(ownerEmail) {
    const query = 'SELECT * FROM bots WHERE owner_email = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [ownerEmail]);
    return result.rows.map(bot => normalizeBotData(bot));
}

/**
 * Obtiene el último puerto usado
 */
async function getLastPort() {
    const query = 'SELECT MAX(port) as max_port FROM bots';
    const result = await pool.query(query);
    return result.rows[0]?.max_port || 3000;
}

/**
 * Elimina un bot
 */
async function deleteBotById(id) {
    const query = 'DELETE FROM bots WHERE id = $1';
    await pool.query(query, [id]);
}

module.exports = {
    addBot,
    getBotById,
    getAllBots,
    getBotsByOwner,
    getBotByIdAndOwner,
    getLastPort,
    updateBotStatus,
    deleteBotById,
    updateBotPrompt
};