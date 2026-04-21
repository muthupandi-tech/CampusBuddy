const express = require('express');
const router = express.Router();
const { getMessages, saveMessage } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:userId', authMiddleware, getMessages);
router.post('/', authMiddleware, saveMessage);

module.exports = router;
