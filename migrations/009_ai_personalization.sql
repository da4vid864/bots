BEGIN;

-- Add system_prompt_template to bots if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bots' AND column_name = 'system_prompt_template') THEN
        ALTER TABLE bots ADD COLUMN system_prompt_template TEXT;
    END IF;
END $$;

-- Update tenant settings JSON schema validation if necessary
-- For now we just ensure the column exists.
-- The deepseekService will prioritize this column, 
-- or fallback to a 'system_prompt' in the tenant settings, 
-- or finally the default generic prompt.

COMMIT;