-- Migration 011: Add missing foreign key constraints for referential integrity
-- This migration adds foreign keys that were missing in the original schema
-- to ensure data consistency and prevent orphaned records.
-- Uses safe checks to handle missing tables/columns gracefully.

BEGIN;

-- Helper function to safely add foreign keys only if tables and columns exist
DO $$
DECLARE
    table_exists boolean;
    column_exists boolean;
    constraint_exists boolean;
BEGIN
    -- 1. Add foreign key from leads.assigned_to to users.email (if both tables exist)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'assigned_to'
        ) INTO column_exists;
        
        IF column_exists THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'leads' AND constraint_name = 'fk_leads_assigned_to_user'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Clean up orphaned records first
                UPDATE leads 
                SET assigned_to = NULL 
                WHERE assigned_to IS NOT NULL 
                  AND assigned_to NOT IN (SELECT email FROM users WHERE email IS NOT NULL);
                
                -- Add the foreign key constraint
                ALTER TABLE leads 
                ADD CONSTRAINT fk_leads_assigned_to_user 
                FOREIGN KEY (assigned_to) REFERENCES users(email) 
                ON DELETE SET NULL;
                
                RAISE NOTICE 'Added fk_leads_assigned_to_user constraint';
            END IF;
        END IF;
    END IF;
    
    -- 2. Add foreign key from schedules.created_by to users.email
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'schedules' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'schedules' AND column_name = 'created_by'
        ) INTO column_exists;
        
        IF column_exists THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'schedules' AND constraint_name = 'fk_schedules_created_by_user'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Clean up orphaned records
                UPDATE schedules
                SET created_by = 'system'
                WHERE created_by IS NOT NULL
                  AND created_by NOT IN (SELECT email FROM users WHERE email IS NOT NULL);
                
                ALTER TABLE schedules
                ADD CONSTRAINT fk_schedules_created_by_user
                FOREIGN KEY (created_by) REFERENCES users(email)
                ON DELETE SET NULL;
                
                RAISE NOTICE 'Added fk_schedules_created_by_user constraint';
            END IF;
        END IF;
    END IF;
    
    -- 3. Add foreign key from bot_images.bot_id to bots.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bot_images' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bot_images' AND column_name = 'bot_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'bot_images' AND constraint_name = 'fk_bot_images_bot'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Clean orphaned records
                DELETE FROM bot_images 
                WHERE bot_id NOT IN (SELECT id FROM bots WHERE id IS NOT NULL);
                
                ALTER TABLE bot_images
                ADD CONSTRAINT fk_bot_images_bot
                FOREIGN KEY (bot_id) REFERENCES bots(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Added fk_bot_images_bot constraint';
            END IF;
        END IF;
    END IF;
    
    -- 4. Add foreign key from leads.owner_user_id to users.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'owner_user_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'leads' AND constraint_name = 'fk_leads_owner_user'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Clean orphaned records
                UPDATE leads
                SET owner_user_id = NULL
                WHERE owner_user_id IS NOT NULL
                  AND owner_user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);
                
                ALTER TABLE leads
                ADD CONSTRAINT fk_leads_owner_user
                FOREIGN KEY (owner_user_id) REFERENCES users(id)
                ON DELETE SET NULL;
                
                RAISE NOTICE 'Added fk_leads_owner_user constraint';
            END IF;
        END IF;
    END IF;
    
    -- 5. Add foreign key from scoring_rules.bot_id to bots.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'scoring_rules' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'scoring_rules' AND column_name = 'bot_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Drop existing constraint if it has a different name
            EXECUTE 'ALTER TABLE scoring_rules DROP CONSTRAINT IF EXISTS scoring_rules_bot_id_fkey';
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'scoring_rules' AND constraint_name = 'fk_scoring_rules_bot'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                -- Clean orphaned records
                DELETE FROM scoring_rules 
                WHERE bot_id NOT IN (SELECT id FROM bots WHERE id IS NOT NULL);
                
                ALTER TABLE scoring_rules
                ADD CONSTRAINT fk_scoring_rules_bot
                FOREIGN KEY (bot_id) REFERENCES bots(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Added fk_scoring_rules_bot constraint';
            END IF;
        END IF;
    END IF;
    
    -- 6. Add foreign key from products.bot_id to bots.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'bot_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_bot_id_fkey';
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'products' AND constraint_name = 'fk_products_bot'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                DELETE FROM products 
                WHERE bot_id NOT IN (SELECT id FROM bots WHERE id IS NOT NULL);
                
                ALTER TABLE products
                ADD CONSTRAINT fk_products_bot
                FOREIGN KEY (bot_id) REFERENCES bots(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Added fk_products_bot constraint';
            END IF;
        END IF;
    END IF;
    
    -- 7. Add foreign key from bot_features.bot_id to bots.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bot_features' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bot_features' AND column_name = 'bot_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            EXECUTE 'ALTER TABLE bot_features DROP CONSTRAINT IF EXISTS bot_features_bot_id_fkey';
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'bot_features' AND constraint_name = 'fk_bot_features_bot'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                DELETE FROM bot_features 
                WHERE bot_id NOT IN (SELECT id FROM bots WHERE id IS NOT NULL);
                
                ALTER TABLE bot_features
                ADD CONSTRAINT fk_bot_features_bot
                FOREIGN KEY (bot_id) REFERENCES bots(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Added fk_bot_features_bot constraint';
            END IF;
        END IF;
    END IF;
    
    -- 8. Add foreign key from schedules.bot_id to bots.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'schedules' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'schedules' AND column_name = 'bot_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            EXECUTE 'ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_bot_id_fkey';
            
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'schedules' AND constraint_name = 'fk_schedules_bot'
            ) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                DELETE FROM schedules 
                WHERE bot_id NOT IN (SELECT id FROM bots WHERE id IS NOT NULL);
                
                ALTER TABLE schedules
                ADD CONSTRAINT fk_schedules_bot
                FOREIGN KEY (bot_id) REFERENCES bots(id)
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Added fk_schedules_bot constraint';
            END IF;
        END IF;
    END IF;
    
END $$;

-- 9. Create indexes for better performance on foreign key columns
DO $$
BEGIN
    -- Check if leads table exists before creating index
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_leads_owner_user_id ON leads(owner_user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
        CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);
        CREATE INDEX IF NOT EXISTS idx_schedules_bot_id ON schedules(bot_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_images') THEN
        CREATE INDEX IF NOT EXISTS idx_bot_images_bot_id ON bot_images(bot_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scoring_rules') THEN
        CREATE INDEX IF NOT EXISTS idx_scoring_rules_bot_id ON scoring_rules(bot_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE INDEX IF NOT EXISTS idx_products_bot_id ON products(bot_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_features') THEN
        CREATE INDEX IF NOT EXISTS idx_bot_features_bot_id ON bot_features(bot_id);
    END IF;
END $$;

-- 10. Add validation for email format in users table (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_format_check;
        
        -- Add new constraint for email format validation
        ALTER TABLE users
        ADD CONSTRAINT users_email_format_check 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
        
        RAISE NOTICE 'Added users_email_format_check constraint';
    END IF;
END $$;

-- 11. Add validation for WhatsApp number format in leads (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_whatsapp_number_format_check;
        
        -- Add new constraint for WhatsApp number format (E.164)
        -- Note: This is a basic validation, can be adjusted as needed
        ALTER TABLE leads
        ADD CONSTRAINT leads_whatsapp_number_format_check
        CHECK (whatsapp_number IS NULL OR whatsapp_number ~* '^\+[1-9]\d{1,14}$');
        
        RAISE NOTICE 'Added leads_whatsapp_number_format_check constraint';
    END IF;
END $$;

-- 12. Log the migration in audit logs (system action)
-- Note: This requires a system tenant context, which we'll handle by temporarily disabling RLS
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
            'migration_011',
            '{"migration": "011_add_missing_foreign_keys", "description": "Added missing foreign key constraints for referential integrity"}'
        );
        
        RAISE NOTICE 'Logged migration in audit_logs';
    END IF;
END $$;

COMMIT;

-- Migration completed successfully
-- Note: This migration is idempotent and can be run multiple times safely