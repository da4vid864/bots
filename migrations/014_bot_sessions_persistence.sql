-- Migration: 014_bot_sessions_persistence.sql
-- Purpose: Create table for session persistence metadata
-- Allows tracking active sessions and recovering them after restarts

CREATE TABLE IF NOT EXISTS bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bot_id TEXT NOT NULL UNIQUE REFERENCES bots(id) ON DELETE CASCADE,
    
    -- Session Info
    phone VARCHAR(20),  -- Número de WhatsApp del bot
    authenticated_at TIMESTAMP,  -- Cuándo se autenticó por primera vez
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Última actividad
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'disconnected',  -- connected, disconnected, reconnecting, error
    connection_attempts INTEGER DEFAULT 0,  -- Número de intentos de conexión
    last_connection_error TEXT,  -- Último error de conexión
    
    -- Metadata
    metadata JSONB DEFAULT '{}',  -- Datos adicionales (versión, etc)
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, bot_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_bot_sessions_tenant ON bot_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_activity ON bot_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_connected ON bot_sessions(status) WHERE status = 'connected';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_bot_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bot_sessions_update ON bot_sessions;
CREATE TRIGGER trigger_bot_sessions_update
BEFORE UPDATE ON bot_sessions
FOR EACH ROW
EXECUTE FUNCTION update_bot_sessions_timestamp();

-- Vista para obtener sesiones activas
CREATE OR REPLACE VIEW vw_active_sessions AS
SELECT 
    bs.id,
    bs.bot_id,
    b.name as bot_name,
    b.owner_email,
    bs.phone,
    bs.status,
    bs.last_activity,
    bs.authenticated_at,
    EXTRACT(EPOCH FROM (NOW() - bs.last_activity)) as idle_seconds
FROM bot_sessions bs
LEFT JOIN bots b ON bs.bot_id = b.id
WHERE bs.status IN ('connected', 'reconnecting')
  AND bs.last_activity > NOW() - INTERVAL '24 hours';
