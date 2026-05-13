/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT access tokens from the Authorization header.
 * Attaches decoded user info to req.user.
 * Uses custom error classes for consistent error responses.
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');
const UnauthorizedError = require('../errors/UnauthorizedError');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header exists
    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid token format — use "Bearer <token>"');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user to request
    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    // JWT-specific errors are handled by error middleware,
    // but wrap them in UnauthorizedError for consistency
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

module.exports = authMiddleware;
