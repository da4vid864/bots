// services/schedulerExecutor.js
const schedulerService = require('./schedulerService');
const db = require('./db');

let executorInterval = null;
let cleanupInterval = null;
let onActionCallback = null;

/**
 * Iniciar el ejecutor de tareas programadas
 * @param {Function} callback - Función que se ejecutará cuando haya una acción (enable/disable)
 */
function startSchedulerExecutor(callback) {
    if (executorInterval) {
        console.log('⚠️ El ejecutor de tareas ya está en funcionamiento');
        return;
    }

    onActionCallback = callback;

    // Revisar cada 30 segundos si hay tareas que ejecutar
    executorInterval = setInterval(() => {
        checkAndExecutePendingTasks();
    }, 30000); // 30 segundos

    // Revisar cada 24 horas limpieza de datos (Data Minimization)
    cleanupInterval = setInterval(() => {
        runDataMinimization();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('✅ Ejecutor de tareas programadas iniciado');
    
    // Ejecutar inmediatamente la primera vez
    checkAndExecutePendingTasks();
    
    // Run data minimization on startup (non-blocking)
    runDataMinimization().catch(err => console.error('Initial data minimization error:', err));
}

/**
 * Detener el ejecutor
 */
function stopSchedulerExecutor() {
    if (executorInterval) {
        clearInterval(executorInterval);
        executorInterval = null;
    }
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
    console.log('🛑 Ejecutor de tareas programadas detenido');
}

/**
 * Revisar y ejecutar tareas pendientes
 */
async function checkAndExecutePendingTasks() {
    try {
        const pendingTasks = await schedulerService.getPendingSchedules();

        if (pendingTasks.length > 0) {
            console.log(`📅 Encontradas ${pendingTasks.length} tarea(s) pendiente(s) para ejecutar`);
        }

        for (const task of pendingTasks) {
            try {
                console.log(`⚡ Ejecutando tarea programada: ${task.action} para bot ${task.bot_id}`);
                
                // Ejecutar la acción a través del callback
                if (onActionCallback) {
                    await onActionCallback(task.bot_id, task.action);
                }

                // Marcar como ejecutada
                await schedulerService.markScheduleAsExecuted(task.id);
                
                console.log(`✅ Tarea ${task.id} ejecutada exitosamente`);
            } catch (error) {
                console.error(`❌ Error ejecutando tarea ${task.id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Error en checkAndExecutePendingTasks:', error);
    }
}

/**
 * Ejecutar minimización de datos (Compliance)
 * Elimina mensajes de leads antiguos.
 * Default: > 90 días
 */
async function runDataMinimization() {
    console.log('🧹 Ejecutando Data Minimization (Compliance Cleanup)...');
    try {
        // En una implementación multi-tenant real, deberíamos iterar por tenants
        // o ejecutar una query que respete configuraciones por tenant.
        // Por simplicidad en este MVP, borramos globalmente mensajes viejos.
        // Si hay una configuración específica por tenant, se debería consultar `tenants.settings`.

        // Default retention: 90 days
        const retentionDays = 90;
        
        const result = await db.query(`
            DELETE FROM lead_messages 
            WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
        `);

        if (result.rowCount > 0) {
            console.log(`🧹 Data Minimization: Eliminados ${result.rowCount} mensajes antiguos.`);
        } else {
            console.log('🧹 Data Minimization: No se encontraron mensajes antiguos para eliminar.');
        }

        // También podríamos eliminar leads 'capturing' que no han tenido actividad en X tiempo
        const staleLeadResult = await db.query(`
            DELETE FROM leads 
            WHERE status = 'capturing' 
            AND last_message_at < NOW() - INTERVAL '180 days'
        `);
        
        if (staleLeadResult.rowCount > 0) {
             console.log(`🧹 Data Minimization: Eliminados ${staleLeadResult.rowCount} leads inactivos.`);
        }

    } catch (error) {
        console.error('❌ Error en runDataMinimization:', error);
    }
}

module.exports = {
    startSchedulerExecutor,
    stopSchedulerExecutor,
    checkAndExecutePendingTasks,
    runDataMinimization
};