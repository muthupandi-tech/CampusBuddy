const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Subjects
router.get('/subjects', authMiddleware, academicController.getSubjects);

// Staff Subjects
router.post('/staff/subjects', authMiddleware, academicController.assignStaffSubject);
router.get('/staff/subjects/:staffId', authMiddleware, academicController.getStaffSubjects);
router.delete('/staff/subjects', authMiddleware, academicController.removeStaffSubject);

// Staff Qualifications
router.post('/staff/qualifications', authMiddleware, academicController.addStaffQualification);
router.get('/staff/qualifications/:staffId', authMiddleware, academicController.getStaffQualifications);
router.delete('/staff/qualifications/:id', authMiddleware, academicController.deleteQualification);

// Dashboard Integrations
router.get('/announcements', authMiddleware, academicController.getAnnouncements);
router.get('/announcements/history', authMiddleware, academicController.getAnnouncementHistory);
router.get('/events', authMiddleware, academicController.getEvents);
router.get('/events/history', authMiddleware, academicController.getEventHistory);
router.get('/resources/all', authMiddleware, academicController.getAllResources);

module.exports = router;
