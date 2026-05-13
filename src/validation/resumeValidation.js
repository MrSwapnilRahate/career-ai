/**
 * Resume Validation Schemas
 * 
 * Joi schemas for validating resume-related request payloads.
 * Used with the generic validate() middleware.
 */

const Joi = require('joi');

/**
 * Job match request validation.
 * jobDescription is passed in req.body alongside the file upload.
 */
const jobMatchSchema = Joi.object({
  jobDescription: Joi.string()
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.base': 'Job description must be a string',
      'string.empty': 'Job description cannot be empty',
      'string.min': 'Job description must be at least 20 characters',
      'string.max': 'Job description cannot exceed 5000 characters',
      'any.required': 'Job description is required',
    }),
});

/**
 * History query params validation.
 */
const historyQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
    }),
});

module.exports = { jobMatchSchema, historyQuerySchema };
