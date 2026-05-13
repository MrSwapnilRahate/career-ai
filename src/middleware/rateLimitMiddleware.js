/**
 * Tiered Rate Limiting
 * 
 * Different rate limits for different endpoints:
 * - apiLimiter:    100 req / 15 min — general API protection
 * - authLimiter:   10 req / 15 min  — prevent brute force login
 * - uploadLimiter: 5 req / 15 min   — protect AI API costs
 */

const rateLimit = require('express-rate-limit');

const commonOptions = {
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
};

/**
 * General API rate limiter.
 * Applied to all /api routes.
 */
const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again after 15 minutes',
    },
  },
});

/**
 * Auth rate limiter (strict).
 * Applied to login/signup to prevent brute force attacks.
 */
const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again after 15 minutes',
    },
  },
});

/**
 * Upload rate limiter (very strict).
 * Applied to resume upload endpoints to protect AI API costs.
 */
const uploadLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Too many resume uploads, please try again after 15 minutes',
    },
  },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
