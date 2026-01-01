// services/baileysAuthService.js
import { query as pool } from './db.js';

let baileys;

async function loadBaileys() {
    if (!baileys) {
        baileys = await import('@whiskeysockets/baileys');
    }
    return baileys;
}

/**
 * Creates a database-backed Auth State for Baileys
 * @param {string} botId 
 */
async function usePostgresAuthState(botId) {
    const { BufferJSON, initAuthCreds, proto } = await loadBaileys();

    // 1. Load creds (if exists) or init new
    let creds;
    try {
        const res = await pool(
            'SELECT session_value FROM bailey_sessions WHERE bot_id = $1 AND session_key = $2',
            [botId, 'creds']
        );
        
        if (res.rows.length > 0) {
            creds = JSON.parse(JSON.stringify(res.rows[0].session_value), BufferJSON.reviver);
        } else {
            creds = initAuthCreds();
        }
    } catch (error) {
        console.error(`[${botId}] ❌ Error loading creds from DB:`, error);
        creds = initAuthCreds();
    }

    // 2. Define saveCreds function
    const saveCreds = async () => {
        try {
            await pool(
                `INSERT INTO bailey_sessions (bot_id, session_key, session_value) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (bot_id, session_key) 
                 DO UPDATE SET session_value = EXCLUDED.session_value, updated_at = NOW()`,
                [botId, 'creds', JSON.parse(JSON.stringify(creds, BufferJSON.replacer))]
            );
        } catch (error) {
            console.error(`[${botId}] ❌ Error saving creds to DB:`, error);
        }
    };

    // 3. Define keys store
    const keys = {
        get: async (type, ids) => {
            const data = {};
            try {
                // Construct list of keys to fetch
                const keysToFetch = ids.map(id => `${type}-${id}`);
                
                if (keysToFetch.length === 0) return data;

                const res = await pool(
                    'SELECT session_key, session_value FROM bailey_sessions WHERE bot_id = $1 AND session_key = ANY($2)',
                    [botId, keysToFetch]
                );

                for (const row of res.rows) {
                    const value = JSON.parse(JSON.stringify(row.session_value), BufferJSON.reviver);
                    let keyId = row.session_key.substring(type.length + 1);
                    
                    if (type === 'app-state-sync-key' && row.session_key.startsWith('app-state-sync-key-')) {
                        // Special handling if needed
                    }

                    data[keyId] = value;
                }
            } catch (error) {
                console.error(`[${botId}] ❌ Error getting keys from DB:`, error);
            }
            return data;
        },
        set: async (data) => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                for (const category in data) {
                    for (const id in data[category]) {
                        const value = data[category][id];
                        const key = `${category}-${id}`;

                        if (value) {
                            await client.query(
                                `INSERT INTO bailey_sessions (bot_id, session_key, session_value) 
                                 VALUES ($1, $2, $3)
                                 ON CONFLICT (bot_id, session_key) 
                                 DO UPDATE SET session_value = EXCLUDED.session_value, updated_at = NOW()`,
                                [botId, key, JSON.parse(JSON.stringify(value, BufferJSON.replacer))]
                            );
                        } else {
                            await client.query(
                                'DELETE FROM bailey_sessions WHERE bot_id = $1 AND session_key = $2',
                                [botId, key]
                            );
                        }
                    }
                }
                
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`[${botId}] ❌ Error setting keys in DB:`, error);
            } finally {
                client.release();
            }
        }
    };

    return {
        state: {
            creds,
            keys
        },
        saveCreds
    };
}

/**
 * Checks if a bot has valid credentials in the database
 * @param {string} botId 
 */
async function hasValidDBSession(botId) {
    try {
        const res = await pool(
            "SELECT session_value FROM bailey_sessions WHERE bot_id = $1 AND session_key = 'creds'",
            [botId]
        );
        
        if (res.rows.length === 0) return false;
        
        const { BufferJSON } = await loadBaileys();
        const creds = JSON.parse(JSON.stringify(res.rows[0].session_value), BufferJSON.reviver);
        
        // Check if registered (has me.id)
        return !!(creds && creds.me && creds.me.id);
    } catch (error) {
        console.error(`[${botId}] ⚠️ Error checking DB session:`, error.message);
        return false;
    }
}

/**
 * Removes all session data for a bot from DB
 * @param {string} botId 
 */
async function clearDBSession(botId) {
    try {
        await pool('DELETE FROM bailey_sessions WHERE bot_id = $1', [botId]);
        console.log(`[${botId}] 🗑️ DB Session cleared`);
        return true;
    } catch (error) {
        console.error(`[${botId}] ❌ Error clearing DB session:`, error);
        return false;
    }
}

export {
    usePostgresAuthState,
    hasValidDBSession,
    clearDBSession
};

export default {
    usePostgresAuthState,
    hasValidDBSession,
    clearDBSession
};
