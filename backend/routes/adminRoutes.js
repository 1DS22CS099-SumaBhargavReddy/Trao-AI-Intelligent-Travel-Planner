const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/admin/health
router.get('/health', adminController.getApiHealth);

module.exports = router;
