const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const { requireGroup } = require('../middleware/groupMiddleware');

router.post('/apply', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), loanController.applyLoan);
router.get('/my', authMiddleware, requireGroup, loanController.getUserLoans);
router.put('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), loanController.updateLoan);
router.delete('/:id', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), loanController.deleteLoan);

module.exports = router;
