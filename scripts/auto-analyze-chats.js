/**
 * Script que corre periódicamente para analizar chats no procesados
 */

const bulkAnalysisService = require('../services/bulkAnalysisService');
const pool = require('../services/db');

/**
 * Script que corre periódicamente para analizar chats no procesados
 */
async function runAutoAnalysis() {
  console.log('🔄 Ejecutando análisis automático de chats...');
  
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
    }
    
    console.log(`🎯 ANÁLISIS AUTOMÁTICO COMPLETADO:`);
    console.log(`   📊 Total de tenants procesados: ${tenants.rows.length}`);
    console.log(`   💬 Total de chats analizados: ${totalProcessed}`);
    
    return totalProcessed;
    
  } catch (error) {
    console.error('❌ Error en análisis automático:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAutoAnalysis()
    .then(total => {
      console.log(`✅ Script completado: ${total} chats analizados`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = { runAutoAnalysis };