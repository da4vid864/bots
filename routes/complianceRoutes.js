const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { requireAuth, requireAdmin } = require('../auth/authMiddleware');

// Submit a request (Access, Rectify, Cancel, Oppose)
router.post('/request', requireAuth, complianceController.submitRequest);

// List my requests (for the user) or all requests (for the admin)
router.get('/requests', requireAuth, complianceController.listRequests);

// Admin approves/rejects a request
router.post('/requests/:id/review', requireAdmin, complianceController.reviewRequest);

module.exports = router;