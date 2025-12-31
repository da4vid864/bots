ALTER TABLE bot_sessions 
ALTER COLUMN tenant_id DROP NOT NULL,
ALTER COLUMN tenant_id SET DEFAULT NULL;

-- Agregar índice para búsquedas sin tenant_id
CREATE INDEX IF NOT EXISTS idx_bot_sessions_bot_id ON bot_sessions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status)