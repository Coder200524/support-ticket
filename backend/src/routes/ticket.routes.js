// =============================================
// backend/src/routes/ticket.routes.js
// =============================================
const express = require('express');
const multer = require('multer');
const { body, query } = require('express-validator');
const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketStats,
} = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

const router = express.Router();

// All ticket routes require authentication
router.use(authenticate);

// GET /api/tickets/stats - Dashboard statistics
router.get('/stats', getTicketStats);

// GET /api/tickets - Get all tickets (with filtering & pagination)
router.get(
  '/',
  [
    query('status').optional().isIn(['open', 'pending', 'closed']).withMessage('Invalid status filter.'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
  ],
  validate,
  getAllTickets
);

// POST /api/tickets - Create a new ticket
router.post(
  '/',
  upload.single('attachment'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Ticket title is required.')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters.'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required.')
      .isLength({ min: 10 }).withMessage('Description must be at least 10 characters.'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),
    body('departmentId')
      .optional()
      .isString().withMessage('Department ID must be a valid string.'),
  ],
  validate,
  createTicket
);

// GET /api/tickets/:id - Get a specific ticket
router.get('/:id', getTicketById);

// PUT /api/tickets/:id - Update a ticket
router.put(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters.'),
    body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters.'),
    body('status').optional().isIn(['open', 'pending', 'closed']).withMessage('Invalid status.'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority.'),
    body('assignedToId').optional().isString().withMessage('Assigned agent ID must be a valid string.'),
    body('departmentId').optional().isString().withMessage('Department ID must be a valid string.'),
  ],
  validate,
  updateTicket
);

// DELETE /api/tickets/:id - Delete a ticket
router.delete('/:id', deleteTicket);

module.exports = router;
