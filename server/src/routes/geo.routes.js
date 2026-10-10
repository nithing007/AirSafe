'use strict';

/**
 * routes/geo.routes.js
 *
 * Mounted at /api/geo in app.js.
 */

const { Router } = require('express');
const { searchLocationsHandler } = require('../controllers/geo.controller');

const router = Router();

// GET /api/geo/search?q=...&limit=...
router.get('/search', searchLocationsHandler);

module.exports = router;
