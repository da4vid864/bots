BEGIN;

-- 1. Create Pipelines Table
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#e2e8f0',
    type TEXT DEFAULT 'OPEN', -- 'OPEN', 'WON', 'LOST'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Lead Stage Events Table (Audit)
CREATE TABLE IF NOT EXISTS lead_stage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    old_stage_id UUID REFERENCES pipeline_stages(id),
    new_stage_id UUID REFERENCES pipeline_stages(id) NOT NULL,
    changed_by TEXT, -- Email or 'system'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add new columns to leads table
-- We use a DO block to avoid errors if columns already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'pipeline_id') THEN
        ALTER TABLE leads ADD COLUMN pipeline_id UUID REFERENCES pipelines(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'stage_id') THEN
        ALTER TABLE leads ADD COLUMN stage_id UUID REFERENCES pipeline_stages(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'owner_user_id') THEN
        -- Note: users.id is currently INTEGER (SERIAL), so we must use INTEGER, not UUID
        ALTER TABLE leads ADD COLUMN owner_user_id INTEGER REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_at') THEN
        ALTER TABLE leads ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 5. Enable RLS and Create Policies
DO $$
DECLARE
    t text;
    new_tables text[] := ARRAY[
        'pipelines', 
        'pipeline_stages', 
        'lead_stage_events'
    ];
BEGIN
    FOREACH t IN ARRAY new_tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_insert_policy ON %I', t);

        -- Create Isolation Policy
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

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_stage_events(lead_id);

COMMIT;