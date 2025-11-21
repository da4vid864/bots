// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { requireAuth } = require('../auth/authMiddleware');

// 1. INICIAR COMPRA
router.get('/purchase/pro', async (req, res) => {
    console.log('🛒 [DEBUG] Iniciando flujo de compra...');

    if (!req.user) {
        console.log('👤 [DEBUG] Usuario no logueado. Estableciendo cookie y redirigiendo a Google.');
        res.cookie('redirect_to_checkout', 'true', { 
            httpOnly: true, 
            maxAge: 1000 * 60 * 10 
        });
        return res.redirect('/auth/google');
    }

    console.log(`👤 [DEBUG] Usuario logueado: ${req.user.email}. Intentando crear sesión de Stripe...`);

    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const successUrl = `${protocol}://${host}/dashboard?payment=success`;
        const cancelUrl = `${protocol}://${host}/?payment=cancelled`;

        // Verificar que tengamos las variables necesarias antes de llamar a Stripe
        if (!process.env.STRIPE_PRICE_ID_PRO) {
            throw new Error('Falta la variable de entorno STRIPE_PRICE_ID_PRO');
        }

        const session = await subscriptionService.createCheckoutSession(
            req.user.email, 
            successUrl, 
            cancelUrl
        );

        console.log(`✅ [DEBUG] Sesión de Stripe creada. URL: ${session.url}`);
        
        // Redirigir a Stripe
        res.redirect(session.url);

    } catch (error) {
        // AQUÍ VERÁS EL ERROR REAL EN LOS LOGS DE RAILWAY
        console.error('❌ [ERROR CRÍTICO] Falló la creación de sesión de Stripe:', error);
        
        // Redirigir mostrando el error en la URL para saber qué pasó
        res.redirect(`/?error=payment_failed&details=${encodeURIComponent(error.message)}`);
    }
});

// ... (resto del archivo igual) ...
router.get('/portal', requireAuth, async (req, res) => {
    // ... mismo código del portal ...
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const returnUrl = `${protocol}://${host}/dashboard`;
        const session = await subscriptionService.createBillingPortalSession(req.user.email, returnUrl);
        res.redirect(session.url);
    } catch (error) {
        console.error('Error portal:', error);
        res.redirect('/dashboard?error=portal_failed');
    }
});

module.exports = router;