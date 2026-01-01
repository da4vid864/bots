// services/initDb.js
import { query as pool } from './db.js';

async function initializeDatabase() {
    console.log('🔄 Inicializando base de datos...');
    
    try {
        // 1. Tabla de usuarios
        await pool(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL DEFAULT 'vendor',
                added_by TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            );
        `);
        console.log('✅ Tabla users verificada');

        // 2. Tabla de bots
        await pool(`
            CREATE TABLE IF NOT EXISTS bots (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                port INTEGER UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'enabled',
                owner_email TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla bots verificada');

        // 3. Tabla de leads
        await pool(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL,
                whatsapp_number TEXT NOT NULL,
                name TEXT,
                email TEXT,
                location TEXT,
                phone TEXT,
                status TEXT NOT NULL DEFAULT 'capturing',
                assigned_to TEXT,
                captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                qualified_at TIMESTAMP,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(bot_id, whatsapp_number)
            );
        `);
        console.log('✅ Tabla leads verificada');

        // 4. Tabla de mensajes de leads
        await pool(`
            CREATE TABLE IF NOT EXISTS lead_messages (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                sender TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla lead_messages verificada');

        // 5. Tabla de features
        await pool(`
            CREATE TABLE IF NOT EXISTS bot_features (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL UNIQUE,
                scheduling_enabled BOOLEAN DEFAULT FALSE,
                auto_response_enabled BOOLEAN DEFAULT TRUE,
                lead_capture_enabled BOOLEAN DEFAULT TRUE,
                working_hours_enabled BOOLEAN DEFAULT FALSE,
                working_hours_start TEXT DEFAULT '09:00',
                working_hours_end TEXT DEFAULT '18:00',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla bot_features verificada');

        // 6. Tabla de schedules
        await pool(`
            CREATE TABLE IF NOT EXISTS schedules (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL,
                action TEXT NOT NULL,
                scheduled_at TIMESTAMP NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                executed BOOLEAN DEFAULT FALSE,
                executed_at TIMESTAMP,
                created_by TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla schedules verificada');

        // 7. Tabla de imágenes del bot
        await pool(`
            CREATE TABLE IF NOT EXISTS bot_images (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                keyword TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla bot_images verificada');

        // === 8. NUEVA TABLA DE SUSCRIPCIONES (AQUÍ ESTABA EL ERROR) ===
        await pool(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_email TEXT NOT NULL UNIQUE,
                plan TEXT NOT NULL DEFAULT 'free',
                status TEXT NOT NULL DEFAULT 'active',
                bot_limit INTEGER NOT NULL DEFAULT 1,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                current_period_end TIMESTAMP,
                trial_ends_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Migración para agregar trial_ends_at si no existe
        await pool(`
            ALTER TABLE subscriptions
            ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
        `);
        
        console.log('✅ Tabla subscriptions verificada (NUEVA)');

        // 9. Tabla de reglas de scoring
        await pool(`
            CREATE TABLE IF NOT EXISTS scoring_rules (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL,
                keyword TEXT NOT NULL,
                match_type TEXT DEFAULT 'contains',
                points INTEGER DEFAULT 0,
                response_message TEXT,
                tag_to_add TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabla scoring_rules verificada');

        // 10. Tabla de productos
        await pool(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                bot_id TEXT NOT NULL,
                sku TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2),
                currency TEXT DEFAULT 'MXN',
                image_url TEXT,
                tags TEXT[],
                stock_status TEXT DEFAULT 'in_stock',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(bot_id, sku),
                FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabla products verificada');

        // 11. Migración de columnas para leads (score y tags)
        await pool(`
            ALTER TABLE leads
            ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
        `);
        console.log('✅ Columnas score y tags verificadas en leads');

        console.log('✅ Base de datos inicializada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    }
}

export { initializeDatabase };

export default { initializeDatabase };
