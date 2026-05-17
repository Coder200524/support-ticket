// =============================================
// backend/src/controllers/ticket.controller.js
// =============================================
// Ticket Controller - Business Logic for Tickets
//
// ENDPOINTS THIS CONTROLLER HANDLES:
// POST   /api/tickets         → createTicket
// GET    /api/tickets         → getAllTickets
// GET    /api/tickets/:id     → getTicketById
// PUT    /api/tickets/:id     → updateTicket
// DELETE /api/tickets/:id     → deleteTicket
//
// ACCESS CONTROL:
// - Customers: create tickets, view THEIR OWN tickets only
// - Agents: view tickets for their department and update any fields
// - Both: cannot delete (only admin could, if we had one)
//
// WHAT IS PAGINATION?
// When you have thousands of tickets, you can't return them all
// at once - it would be too slow and too much data.
// Pagination returns data in "pages" (like a book):
//   Page 1: tickets 1-10
//   Page 2: tickets 11-20
//   etc.
// The client sends: ?page=2&limit=10
// The server returns: 10 tickets starting from the 11th
// =============================================

const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');
const { uploadBuffer } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendTicketCreatedEmail, sendTicketUpdatedEmail } = require('../services/email.service');

const normalizeSortBy = (sortBy) => {
  const allowed = ['createdAt', 'updatedAt', 'priority', 'status'];
  return allowed.includes(sortBy) ? sortBy : 'createdAt';
};

const normalizeSortOrder = (order) => {
  return order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
};

