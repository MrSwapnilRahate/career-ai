const AppError = require('./AppError');

/**
 * 400 Validation Error
 * Use for invalid input, malformed requests, or business rule violations.
 */
class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Array} [details] - Field-level validation details
   */
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

module.exports = ValidationError;
