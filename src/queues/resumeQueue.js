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
 */

const { Queue } = require('bullmq');
const { config } = require('../config/environment');
const logger = require('../utils/logger');

const QUEUE_NAME = 'resume-analysis';

const resumeQueue = new Queue(QUEUE_NAME, {
  connection: {
    url: config.redisUrl,
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
resumeQueue.on('error', (error) => {
  logger.error('Queue error:', error.message);
});

logger.info(`📋 Resume queue "${QUEUE_NAME}" initialized`);

module.exports = resumeQueue;
