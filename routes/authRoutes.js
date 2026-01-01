// routes/authRoutes.js
import express from 'express';
import passport from 'passport';
import { handleGoogleCallback, logout } from '../auth/authController.js';
const router = express.Router();

// Redirige al usuario a Google para iniciar sesión
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// Google redirige aquí después del inicio de sesión
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  handleGoogleCallback
);

// Cierra la sesión del usuario
router.get('/logout', logout);

export default router;