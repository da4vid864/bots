#!/usr/bin/env node
/**
 * test_session_persistence.js
 * Script para verificar que la persistencia de sesiones funciona correctamente
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config();
const sessionPersistenceService = require('./services/sessionPersistenceService');

async function testSessionPersistence() {
    console.log('\n🧪 TEST: Session Persistence\n');
    
    // Simulamos tener algunos bots configurados
    const testBots = ['ventas-mx', '2734545', 'Chachi-bot', '10023291230'];
    
    console.log('1️⃣  Verificando credenciales guardadas para cada bot:');
    console.log('═'.repeat(60));
    
    for (const botId of testBots) {
        const hasValid = await sessionPersistenceService.hasValidSessionCredentials(botId);
        const status = hasValid ? '✅ SÍ' : '❌ NO';
        const authDir = path.join(__dirname, 'auth-sessions', botId);
        const exists = fs.existsSync(authDir) ? 'EXISTE' : 'NO EXISTE';
        
        console.log(`[${botId}]`);
        console.log(`  Carpeta:      ${authDir}`);
        console.log(`  Status:       ${exists}`);
        console.log(`  Credenciales: ${status}`);
        console.log('');
    }
    
    console.log('2️⃣  Exportando backups de sesiones:');
    console.log('═'.repeat(60));
    
    for (const botId of testBots) {
        const backupPath = sessionPersistenceService.exportSessionBackup(botId);
        if (backupPath) {
            console.log(`✅ ${botId}: ${backupPath}`);
        }
    }
    
    console.log('\n3️⃣  Verificando tabla de persistencia en BD:');
    console.log('═'.repeat(60));
    
    try {
        const pool = require('./services/db');
        const result = await pool.query(`
            SELECT bot_id, phone, status, last_activity, authenticated_at
            FROM bot_sessions
            ORDER BY last_activity DESC
            LIMIT 5
        `);
        
        if (result.rows.length === 0) {
            console.log('ℹ️  No hay sesiones registradas aún (se guardarán al conectar)');
        } else {
            console.log('Sesiones registradas:');
            for (const row of result.rows) {
                console.log(`  Bot: ${row.bot_id}`);
                console.log(`    Phone: ${row.phone || 'N/A'}`);
                console.log(`    Status: ${row.status}`);
                console.log(`    Last Activity: ${new Date(row.last_activity).toLocaleString()}`);
                console.log(`    Authenticated: ${row.authenticated_at ? new Date(row.authenticated_at).toLocaleString() : 'N/A'}`);
                console.log('');
            }
        }
        
        // pool is exported as 'pool' property or default if module.exports = pool
        if (pool.pool && typeof pool.pool.end === 'function') {
            await pool.pool.end();
        } else if (typeof pool.end === 'function') {
            await pool.end();
        }
    } catch (error) {
        console.error('❌ Error consultando BD:', error.message);
    }
    
    console.log('\n✅ Test completado\n');
}

testSessionPersistence().catch(console.error);
