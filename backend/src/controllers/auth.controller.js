// =============================================
// backend/src/controllers/auth.controller.js
// =============================================
// Authentication Controller
//
// WHAT DOES THIS FILE DO?
// This file contains the business logic for:
// 1. Registering a new user account
// 2. Logging in with email and password
// 3. Getting the current logged-in user's profile
//
// WHAT IS bcrypt?
// bcrypt is a hashing algorithm specifically designed for passwords.
// Regular hashing (like MD5) is too fast - hackers can try billions
// of combinations per second. bcrypt is INTENTIONALLY slow.
//
// How it works:
// 1. You give bcrypt a password: "mypassword123"
// 2. It mixes in a "salt" (random data) to prevent rainbow table attacks
// 3. It applies the hash function many times (controlled by "rounds")
// 4. Result: "$2a$12$randomsalt.hashedpassword" - stored in database
//
// When user logs in:
// bcrypt.compare("mypassword123", storedHash) → true (passwords match!)
//
// WHY CAN'T WE REVERSE THE HASH?
// Hashing is a ONE-WAY function. You can't go backwards.
// That's why even if someone steals the database, they can't
// see real passwords. They would have to try every possibility.
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendWelcomeEmail } = require('../services/email.service');

// BCRYPT ROUNDS: Higher = slower but more secure
// 10-12 is the industry standard.
// 12 rounds ≈ 300ms per hash - slow enough to resist attacks
// but fast enough for normal login
const BCRYPT_ROUNDS = 12;

/**
 * Helper: Generate JWT token for a user
 * The token contains the user's id, email, and role
 * These are "claims" - information encoded inside the token
 *
 * WHY INCLUDE ROLE IN TOKEN?
 * When an agent accesses the API, we need to know they're an agent
 * WITHOUT querying the database each time. The role is in the token,
 * so we can check it instantly in our middleware.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,         // User's unique ID
      email: user.email,   // User's email
      role: user.role,     // "customer" or "agent"
    },
    process.env.JWT_SECRET,    // Secret key to sign the token
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Expiry time
  );
};

// =============================================
// CONTROLLER: Register
// POST /api/auth/register
// =============================================
const register = async (req, res, next) => {
  try {
    // 1. Extract data from the request body
    const { name, email, password, role } = req.body;

    // 2. Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    // 3. Hash the password BEFORE storing in database
    // Never store plain-text passwords!
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 4. Create the user in the database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(), // Always store email lowercase
        password: hashedPassword,           // Store the HASH, not the plain password
        // Allow "agent" role on self-registration as requested
        role: role || 'customer',
      },
      // Select only safe fields to return (exclude password hash!)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. Generate JWT token for immediate login after registration
    const token = generateToken(user);

    // 6. Send welcome email (don't await - don't block the response)
    sendWelcomeEmail(user).catch(console.error);

    // 7. Return success with token and user data
    return sendSuccess(
      res,
      { user, token },
      'Account created successfully! Welcome aboard! 🎉',
      201 // 201 = Created
    );
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

// =============================================
// CONTROLLER: Login
// POST /api/auth/login
// =============================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // 2. Check if user exists
    // SECURITY NOTE: We give the same error for "no user" and "wrong password"
    // This prevents "user enumeration attacks" where someone can discover
    // which emails have accounts by checking different error messages.
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // 3. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // 4. Generate JWT token
    const token = generateToken(user);

    // 5. Return token and user info (without password!)
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          department: user.department || null,
        },
      },
      'Login successful! Welcome back! 👋'
    );
  } catch (error) {
    next(error);
  }
};

// =============================================
// CONTROLLER: Get Current User Profile
// GET /api/auth/me (protected route)
// =============================================
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the authenticate middleware
    // It contains the decoded JWT payload: { id, email, role }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        department: {
          select: { id: true, name: true },
        },
        // Include ticket counts for the dashboard
        _count: {
          select: {
            ticketsCreated: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, { user }, 'User profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
