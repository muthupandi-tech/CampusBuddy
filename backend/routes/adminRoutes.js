const express = require('express');
const router = express.Router();
const { createAdminMessage, getAdminMessages, getAdminMessageHistory, getAllAdminMessages, deactivateAdminMessage } = require('../controllers/adminMessageController');
const adminController = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Admin-only: create a broadcast message
router.post('/messages', authMiddleware, roleMiddleware(['admin']), createAdminMessage);

// Admin-only: get all messages (for admin panel)
router.get('/messages/all', authMiddleware, roleMiddleware(['admin']), getAllAdminMessages);

// Admin-only: deactivate a message (move to history)
router.put('/messages/:id/deactivate', authMiddleware, roleMiddleware(['admin']), deactivateAdminMessage);

// Authenticated users: get active messages targeted to their role
router.get('/messages', authMiddleware, getAdminMessages);

// Authenticated users: get expired/deactivated message history
router.get('/messages/history', authMiddleware, getAdminMessageHistory);

// Class Assignments (Admin only)
router.get('/classes', authMiddleware, roleMiddleware(['admin']), adminController.getClasses);
router.get('/staff', authMiddleware, roleMiddleware(['admin']), adminController.getStaff);
router.post('/assign-class', authMiddleware, roleMiddleware(['admin']), adminController.assignClass);
router.post('/unassign-class', authMiddleware, roleMiddleware(['admin']), adminController.unassignClass);

// Dynamic Management
router.get('/departments', authMiddleware, roleMiddleware(['admin']), adminController.getDepartments);
router.post('/departments', authMiddleware, roleMiddleware(['admin']), adminController.addDepartment);
router.post('/sections', authMiddleware, roleMiddleware(['admin']), adminController.addSection);
router.post('/sections/:id/delete', authMiddleware, roleMiddleware(['admin']), adminController.deleteSection);

module.exports = router;
