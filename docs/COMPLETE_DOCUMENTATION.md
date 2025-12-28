# BotInteligente - SaaS Platform Documentation

**Version:** 1.0.0
**Last Updated:** December 2025

---

## 1. Executive Summary

**BotInteligente** is a comprehensive Multi-Tenant SaaS platform designed to automate sales, customer support, and lead management via WhatsApp. Built for the LATAM market, it emphasizes **Privacy Compliance (LGPD/LFPDPPP)**, **AI-driven interactions (DeepSeek)**, and **Multi-Channel Scalability**.

The platform transforms a traditional single-instance bot solution into a scalable service where multiple companies (tenants) can manage their own bots, leads, and sales pipelines in complete isolation, all served from a single efficient infrastructure.

### Key Value Propositions
*   **Multi-Tenancy:** Strict data isolation using PostgreSQL Row-Level Security (RLS).
*   **AI Core:** DeepSeek integration for context-aware, human-like conversations.
*   **Compliance:** Built-in Privacy Portal for ARCO rights management and automated data minimization.
*   **Omnichannel:** Robust WhatsApp integration via Baileys with multi-session support.

---

## 2. Functional Pillars

### 2.1. AI Core (DeepSeek)
The platform utilizes **DeepSeek AI** to power intelligent conversations.
*   **System Prompts:** Each tenant can configure custom system prompts to define their bot's persona (e.g., "Sales Agent", "Support Rep").
*   **Context Awareness:** The AI engine maintains conversation history per lead to provide relevant responses.
*   **Rate Limiting:** Usage is tracked and limited per tenant to ensure fair resource distribution.

### 2.2. CRM & Sales Automation
Beyond simple chat, BotInteligente functions as a lightweight CRM.
*   **Lead Management:** Automatically captures leads from WhatsApp conversations.
*   **Pipeline Tracking:** Tracks lead status (New, Qualified, Closed).
*   **Scoring:** Configurable lead scoring rules based on user interactions.
*   **Product Management:** Tenants can manage product catalogs and send product details via chat.

### 2.3. Multi-Channel Bots (WhatsApp/Baileys)
*   **Session Management:** Uses `@whiskeysockets/baileys` to manage multiple WhatsApp sessions simultaneously.
*   **Isolation:** Session files are stored in `auth-sessions/{tenantId}/{botId}/` to prevent cross-tenant leakage.
*   **QR Login:** Easy pairing process for tenants to connect their WhatsApp Business accounts.

### 2.4. Compliance (Privacy Portal)
A dedicated module ensures adherence to data protection laws.
*   **ARCO Rights:** Tenants can manage Access, Rectification, Cancellation, and Opposition requests.
*   **Audit Logs:** Critical actions (login, exports, deletions) are logged for security.
*   **Data Retention:** Automated jobs clean up old messages to minimize data liability.

---

## 3. Technical Architecture

### 3.1. Technology Stack
*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js
*   **Frontend:** React (Vite) + Tailwind CSS
*   **Database:** PostgreSQL (with `pgcrypto` and RLS)
*   **Cache/Queue:** Redis (for rate limiting and job queues)
*   **Storage:** Cloudflare R2 (compatible with S3) for media and session backups.
*   **Infrastructure:** Railway (Deployment & Orchestration)

### 3.2. Multi-Tenancy Model
We implement a **Shared Database, Shared Schema** strategy reinforced by **Row-Level Security (RLS)**.

