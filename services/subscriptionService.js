// services/subscriptionService.js
const pool = require('./db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Planes Freemium
const PLANS = {
    free: {
        name: 'Gratuito',
        price: 0,
        botLimit: 1,
        leadsLimit: 100, // 100 leads/mes máximo
        features: ['1 bot activo', '100 leads/mes', 'Soporte por email']
    },
    pro: {
        name: 'Pro',
        price: 99, // Updated to match pricing UI
        priceId: process.env.STRIPE_PRICE_ID_PRO, // Lo crearemos en Stripe
        botLimit: -1, // Ilimitado
        leadsLimit: -1, // Ilimitado durante trial y plan activo
        features: ['Bots ilimitados', 'Leads ilimitados', 'Soporte prioritario 24/7', 'Sin marca "Powered by"']
    }
};

/**
 * Obtener o crear suscripción
 * Asigna Free Tier permanentemente a nuevos usuarios (1 bot, 100 leads/mes)
 */
async function getOrCreateSubscription(userEmail) {
    try {
        let result = await pool.query(
            'SELECT * FROM subscriptions WHERE user_email = $1',
            [userEmail]
        );

        if (result.rows.length === 0) {
            // Crear suscripción gratuita por defecto
            // Free Tier: 1 bot permanente, 100 leads/mes máximo
            result = await pool.query(
                'INSERT INTO subscriptions (user_email, plan, status, bot_limit, leads_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [userEmail, 'free', 'active', 1, 100]
            );
            console.log(`✅ Suscripción Free creada para ${userEmail}: 1 bot, 100 leads/mes`);
        } else {
            // Verificar si el trial ha expirado
            const sub = result.rows[0];
            if (sub.status === 'trial' && sub.trial_ends_at && new Date() > new Date(sub.trial_ends_at)) {
                console.log(`⏳ Trial expirado para ${userEmail}. Revirtiendo a Free Tier.`);
                // Revertir a Free con límites permanentes
                await pool.query(
                    "UPDATE subscriptions SET plan = 'free', status = 'active', bot_limit = 1, leads_limit = 100, trial_ends_at = NULL WHERE user_email = $1",
                    [userEmail]
                );
                // Refetch
                result = await pool.query('SELECT * FROM subscriptions WHERE user_email = $1', [userEmail]);
            }
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error obteniendo suscripción:', error);
        throw error;
    }
}

/**
 * Activar Trial de 14 días (Sin tarjeta requerida)
 * IMPORTANTE: Solo permite UNA vez por email para prevenir abuso
 */
async function activateProTrial(userEmail) {
    try {
        const subscription = await getOrCreateSubscription(userEmail);
        
        // Validar que está en plan Free (protección anti-abuso)
        if (subscription.plan !== 'free') {
            console.log(`⚠️ Usuario ${userEmail} intenta trial con plan ${subscription.plan}. Rechazando.`);
            throw new Error('Trial solo disponible para usuarios en plan Free.');
        }

        // Prevenir reinicio de trial (si ya tuvo uno alguna vez)
        if (subscription.trial_used_once) {
            console.log(`⚠️ Usuario ${userEmail} ya usó su trial. Rechazando.`);
            throw new Error('Solo se permite un trial por usuario. Contacte a soporte para excepciones.');
        }

        const trialDays = 14;
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        // Activar trial: plan Pro, estado trial, bots/leads ilimitados, marcar como usado
        const result = await pool.query(
            "UPDATE subscriptions SET plan = 'pro', status = 'trial', bot_limit = -1, leads_limit = -1, trial_ends_at = $1, trial_used_once = TRUE WHERE user_email = $2 RETURNING *",
            [trialEndsAt, userEmail]
        );

        console.log(`🚀 Trial Pro (14 días) activado para ${userEmail}. Sin tarjeta requerida.`);
        console.log(`⏰ Vence el ${trialEndsAt.toISOString()}`);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error activando trial:', error);
        throw error;
    }
}

/**
 * Verificar si el usuario puede crear más bots
 */
async function canCreateBot(userEmail, currentBotCount) {
    try {
        const subscription = await getOrCreateSubscription(userEmail);
        
        // -1 significa ilimitado (plan Pro)
        if (subscription.bot_limit === -1) return true;
        
        // Plan gratuito: máximo 1 bot
        return currentBotCount < subscription.bot_limit;
    } catch (error) {
        console.error('Error verificando límite de bots:', error);
        return false;
    }
}

/**
 * Verificar si el usuario puede capturar más leads en el mes actual
 * Retorna true si aún tiene cuota disponible
 */
async function canCaptureLeads(userEmail, currentMonthLeads) {
    try {
        const subscription = await getOrCreateSubscription(userEmail);
        
        // -1 significa ilimitado (plan Pro)
        if (subscription.leads_limit === -1) return true;
        
        // Plan gratuito: máximo 100 leads/mes
        return currentMonthLeads < subscription.leads_limit;
    } catch (error) {
        console.error('Error verificando límite de leads:', error);
        return false;
    }
}

/**
 * Obtener información del límite actual y estado de suscripción
 */
async function getBotLimitInfo(userEmail, currentBotCount) {
    const subscription = await getOrCreateSubscription(userEmail);
    
    // Calcular días restantes del trial
    let trialDaysLeft = null;
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
        const now = new Date();
        const trialEnd = new Date(subscription.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        trialDaysLeft = Math.max(0, daysLeft);
    }
    
    return {
        currentPlan: subscription.plan,
        status: subscription.status, // 'active', 'trial', 'canceled'
        botLimit: subscription.bot_limit,
        leadsLimit: subscription.leads_limit,
        currentBotCount: currentBotCount,
        canCreateBot: subscription.bot_limit === -1 || currentBotCount < subscription.bot_limit,
        isUnlimited: subscription.bot_limit === -1,
        isTrialActive: subscription.status === 'trial',
        trialDaysLeft: trialDaysLeft,
        trialEndsAt: subscription.trial_ends_at,
        trialUsedOnce: subscription.trial_used_once || false
    };
}

/**
 * Crear sesión de checkout para upgrade a Pro
 */
async function createCheckoutSession(userEmail, successUrl, cancelUrl) {
    try {
        const subscription = await getOrCreateSubscription(userEmail);
        
        // Crear o recuperar customer de Stripe
        let customerId = subscription.stripe_customer_id;
        
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: { userEmail }
            });
            customerId = customer.id;
            
            await pool.query(
                'UPDATE subscriptions SET stripe_customer_id = $1 WHERE user_email = $2',
                [customerId, userEmail]
            );
        }

        // Crear sesión de checkout
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID_PRO,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userEmail,
                plan: 'pro'
            }
        });

        return session;
    } catch (error) {
        console.error('Error creando sesión de checkout:', error);
        throw error;
    }
}

