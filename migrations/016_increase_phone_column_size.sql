-- Migration: 016_increase_phone_column_size.sql
-- Purpose: Increase the size of phone number columns to accommodate long IDs (like LID)
-- Date: 2025-12-31

BEGIN;

-- Drop dependent views
DROP VIEW IF EXISTS vw_chats_by_category;
DROP VIEW IF EXISTS vw_active_sessions;

-- Increase column size in analyzed_chats
ALTER TABLE analyzed_chats ALTER COLUMN contact_phone TYPE VARCHAR(100);

-- Increase column size in bot_sessions
ALTER TABLE bot_sessions ALTER COLUMN phone TYPE VARCHAR(100);

-- Recreate view vw_chats_by_category
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

-- Recreate view vw_active_sessions
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

COMMIT;