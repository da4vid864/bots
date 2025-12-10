// auth/authController.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const userService = require('../services/userService');
const subscriptionService = require('../services/subscriptionService');

const handleGoogleCallback = async (req, res) => {
  try {
    // 1. Obtener datos básicos de Google
    const email = req.user.profile.emails[0].value;
    let role = 'unauthorized';
    let addedBy = null;
    
    // 2. Determinar el Rol del Usuario
    if (userService.isAdmin(email)) {
      role = 'admin';
    } else {
      // Verificar existencia en base de datos o crear si es nuevo (auto-registro básico)
      let dbUser = await userService.getUserByEmail(email);
      
      if (!dbUser) {
          console.log(`Nuevo usuario detectado: ${email}. Creando cuenta Free.`);
          // Crear usuario con rol 'vendor' (o 'user') por defecto
          dbUser = await userService.createUser(email, 'vendor', 'system');
          // Crear suscripción Free por defecto con límites permanentes
          // Free Tier: 1 bot, 100 leads/mes, sin tarjeta requerida
          await subscriptionService.getOrCreateSubscription(email);
      }

      if (dbUser && dbUser.is_active) {
        role = dbUser.role;
        addedBy = dbUser.added_by;
        await userService.updateLastLogin(email);
      }
    }
    
    // 3. Generar Token JWT
    const tokenPayload = {
      id: req.user.profile.id,
      displayName: req.user.profile.displayName,
      email: email,
      picture: req.user.profile.photos[0].value,
      role: role,
      addedBy: addedBy
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
      console.log(`💰 Usuario ${email} tiene cookie de compra. Iniciando 14-día trial sin tarjeta...`);
      res.clearCookie('redirect_to_checkout');
      
      // Activar Trial automáticamente (14 días sin tarjeta requerida)
      try {
          const trialResult = await subscriptionService.activateProTrial(email);
          console.log(`✅ Pro Trial activado para ${email}. Vence el ${trialResult.trial_ends_at}`);
          // Redirigir al dashboard con mensaje de éxito
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
          const isProduction = process.env.NODE_ENV === 'production';
          const target = isProduction ? '/dashboard?trial=started' : `${frontendUrl}/dashboard?trial=started`;
          return res.redirect(target);
      } catch (err) {
          console.error("❌ Error activando trial automático:", err);
          // Fallback al dashboard normal si falla
      }
    }
  
    // === 5. REDIRECCIÓN NORMAL ===
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const isProduction = process.env.NODE_ENV === 'production';

    if (role === 'admin' || role === 'vendor') {
      const targetPath = role === 'admin' ? '/dashboard' : '/sales';
      res.redirect(isProduction ? targetPath : `${frontendUrl}${targetPath}`);
    } else {
      // Si el usuario no tiene rol asignado pero intentó loguearse
      // Podríamos redirigirlo a una página de "Pendiente de aprobación" o al Dashboard con permisos limitados
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

module.exports = { handleGoogleCallback, logout };