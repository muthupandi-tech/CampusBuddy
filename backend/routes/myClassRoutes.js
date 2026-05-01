const express = require('express');
const router = express.Router();
const myClassController = require('../controllers/myClassController');
const { authMiddleware: auth } = require('../middleware/authMiddleware');

// Student & Common
router.get('/info', auth, myClassController.getMyClassInfo);
router.get('/timetable', auth, myClassController.getTimetable);
router.get('/students', auth, myClassController.getClassmates);
router.get('/marks', auth, myClassController.getMarks);
router.get('/chat', auth, myClassController.getChatHistory);

// Staff
router.get('/staff/sections', auth, myClassController.getStaffSections);
router.get('/staff/section/:sectionId/students', auth, myClassController.getSectionStudents);
router.get('/staff/section/:sectionId/marks-matrix', auth, myClassController.getSectionMarksMatrix);
router.post('/staff/marks', auth, myClassController.upsertMarks);
router.post('/staff/timetable', auth, myClassController.assignTimetable);


module.exports = router;
