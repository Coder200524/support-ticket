// =============================================
// backend/src/routes/comment.routes.js
// =============================================
const express = require('express');
const { body } = require('express-validator');
const { addComment, getTicketComments, deleteComment } = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// All comment routes require authentication
router.use(authenticate);

// POST /api/comments - Add comment to a ticket
router.post(
  '/',
  [
    body('ticketId').notEmpty().withMessage('Ticket ID is required.'),
    body('message').trim().notEmpty().withMessage('Comment message is required.')
      .isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters.'),
    body('isInternalNote').optional().isBoolean().withMessage('isInternalNote must be true or false.'),
  ],
  validate,
  addComment
);

// GET /api/comments/ticket/:ticketId - Get all comments for a ticket
router.get('/ticket/:ticketId', getTicketComments);

// DELETE /api/comments/:id - Delete a comment
router.delete('/:id', deleteComment);

module.exports = router;
