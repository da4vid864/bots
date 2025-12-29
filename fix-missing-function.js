// fix-missing-function.js
// Script to fix missing database function

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/botinteligente'
});

async function fixFunctions() {
    try {
        console.log('Creating missing SQL functions...\n');
        
        // 1. get_max_port_system() - Already exists, but let's recreate to be safe
        console.log('1️⃣  Creating get_max_port_system()...');
        await pool.query(`
            CREATE OR REPLACE FUNCTION get_max_port_system() 
            RETURNS INTEGER AS $$
            BEGIN
                RETURN COALESCE((SELECT MAX(port) FROM bots), 3000);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        `);
        console.log('   ✅ get_max_port_system() created\n');
        
        // 2. get_user_by_email_system() - NEW
        console.log('2️⃣  Creating get_user_by_email_system()...');
        await pool.query(`
            CREATE OR REPLACE FUNCTION get_user_by_email_system(p_email TEXT)
            RETURNS TABLE (
                id UUID,
                email VARCHAR,
                role VARCHAR,
                is_active BOOLEAN,
                tenant_id UUID,
                added_by VARCHAR,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            ) AS $$
            BEGIN
                RETURN QUERY SELECT 
                    users.id,
                    users.email,
                    users.role,
                    users.is_active,
                    users.tenant_id,
                    users.added_by,
                    users.created_at,
                    users.updated_at
                FROM users
                WHERE LOWER(users.email) = LOWER(p_email);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        `);
        console.log('   ✅ get_user_by_email_system() created\n');
        
        // 3. create_tenant_and_user_system() - NEW
        console.log('3️⃣  Creating create_tenant_and_user_system()...');
        await pool.query(`
            CREATE OR REPLACE FUNCTION create_tenant_and_user_system(
                p_email TEXT,
                p_role VARCHAR,
                p_added_by VARCHAR
            )
            RETURNS TABLE (
                id UUID,
                email VARCHAR,
                role VARCHAR,
                is_active BOOLEAN,
                tenant_id UUID,
                added_by VARCHAR,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            ) AS $$
            DECLARE
                v_tenant_id UUID;
                v_user_id UUID;
            BEGIN
                -- Create new tenant
                INSERT INTO tenants (name) VALUES (p_email || ' Tenant')
                RETURNING tenants.id INTO v_tenant_id;
                
                -- Create new user
                INSERT INTO users (email, role, is_active, tenant_id, added_by)
                VALUES (LOWER(p_email), p_role, true, v_tenant_id, p_added_by)
                RETURNING users.id INTO v_user_id;
                
                -- Return the created user
                RETURN QUERY SELECT 
                    users.id,
                    users.email,
                    users.role,
                    users.is_active,
                    users.tenant_id,
                    users.added_by,
                    users.created_at,
                    users.updated_at
                FROM users
                WHERE users.id = v_user_id;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        `);
        console.log('   ✅ create_tenant_and_user_system() created\n');
        
        // Test the functions
        console.log('Testing functions...\n');
        
        const maxPort = await pool.query('SELECT get_max_port_system() as max_port');
        console.log(`✅ get_max_port_system() works! Max port: ${maxPort.rows[0].max_port}`);
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✨ All missing functions created successfully!');
        console.log('═══════════════════════════════════════════════════════');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating functions:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixFunctions();
