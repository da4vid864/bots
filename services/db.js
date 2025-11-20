// services/db.js
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Configuraciones adicionales para Railway
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.stack);
    process.exit(1);
  } else {
    console.log('✅ Conectado exitosamente a PostgreSQL');
    release();
  }
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

module.exports = pool;