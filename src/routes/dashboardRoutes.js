const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const { requireGroup } = require('../middleware/groupMiddleware');

router.get('/stats', authMiddleware, requireGroup, requireRoles('admin', 'treasurer', 'member'), dashboardController.getStats);
router.get('/reports/financial', authMiddleware, requireGroup, requireRoles('admin', 'treasurer'), dashboardController.getFinancialReports);
router.get('/reports/financial/export', authMiddleware, requireGroup, requireRoles('admin', 'treasurer'), dashboardController.exportFinancialReports);
router.get('/audit/logs', authMiddleware, requireRoles('admin'), dashboardController.getAuditLogs);

module.exports = router;
