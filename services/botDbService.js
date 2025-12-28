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
    // We assume the DB wrapper injects the tenant context.
    // The INSERT trigger or RLS policy might require tenant_id to be set explicitly in the query 
    // to match the session variable, or use DEFAULT.
    // Given our migration:
    // "ALTER TABLE bots ADD COLUMN tenant_id UUID REFERENCES tenants(id);"
    // "CREATE POLICY tenant_insert_policy ... WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)"
    // Postgres RLS for INSERT usually requires the row being inserted to have the column set to the value 
    // that satisfies the policy.
    // So we should add `current_setting(...)` to the values list.
    
    const query = `
        INSERT INTO bots (id, name, port, prompt, status, owner_email, tenant_id) 
        VALUES ($1, $2, $3, $4, $5, $6, current_setting('app.current_tenant')::uuid)
    `;
    await pool.query(query, [id, name, port, prompt, 'enabled', ownerEmail]);
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