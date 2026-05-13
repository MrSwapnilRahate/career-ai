/**
 * Request Logger Middleware
 * 
 * Logs every API request with method, URL, status code, and response time.
 * Skips health check endpoint to avoid log noise.
 */

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Skip health check logging
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 80),
    };

    // Add user ID if authenticated
    if (req.user?.id) {
      logData.userId = req.user.id;
    }

    // Use appropriate log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = requestLogger;
