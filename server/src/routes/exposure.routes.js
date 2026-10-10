'use strict';

/**
 * routes/exposure.routes.js
 *
 * Mounted at /api/exposure in app.js.
 */

const { Router } = require('express');
const {
  calculateExposure,
  getExposureHistory,
} = require('../controllers/exposure.controller');

const router = Router();

// POST /api/exposure/calculate
router.post('/calculate', calculateExposure);

// GET /api/exposure/history
router.get('/history', getExposureHistory);

module.exports = router;
