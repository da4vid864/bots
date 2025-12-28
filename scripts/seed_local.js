require('dotenv').config();
const { pool } = require('../services/db');
// const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Use hardcoded IDs to make it repeatable/predictable for local dev
const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEV_USER_EMAIL = 'admin@botinteligente.local';
const DEV_USER_PASSWORD = 'admin123'; // In a real app we'd hash this, but we'll mock login for now or assume test mode

async function seedLocal() {
  console.log('🌱 Starting local seed...');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Ensure Dev Tenant exists
    // We insert directly to bypass RLS or use a system function if available. 
    // Since we are running this script with DB credentials from .env, we are likely superuser or owner, 
    // but RLS might still apply if we don't handle it.
    // However, for seeding, we can just insert into 'tenants' (RLS usually allows INSERT if policy says so, 
    // but here we want to force it).
    // Let's check if it exists first.
    
    // Disable RLS for this session to ensure we can seed freely
    // (Requires superuser or table owner privileges usually)
    // Alternatively, we can just insert since we are not setting app.current_tenant, 
    // so if policies prevent insertion without it, we might fail.
    // But 'tenants' table usually doesn't have RLS or checks against itself in a circular way.
    // Let's look at migration 006:
    // "CREATE POLICY tenant_isolation_policy ON %I..." applied to users, bots, etc.
    // 'tenants' table itself doesn't seem to have RLS enabled in the migration provided (only the child tables).
    
    const tenantRes = await client.query('SELECT id FROM tenants WHERE id = $1', [DEV_TENANT_ID]);
    
    if (tenantRes.rowCount === 0) {
      console.log('Creating Dev Tenant...');
      await client.query(`
        INSERT INTO tenants (id, name, plan, status)
        VALUES ($1, $2, $3, $4)
      `, [DEV_TENANT_ID, 'Dev Tenant', 'enterprise', 'active']);
    } else {
      console.log('Dev Tenant already exists.');
    }

    // 2. Ensure Admin User exists
    // Users table HAS RLS. We need to be careful.
    // If we insert without app.current_tenant set, the CHECK policy might fail:
    // "WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)"
    // So we MUST set the tenant context OR use BYPASSRLS user OR use the `create_tenant_and_user_system` function 
    // (but that creates a NEW tenant).
    
    // Strategy: Set the session variable to our DEV_TENANT_ID before inserting user.
    await client.query(`SET app.current_tenant = '${DEV_TENANT_ID}'`);
    
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [DEV_USER_EMAIL]);
    
    if (userRes.rowCount === 0) {
      console.log('Creating Admin User...');
      // Note: we aren't hashing password in the provided schema usually (it uses Google Auth), 
      // but if we support password auth later, we'd need it. 
      // The schema in 007 shows `password_hash` column in `get_user_by_email_system` return, 
      // but let's see if the table has it. 
      // The migration 007 `create_tenant_and_user_system` doesn't insert password.
      // We will just insert email and role.
      
      await client.query(`
        INSERT INTO users (email, role, tenant_id, added_by, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [DEV_USER_EMAIL, 'admin', DEV_TENANT_ID, 'system', true]);
      
      console.log(`User created: ${DEV_USER_EMAIL}`);
      console.log(`\n✅ You can simulate login by setting this user in your session or JWT.`);
      
    } else {
      console.log('Admin User already exists.');
    }
    
    // 3. Optional: Seed some dummy data if needed (Bots, Leads, etc.)
    
    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedLocal();