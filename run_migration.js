const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ruta a la base de datos (ajusta según tu configuración en .env)
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'data', 'leads.db');

// Ruta al archivo de migración
const migrationFile = path.join(__dirname, 'migrations', '003_add_image_storage_columns.sql');

function runMigration() {
  // Verificar si el archivo de migración existe
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Archivo de migración no encontrado: ${migrationFile}`);
    return;
  }

  // Leer el contenido del archivo SQL
  const sql = fs.readFileSync(migrationFile, 'utf8');

  try {
    // Conectar a la base de datos
    const db = new Database(dbPath);
    console.log('✅ Conectado a la base de datos.');

    // Ejecutar la migración
    db.exec(sql);
    console.log('✅ Migración aplicada exitosamente: 003_add_image_storage_columns.sql');

    // Cerrar la conexión
    db.close();
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };