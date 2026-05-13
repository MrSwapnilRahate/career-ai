const AppError = require('./AppError');

/**
 * 401 Unauthorized Error
 * Use for authentication failures (missing/invalid/expired tokens).
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

module.exports = UnauthorizedError;
