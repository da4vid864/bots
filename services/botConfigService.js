// services/botConfigService.js
const pool = require('./db');

/**
 * @typedef {Object} BotFeatures
 * @property {string} bot_id - The unique identifier of the bot.
 * @property {boolean} scheduling_enabled - Whether scheduling functionality is enabled.
 * @property {boolean} auto_response_enabled - Whether automated responses are enabled.
 * @property {boolean} lead_capture_enabled - Whether lead capture functionality is enabled.
 * @property {boolean} working_hours_enabled - Whether working hours restrictions are enabled.
 * @property {string} working_hours_start - Start time of working hours (e.g., '09:00').
 * @property {string} working_hours_end - End time of working hours (e.g., '18:00').
 * @property {Date} [updated_at] - Timestamp of the last update.
 */

/**
 * Retrieves the features configuration for a specific bot.
 * Creates a default configuration if one does not exist.
 * 
 * @param {string} botId - The unique identifier of the bot.
 * @returns {Promise<BotFeatures>} The bot features configuration.
 */
async function getBotFeatures(botId) {
    try {
        let result = await pool.query(
            'SELECT * FROM bot_features WHERE bot_id = $1',
            [botId]
        );
        
        if (result.rows.length === 0) {
            // Crear registro con valores por defecto
            await pool.query(
                'INSERT INTO bot_features (bot_id) VALUES ($1)',
                [botId]
            );
            
            result = await pool.query(
                'SELECT * FROM bot_features WHERE bot_id = $1',
                [botId]
            );
        }
        
        return result.rows[0];
    } catch (error) {
        console.error(`Error obteniendo features para bot ${botId}:`, error);
        
        // Retornar valores por defecto en caso de error
        return {
            bot_id: botId,
            scheduling_enabled: false,
            auto_response_enabled: true,
            lead_capture_enabled: true,
            working_hours_enabled: false,
            working_hours_start: '09:00',
            working_hours_end: '18:00'
        };
    }
}

/**
 * Updates a specific feature configuration for a bot.
 * 
 * @param {string} botId - The unique identifier of the bot.
 * @param {string} featureName - The name of the feature to update.
 * @param {boolean|string} value - The new value for the feature.
 * @returns {Promise<BotFeatures>} The updated bot features configuration.
 * @throws {Error} If the feature name is invalid or the update fails.
 */
async function updateBotFeature(botId, featureName, value) {
    const validFeatures = [
        'scheduling_enabled',
        'auto_response_enabled', 
        'lead_capture_enabled',
        'working_hours_enabled',
        'working_hours_start',
        'working_hours_end'
    ];
    
    if (!validFeatures.includes(featureName)) {
        throw new Error(`Funcionalidad inválida: ${featureName}`);
    }

    try {
        // Asegurarse de que exista el registro
        const existing = await pool.query(
            'SELECT * FROM bot_features WHERE bot_id = $1',
            [botId]
        );
        
        if (existing.rows.length === 0) {
            await pool.query(
                'INSERT INTO bot_features (bot_id) VALUES ($1)',
                [botId]
            );
        }
        
        // Actualizar la funcionalidad
        const query = `
            UPDATE bot_features 
            SET ${featureName} = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE bot_id = $2
        `;
        await pool.query(query, [value, botId]);
        
        return await getBotFeatures(botId);
    } catch (error) {
        console.error(`Error actualizando feature ${featureName} para bot ${botId}:`, error);
        throw error;
    }
}

/**
 * Updates multiple features for a bot simultaneously.
 * 
 * @param {string} botId - The unique identifier of the bot.
 * @param {Object} features - Object containing the features to update.
 * @param {boolean} [features.schedulingEnabled] - Enable/disable scheduling.
 * @param {boolean} [features.autoResponseEnabled] - Enable/disable auto-response.
 * @param {boolean} [features.leadCaptureEnabled] - Enable/disable lead capture.
 * @param {boolean} [features.workingHoursEnabled] - Enable/disable working hours.
 * @param {string} [features.workingHoursStart] - Working hours start time.
 * @param {string} [features.workingHoursEnd] - Working hours end time.
 * @returns {Promise<BotFeatures>} The updated bot features configuration.
 * @throws {Error} If the update fails.
 */
async function updateBotFeatures(botId, features) {
    try {
        // Asegurarse de que exista el registro
        const existing = await pool.query(
            'SELECT * FROM bot_features WHERE bot_id = $1',
            [botId]
        );
        
        if (existing.rows.length === 0) {
            await pool.query(
                'INSERT INTO bot_features (bot_id) VALUES ($1)',
                [botId]
            );
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        const validFeatures = {
            scheduling_enabled: 'BOOLEAN',
            auto_response_enabled: 'BOOLEAN',
            lead_capture_enabled: 'BOOLEAN',
            working_hours_enabled: 'BOOLEAN',
            working_hours_start: 'TEXT',
            working_hours_end: 'TEXT'
        };
        
        // Convertir camelCase a snake_case para las claves
        const featureMap = {
            schedulingEnabled: 'scheduling_enabled',
            autoResponseEnabled: 'auto_response_enabled',
            leadCaptureEnabled: 'lead_capture_enabled',
            workingHoursEnabled: 'working_hours_enabled',
            workingHoursStart: 'working_hours_start',
            workingHoursEnd: 'working_hours_end'
        };
        
        for (const [key, value] of Object.entries(features)) {
            const dbKey = featureMap[key] || key;
            
            if (validFeatures[dbKey]) {
                updates.push(`${dbKey} = $${paramCount++}`);
                values.push(value);
            }
        }
        
        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(botId);
            
            const query = `
                UPDATE bot_features 
                SET ${updates.join(', ')} 
                WHERE bot_id = $${paramCount}
            `;
            await pool.query(query, values);
        }
        
        return await getBotFeatures(botId);
    } catch (error) {
        console.error(`Error actualizando features para bot ${botId}:`, error);
        throw error;
    }
}

/**
 * Creates initial feature configuration for a new bot.
 * If configuration already exists, does nothing.
 * 
 * @param {string} botId - The unique identifier of the bot.
 * @returns {Promise<BotFeatures>} The bot features configuration.
 */
async function createBotFeatures(botId) {
    try {
        await pool.query(
            'INSERT INTO bot_features (bot_id) VALUES ($1) ON CONFLICT (bot_id) DO NOTHING',
            [botId]
        );
        
        return await getBotFeatures(botId);
    } catch (error) {
        console.error(`Error creando features iniciales para bot ${botId}:`, error);
        return await getBotFeatures(botId);
    }
}

/**
 * Deletes the feature configuration for a bot.
 * 
 * @param {string} botId - The unique identifier of the bot.
 * @returns {Promise<void>}
 */
async function deleteBotFeatures(botId) {
    try {
        await pool.query(
            'DELETE FROM bot_features WHERE bot_id = $1',
            [botId]
        );
        console.log(`✅ Features del bot ${botId} eliminadas`);
    } catch (error) {
        console.error(`Error eliminando features del bot ${botId}:`, error);
    }
}

module.exports = {
    getBotFeatures,
    updateBotFeature,
    updateBotFeatures,
    createBotFeatures,
    deleteBotFeatures
};