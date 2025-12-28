const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('❌ Por favor especifica el archivo de migración como argumento.');
    process.exit(1);
}

const migrationPath = path.join(__dirname, 'migrations', migrationFile);

if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Archivo de migración no encontrado: ${migrationPath}`);
    process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

async function run() {
    const client = await pool.connect();
    try {
        console.log(`🚀 Ejecutando migración: ${migrationFile}`);
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('✅ Migración completada exitosamente.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error ejecutando migración:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();