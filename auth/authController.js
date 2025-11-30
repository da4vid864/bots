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

  // === 4. LÓGICA DE REDIRECCIÓN DE PAGO ===
  
  // Verificamos si el usuario hizo clic en "Comprar" antes de loguearse
  if (req.cookies.redirect_to_checkout === 'true') {
    console.log(`💰 Usuario ${email} detectado con intención de compra. Redirigiendo a Stripe...`);
    
    // Borramos la cookie para que no se quede pegada en el navegador
    res.clearCookie('redirect_to_checkout');
    
    // Redireccionamos a la ruta de compra (que ahora verá que el usuario está logueado)
    return res.redirect('/subs/purchase/pro');
  }

  // === 5. REDIRECCIÓN NORMAL AL FRONTEND ===
  
  if (role === 'admin' || role === 'vendor') {
    // Redirigimos al frontend, React Router se encargará del resto
    // Usamos las rutas que definimos en React (dashboard o sales)
    const targetPath = role === 'admin' ? '/dashboard' : '/sales';
    res.redirect(targetPath);
  } else {
    // Si el usuario no es admin, ni vendor
    // Redirigimos al login con un error
    res.redirect('/login?error=unauthorized');
  }
};

const logout = (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('redirect_to_checkout'); // Limpiamos la cookie de intención también por si acaso
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};

module.exports = { handleGoogleCallback, logout };