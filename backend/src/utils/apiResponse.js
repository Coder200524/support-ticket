// =============================================
// backend/src/utils/apiResponse.js
// =============================================
// Utility functions to create consistent API responses.
//
// WHY CONSISTENT RESPONSES?
// Every API endpoint should return data in the same format.
// This makes it easy for the frontend to know exactly
// what shape of data to expect. It also makes debugging easier.
//
// RESPONSE FORMAT:
// Success: { success: true, message: "...", data: {...} }
// Error:   { success: false, message: "...", errors: [...] }
// =============================================

/**
 * Send a successful API response
 * @param {object} res - Express response object
 * @param {object} data - Data to send back (can be anything)
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error API response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Array} errors - Array of detailed error messages (optional)
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { sendSuccess, sendError };
