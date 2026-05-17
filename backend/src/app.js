// =============================================
// backend/src/app.js
// =============================================
// Express Application Setup
//
// WHAT IS THIS FILE?
// This is the "brain" of the backend. It sets up the
// Express server, adds all the middleware (security,
// logging, parsing), and connects all the route files.
//
// WHAT IS EXPRESS?
// Express is a web framework for Node.js. It listens for
// HTTP requests (GET, POST, PUT, DELETE) and runs code
// based on the URL path and method.
//
// ORDER MATTERS!
// Middleware is applied in the order it's defined.
// Security headers (helmet) should come first.
// Body parser must come before routes.
// Error handler must come LAST.
// =============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import our route files (we'll create these next)
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const commentRoutes = require('./routes/comment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const departmentRoutes = require('./routes/department.routes');

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Create the Express application
const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Helmet: Sets various HTTP headers to protect against
// common web vulnerabilities like XSS attacks
app.use(helmet());

// CORS: Cross-Origin Resource Sharing
// This allows our React frontend (running on port 5173)
// to make requests to our backend (running on port 5000).
// Without this, browsers would block the requests by default.
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true, // Allow cookies/auth headers to be sent
}));

// Rate Limiting: Prevent brute-force attacks
// Allow max 100 requests per IP every 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// =============================================
// PARSING MIDDLEWARE
// =============================================

// Parse incoming JSON request bodies
// This allows us to access request data via req.body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// =============================================
// LOGGING MIDDLEWARE
// =============================================

// Morgan: Logs every HTTP request to the console
// "dev" format: GET /api/tickets 200 15ms
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// =============================================
// HEALTH CHECK ROUTE
// =============================================

// Simple endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Support Ticket System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// =============================================
// API ROUTES
// =============================================

// All auth routes: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes);

// All ticket routes: /api/tickets
app.use('/api/tickets', ticketRoutes);

// All comment routes: /api/comments
app.use('/api/comments', commentRoutes);

// Analytics routes: /api/analytics/summary
app.use('/api/analytics', analyticsRoutes);

// Department routes: /api/departments
app.use('/api/departments', departmentRoutes);

// =============================================
// ERROR HANDLING (must be LAST)
// =============================================

// 404 handler for any undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
