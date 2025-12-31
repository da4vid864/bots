-- Migration: 013_analyzed_chats_system.sql (FIXED)
-- Purpose: Create tables for chat analysis and pipeline integration
-- Date: 2025-12-30

-- 1. Tabla de chats analizados (Chats con análisis AI)
CREATE TABLE IF NOT EXISTS analyzed_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    
    -- Análisis AI
    analysis_results JSONB DEFAULT '{}',
    lead_score INTEGER DEFAULT 0,
    pipeline_category VARCHAR(50) NOT NULL,
    
    -- Metadata
    messages_count INTEGER DEFAULT 0,
    last_message_content TEXT,
    last_message_at TIMESTAMP,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Asignación
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    
    -- Productos mencionados
    products_mentioned JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'analyzed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, bot_id, contact_phone)
);

-- 2. Historial de movimientos en pipeline (Auditoría)
CREATE TABLE IF NOT EXISTS pipeline_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES analyzed_chats(id) ON DELETE CASCADE,
    from_category VARCHAR(50) NOT NULL,
    to_category VARCHAR(50) NOT NULL,
    moved_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT,
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de análisis de conversación (Detalles técnicos)
CREATE TABLE IF NOT EXISTS chat_analysis_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES analyzed_chats(id) ON DELETE CASCADE,
    
    -- Análisis detallado
    raw_analysis JSONB NOT NULL,
    intent_classification VARCHAR(50),
    conversation_summary TEXT,
    suggested_next_steps TEXT,
    sentiment_score NUMERIC(3,2),
    engagement_level VARCHAR(20),
    
    -- Metadata
    analysis_model VARCHAR(50) DEFAULT 'deepseek-chat',
    tokens_used INTEGER,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de configuración de categorías del pipeline
CREATE TABLE IF NOT EXISTS pipeline_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3b82f6',
    position INTEGER DEFAULT 0,
    icon VARCHAR(50),
    
    -- Condiciones automáticas de clasificación
    min_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    keywords JSONB DEFAULT '[]',
    
    is_final_stage BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, name)
);

-- 5. Tabla de estadísticas del pipeline (Para analytics)
CREATE TABLE IF NOT EXISTS pipeline_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pipeline_category VARCHAR(50) NOT NULL,
    
    -- Contadores
    total_chats INTEGER DEFAULT 0,
    new_today INTEGER DEFAULT 0,
    converted_this_month INTEGER DEFAULT 0,
    lost_this_month INTEGER DEFAULT 0,
    
    -- Promedios
    avg_lead_score NUMERIC(5,2) DEFAULT 0,
    avg_time_in_category INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    
    -- Periodo
    date_period DATE NOT NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, pipeline_category, date_period)
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_tenant ON analyzed_chats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_bot ON analyzed_chats(bot_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_category ON analyzed_chats(pipeline_category);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_score ON analyzed_chats(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_assigned ON analyzed_chats(assigned_to);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_status ON analyzed_chats(status);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_created ON analyzed_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_analysis_ready ON analyzed_chats(status, analyzed_at) WHERE status = 'analyzed';

CREATE INDEX IF NOT EXISTS idx_movements_tenant ON pipeline_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movements_chat ON pipeline_movements(chat_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON pipeline_movements(moved_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_tenant ON chat_analysis_details(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analysis_chat ON chat_analysis_details(chat_id);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON pipeline_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_position ON pipeline_categories(position);

CREATE INDEX IF NOT EXISTS idx_stats_tenant ON pipeline_statistics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stats_date ON pipeline_statistics(date_period DESC);

-- Insertar categorías predeterminadas
INSERT INTO pipeline_categories (tenant_id, name, display_name, description, color_code, position, min_score, max_score)
SELECT 
    t.id,
    v.name,
    v.display_name,
    v.description,
    v.color_code,
    v.position,
    v.min_score,
    v.max_score
FROM tenants t
CROSS JOIN (
    VALUES 
        ('nuevos_contactos', 'Nuevos Contactos', 'Chats nuevos sin clasificar', '#6b7280', 0, 0, 30),
        ('calientes', 'Leads Calientes', 'Alta probabilidad de conversión', '#ef4444', 1, 70, 100),
        ('seguimiento', 'En Seguimiento', 'En proceso de conversación activa', '#3b82f6', 2, 40, 69),
        ('negociacion', 'Negociación', 'Discutiendo términos y precios', '#f59e0b', 3, 50, 79),
        ('cerrar_venta', 'Cerrar Venta', 'Listos para finalizar compra', '#10b981', 4, 75, 100),
        ('perdidos', 'Perdidos', 'Sin interés o no contactables', '#8b5cf6', 5, 0, 25),
        ('clientes', 'Clientes', 'Conversiones exitosas', '#06b6d4', 6, 80, 100)
) v(name, display_name, description, color_code, position, min_score, max_score)
ON CONFLICT DO NOTHING;

-- Crear vista para obtener chats por categoría
CREATE OR REPLACE VIEW vw_chats_by_category AS
SELECT 
    ac.id,
    ac.tenant_id,
    ac.bot_id,
    ac.contact_phone,
    ac.contact_name,
    ac.lead_score,
    ac.pipeline_category,
    ac.assigned_to,
    ac.products_mentioned,
    ac.messages_count,
    ac.last_message_at,
    ac.analyzed_at,
    pc.display_name as category_display_name,
    pc.color_code,
    u.email as assigned_to_email
FROM analyzed_chats ac
LEFT JOIN pipeline_categories pc ON ac.pipeline_category = pc.name
LEFT JOIN users u ON ac.assigned_to = u.id
WHERE ac.status IN ('analyzed', 'classified', 'assigned');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_analyzed_chats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_analyzed_chats_update ON analyzed_chats;
CREATE TRIGGER trigger_analyzed_chats_update
BEFORE UPDATE ON analyzed_chats
FOR EACH ROW
EXECUTE FUNCTION update_analyzed_chats_timestamp();

-- Trigger para actualizar estadísticas
CREATE OR REPLACE FUNCTION update_pipeline_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pipeline_statistics (
        tenant_id, pipeline_category, total_chats, 
        avg_lead_score, date_period, updated_at
    )
    SELECT 
        NEW.tenant_id,
        NEW.pipeline_category,
        COUNT(*),
        AVG(lead_score),
        CURRENT_DATE,
        CURRENT_TIMESTAMP
    FROM analyzed_chats
    WHERE tenant_id = NEW.tenant_id 
      AND pipeline_category = NEW.pipeline_category
      AND DATE(created_at) = CURRENT_DATE
    ON CONFLICT (tenant_id, pipeline_category, date_period) 
    DO UPDATE SET 
        total_chats = EXCLUDED.total_chats,
        avg_lead_score = EXCLUDED.avg_lead_score,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_statistics ON analyzed_chats;
CREATE TRIGGER trigger_update_statistics
AFTER INSERT OR UPDATE ON analyzed_chats
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_statistics();
