# Lead Scoring & Automated Response Architecture

## 1. Overview
This document outlines the architecture for implementing Lead Scoring and Automated Responses. The goal is to assign points to leads based on their interactions (keywords) and trigger automated actions (responses, tagging) based on these scores or specific keywords.

## 2. Database Schema Changes

### 2.1. Update `leads` Table
We will enhance the existing `leads` table to store the score and tags.

```sql
ALTER TABLE leads 
ADD COLUMN score INTEGER DEFAULT 0,
ADD COLUMN tags TEXT[] DEFAULT '{}'; -- Array of strings for tags like 'hot', 'interested', 'price-inquiry'
```

### 2.2. New Table `scoring_rules`
This table will define the rules for scoring and automation per bot.

```sql
CREATE TABLE scoring_rules (
    id SERIAL PRIMARY KEY,
    bot_id TEXT NOT NULL,
    keyword TEXT NOT NULL,           -- The word or phrase to look for (e.g., "precio", "demo")
    match_type TEXT DEFAULT 'contains', -- 'contains', 'exact', 'regex'
    points INTEGER DEFAULT 0,        -- Points to add (can be negative)
    response_message TEXT,           -- Optional: Automated text response
    tag_to_add TEXT,                 -- Optional: Tag to apply (e.g., "high-intent")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);
```

## 3. Service Layer Design

### 3.1. `services/scoringService.js` (New)
This service will handle the logic for evaluating messages against rules.

**Key Functions:**
*   `getRules(botId)`: Fetches active rules for a bot (cached ideally).
*   `evaluateMessage(botId, messageText)`: 
    *   Iterates through rules.
    *   Returns object: `{ scoreDelta: number, tags: string[], responses: string[] }`.
*   `applyScoring(leadId, evaluationResult)`:
    *   Updates `leads` table: increments `score`, appends unique `tags`.
    *   Returns updated lead.

### 3.2. `services/leadDbService.js` (Update)
*   Update `getOrCreateLead` to initialize score/tags if needed (defaults handle this).
*   Add method `updateLeadScoreAndTags(leadId, scoreDelta, newTags)`.

## 4. Integration Logic (`services/baileysManager.js`)

The scoring logic will be integrated into the `handleIncomingMessage` pipeline.

**Flow:**
1.  **Receive Message**: User sends a message.
2.  **Get/Create Lead**: Existing logic.
3.  **Scoring & Analysis** (New Step):
    *   Call `scoringService.evaluateMessage(botId, message)`.
    *   If matches found:
        *   Call `scoringService.applyScoring(lead.id, result)`.
        *   If `result.responses` has content:
            *   Send these specific automated responses immediately.
            *   *Decision Point*: Should this stop the AI processing? 
                *   *Strategy*: If a specific "Hard Rule" response is triggered (e.g., "STOP"), maybe stop. For now, we will treat these as "System Injected" responses. The AI can still generate a follow-up if needed, or we can configure the rule to "stop_ai". For simplicity, we will send the automated response and **skip** the AI generation for this turn to avoid double-replying, unless configured otherwise.
4.  **Lead Qualification**:
    *   Check if `lead.score` >= Threshold (e.g., 50).
    *   If yes and status is not 'qualified', auto-qualify or notify sales.

## 5. Chat History
*   **Current State**: `lead_messages` (Postgres) stores history. `chatHistoryService.js` (SQLite) appears unused/redundant for the main bot flow.
*   **Recommendation**: Continue using `lead_messages` in Postgres. It is robust enough. No schema changes needed for `lead_messages`.

## 6. Implementation Plan (Code Mode)

1.  **Database**:
    *   Create migration script `migrations/001_add_scoring.sql`.
    *   Update `services/initDb.js` to run this migration or include schema in fresh init.
2.  **Services**:
    *   Create `services/scoringService.js`.
    *   Update `services/leadDbService.js`.
3.  **Controller/API** (Optional but good):
    *   Add endpoints to CRUD `scoring_rules` so the frontend can configure them.
4.  **Bot Logic**:
    *   Modify `services/baileysManager.js` to import and use `scoringService`.
