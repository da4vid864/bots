// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { requireAuth } = require('../auth/authMiddleware');

// 1. INICIAR COMPRA
router.get('/purchase/pro', async (req, res) => {
    console.log('🛒 [DEBUG] Iniciando flujo de compra...');

    // Si el usuario NO está logueado, guardamos la intención y lo mandamos a loguear
    if (!req.user) {
        console.log('👤 [DEBUG] Usuario no logueado. Estableciendo cookie y redirigiendo a Google.');
        
        // Cookie de vida corta (10 mins) para recordar la intención
        res.cookie('redirect_to_checkout', 'true', { 
            httpOnly: true, 
            maxAge: 1000 * 60 * 10,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        
        return res.redirect('/auth/google');
    }

    console.log(`👤 [DEBUG] Usuario logueado: ${req.user.email}. Intentando crear sesión de Stripe...`);

    try {
        const protocol = req.protocol;
        const host = req.get('host');
        // Aseguramos HTTPS en producción si estamos detrás de un proxy
        const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : protocol) + '://' + host;
        
        const successUrl = `${baseUrl}/dashboard?payment=success`;
        const cancelUrl = `${baseUrl}/dashboard?payment=cancelled`;

        // Verificar que tengamos las variables necesarias antes de llamar a Stripe
        if (!process.env.STRIPE_PRICE_ID_PRO) {
            console.error('❌ Falta STRIPE_PRICE_ID_PRO en variables de entorno');
            return res.redirect('/dashboard?error=config_error');
        }

        const session = await subscriptionService.createCheckoutSession(
            req.user.email, 
            successUrl, 
            cancelUrl
        );

        console.log(`✅ [DEBUG] Sesión de Stripe creada. URL: ${session.url}`);
        
        // Redirigir a la página de pago de Stripe
        res.redirect(session.url);

    } catch (error) {
        console.error('❌ [ERROR CRÍTICO] Falló la creación de sesión de Stripe:', error);
        res.redirect(`/dashboard?error=payment_init_failed`);
    }
});

router.get('/portal', requireAuth, async (req, res) => {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = (process.env.NODE_ENV === 'production' ? 'https' : protocol) + '://' + host;
        
        const returnUrl = `${baseUrl}/dashboard`;
        const session = await subscriptionService.createBillingPortalSession(req.user.email, returnUrl);
        res.redirect(session.url);
    } catch (error) {
        console.error('Error portal:', error);
        res.redirect('/dashboard?error=portal_failed');
    }
});

module.exports = router;