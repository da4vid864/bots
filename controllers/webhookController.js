// controllers/webhookController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const subscriptionService = require('../services/subscriptionService');

async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // IMPORTANTE: req.body debe ser el buffer raw, no JSON parseado
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                // Cuando el pago inicial es exitoso
                if (session.subscription) {
                    await subscriptionService.updateSubscriptionFromStripe(session.subscription);
                }
                break;

            case 'invoice.payment_succeeded':
                // Renovación mensual exitosa
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await subscriptionService.updateSubscriptionFromStripe(invoice.subscription);
                }
                break;

            case 'customer.subscription.deleted':
                // El usuario canceló o dejó de pagar
                const subscription = event.data.object;
                await subscriptionService.handleSubscriptionCanceled(subscription.id);
                break;
            
            default:
                console.log(`Evento no manejado: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).send('Server Error');
    }
}

module.exports = { handleStripeWebhook };