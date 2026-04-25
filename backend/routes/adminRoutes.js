const express = require('express');
const router = express.Router();
const { createAdminMessage, getAdminMessages, getAdminMessageHistory, getAllAdminMessages, deactivateAdminMessage } = require('../controllers/adminMessageController');
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

module.exports = router;
