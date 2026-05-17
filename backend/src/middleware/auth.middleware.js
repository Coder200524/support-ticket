// =============================================
// backend/src/middleware/auth.middleware.js
// =============================================
// JWT Authentication Middleware
//
// WHAT IS MIDDLEWARE?
// Middleware is a function that runs BETWEEN the request
// coming in and the route handler running. Think of it
// like a security guard at a door: before you enter, you
// must show your ID. If you don't have one, you're turned away.
//
// WHAT IS JWT?
// JWT = JSON Web Token. It's a secure string (token) that 
// the server gives you after login. It contains your user 
// info encoded inside it. On every future request, you send 
// this token. The server verifies it and knows who you are
// WITHOUT checking the database every single time.
//
// TOKEN FORMAT: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// The "Bearer " prefix is a standard naming convention.
//
// HOW IT WORKS:
// 1. Client sends a request with the token in the Authorization header
// 2. This middleware intercepts the request
// 3. It extracts and verifies the token using the secret key
// 4. If valid, it attaches the user info to req.user
// 5. The actual route handler then runs with req.user available
// 6. If invalid, it immediately returns a 401 Unauthorized error
// =============================================

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware: Verify JWT Token
 * Attach decoded user data to req.user
 */
const authenticate = (req, res, next) => {
  // 1. Get the Authorization header value
  const authHeader = req.headers['authorization'];

  // 2. The token format is: "Bearer <token>"
  // So we split by space and grab the second part [1]
  const token = authHeader && authHeader.split(' ')[1];

  // 3. If no token found, deny access
  if (!token) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  try {
    // 4. Verify the token using the same secret used to sign it
    // jwt.verify() will throw an error if the token is expired or tampered
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded user payload to the request object
    // Now any route handler can access req.user.id, req.user.role, etc.
    req.user = decoded;

    // 6. Call next() to move on to the actual route handler
    next();
  } catch (error) {
    // Token was invalid or expired
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

/**
 * Middleware: Role-Based Authorization
 * Only allow users with specific roles to access a route
 * Usage: authorize('agent') or authorize('agent', 'customer')
 *
 * WHAT IS ROLE-BASED ACCESS CONTROL (RBAC)?
 * Different users have different permissions.
 * A "customer" can only see their own tickets.
 * An "agent" can see ALL tickets and update them.
 * We enforce this by checking req.user.role (set by authenticate above).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the logged-in user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}.`,
        403 // 403 = Forbidden (you're authenticated but don't have permission)
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
