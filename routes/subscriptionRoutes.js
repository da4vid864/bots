// routes/subscriptionRoutes.js
import express from 'express';
const router = express.Router();
import subscriptionService from '../services/subscriptionService.js';
import { requireAuth } from '../auth/authMiddleware.js';

// 1. INICIAR COMPRA / TRIAL
router.get('/purchase/pro', async (req, res) => {
    console.log('🛒 [DEBUG] Iniciando flujo de compra/trial...');

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

    console.log(`👤 [DEBUG] Usuario logueado: ${req.user.email}. Activando Trial...`);

    try {
        // Activar Trial directamente (Sin Stripe por ahora)
        await subscriptionService.activateProTrial(req.user.email);
        
        // Redirigir al dashboard
        res.redirect('/dashboard?payment=success');

    } catch (error) {
        console.error('❌ [ERROR CRÍTICO] Falló la activación del trial:', error);
        res.redirect(`/dashboard?error=payment_init_failed`);
    }
});

// Endpoint explícito para activar trial (si se llama desde frontend autenticado)
router.post('/start-trial', requireAuth, async (req, res) => {
    try {
        await subscriptionService.activateProTrial(req.user.email);
        res.json({ success: true, message: 'Trial activado' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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

export default router;