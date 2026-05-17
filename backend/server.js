// =============================================
// backend/server.js
// =============================================
// Server Entry Point
//
// This file is the starting point of the backend.
// It imports the configured Express app and starts
// listening on a port for incoming HTTP connections.
//
// WHY SEPARATE app.js AND server.js?
// Separating them makes testing easier.
// During testing, we can import app.js WITHOUT
// starting the actual server (no port conflicts).
// server.js only runs during actual development/production.
// =============================================

require('dotenv').config(); // Load .env file first, before anything else

const app = require('./src/app');
const prisma = require('./src/config/prisma');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

const ensureDepartments = async () => {
  const departmentNames = ['Billing', 'Technical', 'Sales'];
  for (const name of departmentNames) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
};

// Start the Express server
const server = app.listen(PORT, async () => {
  console.log('🚀 ================================');
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 API URL: http://localhost:${PORT}/api`);
  console.log('🚀 ================================');

  // Test database connection
  try {
    await prisma.$connect();
    await ensureDepartments();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct in .env');
    process.exit(1); // Exit if DB connection fails
  }
});

initSocket(server);

// Graceful shutdown: close DB connection when server stops
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server; // Export for testing
