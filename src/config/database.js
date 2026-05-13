/**
 * MongoDB Connection Manager
 * 
 * Handles connection with retry logic and graceful disconnect.
 * Uses exponential backoff for connection retries.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { config } = require('./environment');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000; // Base delay, doubles each retry

/**
 * Connect to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with exponential backoff.
 */
async function connectDatabase() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(config.mongoUri);
      logger.info('✅ MongoDB connected successfully');

      // Log connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return; // Success — exit retry loop
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error.message
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`
        );
      }

      // Exponential backoff: 3s, 6s, 12s
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Gracefully close the MongoDB connection.
 * Called during server shutdown.
 */
async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error.message);
  }
}

module.exports = { connectDatabase, disconnectDatabase };
