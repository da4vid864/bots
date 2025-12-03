-- Add score and tags to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create scoring_rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
    id SERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    keyword TEXT NOT NULL,
    match_type TEXT DEFAULT 'contains', -- 'contains', 'exact', 'regex'
    points INTEGER DEFAULT 0,
    response_message TEXT,
    tag_to_add TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);