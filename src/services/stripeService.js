/**
 * Stripe Service — Subscription Management
 * 
 * Handles:
 * - Checkout session creation (redirect to Stripe-hosted page)
 * - Webhook processing for subscription events
 * - Customer portal for self-service billing
 * - Subscription status queries
 */

const { config } = require('../config/environment');
const User = require('../models/User');
const logger = require('../utils/logger');

// Lazy-initialized Stripe client
let _stripe;
function getStripe() {
  if (!_stripe) {
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Set it in your .env file.');
    }
    const Stripe = require('stripe');
    _stripe = new Stripe(config.stripe.secretKey);
  }
  return _stripe;
}

const PLAN_PRICE_MAP = {
  pro: () => config.stripe.priceProMonthly,
  enterprise: () => config.stripe.priceEnterpriseMonthly,
};

const stripeService = {
  /**
   * Create a Stripe Checkout session for subscription.
   * @param {string} userId - Our internal user ID
   * @param {string} plan - 'pro' or 'enterprise'
   * @returns {Promise<{ url: string }>} Checkout URL
   */
  async createCheckoutSession(userId, plan) {
    const stripe = getStripe();
    const user = await User.findById(userId);

    if (!user) throw new Error('User not found');

    const priceId = PLAN_PRICE_MAP[plan]?.();
    if (!priceId) throw new Error(`Invalid plan: ${plan}`);

    // Create or reuse Stripe customer
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      user.subscription = user.subscription || {};
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.corsOrigins[0]}/dashboard?checkout=success`,
      cancel_url: `${config.corsOrigins[0]}/pricing?checkout=canceled`,
      metadata: { userId: userId.toString(), plan },
    });

    logger.info(`Checkout session created for user ${userId}`, { plan, sessionId: session.id });

    return { url: session.url, sessionId: session.id };
  },

  /**
   * Create a Stripe Customer Portal session for self-service billing.
   * @param {string} userId
   * @returns {Promise<{ url: string }>}
   */
  async createPortalSession(userId) {
    const stripe = getStripe();
    const user = await User.findById(userId);

    if (!user?.subscription?.stripeCustomerId) {
      throw new Error('No subscription found. Please subscribe first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${config.corsOrigins[0]}/dashboard`,
    });

    return { url: session.url };
  },

  /**
   * Get subscription status for a user.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getSubscriptionStatus(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    return {
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'none',
      currentPeriodEnd: user.subscription?.currentPeriodEnd || null,
    };
  },

  /**
   * Handle Stripe webhook events.
   * @param {Object} event - Verified Stripe event
   */
  async handleWebhook(event) {
    const { type, data } = event;

    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;

        await User.findByIdAndUpdate(userId, {
          'subscription.plan': plan,
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.status': 'active',
        });

        logger.info(`Subscription activated: ${plan} for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = data.object;
        const customerId = subscription.customer;
        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

        if (user) {
          user.subscription.status = subscription.status;
          user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

          // Handle plan changes
          if (subscription.cancel_at_period_end) {
            user.subscription.status = 'canceled';
          }

          await user.save();
          logger.info(`Subscription updated for user ${user._id}`, { status: subscription.status });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = data.object;
        const customerId = subscription.customer;

        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': customerId },
          {
            'subscription.plan': 'free',
            'subscription.status': 'none',
            'subscription.stripeSubscriptionId': null,
            'subscription.currentPeriodEnd': null,
          }
        );

        logger.info(`Subscription canceled for customer ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data.object;
        const customerId = invoice.customer;

        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': customerId },
          { 'subscription.status': 'past_due' }
        );

        logger.warn(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        logger.info(`Unhandled webhook event: ${type}`);
    }
  },

  /**
   * Verify webhook signature.
   * @param {Buffer} rawBody
   * @param {string} signature
   * @returns {Object} Verified event
   */
  verifyWebhookSignature(rawBody, signature) {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  },
};

module.exports = stripeService;
