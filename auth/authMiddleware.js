// auth/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const userService = require('../services/userService');

// Middleware para adjuntar el usuario a `req` si existe un token válido
const attachUser = async (req, res, next) => {
  const token = req.cookies.auth_token;
  req.user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verificar si es admin (de las variables de entorno)
      if (userService.isAdmin(decoded.email)) {
        decoded.role = 'admin';
        // Get tenant_id from DB even for admins
        let dbUser = await userService.getUserByEmail(decoded.email);
        if (!dbUser) {
          // Admin without DB user - create them
          console.log(`Creating new admin user: ${decoded.email}`);
          dbUser = await userService.createUser(decoded.email, 'admin', 'system');
        }
        if (dbUser) {
          if (dbUser.tenant_id) decoded.tenant_id = dbUser.tenant_id;
          // Ensure ID is the database ID
          if (dbUser.id) decoded.id = dbUser.id;
        } else {
          console.warn(`⚠️  Admin user ${decoded.email} has no tenant_id`);
        }
        req.user = decoded;
        next();
        return;
      }
      
      // Si no es admin, verificar en la base de datos
      let dbUser = await userService.getUserByEmail(decoded.email);
      
      // Si el usuario no existe, crearlo automáticamente
      if (!dbUser) {
        console.log(`Creating new user: ${decoded.email}`);
        dbUser = await userService.createUser(decoded.email, 'vendor', 'google');
      }
      
      if (dbUser && dbUser.is_active) {
        decoded.role = dbUser.role;
        decoded.addedBy = dbUser.added_by;
        decoded.tenant_id = dbUser.tenant_id; // CRITICAL: Preserve tenant_id from DB
        
        // Ensure req.user.id is the internal Database ID, not the Google ID
        // This prevents "value out of range" errors when inserting into integer columns
        if (dbUser.id) {
            decoded.googleId = decoded.id; // Preserve Google ID just in case
            decoded.id = dbUser.id;
        }

        if (!decoded.tenant_id) {
          console.warn(`⚠️  User ${decoded.email} has no tenant_id after DB lookup`);
        }
        
        req.user = decoded;
        
        // Actualizar último login
        try {
          await userService.updateLastLogin(decoded.email);
        } catch (e) {
          console.error('Error updating last login:', e.message);
        }
      } else {
        decoded.role = 'unauthorized';
        console.warn(`User ${decoded.email} not active or not found`);
        req.user = decoded;
      }
    } catch (err) {
      console.warn("Token JWT inválido, limpiando cookie:", err.message);
      res.clearCookie('auth_token');
    }
  }
  next();
};

// Middleware para proteger rutas que requieren ser un administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).send(`
      <h1>403 - Acceso Denegado</h1>
      <p>No tienes permiso para acceder a esta sección (requiere rol de administrador).</p>
      <a href="/sales">Ir a Panel de Ventas</a> | 
      <a href="/auth/logout">Cerrar sesión</a>
    `);
  }

  next();
};

// Middleware para proteger rutas que requieren estar autenticado (admin o vendor)
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  if (req.user.role === 'unauthorized') {
    return res.status(403).send(`
      <h1>403 - No Autorizado</h1>
      <p>Tu cuenta no tiene permisos para acceder a este sistema.</p>
      <p>Contacta al administrador para solicitar acceso.</p>
      <a href="/auth/logout">Cerrar sesión</a>
    `);
  }

  next();
};

module.exports = { attachUser, requireAdmin, requireAuth };