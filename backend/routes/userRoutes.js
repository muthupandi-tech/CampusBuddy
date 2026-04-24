const express = require('express');
const router = express.Router();
const { getMe, getStaffList, getStudentList, getAdminStats, getStudentDashboard, getStaffDashboard, updateProfile, changePassword, updatePreferences } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Existing routes
router.get('/me', authMiddleware, getMe);
router.get('/profile', authMiddleware, getMe); // Alias
router.get('/staff', authMiddleware, getStaffList);
router.get('/students', authMiddleware, getStudentList);
router.get('/stats', authMiddleware, roleMiddleware(['admin']), getAdminStats);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.put('/preferences', authMiddleware, updatePreferences);

// New Role-based Dashboards (Phase 2)
router.get('/student/dashboard', authMiddleware, roleMiddleware(['student']), getStudentDashboard);
router.get('/staff/dashboard', authMiddleware, roleMiddleware(['staff']), getStaffDashboard);

module.exports = router;
