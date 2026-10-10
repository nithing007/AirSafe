'use strict';

/**
 * routes/air.routes.js
 *
 * Defines routes for the air quality module.
 * Mounted at /api/air in app.js.
 */

const { Router } = require('express');
const { getCurrentAir, getForecast } = require('../controllers/air.controller');

const router = Router();

// GET /api/air/current?lat=...&lon=...
router.get('/current', getCurrentAir);

// GET /api/air/forecast?lat=...&lon=...
router.get('/forecast', getForecast);

module.exports = router;
