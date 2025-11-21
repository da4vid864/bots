// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { requireAuth } = require('../auth/authMiddleware');

// 1. INICIAR COMPRA (Accesible desde Landing y Dashboard)
router.get('/purchase/pro', async (req, res) => {
    // Si el usuario NO está logueado
    if (!req.user) {
        // Guardamos una "cookie de intención" por 10 minutos
        res.cookie('redirect_to_checkout', 'true', { 
            httpOnly: true, 
            maxAge: 1000 * 60 * 10 
        });
        // Lo mandamos a loguearse con Google
        return res.redirect('/auth/google');
    }

    // Si YA está logueado, creamos la sesión de Stripe
    try {
        const protocol = req.protocol; // http o https
        const host = req.get('host');  // localhost:3000 o tu dominio
        
        const successUrl = `${protocol}://${host}/dashboard?payment=success`;
        const cancelUrl = `${protocol}://${host}/?payment=cancelled`;

        const session = await subscriptionService.createCheckoutSession(
            req.user.email, 
            successUrl, 
            cancelUrl
        );

        res.redirect(session.url);
    } catch (error) {
        console.error('Error iniciando checkout:', error);
        res.redirect('/?error=payment_init_failed');
    }
});

// 2. PORTAL DE CLIENTE (Solo para usuarios logueados)
// Para cancelar suscripción o cambiar tarjeta
router.get('/portal', requireAuth, async (req, res) => {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const returnUrl = `${protocol}://${host}/dashboard`;

        const session = await subscriptionService.createBillingPortalSession(
            req.user.email, 
            returnUrl
        );

        res.redirect(session.url);
    } catch (error) {
        console.error('Error creando portal:', error);
        res.redirect('/dashboard?error=portal_failed');
    }
});

module.exports = router;