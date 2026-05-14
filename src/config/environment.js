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

// Service vars — required at runtime when services are used, but
// allow the server to start so you can set them up incrementally
const serviceVars = [
  { key: 'OPENAI_API_KEY', service: 'AI Analysis' },
  { key: 'CLOUD_NAME', service: 'Cloudinary Upload' },
  { key: 'CLOUD_API_KEY', service: 'Cloudinary Upload' },
  { key: 'CLOUD_API_SECRET', service: 'Cloudinary Upload' },
  { key: 'REDIS_URL', service: 'Background Queue' },
];

/**
 * Validate that all required environment variables are set.
 * Call this at startup before any other initialization.
 */
function validateEnvironment() {
  // 1. Check core variables (hard fail)
  const missingCore = coreRequiredVars.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(
      `Missing REQUIRED environment variables:\n  ${missingCore.join('\n  ')}\n\nSee .env.example for reference.`
    );
  }

  // 2. Warn about missing service variables (soft fail — allows dev startup)
  const missingServices = serviceVars.filter((v) => !process.env[v.key]);
  if (missingServices.length > 0) {
    console.warn(
      `\n⚠️  Missing optional service variables (some features will be unavailable):\n` +
      missingServices.map((v) => `  - ${v.key} (${v.service})`).join('\n') +
      `\n`
    );
  }
}

/**
 * Typed configuration object — single source of truth for all env config.
 * Access via: const { config } = require('./config/environment');
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

  // OpenAI
  ai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000', 10),
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
