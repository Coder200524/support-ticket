// =============================================
// backend/tests/setup.js
// =============================================
// Global Setup for Jest Tests
// =============================================
const prisma = require('../src/config/prisma');

// After all tests finish, disconnect from the database
// so the Jest process can exit cleanly
afterAll(async () => {
  await prisma.$disconnect();
});
