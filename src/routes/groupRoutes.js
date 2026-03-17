const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/my', authMiddleware, groupController.listMyGroups);
router.get('/:id', authMiddleware, groupController.getGroup);
router.post('/create', authMiddleware, groupController.createGroup);
router.post('/join', authMiddleware, groupController.joinGroup);

module.exports = router;
