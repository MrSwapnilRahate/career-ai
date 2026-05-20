/**
 * Server Entry Point
 * 
 * Handles:
 * - Environment validation (fail-fast)
 * - MongoDB connection with retry
 * - Redis connection for BullMQ
 * - Queue worker initialization
 * - Graceful shutdown on SIGTERM/SIGINT
 */

require('dotenv').config();

const { config, validateEnvironment } = require('./src/config/environment');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const { createRedisConnection, disconnectRedis } = require('./src/config/redis');
const { startWorker } = require('./src/queues/resumeWorker');
const logger = require('./src/utils/logger');
const app = require('./src/app');

// Track connections for graceful shutdown
let server;
let redisConnection;
let worker;

/**
 * Start the server and all dependencies.
 */
async function start() {
  try {
    // 1. Validate environment variables
    validateEnvironment();
    logger.info('✅ Environment validated');

    // 2. Connect to MongoDB
    await connectDatabase();

    // 3. Connect to Redis and start queue worker (only if configured)
    if (config.redisUrl) {
      try {
        redisConnection = createRedisConnection();
        worker = startWorker();
        logger.info('✅ Queue worker started');
      } catch (redisError) {
        logger.warn('⚠️  Redis/Queue unavailable — running without background processing', {
          error: redisError.message,
        });
      }
    } else {
      logger.info('ℹ️  Redis not configured — background job queue disabled');
      logger.info('   Resume uploads will use synchronous processing');
    }

    // 4. Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} (${config.nodeEnv})`);
      logger.info(`   Health check: http://localhost:${config.port}/health`);
    });

    // 5. Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      throw error;
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

/**
 * Gracefully shut down all connections.
 */
async function shutdown(signal) {
  logger.info(`\n${signal} received — shutting down gracefully...`);

  // 1. Stop accepting new requests
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP server closed');
  }

  // 2. Close queue worker
  if (worker) {
    await worker.close();
    logger.info('Queue worker closed');
  }

  // 3. Disconnect Redis
  await disconnectRedis(redisConnection);

  // 4. Disconnect MongoDB
  await disconnectDatabase();

  logger.info('👋 Graceful shutdown complete');
  process.exit(0);
}

// ─── Signal Handlers ──────────────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Rejection / Exception Handlers ─────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Don't crash — log and continue
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Crash after logging — uncaught exceptions leave the app in undefined state
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────
start();
