// =============================================
// backend/src/middleware/validate.middleware.js
// =============================================
// Request Validation Middleware
//
// WHAT IS INPUT VALIDATION?
// Never trust data coming from the user/frontend.
// We validate inputs (e.g., "is the email actually an email?")
// BEFORE it reaches our controllers or database.
// This prevents bad data from being stored and protects
// against injection attacks.
//
// We use the "express-validator" library to define rules
// and then this middleware to check if any rules were broken.
// =============================================

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware: Process validation results from express-validator
 * Must be placed AFTER the validation rule arrays in a route
 */
const validate = (req, res, next) => {
  // Get all validation errors collected by express-validator
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format the errors into a simple array of messages
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return sendError(
      res,
      'Validation failed. Please check your inputs.',
      422, // 422 = Unprocessable Entity (the data format is wrong)
      formattedErrors
    );
  }

  // All validations passed, proceed to controller
  next();
};

module.exports = { validate };
