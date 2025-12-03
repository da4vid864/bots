# Implementation Plan: Lead Scoring & Automated Responses

This plan outlines the steps to implement the Lead Scoring and Automated Response architecture in **Code** mode.

## Phase 1: Database Schema Updates

### 1. Create Migration File
*   **File:** `migrations/001_add_scoring.sql` (New File)
*   **Content:**
    *   SQL to add `score` and `tags` columns to the `leads` table.
    *   SQL to create the `scoring_rules` table.

### 2. Update Initialization Script
*   **File:** `services/initDb.js`
*   **Action:**
    *   Add the `scoring_rules` table creation query to the `initializeDatabase` function.
    *   Add logic to check for and add `score` and `tags` columns to `leads` if they don't exist (idempotent migration).

## Phase 2: Backend Services

### 3. Create Scoring Service
*   **File:** `services/scoringService.js` (New File)
*   **Responsibilities:**
    *   `getScoringRules(botId)`: Fetch active rules from the database.
    *   `evaluateMessage(botId, message)`: Analyze message text against rules to determine score changes, tags to add, and responses to send.
    *   `applyScoring(leadId, evaluationResult)`: Update the lead's score and tags in the database.

### 4. Update Lead Database Service
*   **File:** `services/leadDbService.js`
*   **Action:**
    *   Add `updateLeadScoreAndTags(leadId, scoreDelta, tags)` function.
    *   Ensure `getOrCreateLead` returns the new fields.

## Phase 3: Integration

### 5. Integrate with Baileys Manager
*   **File:** `services/baileysManager.js`
*   **Action:**
    *   Import `scoringService`.
    *   Modify `handleIncomingMessage`:
        1.  **Analyze:** Call `scoringService.evaluateMessage` with the incoming user message.
        2.  **Apply:** If there are score updates or tags, call `scoringService.applyScoring`.
        3.  **Respond:** If the evaluation returns an automated response:
            *   Send the automated response immediately.
            *   *Logic Decision:* If an automated response is sent, we will **skip** the AI generation for this turn to avoid conflicting or redundant replies, unless the rule specifies otherwise (for MVP, we skip AI if rule triggers).
        4.  **Qualify:** Check if the new score crosses a threshold (e.g., 50 points) and trigger `qualifyLead` if needed.

## Phase 4: Verification

### 6. Testing Steps
*   **Manual Test:**
    *   Insert a test rule into `scoring_rules` (e.g., keyword "precio", points +10, response "Nuestros precios inician en $500").
    *   Send a WhatsApp message "Hola, cual es el precio?".
    *   **Verify:**
        *   Bot replies with "Nuestros precios inician en $500".
        *   Database shows lead has `score = 10` and potentially a tag.
        *   AI does not send a second generic response.