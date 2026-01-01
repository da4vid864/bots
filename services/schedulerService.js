// services/schedulerService.js
import { pool } from './db.js';
import botConfigService from './botConfigService.js';

/**
 * Crear una nueva tarea programada
 */
async function createSchedule(botId, action, scheduledAt, createdBy) {
    try {
        const result = await pool.query(
            'INSERT INTO schedules (bot_id, action, scheduled_at, created_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [botId, action, scheduledAt, createdBy, 'pending']
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creando schedule:', error);
        throw error;
    }
}

/**
 * Obtener todas las tareas pendientes que deben ejecutarse
 */
async function getPendingSchedules() {
    try {
        const result = await pool.query(`
            SELECT * FROM schedules 
            WHERE status = 'pending' 
            AND executed = FALSE 
            AND scheduled_at <= NOW()
            ORDER BY scheduled_at ASC
        `);
        
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo schedules pendientes:', error);
        return [];
    }
}

/**
 * Marcar una tarea como ejecutada
 */
async function markScheduleAsExecuted(scheduleId) {
    try {
        await pool.query(
            'UPDATE schedules SET executed = TRUE, executed_at = NOW(), status = $1 WHERE id = $2',
            ['completed', scheduleId]
        );
    } catch (error) {
        console.error(`Error marcando schedule ${scheduleId} como ejecutado:`, error);
    }
}

/**
 * Cancelar una tarea programada
 */
async function cancelSchedule(scheduleId) {
    try {
        await pool.query(
            'UPDATE schedules SET status = $1 WHERE id = $2',
            ['cancelled', scheduleId]
        );
    } catch (error) {
        console.error(`Error cancelando schedule ${scheduleId}:`, error);
    }
}

/**
 * Obtener todas las tareas de un bot específico
 */
async function getSchedulesByBot(botId) {
    try {
        const result = await pool.query(
            'SELECT * FROM schedules WHERE bot_id = $1 ORDER BY scheduled_at DESC',
            [botId]
        );
        
        return result.rows;
    } catch (error) {
        console.error(`Error obteniendo schedules del bot ${botId}:`, error);
        return [];
    }
}

/**
 * Obtener tareas pendientes de un bot específico
 */
async function getPendingSchedulesByBot(botId) {
    try {
        const result = await pool.query(`
            SELECT * FROM schedules 
            WHERE bot_id = $1 
            AND status = 'pending' 
            AND executed = FALSE 
            ORDER BY scheduled_at ASC
        `, [botId]);
        
        return result.rows;
    } catch (error) {
        console.error(`Error obteniendo schedules pendientes del bot ${botId}:`, error);
        return [];
    }
}

/**
 * Eliminar tareas de un bot eliminado
 */
async function deleteSchedulesByBot(botId) {
    try {
        await pool.query(
            'DELETE FROM schedules WHERE bot_id = $1',
            [botId]
        );
        
        console.log(`✅ Schedules del bot ${botId} eliminados`);
    } catch (error) {
        console.error(`Error eliminando schedules del bot ${botId}:`, error);
    }
}

/**
 * Verificar si el agendamiento está habilitado para un bot
 */
async function isSchedulingEnabled(botId) {
    try {
        const features = await botConfigService.getBotFeatures(botId);
        return features.scheduling_enabled === true;
    } catch (error) {
        console.error(`Error verificando scheduling para bot ${botId}:`, error);
        return false;
    }
}

export {
    createSchedule,
    getPendingSchedules,
    markScheduleAsExecuted,
    cancelSchedule,
    getSchedulesByBot,
    getPendingSchedulesByBot,
    deleteSchedulesByBot,
    isSchedulingEnabled
};

export default {
    createSchedule,
    getPendingSchedules,
    markScheduleAsExecuted,
    cancelSchedule,
    getSchedulesByBot,
    getPendingSchedulesByBot,
    deleteSchedulesByBot,
    isSchedulingEnabled
};