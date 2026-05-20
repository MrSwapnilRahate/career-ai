/**
 * Redis Connection for BullMQ Queues
 * 
 * Provides IORedis connection config used by BullMQ.
 * BullMQ creates its own connections internally — we just export the config.
 */

const { config } = require('./environment');
const logger = require('../utils/logger');
const IORedis = require('ioredis');

/**
 * Parse Redis URL into IORedis connection options.
 */
function getRedisOptions() {
  return {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,    // Required by BullMQ
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis unavailable after 3 attempts — background jobs disabled');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 500, 3000);
      if (times === 1) logger.warn(`Redis retry attempt ${times}, next retry in ${delay}ms`);
      return delay;
    },
  };
}

/**
 * Create a Redis connection instance.
 * Used for health checks and direct Redis operations.
 */
function createRedisConnection() {
  const connection = new IORedis(config.redisUrl, getRedisOptions());

  connection.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  connection.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });

  return connection;
}

/**
 * Gracefully close a Redis connection.
 */
async function disconnectRedis(connection) {
  try {
    if (connection) {
      await connection.quit();
      logger.info('Redis disconnected gracefully');
    }
  } catch (error) {
    logger.error('Error disconnecting Redis:', error.message);
  }
}

module.exports = { getRedisOptions, createRedisConnection, disconnectRedis };
