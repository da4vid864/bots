-- Migration 012: Standardize all IDs to UUID for consistency
-- This migration converts the users.id column from INTEGER to UUID
-- to maintain consistency with other tables that use UUID primary keys.

BEGIN;

-- 1. First, check if users.id is already UUID
DO $$
DECLARE
    data_type text;
BEGIN
    SELECT data_type INTO data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    IF data_type = 'integer' THEN
        RAISE NOTICE 'users.id is INTEGER, converting to UUID...';
        
        -- Create a temporary UUID column
        ALTER TABLE users ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
        
        -- Update all foreign key references to use the new UUID
        -- First, update leads.owner_user_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'owner_user_id'
        ) THEN
            -- Create a mapping table for the conversion
            CREATE TEMP TABLE user_id_mapping AS
            SELECT id as old_id, new_id
            FROM users;
            
            -- Update leads.owner_user_id to use UUID
            UPDATE leads l
            SET owner_user_id = um.new_id::text
            FROM user_id_mapping um
            WHERE l.owner_user_id::integer = um.old_id;
            
            RAISE NOTICE 'Updated leads.owner_user_id to UUID';
        END IF;
        
        -- Drop the old primary key constraint
        ALTER TABLE users DROP CONSTRAINT users_pkey;
        
        -- Drop the old id column
        ALTER TABLE users DROP COLUMN id;
        
        -- Rename new_id to id
        ALTER TABLE users RENAME COLUMN new_id TO id;
        
        -- Add primary key constraint
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        -- Update the sequence if one exists (though UUID doesn't need it)
        DROP SEQUENCE IF EXISTS users_id_seq;
        
        RAISE NOTICE 'Successfully converted users.id to UUID';
    ELSE
        RAISE NOTICE 'users.id is already UUID (type: %), no conversion needed', data_type;
    END IF;
END $$;

-- 2. Ensure all foreign key columns referencing users.id are UUID type
DO $$
BEGIN
    -- Check leads.owner_user_id data type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'owner_user_id'
    ) THEN
        -- Get current data type
        DECLARE
            col_data_type text;
        BEGIN
            SELECT data_type INTO col_data_type
            FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'owner_user_id';
            
            IF col_data_type = 'integer' THEN
                -- Convert to UUID
                ALTER TABLE leads 
                ALTER COLUMN owner_user_id TYPE UUID 
                USING owner_user_id::text::UUID;
                
                RAISE NOTICE 'Converted leads.owner_user_id to UUID type';
            END IF;
        END;
    END IF;
END $$;

-- 3. Update any other tables that might reference users.id with INTEGER
-- Note: This is a placeholder for future tables that might need conversion

-- 4. Add UUID validation to all UUID columns for consistency
DO $$
DECLARE
    table_rec record;
    col_rec record;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        FOR col_rec IN
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_rec.table_name
            AND column_name LIKE '%_id'
            AND data_type = 'uuid'
        LOOP
            -- Create a check constraint for UUID format
            EXECUTE format('
                ALTER TABLE %I 
                DROP CONSTRAINT IF EXISTS %I;
            ', table_rec.table_name, 'chk_' || col_rec.column_name || '_uuid_format');
            
            EXECUTE format('
                ALTER TABLE %I 
                ADD CONSTRAINT %I 
                CHECK (%I IS NULL OR %I::text ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'');
            ', table_rec.table_name, 'chk_' || col_rec.column_name || '_uuid_format',
               col_rec.column_name, col_rec.column_name);
        END LOOP;
    END LOOP;
END $$;

-- 5. Log the migration in audit logs
DO $$
DECLARE
    system_tenant_id UUID;
BEGIN
    -- Get a tenant ID to use for system audit (use default tenant)
    SELECT id INTO system_tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1;
    
    IF system_tenant_id IS NOT NULL THEN
        INSERT INTO audit_logs (tenant_id, user_email, action, resource_id, details)
        VALUES (
            system_tenant_id,
            'system@botinteligente.com',
            'SCHEMA_MIGRATION',
            'migration_012',
            '{"migration": "012_standardize_uuid_ids", "description": "Standardized all IDs to UUID for consistency"}'
        );
        
        RAISE NOTICE 'Logged migration in audit_logs';
    END IF;
END $$;

COMMIT;

-- Migration completed successfully
-- WARNING: This migration modifies primary key types and may break existing applications
-- if they rely on INTEGER IDs. Ensure all application code uses UUID strings.