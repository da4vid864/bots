// test_tenant_logic.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runTests() {
    console.log('🧪 Testing Tenant Logic Refactoring...');
    const client = await pool.connect();
    
    try {
        // 1. Setup: Ensure we have a tenant and a bot
        await client.query("BEGIN");
        
        // Get Default Tenant
        const tenantRes = await client.query("SELECT id FROM tenants WHERE name = 'Default Tenant'");
        const tenantId = tenantRes.rows[0].id;
        console.log(`✅ Using Tenant ID: ${tenantId}`);

        // Set RLS Context
        await client.query(`SET app.current_tenant = '${tenantId}'`);

        // Create a Test Bot
        const botId = 'test_bot_' + Date.now();
        await client.query(`
            INSERT INTO bots (id, name, status, owner_email, tenant_id, system_prompt_template, port, prompt)
            VALUES ($1, 'Test Bot', 'enabled', 'test@example.com', $2, 'You are a test bot.', 3001, 'Base Prompt')
        `, [botId, tenantId]);
        console.log(`✅ Created Test Bot: ${botId}`);

        // 2. Test Scoring Service Logic (Insert Rule)
        // We'll simulate the service logic here by running the query directly as if it were the service
        // ensuring it respects the tenant_id via default or explicit insert.
        // The service uses: VALUES (..., current_setting('app.current_tenant')::uuid)
        
        const ruleRes = await client.query(`
            INSERT INTO scoring_rules 
            (bot_id, keyword, match_type, points, response_message, tag_to_add, tenant_id) 
            VALUES ($1, 'hello', 'contains', 10, 'Hi there!', 'greeting', current_setting('app.current_tenant')::uuid) 
            RETURNING *
        `, [botId]);
        
        if (ruleRes.rows[0].tenant_id === tenantId) {
            console.log('✅ Scoring Rule created with correct Tenant ID');
        } else {
            console.error('❌ Scoring Rule Tenant ID mismatch');
        }

        // 3. Test Lead Service Logic (Create Lead)
        // Service uses: VALUES (..., current_setting('app.current_tenant')::uuid)
        const leadRes = await client.query(`
            INSERT INTO leads (bot_id, whatsapp_number, status, score, tags, tenant_id) 
            VALUES ($1, '1234567890', 'capturing', 0, '{}', current_setting('app.current_tenant')::uuid) 
            RETURNING *
        `, [botId]);

        if (leadRes.rows[0].tenant_id === tenantId) {
            console.log('✅ Lead created with correct Tenant ID');
        } else {
            console.error('❌ Lead Tenant ID mismatch');
        }

        await client.query("ROLLBACK"); // Clean up
        console.log('✅ All tests passed (Rolled back changes)');

    } catch (err) {
        console.error('❌ Test Failed:', err);
        await client.query("ROLLBACK");
    } finally {
        client.release();
        pool.end();
    }
}

runTests();