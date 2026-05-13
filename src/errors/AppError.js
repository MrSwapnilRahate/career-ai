/**
 * Base Application Error
 * 
 * All custom errors extend this class.
 * Distinguishes operational errors (expected) from programming errors (bugs).
 */

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Machine-readable error code (e.g., 'USER_NOT_FOUND')
   * @param {boolean} [isOperational=true] - True for expected errors, false for bugs
   */
  constructor(message, statusCode, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Capture stack trace, excluding this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
