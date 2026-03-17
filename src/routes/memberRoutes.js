const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const { requireGroup } = require('../middleware/groupMiddleware');

router.get('/', authMiddleware, requireGroup, requireRoles('admin', 'treasurer'), memberController.getMembers);
router.post('/', authMiddleware, requireGroup, requireRoles('admin'), memberController.addMember);
router.get('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer'), memberController.getMemberProfile);
router.put('/:id', authMiddleware, requireGroup, requireRoles('admin'), memberController.updateMember);
router.delete('/:id', authMiddleware, requireGroup, requireRoles('admin'), memberController.deleteMember);

module.exports = router;
