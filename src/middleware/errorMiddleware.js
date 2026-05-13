/**
 * Enhanced Error Middleware
 * 
 * Centralized error handler that:
 * - Detects custom AppError instances and uses their statusCode
 * - Handles Mongoose validation errors (CastError, ValidationError, 11000)
 * - Handles JWT-specific errors
 * - Logs all 5xx errors via Winston
 * - Returns consistent error response format
 */

const logger = require('../utils/logger');
const AppError = require('../errors/AppError');

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || undefined;

  // ─── Mongoose CastError (invalid ObjectId) ──────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    code = 'INVALID_ID';
  }

  // ─── Mongoose Validation Error ──────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose Duplicate Key (11000) ─────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for '${field}' — already exists`;
    code = 'DUPLICATE_KEY';
  }

  // ─── JWT Errors ─────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  }

  // ─── Multer File Size Error ─────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size exceeds the 5MB limit';
    code = 'FILE_TOO_LARGE';
  }

  // ─── Log server errors ─────────────────────────────────────
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // ─── Send Response ─────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

module.exports = errorMiddleware;
