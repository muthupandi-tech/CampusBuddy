const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  uploadResource, getResources,
  createAnnouncement, getAnnouncements, getAnnouncementHistory,
  createEvent, getEvents, getEventHistory,
  getTimetable
} = require('../controllers/academicController');

// Resources mapping securely
router.post('/resources', authMiddleware, roleMiddleware(['staff']), uploadResource);
router.get('/resources/:subjectId', authMiddleware, getResources); 

// Announcements mapping seamlessly
router.post('/announcements', authMiddleware, roleMiddleware(['admin', 'staff']), createAnnouncement);
router.get('/announcements', authMiddleware, getAnnouncements);
router.get('/announcements/history', authMiddleware, getAnnouncementHistory);

// Events strictly tied natively inside
router.post('/events', authMiddleware, roleMiddleware(['admin']), createEvent);
router.get('/events', authMiddleware, getEvents);
router.get('/events/history', authMiddleware, getEventHistory);

// Timetable organically maps
router.get('/timetable', authMiddleware, getTimetable);

module.exports = router;
