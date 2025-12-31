-- Migration: 013_analyzed_chats_system.sql
-- Purpose: Create tables for chat analysis and pipeline integration
-- Date: 2025-12-30

-- 1. Tabla de chats analizados (Chats con análisis AI)
CREATE TABLE IF NOT EXISTS analyzed_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    
    -- Análisis AI
    analysis_results JSONB DEFAULT '{}',  -- {intencion, confianza, engagement, interesProducto, urgencia}
    lead_score INTEGER DEFAULT 0,  -- 0-100
    pipeline_category VARCHAR(50) NOT NULL,  -- Nueva_Contacto, Caliente, Seguimiento, Negociacion, Cerrar_Venta, Perdido, Cliente
    
    -- Metadata
    messages_count INTEGER DEFAULT 0,
    last_message_content TEXT,
    last_message_at TIMESTAMP,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Asignación
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    
    -- Productos mencionados
    products_mentioned JSONB DEFAULT '[]',  -- [{id, name, mention_count, intent}]
    
    -- Status
    status VARCHAR(50) DEFAULT 'analyzed',  -- pending_analysis, analyzed, classified, assigned, converted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, bot_id, contact_phone),
    INDEX idx_analyzed_chats_tenant (tenant_id),
    INDEX idx_analyzed_chats_bot (bot_id),
    INDEX idx_analyzed_chats_category (pipeline_category),
    INDEX idx_analyzed_chats_score (lead_score DESC),
    INDEX idx_analyzed_chats_assigned (assigned_to),
    INDEX idx_analyzed_chats_status (status)
);

-- 2. Historial de movimientos en pipeline (Auditoría)
CREATE TABLE IF NOT EXISTS pipeline_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES analyzed_chats(id) ON DELETE CASCADE,
    from_category VARCHAR(50) NOT NULL,
    to_category VARCHAR(50) NOT NULL,
    moved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT,
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_movements_tenant (tenant_id),
    INDEX idx_movements_chat (chat_id),
    INDEX idx_movements_date (moved_at DESC)
);

-- 3. Tabla de análisis de conversación (Detalles técnicos)
CREATE TABLE IF NOT EXISTS chat_analysis_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES analyzed_chats(id) ON DELETE CASCADE,
    
    -- Análisis detallado
    raw_analysis JSONB NOT NULL,  -- Respuesta completa de DeepSeek
    intent_classification VARCHAR(50),  -- compra, consulta, soporte, reclamacion
    conversation_summary TEXT,
    suggested_next_steps TEXT,
    sentiment_score NUMERIC(3,2),  -- -1 a 1
    engagement_level VARCHAR(20),  -- alto, medio, bajo
    
    -- Metadata
    analysis_model VARCHAR(50) DEFAULT 'deepseek-chat',
    tokens_used INTEGER,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_analysis_tenant (tenant_id),
    INDEX idx_analysis_chat (chat_id)
);

-- 4. Tabla de configuración de categorías del pipeline
CREATE TABLE IF NOT EXISTS pipeline_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3b82f6',  -- Hex color
    position INTEGER DEFAULT 0,
    icon VARCHAR(50),
    
    -- Condiciones automáticas de clasificación
    min_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    keywords JSONB DEFAULT '[]',  -- Palabras clave para clasificación
    
    is_final_stage BOOLEAN DEFAULT FALSE,  -- Si es una etapa terminal (Cerrado, Perdido, Cliente)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, name),
    INDEX idx_categories_tenant (tenant_id),
    INDEX idx_categories_position (position)
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
    avg_time_in_category INTEGER DEFAULT 0,  -- minutos
    conversion_rate NUMERIC(5,2) DEFAULT 0,  -- porcentaje
    
    -- Periodo
    date_period DATE NOT NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, pipeline_category, date_period),
    INDEX idx_stats_tenant (tenant_id),
    INDEX idx_stats_date (date_period DESC)
);

-- 6. Insertar categorías predeterminadas para nuevos tenants
INSERT INTO pipeline_categories (tenant_id, name, display_name, description, color_code, position, min_score, max_score)
VALUES 
    (NULL, 'nuevos_contactos', 'Nuevos Contactos', 'Chats nuevos sin clasificar', '#6b7280', 0, 0, 30),
    (NULL, 'calientes', 'Leads Calientes', 'Alta probabilidad de conversión', '#ef4444', 1, 70, 100),
    (NULL, 'seguimiento', 'En Seguimiento', 'En proceso de conversación activa', '#3b82f6', 2, 40, 69),
    (NULL, 'negociacion', 'Negociación', 'Discutiendo términos y precios', '#f59e0b', 3, 50, 79),
    (NULL, 'cerrar_venta', 'Cerrar Venta', 'Listos para finalizar compra', '#10b981', 4, 75, 100),
    (NULL, 'perdidos', 'Perdidos', 'Sin interés o no contactables', '#8b5cf6', 5, 0, 25),
    (NULL, 'clientes', 'Clientes', 'Conversiones exitosas', '#06b6d4', 6, 80, 100)
ON CONFLICT DO NOTHING;

-- 7. Crear índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_created ON analyzed_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyzed_chats_analysis_ready ON analyzed_chats(status, analyzed_at) WHERE status = 'analyzed';

-- 8. Crear vista para obtener chats por categoría (Optimization)
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

-- 9. Trigger para actualizar updated_at en analyzed_chats
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

-- 10. Trigger para crear estadísticas automáticas
CREATE OR REPLACE FUNCTION update_pipeline_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar estadísticas del pipeline
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

COMMIT;
