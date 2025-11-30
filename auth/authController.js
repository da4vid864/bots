// auth/authController.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const userService = require('../services/userService');

const handleGoogleCallback = async (req, res) => {
  // 1. Obtener datos básicos de Google
  const email = req.user.profile.emails[0].value;
  let role = 'unauthorized';
  let addedBy = null;
  
  // 2. Determinar el Rol del Usuario
  if (userService.isAdmin(email)) {
    role = 'admin';
  } else {
    // Verificar existencia en base de datos
    const dbUser = await userService.getUserByEmail(email);
    
    if (dbUser && dbUser.is_active) {
      role = dbUser.role;
      addedBy = dbUser.added_by;
      
      // Actualizar último login
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

  // === 4. LÓGICA DE REDIRECCIÓN DE PAGO (LO NUEVO) ===
  
  // Verificamos si el usuario hizo clic en "Comprar" antes de loguearse
  if (req.cookies.redirect_to_checkout === 'true') {
    console.log(`💰 Usuario ${email} detectado con intención de compra. Redirigiendo a Stripe...`);
    
    // Borramos la cookie para que no se quede pegada en el navegador
    res.clearCookie('redirect_to_checkout');
    
    // Return JSON response for API
    return res.json({
      success: true,
      redirectTo: '/subs/purchase/pro',
      user: tokenPayload
    });
  }

  // === 5. JSON Response for REST API ===
  
  if (role === 'admin' || role === 'vendor') {
    res.json({
      success: true,
      user: tokenPayload,
      redirectTo: role === 'admin' ? '/api/dashboard' : '/api/sales'
    });
  } else {
    // Si el usuario no es admin, ni vendor
    res.status(403).json({
      success: false,
      message: `Tu cuenta (${email}) no está autorizada para acceder a este sistema. Contacta al administrador para solicitar acceso.`
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('redirect_to_checkout'); // Limpiamos la cookie de intención también por si acaso
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};

module.exports = { handleGoogleCallback, logout };