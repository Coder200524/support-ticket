const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getAnalyticsSummary = async (req, res, next) => {
  try {
    const departmentFilter = req.user.role === 'agent' && req.user.departmentId
      ? Prisma.sql`AND "departmentId" = ${req.user.departmentId}`
      : Prisma.empty;

    const avgResolutionResult = await prisma.$queryRaw(
      Prisma.sql`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))) AS avg_seconds
        FROM "tickets"
        WHERE status = 'closed' AND "resolvedAt" IS NOT NULL
        ${departmentFilter}
      `
    );

    const avgResolutionSeconds = avgResolutionResult?.[0]?.avg_seconds ?? null;
    const averageResolutionTime = avgResolutionSeconds !== null
      ? Math.round(avgResolutionSeconds / 3600) // convert to hours for dashboard
      : null;

    const weeklyActivity = await prisma.$queryRaw(
      Prisma.sql`
        SELECT to_char(gs.day, 'Mon DD') AS day_label, COALESCE(count, 0) AS ticketCount
        FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS gs(day)
        LEFT JOIN (
          SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*) AS count
          FROM "tickets"
          WHERE 1=1
          ${departmentFilter}
          GROUP BY DATE_TRUNC('day', "createdAt")::date
        ) activity ON activity.day = gs.day::date
        ORDER BY gs.day ASC
      `
    );

    const departmentBreakdown = await prisma.$queryRaw(
      Prisma.sql`
        SELECT d.name AS department, COUNT(t.id) AS ticketCount
        FROM "tickets" t
        LEFT JOIN "departments" d ON d.id = t."departmentId"
        WHERE 1=1
        ${departmentFilter}
        GROUP BY d.name
        ORDER BY ticketCount DESC
        LIMIT 8
      `
    );

    const agentResolution = await prisma.$queryRaw(
      Prisma.sql`
        SELECT u.id AS "userId", u.name, COUNT(t.id) AS resolvedCount,
               AVG(EXTRACT(EPOCH FROM (t."resolvedAt" - t."createdAt"))) AS avgSeconds
        FROM "tickets" t
        JOIN "users" u ON u.id = t."assignedToId"
        WHERE t.status = 'closed' AND t."assignedToId" IS NOT NULL
        ${departmentFilter}
        GROUP BY u.id, u.name
        ORDER BY resolvedCount DESC
        LIMIT 5
      `
    );

    return sendSuccess(res, {
      summary: {
        averageResolutionTime,
        weeklyActivity: weeklyActivity.map((row) => ({
          day: row.day_label,
          ticketCount: Number(row.ticketcount),
        })),
        departmentBreakdown: departmentBreakdown.map((row) => ({
          department: row.department || 'Unassigned',
          ticketCount: Number(row.ticketcount),
        })),
        topAgents: agentResolution.map((row) => ({
          userId: row.userId,
          agentName: row.name,
          resolvedCount: Number(row.resolvedcount),
          avgResponseTime: row.avgseconds ? Math.round(Number(row.avgseconds) / 3600) : null,
        })),
      },
    }, 'Analytics summary retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalyticsSummary };
