// =============================================
// backend/src/config/prisma.js
// =============================================
// This file creates ONE shared Prisma Client instance.
//
// WHY ONE INSTANCE?
// Prisma Client manages a connection pool to the database.
// If we create a new instance in every file, we'll open
// too many connections and exhaust the database pool.
// By exporting a single instance here, all files share
// the same pool. This is called the "Singleton Pattern".
//
// HOW IT WORKS:
// PrismaClient() connects to the DATABASE_URL in your .env file.
// prisma.user, prisma.ticket, prisma.comment etc. match
// the models you define in prisma/schema.prisma.
// =============================================

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Create a single Prisma Client instance
const prisma = new PrismaClient({
  adapter,
  // Log all queries in development so you can see what SQL is generated
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
