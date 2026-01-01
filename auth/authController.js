// auth/authController.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
import userService from '../services/userService.js';
import subscriptionService from '../services/subscriptionService.js';
import { runWithTenant } from '../services/db.js';

const handleGoogleCallback = async (req, res) => {
  try {
    // 1. Obtener datos básicos de Google
    const email = req.user.profile.emails[0].value;
    let role = 'unauthorized';
    let addedBy = null;
    let tenantId = null; // New field for Multi-Tenant
    
    // 2. Determinar el Rol del Usuario
    if (userService.isAdmin(email)) {
      role = 'admin';
      // Admins might have a special tenant or just bypass?
      // For now, let's treat them like normal users who also happen to be system admins.
      // They need a tenant to operate in the dashboard unless they are super-admin viewing everything.
      // We will fetch their user record to see if they have a tenant.
    }

    // Verificar existencia en base de datos o crear si es nuevo (auto-registro básico)
    // userService.getUserByEmail uses SECURITY DEFINER, so it bypasses RLS and finds the user globally.
    let dbUser = await userService.getUserByEmail(email);
    
    if (!dbUser) {
        console.log(`Nuevo usuario detectado: ${email}. Creando cuenta Free + Tenant.`);
        // Crear usuario con rol 'vendor' (o 'user') por defecto + Tenant propio
        // createUser now handles Tenant creation atomically via system function.
        dbUser = await userService.createUser(email, 'vendor', 'system');
        
        // Crear suscripción Free por defecto
        // We need to run this within the tenant context!
        if (dbUser.tenant_id) {
            await runWithTenant(dbUser.tenant_id, async () => {
                await subscriptionService.getOrCreateSubscription(email);
            });
        }
    }

    if (dbUser && dbUser.is_active) {
      role = dbUser.role; // Use DB role (might be 'admin' if manually set in DB, or 'vendor')
      addedBy = dbUser.added_by;
      tenantId = dbUser.tenant_id;
      
      // Update last login (requires tenant context)
      if (tenantId) {
          await runWithTenant(tenantId, async () => {
              await userService.updateLastLogin(email);
          });
      }
    }
    
    // 3. Generar Token JWT
    const tokenPayload = {
      id: req.user.profile.id, // Google ID
      dbId: dbUser?.id,        // DB UUID
      displayName: req.user.profile.displayName,
      email: email,
      picture: req.user.profile.photos[0].value,
      role: role,
      addedBy: addedBy,
      tenant_id: tenantId      // CRITICAL: Include tenant_id in token
    };
  
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  
    // === 4. LÓGICA DE REDIRECCIÓN DE PAGO / TRIAL ===
    
    // Verificamos si hay intención de compra (Trial)
    if (req.cookies.redirect_to_checkout === 'true') {
      console.log(`💰 Usuario ${email} tiene cookie de compra. Activando Trial...`);
      res.clearCookie('redirect_to_checkout');
      
      // Activar Trial automáticamente (con contexto de tenant)
      try {
          if (tenantId) {
              await runWithTenant(tenantId, async () => {
                  await subscriptionService.activateProTrial(email);
              });
          }
          // Redirigir al dashboard con mensaje de éxito
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
          const isProduction = process.env.NODE_ENV === 'production';
          const target = isProduction ? '/dashboard?payment=success' : `${frontendUrl}/dashboard?payment=success`;
          return res.redirect(target);
      } catch (err) {
          console.error("Error activando trial automático:", err);
          // Fallback al dashboard normal si falla
      }
    }
  
    // === 5. REDIRECCIÓN NORMAL ===
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const isProduction = process.env.NODE_ENV === 'production';

    if (role === 'admin' || role === 'vendor') {
      const targetPath = role === 'admin' ? '/dashboard' : '/sales';
      // Redirect to correct dashboard based on role
      // For now, defaulting to dashboard for everyone as per previous logic logic might be mixed.
      // Original: admin -> /dashboard, vendor -> /sales.
      // Let's keep it.
       const finalTarget = role === 'admin' ? '/dashboard' : '/sales';
      res.redirect(isProduction ? finalTarget : `${frontendUrl}${finalTarget}`);
    } else {
      // Si el usuario no tiene rol asignado pero intentó loguearse
      res.redirect(isProduction ? '/dashboard' : `${frontendUrl}/dashboard`);
    }
  } catch (error) {
    console.error('Error en Auth Callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const isProduction = process.env.NODE_ENV === 'production';
    res.redirect(isProduction ? '/login?error=auth_failed' : `${frontendUrl}/login?error=auth_failed`);
  }
};

const logout = (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('redirect_to_checkout'); 
  res.json({ success: true, message: 'Sesión cerrada' });
};

export { handleGoogleCallback, logout };