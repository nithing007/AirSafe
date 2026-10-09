'use strict';

/**
 * server.js — HTTP server entry point.
 *
 * This is the only file that calls app.listen(). It is intentionally
 * thin — its sole responsibility is to start the server and log the result.
 *
 * Tests import app.js directly (via Supertest) and never touch this file,
 * which is why listen() lives here and not in app.js.
 */

const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, () => {
  console.log(
    `[server] AirSafe API running in ${config.nodeEnv} mode on port ${config.port}`
  );
  console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
});

// Handle unhandled promise rejections that bubble up to the process level.
// This prevents Node from silently swallowing async errors.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
  // Gracefully close the server before exiting so in-flight requests finish.
  server.close(() => process.exit(1));
});

module.exports = server;
