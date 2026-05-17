// =============================================
// backend/src/controllers/comment.controller.js
// =============================================
// Comment Controller - Business Logic for Comments
//
// ENDPOINTS:
// POST /api/comments               → addComment
// GET  /api/comments/ticket/:id    → getTicketComments
// DELETE /api/comments/:id         → deleteComment
//
// WHAT ARE INTERNAL NOTES?
// When an agent adds a comment with isInternalNote: true,
// it is only visible to other agents.
// This is useful for agents to discuss the issue privately.
// Customers will never see internal notes.
// =============================================

const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// =============================================
// ADD COMMENT TO A TICKET
// POST /api/comments
// Body: { ticketId, message, isInternalNote }
// =============================================
const addComment = async (req, res, next) => {
  try {
    const { ticketId, message, isInternalNote = false } = req.body;

    // 1. Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404);
    }

    // 2. Access control: customers can only comment on their own tickets
    if (req.user.role === 'customer' && ticket.createdById !== req.user.id) {
      return sendError(res, 'You can only comment on your own tickets.', 403);
    }

    // 3. Customers cannot create internal notes (agent-only feature)
    const isInternal = req.user.role === 'agent' ? isInternalNote : false;

    // 4. Create the comment
    const comment = await prisma.comment.create({
      data: {
        message: message.trim(),
        isInternalNote: isInternal,
        ticketId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // 5. If an agent commented, update ticket status to 'pending'
    // (meaning: agent is working on it)
    if (req.user.role === 'agent' && ticket.status === 'open' && !isInternal) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'pending' },
      });
    }

    const io = getIo();
    if (io) {
      io.to(ticketId).emit('newComment', comment);
    }

    return sendSuccess(res, { comment }, 'Comment added successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// =============================================
// GET COMMENTS FOR A TICKET
// GET /api/comments/ticket/:ticketId
// =============================================
const getTicketComments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Check the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404);
    }

    // Access control: customers can only see comments on their own tickets
    if (req.user.role === 'customer' && ticket.createdById !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    // Build the where clause based on user role
    const where = { ticketId };

    // Customers cannot see internal notes
    if (req.user.role === 'customer') {
      where.isInternalNote = false;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first (like a chat)
    });

    return sendSuccess(res, { comments }, 'Comments retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

// =============================================
// DELETE A COMMENT
// DELETE /api/comments/:id
// Users can only delete their own comments
// =============================================
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return sendError(res, 'Comment not found.', 404);
    }

    // Only the comment author or an agent can delete it
    if (req.user.role === 'customer' && comment.userId !== req.user.id) {
      return sendError(res, 'You can only delete your own comments.', 403);
    }

    await prisma.comment.delete({ where: { id } });

    return sendSuccess(res, {}, 'Comment deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getTicketComments, deleteComment };
