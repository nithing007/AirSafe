'use strict';

/**
 * routes/route.routes.js
 *
 * Defines routes for the route comparison module.
 * Mounted at /api/routes in app.js.
 */

const { Router } = require('express');
const { compareRoutesHandler } = require('../controllers/route.controller');

const router = Router();

// POST /api/routes/compare
router.post('/compare', compareRoutesHandler);

module.exports = router;
