// services/userService.js
const pool = require('./db');

// WARNING: Most functions here deal with User/Team Management.
// Since 'users' table is RLS-protected, normal queries will only see users in the current tenant.
// For Login/Registration, we need to bypass RLS using the SECURITY DEFINER functions created in migration 007.

/**
 * Agregar un nuevo usuario al equipo (Tenant actual)
 */
async function addTeamMember(email, role, addedBy) {
    try {
        // Here we rely on RLS. If the current user is an admin of the tenant,
        // they can insert into 'users' table for their tenant.
        // The RLS policy 'tenant_insert_policy' checks if the inserted tenant_id matches the session.
        // BUT: We need to manually supply tenant_id or have a trigger?
        // Actually, the RLS policy for INSERT checks: WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)
        // So we MUST include the tenant_id in the INSERT or have a default.
        // It's cleaner to use a helper that grabs the current tenant or just rely on the fact 
        // that we are in a tenant context.
        
        // HOWEVER: The 'users' table has a NOT NULL constraint on tenant_id.
        // If we don't supply it in INSERT, it fails unless there's a default.
        // We can get the tenant_id from the current session context if we were using a trigger, 
        // but here we are in Node.js.
        
        // Since we are using RLS, we can just execute the query. 
        // BUT standard SQL INSERT needs the value.
        // Let's assume we are in a tenant context (runWithTenant).
        // We can use `current_setting('app.current_tenant')` in the query itself!
        
        const result = await pool.query(
            `INSERT INTO users (email, role, added_by, tenant_id) 
             VALUES ($1, $2, $3, current_setting('app.current_tenant')::uuid) 
             RETURNING *`,
            [email.toLowerCase().trim(), role, addedBy]
        );
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('Este email ya está registrado');
        }
        throw error;
    }
}

/**
 * Crear un nuevo usuario y su Tenant (Self-Registration)
 * USES SECURITY DEFINER FUNCTION (Bypasses RLS)
 */
async function createUser(email, role = 'vendor', addedBy = 'system') {
    try {
        // Utiliza la función del sistema que crea Tenant + User atómicamente y salta RLS
        const result = await pool.query(
            `SELECT id, email, role, is_active, tenant_id, added_by, created_at 
             FROM create_tenant_and_user_system($1, $2, $3)`,
            [email.toLowerCase().trim(), role, addedBy]
        );
        
        // The function returns user with id, email, role, etc.
        const user = result.rows[0];
        
        // Return the user object with all fields
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id,
            added_by: user.added_by,
            is_active: user.is_active,
            created_at: user.created_at
        };
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return getUserByEmail(email);
        }
        throw error;
    }
}

/**
 * Obtener todos los miembros del equipo agregados por un admin
 * (Respects RLS - only sees users in current tenant)
 */
async function getTeamMembers(adminEmail) {
    try {
        // RLS ensures we only see our tenant's users
        // added_by check is secondary logic, but acceptable
        const result = await pool.query(
            'SELECT * FROM users WHERE added_by = $1 ORDER BY created_at DESC',
            [adminEmail]
        );
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo miembros del equipo:', error);
        return [];
    }
}

/**
 * Obtener usuario por email (Login / Auth check)
 * USES SECURITY DEFINER FUNCTION (Bypasses RLS)
 */
async function getUserByEmail(email) {
    try {
        // Use the system function to find user regardless of tenant (for login)
        // Must specify columns explicitly since it's a table-returning function
        const result = await pool.query(
            `SELECT id, email, role, tenant_id, is_active, added_by, created_at 
             FROM get_user_by_email_system($1)`,
            [email.toLowerCase().trim()]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

/**
 * Actualizar último login
 * (Respects RLS, but might fail if we are not in tenant context during login?)
 * Actually, login happens before tenant context is fully established in middleware,
 * BUT we can manually set context if needed, or use a system function.
 * Since this is just a timestamp, we should probably use a system function or ensure context.
 */
async function updateLastLogin(email) {
    try {
        // Since we know the email, we can find the tenant and user via system function first?
        // Or better: update authController to run this INSIDE a tenant context.
        // For now, let's assume we are in context OR use a bypass.
        // Let's use a bypass for safety during login flows.
        
        // Quick workaround: Use direct update if we are sure? 
        // No, update requires RLS pass if enabled.
        // Let's execute this query as the user system (bypass RLS) for login simplicity.
        // We don't have a specific func for this, but we can rely on `get_user_by_email_system` logic?
        // No, we need an UPDATE.
        
        // OPTION B: The AuthController should determine tenant_id, then we run this.
        // If we are in `runWithTenant`, this works.
        // If not, it fails.
        // Let's keep it standard SQL and ensure caller sets context.
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
            [email.toLowerCase().trim()]
        );
    } catch (error) {
        console.error('Error actualizando último login:', error);
    }
}

/**
 * Desactivar/activar usuario
 * (Respects RLS)
 */
async function toggleUserStatus(userId, adminEmail) {
    try {
        const result = await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = $1 AND added_by = $2 RETURNING *',
            [userId, adminEmail]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error cambiando estado de usuario:', error);
        throw error;
    }
}

/**
 * Eliminar usuario del equipo
 * (Respects RLS)
 */
async function removeTeamMember(userId, adminEmail) {
    try {
        await pool.query(
            'DELETE FROM users WHERE id = $1 AND added_by = $2',
            [userId, adminEmail]
        );
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        throw error;
    }
}

/**
 * Verificar si un email es admin (Global Admin)
 */
function isAdmin(email) {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    return adminEmails.includes(email.toLowerCase().trim());
}

module.exports = {
    addTeamMember,
    getTeamMembers,
    getUserByEmail,
    updateLastLogin,
    toggleUserStatus,
    removeTeamMember,
    isAdmin,
    createUser
};