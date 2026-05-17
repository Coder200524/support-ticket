// =============================================
// backend/src/routes/auth.routes.js
// =============================================
// Authentication Routes
//
// WHAT IS A ROUTE FILE?
// Route files map HTTP methods + URLs to controller functions.
// Think of it as a "directory" or "phone book":
//   "If someone calls POST /api/auth/register, send them to
//    the register function in auth.controller.js"
//
// VALIDATION:
// We use express-validator to validate input BEFORE it reaches
// the controller. If validation fails, the validate middleware
// returns an error immediately without running the controller.
//
// ROUTE CHAIN:
// POST /api/auth/register
//   → [validation rules]
//   → validate (check if rules passed)
//   → register (controller: do the actual work)
// =============================================

const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// =============================================
// POST /api/auth/register
// Create a new user account
// =============================================
router.post(
  '/register',
  [
    // Validation rules using express-validator
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(), // Convert to lowercase, remove dots from gmail addresses

    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number.'),

    body('role')
      .optional()
      .isIn(['customer', 'agent']).withMessage('Role must be either "customer" or "agent".'),
  ],
  validate,   // Check validation results
  register    // Run the controller
);

// =============================================
// POST /api/auth/login
// Login with email and password, get JWT token
// =============================================
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.'),

    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

// =============================================
// GET /api/auth/me
// Get the currently logged-in user's profile
// authenticate middleware must run first (protected route)
// =============================================
router.get('/me', authenticate, getMe);

module.exports = router;
