const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  uploadResource, getResources,
  createAnnouncement, getAnnouncements,
  createEvent, getEvents,
  getTimetable
} = require('../controllers/academicController');

// Resources mapping securely
router.post('/resources', authMiddleware, roleMiddleware(['staff']), upload.single('file'), uploadResource);
router.get('/resources/:subjectId', authMiddleware, getResources); 

// Announcements mapping seamlessly
router.post('/announcements', authMiddleware, roleMiddleware(['admin', 'staff']), createAnnouncement);
router.get('/announcements', authMiddleware, getAnnouncements);

// Events strictly tied natively inside
router.post('/events', authMiddleware, roleMiddleware(['admin']), createEvent);
router.get('/events', authMiddleware, getEvents);

// Timetable organically maps
router.get('/timetable', authMiddleware, getTimetable);

module.exports = router;
