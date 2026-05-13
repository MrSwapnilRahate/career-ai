/**
 * Authentication Routes
 * 
 * POST /api/auth/signup   — Register new user
 * POST /api/auth/login    — Authenticate & get tokens
 * POST /api/auth/refresh  — Refresh access token
 * POST /api/auth/logout   — Invalidate refresh token (protected)
 * GET  /api/auth/profile  — Get user profile (protected)
 */

const express = require('express');
const router = express.Router();

const { signup, login, refresh, logout, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validateRequest');
const { signupSchema, loginSchema, refreshSchema } = require('../validation/authValidation');

// ─── Public Routes ────────────────────────────────────────────
router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);

// ─── Protected Routes ─────────────────────────────────────────
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