/**
 * Portal de gestión (cancelar, actualizar tarjeta, etc)
 */
async function createBillingPortalSession(userEmail, returnUrl) {
    try {
        const subscription = await getOrCreateSubscription(userEmail);
        
        if (!subscription.stripe_customer_id) {
            throw new Error('No hay suscripción activa');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: returnUrl,
        });

        return session;
    } catch (error) {
        console.error('Error creando portal:', error);
        throw error;
    }
}

/**
 * Actualizar suscripción cuando Stripe confirma el pago
 */
async function updateSubscriptionFromStripe(stripeSubscriptionId) {
    try {
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const customerId = stripeSubscription.customer;
        
        // Obtener email del customer
        const customer = await stripe.customers.retrieve(customerId);
        const userEmail = customer.email;
        
        await pool.query(`
            UPDATE subscriptions 
            SET stripe_subscription_id = $1,
                plan = 'pro',
                status = $2,
                bot_limit = -1,
                current_period_end = to_timestamp($3),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_email = $4
        `, [
            stripeSubscriptionId,
            stripeSubscription.status,
            stripeSubscription.current_period_end,
            userEmail
        ]);

        console.log(`✅ Usuario ${userEmail} actualizado a plan Pro`);
        return await getOrCreateSubscription(userEmail);
    } catch (error) {
        console.error('Error actualizando suscripción:', error);
        throw error;
    }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCanceled(stripeSubscriptionId) {
    try {
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const customerId = stripeSubscription.customer;
        
        const customer = await stripe.customers.retrieve(customerId);
        const userEmail = customer.email;

        await pool.query(`
            UPDATE subscriptions 
            SET plan = 'free',
                status = 'canceled',
                bot_limit = 1,
                stripe_subscription_id = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_email = $1
        `, [userEmail]);

        console.log(`⚠️ Usuario ${userEmail} regresó a plan gratuito`);
        return await getOrCreateSubscription(userEmail);
    } catch (error) {
        console.error('Error manejando cancelación:', error);
        throw error;
    }
}

module.exports = {
    PLANS,
    getOrCreateSubscription,
    canCreateBot,
    canCaptureLeads,
    getBotLimitInfo,
    createCheckoutSession,
    createBillingPortalSession,
    updateSubscriptionFromStripe,
    handleSubscriptionCanceled,
    activateProTrial
};