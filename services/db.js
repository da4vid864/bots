// services/db.js
const { Pool } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');

// AsyncLocalStorage to store tenant context per request/execution flow
const tenantStorage = new AsyncLocalStorage();

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

// Wrapper to execute code within a tenant context
const runWithTenant = (tenantId, callback) => {
  return tenantStorage.run(tenantId, callback);
};

// Wrapper for pool.query to inject tenant context
const originalQuery = pool.query.bind(pool);

pool.query = async (text, params) => {
  const tenantId = tenantStorage.getStore();
  
  // If no tenant context, execute directly (System/Public context)
  // WARNING: If the connection was previously used by a tenant, it might still have the session variable set.
  // Ideally, we should reset it, but `pg` doesn't support "checkout hooks" easily without wrapping connect.
  // For safety, we will wrap EVERY query execution to manage the session variable.
  
  const client = await pool.connect();
  try {
    if (tenantId) {
      // Set the tenant ID for this session
      await client.query(`SET app.current_tenant = '${tenantId}'`);
    } else {
      // Clear the tenant ID to ensure we don't accidentally use a previous tenant's context
      // 'RESET app.current_tenant' might throw if it wasn't set, so we set to null/empty
      // or use SET LOCAL if we were in a transaction block, but here we are solitary.
      // SET app.current_tenant TO DEFAULT might work if default is unset? No, it's a session var.
      // We'll set it to empty string or valid UUID format if needed. 
      // RLS policy: current_setting('app.current_tenant', true)::uuid
      // If we set it to '', casting to UUID might fail? 
      // Let's try RESET app.current_tenant.
      await client.query("RESET app.current_tenant");
    }

    // Execute the actual query
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    // If RESET fails because variable doesn't exist, ignore that specific error?
    // Postgres warning: "parameter 'app.current_tenant' is not in configuration file" (if using RESET when not set?)
    // Actually RESET works for custom vars set in session.
    throw err;
  } finally {
    client.release();
  }
};

// Also expose a raw query method if needed to bypass wrapper (use carefully)
pool.unsafeQuery = originalQuery;

// Expose connect wrapper if consumers use client directly (e.g. transactions)
const originalConnect = pool.connect.bind(pool);
pool.connect = async (...args) => {
  const client = await originalConnect(...args);
  const tenantId = tenantStorage.getStore();
  
  // Monkey-patch client.release to not just release, but maybe we don't need to do anything special 
  // since the next user will overwrite or reset the tenant.
  
  // However, we SHOULD set the tenant on the client immediately if context exists.
  if (tenantId) {
    await client.query(`SET app.current_tenant = '${tenantId}'`);
  } else {
    await client.query("RESET app.current_tenant");
  }
  
  return client;
};


// Verificar conexión al iniciar
originalConnect((err, client, release) => {
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

module.exports = {
  query: pool.query,
  pool, // Export the modified pool
  runWithTenant,
  // Helper to expose the raw pool if absolutely needed
  rawPool: pool
};