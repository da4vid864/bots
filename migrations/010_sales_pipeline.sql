-- Migration: 010_sales_pipeline.sql
-- Sales Pipeline Tables for Multi-Tenant CRM System
-- Phase 1: Database & Backend Foundation

BEGIN;

-- ============================================
-- 1. PIPELINE STAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    stage_type VARCHAR(50) NOT NULL CHECK (stage_type IN ('new', 'contacted', 'scheduled', 'proposal', 'negotiation', 'won', 'lost')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. LEADS TABLE (Enhanced with pipeline support)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bot_id UUID NOT NULL REFERENCES bots(id),
    pipeline_stage_id UUID REFERENCES pipeline_stages(id),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    lead_score DECIMAL(5,2) DEFAULT 0,
    score_breakdown JSONB,
    qualification_status VARCHAR(50) DEFAULT 'new' CHECK (qualification_status IN ('new', 'qualified', 'disqualified', 'converted')),
    intent_level VARCHAR(20) CHECK (intent_level IN ('high', 'medium', 'low', 'none')),
    assigned_to UUID REFERENCES auth_users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100),
    tags TEXT[],
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. LEAD CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    message_direction VARCHAR(20) NOT NULL CHECK (message_direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location', 'contact')),
    message_content TEXT,
    message_media_url TEXT,
    ai_analysis JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. LEAD ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('stage_change', 'assignment', 'note_added', 'call_scheduled', 'email_sent', 'message_sent', 'score_updated', 'qualified', 'converted', 'lost')),
    activity_data JSONB,
    performed_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. SALES METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('leads_received', 'leads_converted', 'stage_progression', 'response_time', 'conversion_rate', 'avg_deal_value', 'revenue', 'calls_completed', 'emails_sent')),
    metric_value DECIMAL(15,2),
    metric_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, metric_date, metric_type)
);

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

-- Lead indexes
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(contact_phone);
CREATE INDEX IF NOT EXISTS idx_leads_bot ON leads(bot_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent_level);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON lead_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_date ON lead_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_direction ON lead_conversations(message_direction);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON lead_activities(created_at DESC);

-- Pipeline stage indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant ON pipeline_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(display_order);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_type ON pipeline_stages(stage_type);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_metrics_date ON sales_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant ON sales_metrics(tenant_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON sales_metrics(metric_type);

-- ============================================
-- 7. INSERT DEFAULT PIPELINE STAGES
-- ============================================
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get default tenant ID
    SELECT id INTO default_tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        -- Only insert if no stages exist for default tenant
        IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE tenant_id = default_tenant_id) THEN
            INSERT INTO pipeline_stages (tenant_id, name, display_name, description, color_code, stage_type, display_order) VALUES
            (default_tenant_id, 'lead', 'Nuevo Lead', 'Lead recién capturado por el bot', '#3B82F6', 'new', 1),
            (default_tenant_id, 'contacted', 'Contactado', 'Primer contacto realizado', '#10B981', 'contacted', 2),
            (default_tenant_id, 'scheduled', 'Cita Agendada', 'Cita o demostración programada', '#8B5CF6', 'scheduled', 3),
            (default_tenant_id, 'proposal', 'Propuesta', 'Propuesta enviada al cliente', '#F59E0B', 'proposal', 4),
            (default_tenant_id, 'negotiation', 'Negociación', 'En negociación de términos', '#EF4444', 'negotiation', 5),
            (default_tenant_id, 'won', 'Cerrado Ganado', 'Venta concretada', '#059669', 'won', 6),
            (default_tenant_id, 'lost', 'Perdido', 'Venta perdida o no contestó', '#6B7280', 'lost', 7);
        END IF;
    END IF;
END $$;

-- ============================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================
DO $$
DECLARE
    tables text[] := ARRAY['pipeline_stages', 'lead_conversations', 'lead_activities', 'sales_metrics'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_insert_policy ON %I', t);
        
        -- Create Isolation Policy (Read, Update, Delete)
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            USING (tenant_id = current_setting(''app.current_tenant'', true)::uuid)
        ', t);
        
        -- Create Insert Policy
        EXECUTE format('
            CREATE POLICY tenant_insert_policy ON %I
            WITH CHECK (tenant_id = current_setting(''app.current_tenant'', true)::uuid)
        ', t);
    END LOOP;
END $$;

-- ============================================
-- 9. ADD TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables that have this column
DO $$
DECLARE
    tables_with_updated_at text[] := ARRAY['pipeline_stages', 'leads'];
BEGIN
    FOREACH t IN ARRAY tables_with_updated_at
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I
        ', t, t);
        
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ', t, t);
    END LOOP;
END $$;

COMMIT;
