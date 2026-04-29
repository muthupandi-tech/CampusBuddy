const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/authMiddleware');
const classroomController = require('../controllers/classroomController');

router.post('/', auth, classroomController.createClassroom);
router.get('/', auth, classroomController.getClassrooms);

// Global routes (Must be above /:id)
router.get('/students', auth, classroomController.getStudents);

router.get('/:id', auth, classroomController.getClassroomDetails);

// Members
router.get('/:id/members', auth, classroomController.getMembers);
router.post('/:id/request', auth, classroomController.requestJoin);
router.put('/:id/approve', auth, classroomController.handleRequest);
router.delete('/:id/remove/:userId', auth, classroomController.removeMember);

// Resources
router.post('/:id/resources', auth, classroomController.addResource);
router.get('/:id/resources', auth, classroomController.getResources);

// Messages
router.get('/:id/messages', auth, classroomController.getMessages);

// Block
router.post('/block', auth, classroomController.toggleBlockUser);
router.get('/block/list', auth, classroomController.getBlockedUsers);

router.post('/:id/add-student', auth, classroomController.addStudentDirectly);

module.exports = router;
