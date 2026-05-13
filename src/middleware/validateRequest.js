/**
 * Generic Request Validation Middleware
 * 
 * Factory function that creates Express middleware from a Joi schema.
 * Validates req.body and returns 400 with field-level errors on failure.
 * 
 * Usage:
 *   const { validate } = require('../middleware/validateRequest');
 *   router.post('/signup', validate(signupSchema), controller.signup);
 */

const ValidationError = require('../errors/ValidationError');

/**
 * Create validation middleware from a Joi schema.
 * @param {Object} schema - Joi validation schema
 * @param {string} [source='body'] - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,    // Return all errors, not just the first
      stripUnknown: true,   // Remove unknown fields
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace with validated & sanitized value
    req[source] = value;
    next();
  };
}

module.exports = { validate };
