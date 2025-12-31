-- Migration: 015_bot_auth_store.sql
-- Purpose: Create table for storing Baileys session credentials and keys in the database
-- This replaces local file storage to ensure persistence across container restarts (e.g. Railway)

CREATE TABLE IF NOT EXISTS bailey_sessions (
    bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL, -- e.g., 'creds', 'app-state-sync-key', 'pre-key-1'
    session_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bot_id, session_key)
);

-- Index for faster lookups by bot_id (though primary key covers it, this is for partial key searches if needed)
CREATE INDEX IF NOT EXISTS idx_bailey_sessions_bot ON bailey_sessions(bot_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_bailey_sessions_update ON bailey_sessions;
CREATE TRIGGER trigger_bailey_sessions_update
BEFORE UPDATE ON bailey_sessions
FOR EACH ROW
EXECUTE FUNCTION update_bot_sessions_timestamp();