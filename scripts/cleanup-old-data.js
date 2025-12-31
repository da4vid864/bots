/**
 * Script para limpiar datos antiguos
 */

const pool = require('../services/db');

async function cleanupOldData() {
  console.log('🧹 Iniciando limpieza de datos antiguos...');
  
  try {
    // 1. Chats analizados muy antiguos sin actividad
    const oldChatsResult = await pool.query(`
      DELETE FROM analyzed_chats 
      WHERE updated_at < NOW() - INTERVAL '90 days'
        AND lead_score < 30
        AND assigned_to IS NULL
      RETURNING id, contact_phone, pipeline_category
    `);
    
    console.log(`🗑️  Chats analizados eliminados: ${oldChatsResult.rowCount}`);
    
    // 2. Estadísticas antiguas
    const oldStatsResult = await pool.query(`
      DELETE FROM pipeline_statistics 
      WHERE date_period < NOW() - INTERVAL '180 days'
      RETURNING id, pipeline_category, date_period
    `);
    
    console.log(`📊 Estadísticas antiguas eliminadas: ${oldStatsResult.rowCount}`);
    
    // 3. Movimientos de pipeline muy antiguos
    const oldMovementsResult = await pool.query(`
      DELETE FROM pipeline_movements 
      WHERE moved_at < NOW() - INTERVAL '365 days'
      RETURNING id, chat_id, from_category, to_category
    `);
    
    console.log(`🔄 Movimientos antiguos eliminados: ${oldMovementsResult.rowCount}`);
    
    // 4. Análisis detallados antiguos
    const oldDetailsResult = await pool.query(`
      DELETE FROM chat_analysis_details 
      WHERE analyzed_at < NOW() - INTERVAL '60 days'
        AND sentiment_score BETWEEN -0.2 AND 0.2
      RETURNING id, chat_id, analyzed_at
    `);
    
    console.log(`📝 Análisis detallados eliminados: ${oldDetailsResult.rowCount}`);
    
    // 5. Optimizar tablas
    await pool.query('VACUUM analyzed_chats');
    await pool.query('VACUUM pipeline_statistics');
    console.log('⚡ Tablas optimizadas con VACUUM');
    
    console.log('\n🎯 LIMPIEZA COMPLETADA:');
    console.log(`   - Chats eliminados: ${oldChatsResult.rowCount}`);
    console.log(`   - Estadísticas eliminadas: ${oldStatsResult.rowCount}`);
    console.log(`   - Movimientos eliminados: ${oldMovementsResult.rowCount}`);
    console.log(`   - Análisis eliminados: ${oldDetailsResult.rowCount}`);
    
    return {
      oldChats: oldChatsResult.rowCount,
      oldStats: oldStatsResult.rowCount,
      oldMovements: oldMovementsResult.rowCount,
      oldDetails: oldDetailsResult.rowCount
    };
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupOldData()
    .then(() => {
      console.log('\n✅ Limpieza completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en limpieza:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldData };