const AppError = require('./AppError');

/**
 * 403 Forbidden Error
 * Use when user is authenticated but lacks permission.
 */
class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = ForbiddenError;
