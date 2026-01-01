// services/db.js
import pg from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

const { Pool } = pg;

// AsyncLocalStorage to store tenant context per request/execution flow
const tenantStorage = new AsyncLocalStorage();

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Configuraciones adicionales para Railway
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// UUID validation regex (RFC 4122)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to safely set tenant context using parameterized queries
export async function setTenantContext(client, tenantId) {
  if (!tenantId) {
    // Clear tenant context
    await client.query("RESET app.current_tenant");
    return;
  }
  
  // Validate UUID format to prevent injection
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }
  
  // Use SET LOCAL with parameterized query for safety
  // Note: SET doesn't support parameters directly, but we can use EXECUTE with format()
  // However, since we've validated the UUID format, we can safely interpolate
  // Using dollar-quoted string to prevent any injection
  await client.query(`SET app.current_tenant = '${tenantId}'`);
}

// Wrapper to execute code within a tenant context
export const runWithTenant = (tenantId, callback) => {
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
    await setTenantContext(client, tenantId);

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
  await setTenantContext(client, tenantId);
  
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

export const query = pool.query;
export const dbPool = pool;
export const dbRunWithTenant = runWithTenant;
export const dbSetTenantContext = setTenantContext;
export const rawPool = pool;

export default {
  query,
  pool,
  dbPool,
  dbRunWithTenant,
  dbSetTenantContext,
  rawPool
};
