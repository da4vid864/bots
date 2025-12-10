// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { requireAuth } = require('../auth/authMiddleware');

// 1. INICIAR COMPRA / TRIAL (14 días sin tarjeta)
router.get('/purchase/pro', async (req, res) => {
    console.log('🛒 [DEBUG] Iniciando flujo de trial Pro (14 días, sin tarjeta)...');

    // Si el usuario NO está logueado, guardamos la intención y lo mandamos a loguear
    if (!req.user) {
        console.log('👤 [DEBUG] Usuario no logueado. Estableciendo cookie y redirigiendo a Google OAuth.');
        
        // Cookie de vida corta (10 mins) para recordar la intención de trial
        res.cookie('redirect_to_checkout', 'true', {
            httpOnly: true,
            maxAge: 1000 * 60 * 10,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        
        return res.redirect('/auth/google');
    }

    console.log(`👤 [DEBUG] Usuario autenticado: ${req.user.email}. Activando trial Pro 14 días...`);

    try {
        // Activar Trial de 14 días (sin tarjeta requerida)
        const trialSubscription = await subscriptionService.activateProTrial(req.user.email);
        
        console.log(`✅ Trial Pro activado para ${req.user.email}. Vence: ${trialSubscription.trial_ends_at}`);
        
        // Redirigir al dashboard con parámetro de éxito
        res.redirect('/dashboard?trial=started&days=14&nocard=true');

    } catch (error) {
        console.error('❌ [ERROR CRÍTICO] Falló la activación del trial:', error.message);
        // Si el error es por "ya usó trial", redirigir con ese mensaje
        if (error.message.includes('trial por usuario')) {
            res.redirect(`/dashboard?error=trial_already_used`);
        } else {
            res.redirect(`/dashboard?error=trial_activation_failed`);
        }
    }
});

// Endpoint explícito para activar trial (si se llama desde frontend autenticado)
router.post('/start-trial', requireAuth, async (req, res) => {
    try {
        const trialSubscription = await subscriptionService.activateProTrial(req.user.email);
        res.json({ 
            success: true, 
            message: 'Trial Pro activado (14 días sin tarjeta)',
            subscription: {
                plan: trialSubscription.plan,
                status: trialSubscription.status,
                trial_ends_at: trialSubscription.trial_ends_at,
                bot_limit: trialSubscription.bot_limit,
                leads_limit: trialSubscription.leads_limit
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Obtener información actual de suscripción y estado
router.get('/status', requireAuth, async (req, res) => {
    try {
        const botCount = 1; // TODO: Obtener del DB basado en usuario
        const subscriptionInfo = await subscriptionService.getBotLimitInfo(req.user.email, botCount);
        
        res.json({
            success: true,
            subscription: subscriptionInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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