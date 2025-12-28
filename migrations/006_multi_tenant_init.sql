BEGIN;

-- 1. Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'
);

-- 3. Create Default Tenant and capture its ID (for backfilling)
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Check if default tenant exists, create if not
    SELECT id INTO default_tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, plan, status) 
        VALUES ('Default Tenant', 'free', 'active') 
        RETURNING id INTO default_tenant_id;
    END IF;

    -- 4. Add tenant_id to tables and backfill
    -- We use a helper block to handle each table dynamically to avoid errors if column exists

    -- Table: users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
        ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE users SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: bots
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'tenant_id') THEN
        ALTER TABLE bots ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE bots SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE bots ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: leads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tenant_id') THEN
        ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE leads SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: lead_messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lead_messages' AND column_name = 'tenant_id') THEN
        ALTER TABLE lead_messages ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE lead_messages SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE lead_messages ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tenant_id') THEN
        ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE products SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'tenant_id') THEN
        ALTER TABLE schedules ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE schedules SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE schedules ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: bot_features
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_features' AND column_name = 'tenant_id') THEN
        ALTER TABLE bot_features ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE bot_features SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE bot_features ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: bot_images
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_images' AND column_name = 'tenant_id') THEN
        ALTER TABLE bot_images ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE bot_images SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE bot_images ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

    -- Table: scoring_rules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scoring_rules' AND column_name = 'tenant_id') THEN
        ALTER TABLE scoring_rules ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE scoring_rules SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        ALTER TABLE scoring_rules ALTER COLUMN tenant_id SET NOT NULL;
    END IF;

END $$;

-- 5. Create Compliance Tables

-- privacy_requests
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    requester_email TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'ACCESS', 'DELETE', 'RECTIFY', 'OPPOSE'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'
    details JSONB,
    evidence_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'LOGIN', 'EXPORT_LEADS', 'DELETE_BOT'
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Enable RLS and Create Policies
DO $$
DECLARE
    t text;
    -- List of tables that need RLS
    tables text[] := ARRAY[
        'users', 
        'bots', 
        'leads', 
        'lead_messages', 
        'products', 
        'schedules', 
        'bot_features', 
        'bot_images', 
        'scoring_rules', 
        'privacy_requests', 
        'audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to avoid conflicts during re-runs
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_insert_policy ON %I', t);

        -- Create Isolation Policy (Read, Update, Delete)
        -- Uses current_setting('app.current_tenant', true) to avoid errors if not set (returns null, blocking access)
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

COMMIT;