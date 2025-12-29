// fix-missing-function.js
// Script to fix missing database function

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/botinteligente'
});

async function fixFunction() {
    try {
        console.log('Creating missing function: get_max_port_system()...');
        
        const query = `
            CREATE OR REPLACE FUNCTION get_max_port_system() 
            RETURNS INTEGER AS $$
            BEGIN
                RETURN COALESCE((SELECT MAX(port) FROM bots), 3000);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        `;
        
        await pool.query(query);
        console.log('✅ Function created successfully!');
        
        // Test the function
        const result = await pool.query('SELECT get_max_port_system() as max_port');
        console.log(`✅ Function works! Max port: ${result.rows[0].max_port}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating function:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixFunction();
