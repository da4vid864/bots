# CRM Evolution Technical Specification

**Project:** BotInteligente CRM Evolution  
**Date:** December 28, 2025  
**Goal:** Transform the existing WhatsApp Bot SaaS into a full-featured CRM with Customizable Pipelines, Kanban Board, and AI-powered Response Suggestions.

---

## 1. Database Architecture (PostgreSQL)

We will extend the existing multi-tenant schema to support pipelines and enhanced lead tracking. All new tables must support Row Level Security (RLS).

### 1.1 New Tables

#### `pipelines`
Defines the sales processes available in a tenant.
*   `id` (UUID, PK)
*   `tenant_id` (UUID, FK -> tenants.id)
*   `name` (TEXT, e.g., "General Sales")
*   `is_default` (BOOLEAN, default false)
*   `created_at` (TIMESTAMP)

#### `pipeline_stages`
The columns in the Kanban board.
*   `id` (UUID, PK)
*   `pipeline_id` (UUID, FK -> pipelines.id)
*   `name` (TEXT, e.g., "New Lead", "Negotiation", "Closed Won")
*   `position` (INTEGER, for ordering)
*   `color` (TEXT, hex code)
*   `type` (TEXT: 'OPEN', 'WON', 'LOST') - Standard types for reporting

#### `lead_stage_events`
Audit trail for lead movements (replacing simple `updated_at` for analytics).
*   `id` (UUID, PK)
*   `lead_id` (INT, FK -> leads.id)
*   `old_stage_id` (UUID, FK -> pipeline_stages.id, nullable)
*   `new_stage_id` (UUID, FK -> pipeline_stages.id)
*   `changed_by` (TEXT, user email or 'system')
*   `created_at` (TIMESTAMP)

### 1.2 Updates to `leads` Table
*   Add `pipeline_id` (UUID, FK -> pipelines.id, nullable)
*   Add `stage_id` (UUID, FK -> pipeline_stages.id, nullable)
*   Add `owner_user_id` (UUID, FK -> users.id, nullable) - *Optimization: Link to actual user ID instead of just email string*
*   Add `updated_at` (TIMESTAMP)

### 1.3 RLS Policies
All new tables must strictly enforce tenant isolation:
```sql
CREATE POLICY tenant_isolation_policy ON pipelines
USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
```
*(Repeat for `pipeline_stages`)*

---

## 2. API Specification (Express)

### 2.1 Pipelines & Stages

*   **GET /api/pipelines**
    *   Returns list of pipelines with their nested stages for the current tenant.
*   **POST /api/pipelines**
    *   Create a new pipeline.
*   **PUT /api/pipelines/:id/stages/reorder**
    *   Body: `{ stages: [{ id, position }] }`
    *   Updates stage positions in batch.
*   **POST /api/leads/:id/move**
    *   Body: `{ stageId: UUID, pipelineId: UUID }`
    *   Updates lead's stage and records an event in `lead_stage_events`.

### 2.2 AI Suggestions (DeepSeek)

*   **POST /api/ai/suggest-reply**
    *   **Auth:** Required
    *   **Input:**
        ```json
        {
          "leadId": 123,
          "context": "optional extra context",
          "tone": "professional" // or "friendly", "urgent"
        }
        ```
    *   **Logic:**
        1.  Fetch last 10-15 messages for `leadId`.
        2.  Fetch lead metadata (name, products interested in).
        3.  Construct prompt for DeepSeek.
        4.  Return generated text.
    *   **Output:** `{ "suggestion": "Hola Juan, claro, el precio es..." }`

---

## 3. AI Strategy

### 3.1 Context Window Management
We cannot send the entire history. We will implement a sliding window strategy:
*   Fetch the last **15 messages**.
*   Prepend a "System Summary" if available (future feature).
*   Inject Product Catalog context if the user asks about specific products (keyword matching).

### 3.2 System Prompt Template
```text
Role: You are a helpful sales assistant for {Company Name}.
Context: You are replying to a customer on WhatsApp.
Tone: {Tone} (default: Professional yet friendly).
Constraint: Keep replies under 60 words unless detailed info is requested.
Knowledge:
- Customer Name: {Lead Name}
- Interested In: {Tags/Products}
- Message History:
{History}

Instruction: Suggest the next reply to move the sale forward. Do not use placeholders like [Insert Date].
```

---

## 4. Frontend Architecture (React + Vite)

### 4.1 Layout
*   **DashboardLayout**: Updates to include "CRM" or "Kanban" in the sidebar.

### 4.2 Views
1.  **KanbanBoard (`/crm/board`)**
    *   Uses `@dnd-kit/core` for drag-and-drop.
    *   Columns = `PipelineStages`.
    *   Cards = `LeadCard` (Name, Last Message, Score, Owner Avatar).
    *   **Optimistic UI:** Update local state immediately on drop, revert if API fails.

2.  **Enhanced Inbox (`/crm/inbox`)**
    *   Sidebar: Filter by Pipeline Stage.
    *   Chat Area:
        *   "Smart Reply" button above the input field.
        *   Clicking "Smart Reply" shows a loading skeleton, then fills the input area with the suggestion (editable by human).

### 4.3 State Management
*   **`usePipelines` Hook:** Fetches and manages pipeline definitions.
*   **`useLeads` Hook:** Updates to support grouping by stage.
*   **Sync:** When a lead is moved in Kanban, invalidate the `useLeads` query or update local cache to reflect change in Inbox.

---

## 5. Implementation Plan

### Phase 1: Database & Backend Core
1.  [ ] Write Migration `010_crm_pipelines.sql`: Create tables and add columns.
2.  [ ] Update `services/leadDbService.js`: Add methods for pipeline updates.
3.  [ ] Create `services/pipelineService.js`: CRUD for pipelines/stages.
4.  [ ] Implement API Routes in `server.js`.

### Phase 2: AI Backend
1.  [ ] Update `services/deepseekService.js`: Add `generateResponseSuggestion` function.
2.  [ ] Implement prompt engineering with context injection.
3.  [ ] Create endpoint `POST /api/ai/suggest-reply`.

### Phase 3: Frontend - Kanban
1.  [ ] Install `@dnd-kit/core @dnd-kit/sortable`.
2.  [ ] Create `PipelineBoard` component.
3.  [ ] Create `StageColumn` and `LeadCard` components.
4.  [ ] Wire up drag-and-drop to API.

### Phase 4: Frontend - Inbox AI
1.  [ ] Add "Magic Wand" icon to `ChatInterface` input.
2.  [ ] Connect to `suggest-reply` API.
3.  [ ] Handle loading states and error feedback.

### Phase 5: Testing & Refinement
1.  [ ] Test multi-tenant isolation (ensure User A cannot see User B's pipeline).
2.  [ ] Verify "Free Plan" limits (if any) on custom pipelines.
3.  [ ] Deploy.