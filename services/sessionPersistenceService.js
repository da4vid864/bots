/**
 * sessionPersistenceService.js
 * Servicio para persistir y recuperar sesiones de Baileys entre reinicios
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { hasValidDBSession, clearDBSession } = require('./baileysAuthService');

const SESSION_STORAGE_TABLE = 'bot_sessions';

/**
 * Verificar si una sesión tiene credenciales válidas sin necesidad de QR
 * @param {string} botId - ID del bot
 * @returns {Promise<boolean>} true si hay credenciales guardadas
 */
async function hasValidSessionCredentials(botId) {
  // 1. Check Database (Priority)
  const hasDB = await hasValidDBSession(botId);
  if (hasDB) {
    console.log(`[${botId}] ✅ Credenciales encontradas en DB`);
    return true;
  }

  // 2. Fallback to filesystem (Legacy/Migration)
  try {
    const authDir = path.join(__dirname, '..', 'auth-sessions', botId);
    
    if (!fs.existsSync(authDir)) {
      return false;
    }

    const credsPath = path.join(authDir, 'creds.json');
    if (!fs.existsSync(credsPath)) {
      return false;
    }

    const credsContent = fs.readFileSync(credsPath, 'utf8');
    const creds = JSON.parse(credsContent);

    if (creds.me?.id) {
      console.log(`[${botId}] ✅ Credenciales locales encontradas (migración pendiente)`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[${botId}] ❌ Error verificando credenciales:`, error.message);
    return false;
  }
}

/**
 * Guardar metadata de sesión en BD para auditoría
 * @param {string} botId - ID del bot
 * @param {object} data - Datos a guardar
 */
async function saveSessionMetadata(botId, data) {
  try {
    const query = `
      INSERT INTO bot_sessions (bot_id, phone, authenticated_at, last_activity, status, metadata)
      VALUES ($1, $2, $3, NOW(), $4, $5)
      ON CONFLICT (bot_id) DO UPDATE SET
        last_activity = NOW(),
        authenticated_at = COALESCE(EXCLUDED.authenticated_at, bot_sessions.authenticated_at),
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata
    `;

    await pool.query(query, [
      botId,
      data.phoneNumber || null,
      data.authenticatedAt || new Date(),
      data.status || 'connected',
      JSON.stringify(data.metadata || {})
    ]);

    console.log(`[${botId}] 📝 Metadata de sesión guardada`);
  } catch (error) {
    // Si la tabla no existe, ignorar (será creada por migración)
    if (error.code === '42P01') {
      console.log(`[${botId}] ℹ️  Tabla bot_sessions no existe (será creada por migración)`);
      return;
    }
    console.error(`[${botId}] ⚠️  Error guardando metadata:`, error.message);
  }
}

/**
 * Obtener metadata de sesión guardada
 * @param {string} botId - ID del bot
 */
async function getSessionMetadata(botId) {
  try {
    const result = await pool.query(
      'SELECT * FROM bot_sessions WHERE bot_id = $1',
      [botId]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (error.code !== '42P01') {
      console.error(`[${botId}] ⚠️  Error obteniendo metadata:`, error.message);
    }
    return null;
  }
}

/**
 * Limpiar archivos de sesión inválidos
 * @param {string} botId - ID del bot
 */
async function cleanInvalidSession(botId) {
  try {
    // Clean DB session
    await clearDBSession(botId);

    // Clean local files (legacy)
    const authDir = path.join(__dirname, '..', 'auth-sessions', botId);
    if (fs.existsSync(authDir)) {
      const backupDir = `${authDir}.backup.${Date.now()}`;
      fs.renameSync(authDir, backupDir);
      console.log(`[${botId}] 🗑️  Sesión local inválida movida a: ${backupDir}`);
    }
    return true;
  } catch (error) {
    console.error(`[${botId}] ❌ Error limpiando sesión:`, error.message);
    return false;
  }
}

/**
 * Exportar sesión como backup
 * @param {string} botId - ID del bot
 * @param {string} exportPath - Ruta donde exportar
 */
function exportSessionBackup(botId, exportPath = null) {
  try {
    const authDir = path.join(__dirname, '..', 'auth-sessions', botId);
    
    if (!fs.existsSync(authDir)) {
      console.log(`[${botId}] ⚠️  No hay sesión para exportar`);
      return null;
    }

    const backupPath = exportPath || path.join(__dirname, '..', 'session-backups', `${botId}.backup.json`);
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copiar la carpeta de autenticación completa
    const credsPath = path.join(authDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      
      // Guardar backup (sin datos sensibles)
      fs.writeFileSync(backupPath, JSON.stringify({
        botId,
        phoneNumber: creds.me?.id || null,
        backupDate: new Date().toISOString(),
        hasCredentials: !!creds.me?.id
      }, null, 2));

      console.log(`[${botId}] 💾 Backup de sesión exportado a: ${backupPath}`);
      return backupPath;
    }
  } catch (error) {
    console.error(`[${botId}] ❌ Error exportando backup:`, error.message);
  }
  return null;
}

/**
 * Restaurar sesión desde backup
 * @param {string} botId - ID del bot
 * @param {string} backupPath - Ruta del backup
 */
function restoreSessionFromBackup(botId, backupPath) {
  try {
    // Nota: Esta función es informativa. La restauración real requiere
    // tener los archivos de credenciales guardados en auth-sessions/[botId]/
    // que ya se hacen automáticamente en baileysManager.js
    
    if (fs.existsSync(backupPath)) {
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      console.log(`[${botId}] 📂 Backup encontrado: ${backup.phoneNumber} (${backup.backupDate})`);
      return backup;
    }
  } catch (error) {
    console.error(`[${botId}] ❌ Error restaurando backup:`, error.message);
  }
  return null;
}

/**
 * Limpiar sesiones muy antiguas (> 30 días sin actividad)
 */
async function cleanupOldSessions() {
  try {
    const result = await pool.query(`
      DELETE FROM bot_sessions 
      WHERE last_activity < NOW() - INTERVAL '30 days'
      RETURNING bot_id
    `);

    if (result.rowCount > 0) {
      console.log(`🗑️  Sesiones limpias: ${result.rows.map(r => r.bot_id).join(', ')}`);
    }
  } catch (error) {
    if (error.code !== '42P01') {
      console.error('⚠️  Error limpiando sesiones antiguas:', error.message);
    }
  }
}

module.exports = {
  hasValidSessionCredentials,
  saveSessionMetadata,
  getSessionMetadata,
  cleanInvalidSession,
  exportSessionBackup,
  restoreSessionFromBackup,
  cleanupOldSessions,
};
