/**
 * Centralized Environment Configuration
 * 
 * Validates all required env vars at startup (fail-fast pattern).
 * Import this instead of using process.env directly throughout the app.
 */

// Core vars required for the server to start at all
const coreRequiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// Service vars — warn if missing but allow startup
const serviceVars = [
  { key: 'GEMINI_API_KEY', service: 'AI Analysis (Gemini)' },
  { key: 'CLOUD_NAME', service: 'Cloudinary Upload' },
  { key: 'CLOUD_API_KEY', service: 'Cloudinary Upload' },
  { key: 'CLOUD_API_SECRET', service: 'Cloudinary Upload' },
  { key: 'REDIS_URL', service: 'Background Queue' },
  { key: 'STRIPE_SECRET_KEY', service: 'Stripe Payments' },
  { key: 'STRIPE_WEBHOOK_SECRET', service: 'Stripe Webhooks' },
];

/**
 * Validate that all required environment variables are set.
 */
function validateEnvironment() {
  const missingCore = coreRequiredVars.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(
      `Missing REQUIRED environment variables:\n  ${missingCore.join('\n  ')}\n\nSee .env.example for reference.`
    );
  }

  const missingServices = serviceVars.filter((v) => !process.env[v.key]);
  if (missingServices.length > 0) {
    console.warn(
      `\n⚠️  Missing optional service variables (some features unavailable):\n` +
      missingServices.map((v) => `  - ${v.key} (${v.service})`).join('\n') +
      `\n`
    );
  }
}

/**
 * Typed configuration object — single source of truth.
 */
const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // MongoDB
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Google Gemini AI
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    proModel: process.env.AI_PRO_MODEL || 'gemini-2.5-pro-preview-06-05',
    flashModel: process.env.AI_FLASH_MODEL || 'gemini-2.5-flash-preview-05-20',
    timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '60000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
    apiSecret: process.env.CLOUD_API_SECRET,
  },

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceProMonthly: process.env.STRIPE_PRICE_PRO || '',
    priceEnterpriseMonthly: process.env.STRIPE_PRICE_ENTERPRISE || '',
  },

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

module.exports = { config, validateEnvironment };
