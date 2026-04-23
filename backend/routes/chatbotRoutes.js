const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatbotController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, handleChat);

module.exports = router;
