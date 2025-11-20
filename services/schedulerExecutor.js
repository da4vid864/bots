// services/schedulerExecutor.js
const schedulerService = require('./schedulerService');

let executorInterval = null;
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

    console.log('✅ Ejecutor de tareas programadas iniciado');
    
    // Ejecutar inmediatamente la primera vez
    checkAndExecutePendingTasks();
}

/**
 * Detener el ejecutor
 */
function stopSchedulerExecutor() {
    if (executorInterval) {
        clearInterval(executorInterval);
        executorInterval = null;
        console.log('🛑 Ejecutor de tareas programadas detenido');
    }
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

module.exports = {
    startSchedulerExecutor,
    stopSchedulerExecutor,
    checkAndExecutePendingTasks
};