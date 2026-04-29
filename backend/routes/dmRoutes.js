const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/authMiddleware');
const dmController = require('../controllers/dmController');

router.get('/history/:userId', auth, dmController.getDMHistory);
router.post('/send', auth, dmController.sendDM);
router.post('/block-group', auth, dmController.toggleGroupBlock);
router.get('/blocks/:classroomId', auth, dmController.getClassroomBlocks);
router.post('/mark-read/:senderId', auth, dmController.markAsRead);
router.get('/unread-counts', auth, dmController.getUnreadCounts);

module.exports = router;
