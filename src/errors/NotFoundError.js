const AppError = require('./AppError');

/**
 * 404 Not Found Error
 * Use when a requested resource doesn't exist.
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = '') {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

module.exports = NotFoundError;
