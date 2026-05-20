/**
 * Resume Processing Queue (BullMQ)
 * 
 * Defines the Bull queue for async resume processing.
 * Jobs are added by resumeService and processed by resumeWorker.
 * 
 * Why BullMQ?
 * - Redis-backed: persistent, survives server restarts
 * - Built-in retry with backoff
 * - Concurrency control
 * - Job progress tracking
 * - Dead letter queue for permanently failed jobs
 * 
 * NOTE: Lazy-initialized to avoid crash at import time when Redis is unavailable.
 */

const { Queue } = require('bullmq');
const { config } = require('../config/environment');
const { getRedisOptions } = require('../config/redis');
const logger = require('../utils/logger');

const QUEUE_NAME = 'resume-analysis';

let _queue;

function getResumeQueue() {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: {
        url: config.redisUrl,
        ...getRedisOptions(),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs for debugging
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs for investigation
        },
      },
    });

    // Log queue events
    _queue.on('error', (error) => {
      logger.error('Queue error:', error.message);
    });

    logger.info(`📋 Resume queue "${QUEUE_NAME}" initialized`);
  }
  return _queue;
}

// Export a proxy that lazily creates the queue on first property access
module.exports = new Proxy({}, {
  get(target, prop) {
    const queue = getResumeQueue();
    const value = queue[prop];
    return typeof value === 'function' ? value.bind(queue) : value;
  },
});
