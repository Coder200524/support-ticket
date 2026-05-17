const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getAnalyticsSummary } = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate);
router.get('/summary', getAnalyticsSummary);

module.exports = router;
