# SaaS Transformation Architecture: Multi-Tenancy & Privacy Compliance

## 1. High-Level Architecture

The transformed architecture moves from a single-instance model to a strict Multi-Tenant SaaS platform using PostgreSQL Row-Level Security (RLS) for data isolation.

```mermaid
graph TD
    User[End User / Tenant] -->|HTTPS| API_GW[API Gateway / Load Balancer]
    API_GW -->|Request + Auth Token| App_Server[Node.js Application Server]
    
    subgraph "Application Layer"
        App_Server -->|1. Auth & Context| Middleware[Tenant Context Middleware]
        Middleware -->|2. Scoped Request| Services[Service Layer]
        Services -->|3. Data Access| Repositories[Repository Layer]
    end
    
    subgraph "Data Layer (PostgreSQL)"
        Repositories -->|SQL + tenant_id| DB[(PostgreSQL Database)]
        DB -->|RLS Policy| TenantData[Tenant Isolated Data]
    end
    
    subgraph "External Services"
        Services -->|Session Management| Baileys[Baileys WhatsApp Manager]
        Services -->|Inference| DeepSeek[DeepSeek AI API]
        Services -->|Object Storage| R2[Cloudflare R2]
    end
    
    subgraph "Compliance"
        App_Server -->|Audit| AuditLog[Audit Logger]
        User -->|Privacy Request| PrivacyPortal[Privacy Portal (ARCO)]
    end
```

## 2. Multi-Tenancy Design (PostgreSQL RLS)

We will implement **Shared Database, Shared Schema** multi-tenancy, isolating data using a `tenant_id` column and PostgreSQL Row-Level Security (RLS).

### 2.1. Database Schema Changes

Every table containing tenant-specific data MUST have a `tenant_id` column.

**Core Tables to Modify:**
1.  `users` (Add `tenant_id` UUID)
2.  `bots` (Add `tenant_id` UUID)
3.  `leads` (Add `tenant_id` UUID)
4.  `lead_messages` (Add `tenant_id` UUID)
5.  `products` (Add `tenant_id` UUID)
6.  `schedules` (Add `tenant_id` UUID)
7.  `bot_features` (Add `tenant_id` UUID)
8.  `bot_images` (Add `tenant_id` UUID)
9.  `scoring_rules` (Add `tenant_id` UUID)

**New Table: `tenants`**
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}' -- Custom configurations
);
```

### 2.2. Row-Level Security (RLS) Implementation

We will use a session variable `app.current_tenant` to enforce isolation.

**Step 1: Enable RLS on Tables**
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Repeat for all tenant tables
```

**Step 2: Create RLS Policy**
```sql
CREATE POLICY tenant_isolation_policy ON leads
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- For INSERTs, ensure the tenant_id matches
CREATE POLICY tenant_insert_policy ON leads
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
```

**Step 3: Database Connection Strategy**
Do NOT set `app.current_tenant` globally. Instead, use a transaction-scoped setting in the Repository layer or a specialized Database Client wrapper.

```javascript
// Example Repository implementation
async function queryWithTenant(text, params, tenantId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
        const res = await client.query(text, params);
        await client.query('COMMIT');
        return res;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
```

### 2.3. Request Context Middleware

We will implement a middleware that runs *after* authentication to establish the tenant context.

```javascript
// middleware/tenantContext.js
const tenantContext = async (req, res, next) => {
    if (!req.user) return next(); // Public route?

    // 1. Determine Tenant ID from User
    // Users table will link to a tenant_id
    const tenantId = req.user.tenant_id; 

    if (!tenantId) {
        return res.status(403).json({ error: 'User not associated with a tenant' });
    }

    // 2. Attach to Request Object
    req.tenantId = tenantId;
    
    // 3. (Optional) Initialize AsyncLocalStorage for deep propogation
    // global.storage.run({ tenantId }, next);
    
    next();
};
```

## 3. Compliance & Privacy Architecture (LGPD/LFPDPPP)

### 3.1. Privacy Portal Data Model
A dedicated module to handle ARCO rights (Access, Rectification, Cancellation, Opposition).

**Table: `privacy_requests`**
```sql
CREATE TABLE privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    requester_email TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'ACCESS', 'DELETE', 'RECTIFY', 'OPPOSE'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'
    details JSONB, -- Specific data requested or changed
    evidence_url TEXT, -- Link to proof of ID if stored securely
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
```

### 3.2. Data Minimization & Retention
*   **Policy:** Automated cleanup of `lead_messages` older than X days (configurable per tenant, default 90 days).
*   **Implementation:** Cron job running a `DELETE` query filtered by `tenant_id` and `created_at`.

### 3.3. Audit Logs
Track sensitive actions (login, export data, delete bot, change role).

**Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'LOGIN', 'EXPORT_LEADS', 'DELETE_BOT'
    resource_id TEXT, -- ID of the affected object
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Refactoring Strategy

### 4.1. Repository Pattern
Move all SQL queries from `services/*.js` to `repositories/*.js`. This decouples business logic from data access and makes RLS enforcement consistent.

**Structure:**
*   `repositories/BaseRepository.js`: Handles DB connection and setting `app.current_tenant`.
*   `repositories/LeadRepository.js`: Extends Base, methods like `findById`, `create`, `findByStatus`.
*   `services/LeadService.js`: Contains business logic (scoring, validation), calls Repository.

### 4.2. Baileys Manager Multi-Tenancy
The `activeSessions` Map in `baileysManager.js` is currently a global singleton. It must be keyed safely.
*   **Current Key:** `botId` (String).
*   **New Key strategy:** `tenantId:botId` (String) to prevent collisions if bot IDs are not UUIDs.
*   **File System:** `auth-sessions/` folder must be structured as `auth-sessions/{tenantId}/{botId}/` to prevent credential leakage between tenants.

### 4.3. DeepSeek AI Integration
*   Centralized `DeepSeekService`.
*   **Rate Limiting:** Enforce limits *per tenant* using Redis or database counters.
*   **Context Isolation:** Ensure the prompt sent to DeepSeek only includes history from the specific `tenant_id` and `lead_id`.

## 5. Migration Roadmap

1.  **Phase 1: Foundation (Current Sprint)**
    *   Create `tenants` table.
    *   Add `tenant_id` to `users` and `bots`.
    *   Create a "Default Tenant" and migrate existing users/bots to it.
    *   Implement `TenantRepository`.

2.  **Phase 2: Data Isolation**
    *   Add `tenant_id` to all remaining tables (`leads`, `messages`, etc.).
    *   Backfill `tenant_id` based on bot ownership.
    *   Enable RLS on all tables.
    *   Update `db.js` to support transaction-scoped configuration.

3.  **Phase 3: Refactoring**
    *   Refactor `userService` and `botDbService` to use Repositories.
    *   Implement `tenantContext` middleware.
    *   Update `baileysManager` to use structured paths.

4.  **Phase 4: Compliance Features**
    *   Create `audit_logs` table and logger service.
    *   Implement Privacy Portal API endpoints.
    *   Configure data retention cron jobs.