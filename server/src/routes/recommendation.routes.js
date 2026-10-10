'use strict';

/**
 * routes/recommendation.routes.js
 *
 * Mounted at /api/recommendations in app.js.
 */

const { Router } = require('express');
const {
  getCurrentRecommendationsHandler,
  getBestTimeHandler,
} = require('../controllers/recommendation.controller');

const router = Router();

// GET /api/recommendations/current?lat=...&lon=...
router.get('/current', getCurrentRecommendationsHandler);

// GET /api/recommendations/best-time?lat=...&lon=...
router.get('/best-time', getBestTimeHandler);

module.exports = router;
