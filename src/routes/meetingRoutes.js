const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const { requireGroup } = require('../middleware/groupMiddleware');

router.post('/', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.createMeeting);
router.get('/', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.getMeetings);
router.put('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.updateMeeting);
router.delete('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.deleteMeeting);
router.post('/minutes', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.createMinute);
router.put('/minutes/:meetingId', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.updateMinute);
router.get('/minutes/:meetingId', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), meetingController.getMinuteByMeeting);

module.exports = router;
