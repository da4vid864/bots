// services/botConfigService.js
const pool = require('./db');

/**
 * Inicializar tabla de configuración de funcionalidades
 */
async function initBotFeaturesTable() {
    const createBotFeaturesTable = `
    CREATE TABLE IF NOT EXISTS bot_features (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL UNIQUE,
        scheduling_enabled BOOLEAN DEFAULT FALSE,
        auto_response_enabled BOOLEAN DEFAULT TRUE,
        lead_capture_enabled BOOLEAN DEFAULT TRUE,
        working_hours_enabled BOOLEAN DEFAULT FALSE,
        working_hours_start TEXT DEFAULT '09:00',
        working_hours_end TEXT DEFAULT '18:00',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    try {
        await pool.query(createBotFeaturesTable);
        console.log('✅ Tabla bot_features inicializada');
    } catch (error) {
        console.error('❌ Error creando tabla bot_features:', error);
    }
}

// Inicializar al cargar el módulo
initBotFeaturesTable();

/**
 * Obtener las funcionalidades de un bot (crea registro si no existe)
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
 * Actualizar una funcionalidad específica de un bot
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
 * Actualizar múltiples funcionalidades a la vez
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
 * Crear registro de features cuando se crea un bot
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
 * Eliminar funcionalidades de un bot
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