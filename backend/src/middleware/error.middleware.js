// =============================================
// backend/src/middleware/error.middleware.js
// =============================================
// Global Error Handler Middleware
//
// WHAT IS A GLOBAL ERROR HANDLER?
// Instead of writing try/catch in every route and
// returning error responses manually, we can let errors
// "bubble up" to this single handler. In Express, any
// middleware with 4 parameters (err, req, res, next)
// is treated as an error handler.
//
// HOW IT WORKS:
// - You call next(error) from any route or middleware
// - Express automatically skips to this error handler
// - It formats the error and sends a clean JSON response
// =============================================

const { sendError } = require('../utils/apiResponse');

/**
 * Global Error Handler
 * Must have exactly 4 parameters: (err, req, res, next)
 * This tells Express it's an error-handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle Prisma-specific errors
  if (err.code === 'P2002') {
    // P2002 = Unique constraint violation (e.g., duplicate email)
    return sendError(res, 'A record with this value already exists.', 409);
  }

  if (err.code === 'P2025') {
    // P2025 = Record not found
    return sendError(res, 'Record not found.', 404);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired. Please login again.', 401);
  }

  // Default: internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};

/**
 * 404 Not Found Handler
 * Catches any request that doesn't match a defined route
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // pass error to the global errorHandler above
};

module.exports = { errorHandler, notFound };
