const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getDepartments } = require('../controllers/department.controller');

const router = express.Router();

router.use(authenticate);
router.get('/', getDepartments);

module.exports = router;
