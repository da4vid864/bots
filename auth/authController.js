// auth/authController.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const userService = require('../services/userService');

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
      // Nota: Aquí podrías decidir si permites registro abierto o no.
      // Asumiremos que para compras, permitimos el registro como 'vendor' o un rol base.
      let dbUser = await userService.getUserByEmail(email);
      
      if (!dbUser) {
          // Si es un usuario nuevo entrando por flujo de compra, lo creamos
          // O si permites registro libre. Aquí asumiremos lógica existente de userService.
          // Si userService.findOrCreateUser existe, úsalo. Si no, usamos la lógica actual.
          console.log(`Nuevo usuario detectado: ${email}`);
      }

      if (dbUser && dbUser.is_active) {
        role = dbUser.role;
        addedBy = dbUser.added_by;
        await userService.updateLastLogin(email);
      } else if (!dbUser) {
          // Opción: Permitir acceso básico para terminar la compra
          // role = 'prospect'; 
          // Por ahora mantenemos la lógica restrictiva si así está diseñado tu sistema
          // Pero para vender, generalmente quieres dejar entrar al usuario.
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
  
    // === 4. LÓGICA DE REDIRECCIÓN DE PAGO ===
    
    // Verificamos si hay intención de compra
    if (req.cookies.redirect_to_checkout === 'true') {
      console.log(`💰 Usuario ${email} tiene cookie de compra. Redirigiendo a Stripe...`);
      res.clearCookie('redirect_to_checkout');
      return res.redirect('/subs/purchase/pro');
    }
  
    // === 5. REDIRECCIÓN NORMAL ===
    
    if (role === 'admin' || role === 'vendor') {
      const targetPath = role === 'admin' ? '/dashboard' : '/sales';
      res.redirect(targetPath);
    } else {
      // Si el usuario no tiene rol asignado pero intentó loguearse
      // Podríamos redirigirlo a una página de "Pendiente de aprobación" o al Dashboard con permisos limitados
      res.redirect('/dashboard'); 
    }
  } catch (error) {
    console.error('Error en Auth Callback:', error);
    res.redirect('/login?error=auth_failed');
  }
};

const logout = (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('redirect_to_checkout'); 
  res.json({ success: true, message: 'Sesión cerrada' });
};

module.exports = { handleGoogleCallback, logout };