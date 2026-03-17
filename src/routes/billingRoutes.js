const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');

router.post('/stkpush', authMiddleware, requireRoles('admin', 'treasurer', 'member'), billingController.stkPush);
router.post('/callback', billingController.mpesaCallback);
router.post('/card', authMiddleware, requireRoles('admin', 'treasurer', 'member'), billingController.cardPayment);
router.get('/status', authMiddleware, requireRoles('admin', 'treasurer', 'member'), billingController.getSubscriptionStatus);

module.exports = router;
