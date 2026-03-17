const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const { requireGroup } = require('../middleware/groupMiddleware');

router.post('/', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), contributionController.addContribution);
router.post('/mpesa', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), contributionController.initiateMpesaContribution);
router.get('/my', authMiddleware, requireGroup, contributionController.getUserContributions);
router.put('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), contributionController.updateContribution);
router.delete('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), contributionController.deleteContribution);

module.exports = router;
