// middleware/quotaMiddleware.js
import subscriptionService from '../services/subscriptionService.js';

/**
 * Middleware para verificar cuota de bots
 * Previene que usuarios creen más bots que su plan permite
 */
const checkBotQuota = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        // Obtener conteo actual de bots del usuario
        const botCount = 1; // TODO: Obtener del DB basado en req.user.email

        // Verificar si puede crear más bots
        const canCreate = await subscriptionService.canCreateBot(req.user.email, botCount);

        if (!canCreate) {
            const subscription = await subscriptionService.getOrCreateSubscription(req.user.email);
            console.log(`⚠️ Cuota de bots excedida para ${req.user.email}. Plan: ${subscription.plan}, Límite: ${subscription.bot_limit}`);
            
            return res.status(403).json({
                success: false,
                error: 'quota_exceeded',
                message: 'Límite de bots alcanzado para tu plan',
                upgrade_url: '/subs/purchase/pro',
                details: {
                    current_plan: subscription.plan,
                    bot_limit: subscription.bot_limit,
                    trial_ends_at: subscription.trial_ends_at,
                    action: 'Upgrade a Pro para crear bots ilimitados'
                }
            });
        }

        next();
    } catch (error) {
        console.error('❌ Error en checkBotQuota:', error.message);
        res.status(500).json({ success: false, message: 'Error verificando cuota de bots' });
    }
};

/**
 * Middleware para verificar cuota de leads capturados
 * Previene que usuarios capturen más leads que su plan permite (por mes)
 */
const checkLeadsQuota = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        // TODO: Obtener conteo mensual de leads capturados del usuario
        const monthlyLeadCount = 0;

        // Verificar si puede capturar más leads
        const canCapture = await subscriptionService.canCaptureLeads(req.user.email, monthlyLeadCount);

        if (!canCapture) {
            const subscription = await subscriptionService.getOrCreateSubscription(req.user.email);
            console.log(`⚠️ Cuota de leads excedida para ${req.user.email}. Plan: ${subscription.plan}, Límite mensual: ${subscription.leads_limit}`);
            
            return res.status(403).json({
                success: false,
                error: 'quota_exceeded',
                message: 'Límite de leads mensuales alcanzado',
                upgrade_url: '/subs/purchase/pro',
                details: {
                    current_plan: subscription.plan,
                    monthly_leads_limit: subscription.leads_limit,
                    leads_captured_this_month: monthlyLeadCount,
                    trial_ends_at: subscription.trial_ends_at,
                    action: 'Upgrade a Pro para capturar leads ilimitados'
                }
            });
        }

        next();
    } catch (error) {
        console.error('❌ Error en checkLeadsQuota:', error.message);
        res.status(500).json({ success: false, message: 'Error verificando cuota de leads' });
    }
};

/**
 * Middleware para verificar estado de trial
 * Redirige a upgrade si trial está por expirar o ya expiró
 */
const checkTrialExpiry = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(); // Usuario no autenticado, dejar pasar
        }

        const subscription = await subscriptionService.getOrCreateSubscription(req.user.email);

        // Si está en trial y faltan menos de 3 días
        if (subscription.status === 'trial' && subscription.trial_ends_at) {
            const now = new Date();
            const trialEnd = new Date(subscription.trial_ends_at);
            const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 3 && daysLeft > 0) {
                // Trial por expirar pronto - mostrar banner de urgencia en frontend
                res.set('X-Trial-Expiring-Soon', `${daysLeft}`);
            } else if (daysLeft <= 0) {
                // Trial expirado - revirtió a Free, informar al frontend
                res.set('X-Trial-Expired', 'true');
            }
        }

        next();
    } catch (error) {
        console.error('❌ Error en checkTrialExpiry:', error.message);
        next(); // Continuar sin bloquear
    }
};

export {
    checkBotQuota,
    checkLeadsQuota,
    checkTrialExpiry
};
