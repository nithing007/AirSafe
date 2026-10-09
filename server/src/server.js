'use strict';

/**
 * server.js — HTTP server entry point with MongoDB startup and graceful shutdown.
 *
 * Startup flow:
 *   1. Connect to MongoDB Atlas via db.connectDB().
 *   2. If connection succeeds, start listening for HTTP requests on config.port.
 *   3. If initial connection fails, log error clearly and exit(1) before accepting traffic.
 *
 * Graceful shutdown:
 *   - Traps SIGINT and SIGTERM signals.
 *   - Closes the HTTP server so in-flight requests finish and new requests are rejected.
 *   - Closes the Mongoose database connection via db.disconnectDB().
 *   - Enforces a shutdown timeout so the process never hangs indefinitely.
 *   - Safe to execute even if startup failed or server is not listening.
 */

const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

const SHUTDOWN_TIMEOUT_MS = 10000;

let server = null;
let isShuttingDown = false;

/**
 * shutdown — gracefully terminates the HTTP server and database connection.
 *
 * @param {string} signal - Trigger reason (e.g., 'SIGINT', 'SIGTERM', 'UNHANDLED_REJECTION')
 * @param {number} [exitCode=0] - Process exit code
 */
async function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`[server] Received ${signal}. Starting graceful shutdown...`);

  // Ensure shutdown cannot hang indefinitely
  const forceExitTimer = setTimeout(() => {
    console.error('[server] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  if (forceExitTimer.unref) {
    forceExitTimer.unref();
  }

  try {
    if (server && server.listening) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('[server] Error closing HTTP server:', err);
          } else {
            console.log('[server] HTTP server closed.');
          }
          resolve();
        });
      });
    }

    await db.disconnectDB();
    clearTimeout(forceExitTimer);
    console.log('[server] Graceful shutdown complete.');
    process.exit(exitCode);
  } catch (err) {
    clearTimeout(forceExitTimer);
    console.error('[server] Error during graceful shutdown:', err);
    process.exit(1);
  }
}

/**
 * startServer — connects to MongoDB then starts HTTP listener.
 */
async function startServer() {
  try {
    await db.connectDB();

    server = app.listen(config.port, () => {
      console.log(
        `[server] AirSafe API running in ${config.nodeEnv} mode on port ${config.port}`
      );
      console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
    });

    server.on('error', (err) => {
      console.error('[server] HTTP server error:', err);
      shutdown('SERVER_ERROR', 1);
    });

    return server;
  } catch (err) {
    console.error('[server] Fatal: could not initialize database on startup:', err.message);
    process.exit(1);
  }
}

/**
 * Helper for testing lifecycle states
 */
function _resetServerState() {
  server = null;
  isShuttingDown = false;
}

// Handle termination signals
process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
  shutdown('UNHANDLED_REJECTION', 1);
});

// Auto-start if executed directly (e.g., node src/server.js)
if (require.main === module) {
  startServer();
}

module.exports = { startServer, shutdown, _resetServerState };