#### 3.2.1. The `tenants` Table
The root of the hierarchy. Every resource belongs to a tenant.
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}'
);
```

#### 3.2.2. Row-Level Security (RLS)
Isolation is enforced at the database level, not just the application level.
*   **Session Variable:** `app.current_tenant` is set at the start of every transaction.
*   **Policy:** Tables have policies like:
    ```sql
    CREATE POLICY tenant_isolation_policy ON leads
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
    ```
*   **Middleware:** `middleware/tenantMiddleware.js` extracts the `tenant_id` from the authenticated user and wraps the request in a `runWithTenant` context.

### 3.3. Database Schema Overview
Key tables and their relationships:
*   **`users`**: Platform users. Linked to `tenants(id)`.
*   **`bots`**: WhatsApp bot instances. Linked to `tenants(id)`.
*   **`leads`**: End-users interacting with bots. Linked to `tenants(id)`.
*   **`lead_messages`**: Chat history. Linked to `tenants(id)`.
*   **`privacy_requests`**: ARCO requests. Linked to `tenants(id)`.
*   **`audit_logs`**: Security logs. Linked to `tenants(id)`.

---

## 4. Key Modules & Implementation Details

### 4.1. Auth & Session Management
*   **Authentication:** Google OAuth2 (Passport.js).
*   **Session Handling:** JWT (JSON Web Tokens).
*   **Tenant Context:** The JWT payload includes the `tenant_id`.
*   **Flow:**
    1.  User logs in via Google.
    2.  System checks if user exists.
    3.  If new, creates User + Default Tenant + Free Subscription.
    4.  JWT is issued with `tenant_id`.
    5.  Subsequent requests use `tenantMiddleware` to set DB context.

### 4.2. AI Engine (DeepSeek)
*   **Service:** `services/deepseekService.js`
*   **Integration:** Calls DeepSeek API with conversation history.
*   **System Prompt:** Dynamic construction based on Tenant Settings + Bot Persona.

### 4.3. Compliance Module
*   **Service:** `services/complianceService.js`
*   **Audit Logging:**
    ```javascript
    await logAudit(tenantId, userEmail, 'EXPORT_LEADS', { count: 50 });
    ```
*   **Privacy Requests:** Standardized workflow (PENDING -> PROCESSING -> COMPLETED/REJECTED).

### 4.4. WhatsApp Core (Baileys)
*   **Manager:** `services/baileysManager.js`
*   **File Storage:**
    *   Old: `auth-sessions/session-{botId}`
    *   **New:** `auth-sessions/{tenantId}/{botId}/`
*   **Concurrency:** Validates that a tenant does not exceed their plan's bot limit before spawning new sessions.

---

## 5. Developer Guide

### 5.1. Setup & Installation
1.  **Clone Repository:**
    ```bash
    git clone <repo-url>
    cd whatsapp-bot-manager
    ```
2.  **Environment Variables:**
    Copy `.env.example` to `.env` and populate:
    *   `DATABASE_URL`: PostgreSQL connection string.
    *   `GOOGLE_CLIENT_ID` / `SECRET`: For OAuth.
    *   `JWT_SECRET`: Secure random string.
    *   `DEEPSEEK_API_KEY`: AI provider key.
3.  **Install Dependencies:**
    ```bash
    npm install
    cd client && npm install
    ```

### 5.2. Database Migration
Run the included migration scripts to set up the schema and RLS.
```bash
npm run migrate
```
*   *Note: Ensure `pgcrypto` extension is available in your Postgres instance.*

### 5.3. Running Locally
Use the concurrent runner to start Backend and Frontend.
```bash
npm run dev
```
*   **Backend:** `http://localhost:3000`
*   **Frontend:** `http://localhost:3001` (Vite)

### 5.4. Deployment (Railway)
1.  Connect GitHub repo to Railway.
2.  Add PostgreSQL plugin.
3.  Set environment variables in Railway dashboard.
4.  Deploy. The `nixpacks.toml` or `Procfile` will handle the build command (`npm run build`).

---

## 6. Compliance & Legal (LATAM)

### 6.1. LGPD (Brazil) & LFPDPPP (Mexico)
We meet the requirements for "Data Processors" (Encargados del Tratamiento):
*   **Right to Access:** Users can request their data via the Privacy Portal.
*   **Right to Erasure:** "Right to be Forgotten" is supported via deletion requests.
*   **Security:** Data isolation (RLS) and Audit Logs demonstrate "Accountability".
*   **Data Minimization:** Automated cleanup of old chat logs prevents indefinite storage of PII.

### 6.2. Terms of Use
Tenants are responsible for obtaining consent from their leads (End Users) before initiating marketing conversations. BotInteligente provides the infrastructure but does not manage end-user consent directly.