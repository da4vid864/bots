// services/botDbService.js
import { pool } from './db.js';

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
        createdAt: bot.created_at,
        tenantId: bot.tenant_id // Expose tenant_id if needed for debugging
    };
}

/**
 * Inicializar tabla de bots
 * (Deprecated: Managed by migrations)
 */
async function initBotTable() {
    // Logic moved to migration files
}

/**
 * Añade la configuración de un nuevo bot a la base de datos.
 * (RLS Protected: Will insert with current tenant_id automatically if policy allows, 
 * OR we must supply it if policy requires explicit check against session var)
 */
async function addBot(botConfig) {
    const { id, name, port, prompt, ownerEmail } = botConfig;
    // Use parameterized query with current_setting for tenant isolation
    // Note: current_setting() must be used in the query, not as a parameter
    
    const query = `
        INSERT INTO bots (id, name, port, prompt, status, owner_email, tenant_id) 
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE(current_setting('app.current_tenant', true), '')::uuid)
    `;
    try {
        await pool.query(query, [id, name, port, prompt, 'enabled', ownerEmail]);
    } catch (error) {
        // If tenant_id is still empty UUID, throw a more meaningful error
        if (error.code === '22P02' && error.message.includes('invalid input syntax for type uuid')) {
            throw new Error(`Tenant context not set. User must be authenticated with a valid tenant.`);
        }
        throw error;
    }
}

/**
 * Actualiza el estado de un bot
 * (RLS Protected: Only updates if row belongs to tenant)
 */
async function updateBotStatus(id, status) {
    const query = 'UPDATE bots SET status = $1 WHERE id = $2';
    await pool.query(query, [status, id]);
}

/**
 * Actualiza el prompt de un bot
 * (RLS Protected)
 */
async function updateBotPrompt(id, prompt) {
    const query = 'UPDATE bots SET prompt = $1 WHERE id = $2';
    await pool.query(query, [prompt, id]);
}

/**
 * Obtiene un bot por ID
 * (RLS Protected: Returns null if bot belongs to another tenant)
 */
async function getBotById(id) {
    const query = 'SELECT * FROM bots WHERE id = $1';
    const result = await pool.query(query, [id]);
    return normalizeBotData(result.rows[0]);
}

/**
 * Obtiene un bot por ID y owner
 * (RLS Protected + Owner check)
 */
async function getBotByIdAndOwner(id, ownerEmail) {
    const query = 'SELECT * FROM bots WHERE id = $1 AND owner_email = $2';
    const result = await pool.query(query, [id, ownerEmail]);
    return normalizeBotData(result.rows[0]);
}

/**
 * Obtiene todos los bots
 * (RLS Protected: Only returns bots for the current tenant)
 */
async function getAllBots() {
    const query = 'SELECT * FROM bots ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows.map(bot => normalizeBotData(bot));
}

/**
 * Obtiene bots por owner
 * (RLS Protected)
 */
async function getBotsByOwner(ownerEmail) {
    const query = 'SELECT * FROM bots WHERE owner_email = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [ownerEmail]);
    return result.rows.map(bot => normalizeBotData(bot));
}

/**
 * Obtiene el último puerto usado globalmente (Bypassing RLS)
 */
async function getLastPort() {
    // Uses the SECURITY DEFINER function to see all ports
    const query = 'SELECT get_max_port_system() as max_port';
    const result = await pool.query(query);
    return result.rows[0]?.max_port || 3000;
}

/**
 * Elimina un bot
 * (RLS Protected)
 */
async function deleteBotById(id) {
    const query = 'DELETE FROM bots WHERE id = $1';
    await pool.query(query, [id]);
}

export {
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

export default {
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