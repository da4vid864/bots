// middleware/tenantMiddleware.js
const { runWithTenant } = require('../services/db');

/**
 * Middleware to establish the tenant context for the request.
 * It expects the user to be authenticated and have a 'tenant_id' in their profile/token.
 * 
 * Flow:
 * 1. Checks if req.user exists (set by Passport/Auth middleware).
 * 2. If present, extracts tenant_id.
 * 3. Wraps the `next()` call in `runWithTenant` so all downstream DB calls use this tenant.
 */
const tenantMiddleware = (req, res, next) => {
    // If we have an authenticated user with a tenant_id
    if (req.user && req.user.tenant_id) {
        const tenantId = req.user.tenant_id;
        
        // Log for debugging (remove in production or use debug level)
        // console.log(`🔒 Tenant Context Set: ${tenantId} for user ${req.user.email}`);

        // Run the rest of the request chain within the tenant context
        runWithTenant(tenantId, () => {
            next();
        });
    } else {
        // If no user/tenant (public endpoint or not logged in), proceed without tenant context.
        // The DB layer will default to "no tenant" (RESET app.current_tenant),
        // which means RLS policies will block access to tenant-specific data.
        // console.log('🔓 No Tenant Context (Public/System)');
        next();
    }
};

module.exports = tenantMiddleware;