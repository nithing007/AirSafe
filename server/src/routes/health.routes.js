'use strict';

/**
 * routes/health.routes.js
 *
 * Defines the routes for the health-check module.
 * This router is mounted at /api/health in app.js.
 *
 * Keeping routes and controllers in separate files means:
 *   - The route file is a simple map of method+path → handler.
 *   - The controller file holds the actual request/response logic.
 *   - Both are independently testable and replaceable.
 */

const { Router } = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = Router();

// GET /api/health
router.get('/', healthCheck);

module.exports = router;
