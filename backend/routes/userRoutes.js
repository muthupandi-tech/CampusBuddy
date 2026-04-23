const express = require('express');
const router = express.Router();
const { getMe, getStaffList, getStudentList, getAdminStats, getStudentDashboard, getStaffDashboard, updateProfile } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Existing routes
router.get('/me', authMiddleware, getMe);
router.get('/profile', authMiddleware, getMe); // Alias
router.get('/staff', authMiddleware, getStaffList);
router.get('/students', authMiddleware, getStudentList);
router.get('/stats', authMiddleware, roleMiddleware(['admin']), getAdminStats);
router.put('/profile', authMiddleware, updateProfile);

// New Role-based Dashboards (Phase 2)
router.get('/student/dashboard', authMiddleware, roleMiddleware(['student']), getStudentDashboard);
router.get('/staff/dashboard', authMiddleware, roleMiddleware(['staff']), getStaffDashboard);

module.exports = router;
