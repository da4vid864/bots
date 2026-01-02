-- Migration: Conversation Analysis & Lead Processing System
-- Creates tables for conversation analysis and enhanced lead tracking

-- =====================================================
-- CONVERSATION ANALYSIS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Intent Classification
    primary_intent VARCHAR(50) CHECK (primary_intent IN (
        'purchase', 'inquiry', 'support', 'complaint', 'feedback',
        'cancellation', 'renewal', 'appointment', 'information'
    )),
    intent_confidence DECIMAL(5,4) DEFAULT 0,
    intent_evidence JSONB,
    
    -- Interest Scoring
    interest_score INTEGER CHECK (interest_score >= 0 AND interest_score <= 100),
    buying_signals JSONB,
    risk_signals JSONB,
    sentiment_score DECIMAL(5,4),
    
    -- Product/Service Detection
    products_mentioned JSONB,
    services_mentioned JSONB,
    price_inquiries JSONB,
    
    -- Lead Stage Prediction
    predicted_stage VARCHAR(50),
    stage_confidence DECIMAL(5,4),
    stage_indicators JSONB,
    
    -- Follow-up Recommendations
    recommended_followup TIMESTAMP WITH TIME ZONE,
    followup_priority VARCHAR(20) CHECK (followup_priority IN ('high', 'medium', 'low')),
    suggested_actions JSONB,
    
    -- Data Quality
    conversation_length INTEGER,
    message_count INTEGER,
    is_complete_conversation BOOLEAN DEFAULT FALSE,
    analysis_version VARCHAR(20) DEFAULT '1.0',
    
    -- Metadata
    created_by UUID REFERENCES auth_users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(bot_id, tenant_id, contact_phone, analysis_timestamp::date)
);

-- =====================================================
-- CONVERSATION MESSAGES (ENHANCED STORAGE)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    contact_phone VARCHAR(50) NOT NULL,
    message_index INTEGER,
    message_direction VARCHAR(20) NOT NULL CHECK (message_direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
        'text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'interactive'
    )),
    message_content TEXT,
    message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Analysis per message
    intent_classification VARCHAR(50),
    sentiment_score DECIMAL(5,4),
    contains_product_reference BOOLEAN DEFAULT FALSE,
    contains_price_reference BOOLEAN DEFAULT FALSE,
    contains_questions BOOLEAN DEFAULT FALSE,
    question_topics JSONB,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_version VARCHAR(20) DEFAULT '1.0',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEAD CONTACT TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    
    -- Contact quality
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    first_contact_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    
    -- Aggregate analysis
    avg_interest_score DECIMAL(5,2),
    dominant_intent VARCHAR(50),
    products_of_interest JSONB,
    last_stage_prediction VARCHAR(50),
    
    -- Tags
    tags JSONB DEFAULT '[]',
    
    -- Status
    is_qualified_lead BOOLEAN DEFAULT FALSE,
    qualification_score INTEGER,
    needs_review BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID REFERENCES auth_users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(bot_id, tenant_id, contact_phone)
);

-- =====================================================
-- ANALYSIS JOBS (FOR BATCH PROCESSING)
-- =====================================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('full', 'incremental', 'realtime')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Scope
    date_from TIMESTAMP WITH TIME ZONE,
    date_to TIMESTAMP WITH TIME ZONE,
    contact_filter JSONB,
    
    -- Progress
    total_contacts INTEGER DEFAULT 0,
    processed_contacts INTEGER DEFAULT 0,
    failed_contacts INTEGER DEFAULT 0,
    current_contact VARCHAR(50),
    
    -- Results
    results_summary JSONB,
    error_log JSONB DEFAULT '[]',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES auth_users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversation Analysis Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_bot 
    ON conversation_analysis(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_tenant 
    ON conversation_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_phone 
    ON conversation_analysis(contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_intent 
    ON conversation_analysis(primary_intent);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_stage 
    ON conversation_analysis(predicted_stage);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_date 
    ON conversation_analysis(analysis_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_priority 
    ON conversation_analysis(followup_priority);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_interest 
    ON conversation_analysis(interest_score DESC);

-- Conversation Messages Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_bot 
    ON conversation_messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_tenant 
    ON conversation_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_phone 
    ON conversation_messages(contact_phone, message_timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp 
    ON conversation_messages(message_timestamp DESC);

-- Lead Contacts Indexes
CREATE INDEX IF NOT EXISTS idx_lead_contacts_bot 
    ON lead_contacts(bot_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_tenant 
    ON lead_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_phone 
    ON lead_contacts(contact_phone);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_qualified 
    ON lead_contacts(is_qualified_lead);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_score 
    ON lead_contacts(qualification_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_needs_review 
    ON lead_contacts(needs_review);

-- Analysis Jobs Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_bot 
    ON analysis_jobs(bot_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_tenant 
    ON analysis_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status 
    ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created 
    ON analysis_jobs(created_at DESC);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key for analysis to lead_contacts
ALTER TABLE conversation_analysis 
    ADD CONSTRAINT fk_conversation_analysis_lead_contact 
    FOREIGN KEY (bot_id, tenant_id, contact_phone) 
    REFERENCES lead_contacts(bot_id, tenant_id, contact_phone);

-- Add foreign key for messages to lead_contacts
ALTER TABLE conversation_messages 
    ADD CONSTRAINT fk_conversation_messages_lead_contact 
    FOREIGN KEY (bot_id, tenant_id, contact_phone) 
    REFERENCES lead_contacts(bot_id, tenant_id, contact_phone);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversation_analysis IS 'Stores conversation analysis results including intent classification, interest scoring, and stage prediction';
COMMENT ON TABLE conversation_messages IS 'Enhanced message storage with per-message analysis results';
COMMENT ON TABLE lead_contacts IS 'Aggregate contact tracking with cumulative analysis metrics';
COMMENT ON TABLE analysis_jobs IS 'Tracks batch analysis job progress and results';

COMMENT ON COLUMN conversation_analysis.primary_intent IS 'Primary conversation intent: purchase, inquiry, support, complaint, feedback, cancellation, renewal, appointment, information';
COMMENT ON COLUMN conversation_analysis.interest_score IS 'Lead interest score from 0-100 based on buying signals and engagement';
COMMENT ON COLUMN conversation_analysis.predicted_stage IS 'Predicted pipeline stage: new, contacted, qualified, proposal, negotiation, won, lost';
COMMENT ON COLUMN conversation_analysis.followup_priority IS 'Follow-up priority level: high, medium, low';