// =============================================
// CREATE TICKET
// POST /api/tickets
// Only customers and agents can create tickets
// =============================================
const createTicket = async (req, res, next) => {
  try {
    const { title, description, priority, departmentId } = req.body;

    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority: priority || 'medium',
        status: 'open',
        createdById: req.user.id,
        departmentId: departmentId || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    });

      if (req.file) {
        try {
          const backendUrl = process.env.API_URL || 'http://localhost:5000';
          const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

          await prisma.attachment.create({
            data: {
              ticketId: ticket.id,
              url: fileUrl,
              filename: req.file.originalname,
              mimeType: req.file.mimetype,
            },
          });
        } catch (uploadError) {
          console.error('Attachment upload failed:', uploadError.message);
        }
      }

    sendTicketCreatedEmail(
      { name: req.user.name || 'User', email: req.user.email },
      ticket
    ).catch(console.error);

    return sendSuccess(res, { ticket }, 'Ticket created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// =============================================
// GET ALL TICKETS
// GET /api/tickets
// Customers: only see their own tickets
// Agents: see tickets for their department
// Supports filtering by status, priority, search text and pagination
// =============================================
const getAllTickets = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const orderField = normalizeSortBy(sortBy);
    const orderDirection = normalizeSortOrder(sortOrder);

    const baseFilters = {};
    if (req.user.role === 'customer') {
      baseFilters.createdById = req.user.id;
    }
    if (req.user.role === 'agent' && req.user.departmentId) {
      baseFilters.departmentId = req.user.departmentId;
    }
    if (status) baseFilters.status = status;
    if (priority) baseFilters.priority = priority;

    if (search) {
      const normalizedSearch = search.trim();
      const departmentFilter = req.user.role === 'agent' && req.user.departmentId
        ? Prisma.sql`AND "departmentId" = ${req.user.departmentId}`
        : Prisma.empty;

      const customerFilter = req.user.role === 'customer'
        ? Prisma.sql`AND "createdById" = ${req.user.id}`
        : Prisma.empty;

      const statusFilter = status ? Prisma.sql`AND "status" = ${status}` : Prisma.empty;
      const priorityFilter = priority ? Prisma.sql`AND "priority" = ${priority}` : Prisma.empty;

      const ids = await prisma.$queryRaw(
        Prisma.sql`
          SELECT id FROM "tickets"
          WHERE to_tsvector('english', title || ' ' || description)
            @@ plainto_tsquery('english', ${normalizedSearch})
          ${customerFilter}
          ${departmentFilter}
          ${statusFilter}
          ${priorityFilter}
          ORDER BY "createdAt" DESC
          OFFSET ${skip}
          LIMIT ${limitNum}
        `
      );

      const totalResult = await prisma.$queryRaw(
        Prisma.sql`
          SELECT COUNT(*) AS count
          FROM "tickets"
          WHERE to_tsvector('english', title || ' ' || description)
            @@ plainto_tsquery('english', ${normalizedSearch})
          ${customerFilter}
          ${departmentFilter}
          ${statusFilter}
          ${priorityFilter}
        `
      );

      const ticketIds = ids.map((row) => row.id);
      const tickets = ticketIds.length > 0
        ? await prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: { [orderField]: orderDirection },
        })
        : [];

      const totalCount = Number(totalResult?.[0]?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return sendSuccess(res, {
        tickets,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum,
        },
      }, 'Tickets retrieved successfully.');
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where: baseFilters,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take: limitNum,
      }),
      prisma.ticket.count({ where: baseFilters }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return sendSuccess(res, {
      tickets,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum,
      },
    }, 'Tickets retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// =============================================
// GET SINGLE TICKET
// GET /api/tickets/:id
// =============================================
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        attachments: true,
        activities: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
          ...(req.user.role === 'customer' && { where: { isInternalNote: false } }),
        },
        _count: { select: { comments: true } },
      },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404);
    }

    if (req.user.role === 'customer' && ticket.createdById !== req.user.id) {
      return sendError(res, 'You do not have permission to view this ticket.', 403);
    }

    return sendSuccess(res, { ticket }, 'Ticket retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// =============================================
// UPDATE TICKET
// PUT /api/tickets/:id
// =============================================
const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedToId, departmentId } = req.body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { createdBy: { select: { email: true, name: true } } },
    });

    if (!existingTicket) {
      return sendError(res, 'Ticket not found.', 404);
    }

    if (req.user.role === 'customer' && existingTicket.createdById !== req.user.id) {
      return sendError(res, 'You do not have permission to update this ticket.', 403);
    }

    const updateData = {};
    const activityEntries = [];

    if (title && title.trim() !== existingTicket.title) {
      activityEntries.push({
        ticketId: id,
        userId: req.user.id,
        action: 'title_updated',
        oldValue: existingTicket.title,
        newValue: title.trim(),
      });
      updateData.title = title.trim();
    }

    if (description && description.trim() !== existingTicket.description) {
      activityEntries.push({
        ticketId: id,
        userId: req.user.id,
        action: 'description_updated',
        oldValue: existingTicket.description,
        newValue: description.trim(),
      });
      updateData.description = description.trim();
    }

    if (req.user.role === 'agent') {
      if (status && status !== existingTicket.status) {
        activityEntries.push({
          ticketId: id,
          userId: req.user.id,
          action: 'status_changed',
          oldValue: existingTicket.status,
          newValue: status,
        });
        updateData.status = status;
        updateData.resolvedAt = status === 'closed' ? new Date() : null;
      }

      if (priority && priority !== existingTicket.priority) {
        activityEntries.push({
          ticketId: id,
          userId: req.user.id,
          action: 'priority_changed',
          oldValue: existingTicket.priority,
          newValue: priority,
        });
        updateData.priority = priority;
      }

      if (assignedToId !== undefined && assignedToId !== existingTicket.assignedToId) {
        activityEntries.push({
          ticketId: id,
          userId: req.user.id,
          action: 'assignment_changed',
          oldValue: existingTicket.assignedToId || 'unassigned',
          newValue: assignedToId || 'unassigned',
        });
        updateData.assignedToId = assignedToId || null;
      }

      if (departmentId !== undefined && departmentId !== existingTicket.departmentId) {
        activityEntries.push({
          ticketId: id,
          userId: req.user.id,
          action: 'department_changed',
          oldValue: existingTicket.departmentId || 'none',
          newValue: departmentId || 'none',
        });
        updateData.departmentId = departmentId || null;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (activityEntries.length > 0) {
      await prisma.ticketActivity.createMany({ data: activityEntries });
    }

    if (status && status !== existingTicket.status) {
      sendTicketUpdatedEmail(existingTicket.createdBy, updatedTicket).catch(console.error);
    }

    return sendSuccess(res, { ticket: updatedTicket }, 'Ticket updated successfully.');
  } catch (error) {
    next(error);
  }
};

// =============================================
// DELETE TICKET
// DELETE /api/tickets/:id
// =============================================
const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404);
    }

    if (req.user.role === 'customer' && ticket.createdById !== req.user.id) {
      return sendError(res, 'You do not have permission to delete this ticket.', 403);
    }

    await prisma.ticket.delete({ where: { id } });

    return sendSuccess(res, {}, 'Ticket deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// =============================================
// GET TICKET STATS (for dashboard)
// GET /api/tickets/stats
// =============================================
const getTicketStats = async (req, res, next) => {
  try {
    const where = req.user.role === 'customer'
      ? { createdById: req.user.id }
      : {};

    if (req.user.role === 'agent' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    }

    const [open, pending, closed, total] = await Promise.all([
      prisma.ticket.count({ where: { ...where, status: 'open' } }),
      prisma.ticket.count({ where: { ...where, status: 'pending' } }),
      prisma.ticket.count({ where: { ...where, status: 'closed' } }),
      prisma.ticket.count({ where }),
    ]);

    return sendSuccess(res, { stats: { open, pending, closed, total } }, 'Ticket statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketStats,
};
