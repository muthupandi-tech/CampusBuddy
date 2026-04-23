const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/student', authMiddleware, roleMiddleware(['student']), getStudentAnalytics);
router.get('/admin', authMiddleware, roleMiddleware(['admin']), getAdminAnalytics);

module.exports = router;
