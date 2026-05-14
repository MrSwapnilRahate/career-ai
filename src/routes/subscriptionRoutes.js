/**
 * Subscription Routes
 * 
 * POST /api/subscription/checkout  — Create Stripe Checkout session (protected)
 * POST /api/subscription/portal    — Create Customer Portal session (protected)
 * GET  /api/subscription/status    — Get subscription + usage (protected)
 * POST /api/subscription/webhook   — Stripe webhook (raw body, no auth)
 */

const express = require('express');
const router = express.Router();

const {
  createCheckout,
  createPortal,
  getStatus,
  handleWebhook,
} = require('../controllers/subscriptionController');

const authMiddleware = require('../middleware/authMiddleware');

// ─── Protected Routes ─────────────────────────────────────────
router.post('/checkout', authMiddleware, createCheckout);
router.post('/portal', authMiddleware, createPortal);
router.get('/status', authMiddleware, getStatus);

// ─── Webhook (Public — Stripe sends events here) ─────────────
// NOTE: Webhook route needs raw body — see app.js for raw body middleware setup
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
