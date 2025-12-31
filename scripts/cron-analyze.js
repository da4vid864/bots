/**
 * Script de mantenimiento programado para análisis automático
 * Se ejecuta diariamente a las 2 AM
 */

const { exec } = require('child_process');
const cron = require('cron');
const bulkAnalysisService = require('../services/bulkAnalysisService');
const pool = require('../services/db');

console.log('⏰ Iniciando cron job de análisis automático...');

// Job diario a las 2 AM
const analyzeJob = new cron.CronJob('0 2 * * *', async () => {
  console.log('🕑 CRON: Ejecutando análisis automático de chats...');
  
  try {
    // Obtener todos los tenants activos
    const tenants = await pool.query(
      `SELECT DISTINCT tenant_id FROM bots WHERE status = 'enabled'`
    );
    
    let totalProcessed = 0;
    
    for (const tenant of tenants.rows) {
      console.log(`👥 Procesando tenant: ${tenant.tenant_id}`);
      
      const processed = await bulkAnalysisService.checkAndAnalyzeUnprocessedChats(tenant.tenant_id);
      totalProcessed += processed;
      
      console.log(`✅ Tenant ${tenant.tenant_id}: ${processed} chats analizados`);
      
      // Pausa entre tenants
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`🎯 CRON COMPLETADO: ${totalProcessed} chats analizados`);
    
    // Enviar notificación (opcional)
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `✅ Análisis automático completado: ${totalProcessed} chats analizados`
        })
      });
    }
    
  } catch (error) {
    console.error('❌ Error en cron job:', error);
  }
});

// Iniciar el job
analyzeJob.start();
console.log('✅ Cron job programado para ejecutarse diariamente a las 2 AM');

// Mantener el proceso vivo
process.on('SIGINT', () => {
  console.log('🛑 Deteniendo cron job...');
  analyzeJob.stop();
  process.exit(0);
});