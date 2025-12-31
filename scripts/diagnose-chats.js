/**
 * Script de diagnóstico para verificar chats analizados
 */

const pool = require('../services/db');

async function diagnoseChats() {
  console.log('🔍 Diagnóstico de chats analizados...');
  
  try {
    // 1. Estadísticas generales
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(DISTINCT bot_id) as total_bots,
        COUNT(CASE WHEN analyzed_at IS NOT NULL THEN 1 END) as analyzed_chats,
        COUNT(CASE WHEN analyzed_at IS NULL THEN 1 END) as unanalyzed_chats,
        ROUND((COUNT(CASE WHEN analyzed_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2) as percentage_analyzed
      FROM leads
    `);
    
    console.log('📊 ESTADÍSTICAS GENERALES:');
    console.log(JSON.stringify(stats.rows[0], null, 2));
    
    // 2. Chats por bot
    const byBot = await pool.query(`
      SELECT 
        b.name as bot_name,
        b.id as bot_id,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN ac.id IS NOT NULL THEN 1 END) as analyzed,
        COUNT(CASE WHEN ac.id IS NULL THEN 1 END) as not_analyzed
      FROM leads l
      LEFT JOIN analyzed_chats ac ON l.bot_id = ac.bot_id AND l.whatsapp_number = ac.contact_phone
      JOIN bots b ON l.bot_id = b.id
      GROUP BY b.id, b.name
      ORDER BY not_analyzed DESC
    `);
    
    console.log('\n🤖 CHATS POR BOT:');
    byBot.rows.forEach(row => {
      console.log(`${row.bot_name}: ${row.analyzed}/${row.total_leads} analizados (${row.not_analyzed} faltantes)`);
    });
    
    // 3. Top 10 chats no analizados
    const unanalyzed = await pool.query(`
      SELECT 
        l.whatsapp_number as phone,
        l.name,
        b.name as bot_name,
        l.last_message_at,
        l.score
      FROM leads l
      JOIN bots b ON l.bot_id = b.id
      WHERE NOT EXISTS (
        SELECT 1 FROM analyzed_chats ac 
        WHERE ac.bot_id = l.bot_id 
        AND ac.contact_phone = l.whatsapp_number
      )
      ORDER BY l.last_message_at DESC
      LIMIT 10
    `);
    
    console.log('\n📱 TOP 10 CHATS NO ANALIZADOS:');
    unanalyzed.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.phone} - ${row.bot_name} - ${new Date(row.last_message_at).toLocaleDateString()}`);
    });
    
    // 4. Distribución por score en analyzed_chats
    const scoreDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN lead_score >= 70 THEN 'Alto (70+)'
          WHEN lead_score >= 50 THEN 'Medio (50-69)'
          WHEN lead_score >= 30 THEN 'Bajo (30-49)'
          ELSE 'Muy bajo (<30)'
        END as score_range,
        COUNT(*) as count,
        ROUND(AVG(lead_score), 2) as avg_score
      FROM analyzed_chats
      GROUP BY score_range
      ORDER BY 
        CASE score_range
          WHEN 'Alto (70+)' THEN 1
          WHEN 'Medio (50-69)' THEN 2
          WHEN 'Bajo (30-49)' THEN 3
          ELSE 4
        END
    `);
    
    console.log('\n📈 DISTRIBUCIÓN POR SCORE:');
    scoreDistribution.rows.forEach(row => {
      console.log(`${row.score_range}: ${row.count} chats (promedio: ${row.avg_score})`);
    });
    
    // 5. Categorías más comunes en analyzed_chats
    const topCategories = await pool.query(`
      SELECT 
        pipeline_category,
        COUNT(*) as chat_count,
        ROUND(AVG(lead_score), 2) as avg_score
      FROM analyzed_chats
      GROUP BY pipeline_category
      ORDER BY chat_count DESC
      LIMIT 10
    `);
    
    console.log('\n🏷️ CATEGORÍAS MÁS COMUNES:');
    topCategories.rows.forEach(row => {
      console.log(`${row.pipeline_category}: ${row.chat_count} chats (score: ${row.avg_score})`);
    });
    
    // 6. Problemas comunes
    const commonIssues = await pool.query(`
      SELECT 
        'Leads sin mensajes' as issue,
        COUNT(*) as count
      FROM leads l
      WHERE NOT EXISTS (
        SELECT 1 FROM lead_messages lm WHERE lm.lead_id = l.id
      )
      UNION ALL
      SELECT 
        'Chats sin nombre de contacto' as issue,
        COUNT(*) as count
      FROM analyzed_chats
      WHERE contact_name IS NULL OR contact_name = ''
      UNION ALL
      SELECT 
        'Chats sin análisis AI' as issue,
        COUNT(*) as count
      FROM analyzed_chats
      WHERE analysis_results::text = '{}' OR analysis_results IS NULL
    `);
    
    console.log('\n⚠️ PROBLEMAS DETECTADOS:');
    commonIssues.rows.forEach(row => {
      console.log(`${row.issue}: ${row.count}`);
    });
    
    // 7. Recomendaciones
    const statsRow = stats.rows[0];
    console.log('\n💡 RECOMENDACIONES:');
    
    if (statsRow.unanalyzed_chats > 0) {
      console.log(`🔧 Ejecuta: npm run analyze-chats (${statsRow.unanalyzed_chats} chats pendientes)`);
    }
    
    if (statsRow.percentage_analyzed < 80) {
      console.log(`📈 Solo el ${statsRow.percentage_analyzed}% de los chats están analizados`);
    }
    
    // Mostrar bot con más chats pendientes
    if (byBot.rows.length > 0) {
      const botConMasPendientes = byBot.rows[0];
      if (botConMasPendientes.not_analyzed > 0) {
        console.log(`🤖 Prioriza el bot "${botConMasPendientes.bot_name}" (${botConMasPendientes.not_analyzed} chats pendientes)`);
      }
    }
    
    return stats.rows[0];
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  diagnoseChats()
    .then(() => {
      console.log('\n✅ Diagnóstico completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Diagnóstico falló:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseChats };