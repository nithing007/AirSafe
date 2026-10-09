'use strict';

/**
 * controllers/health.controller.js
 *
 * Handles the GET /api/health request.
 *
 * A health endpoint has one job: tell the caller that the server process
 * is running and able to respond to requests. It does not check the
 * database or external APIs — those are separate concerns for a future
 * "readiness" or "deep health" endpoint.
 *
 * Response shape (agreed in docs/api-contract.md and approved Phase 1 spec):
 *   HTTP 200
 *   {
 *     "status":    "ok",
 *     "timestamp": "<ISO 8601 UTC>",
 *     "version":   "<package.json version>"
 *   }
 */

const { version } = require('../../package.json');

/**
 * healthCheck
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function healthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
  });
}

module.exports = { healthCheck };
