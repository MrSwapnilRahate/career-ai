/**
 * Subscription Controller
 * 
 * POST /api/subscription/checkout   — Create Stripe Checkout session
 * POST /api/subscription/portal     — Create Customer Portal session
 * GET  /api/subscription/status     — Get subscription + usage status
 * POST /api/subscription/webhook    — Handle Stripe webhooks
 */

const stripeService = require('../services/stripeService');
const { getUsageSummary } = require('../middleware/subscriptionMiddleware');

/**
 * POST /api/subscription/checkout
 * Create a Stripe Checkout session for a subscription plan.
 */
exports.createCheckout = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid plan. Choose "pro" or "enterprise".' },
      });
    }

    const result = await stripeService.createCheckoutSession(req.user.id, plan);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscription/portal
 * Create a Stripe Customer Portal session.
 */
exports.createPortal = async (req, res, next) => {
  try {
    const result = await stripeService.createPortalSession(req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/subscription/status
 * Get current subscription status and usage.
 */
exports.getStatus = async (req, res, next) => {
  try {
    const subscription = await stripeService.getSubscriptionStatus(req.user.id);
    const usageSummary = await getUsageSummary(req.user.id);

    res.json({
      success: true,
      data: {
        subscription,
        ...usageSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events.
 * NOTE: This route must receive raw body (not JSON-parsed).
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
};
