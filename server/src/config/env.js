'use strict';

/**
 * config/env.js
 *
 * Loads environment variables from a .env file (if present) using dotenv,
 * validates that required variables exist, and exports a single frozen
 * config object.
 *
 * Centralising this here means:
 *   - A missing variable fails loudly at startup, not silently at runtime.
 *   - Every other module imports from this file, never directly from process.env.
 *
 * Phase 1 variables: PORT, NODE_ENV, CORS_ORIGIN.
 * Future variables (MONGODB_URI, OPENWEATHER_API_KEY, JWT_SECRET) will be
 * added here when those features are implemented.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env from the server/ root directory.
// In production (NODE_ENV=production), .env will not be present; variables
// are expected to be injected by the container/host environment.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * List of environment variables required for the current phase.
 * If any of these are missing, the process exits immediately with a clear
 * error message so the problem is caught before the server accepts traffic.
 */
const REQUIRED_VARS = ['PORT', 'NODE_ENV', 'CORS_ORIGIN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[config/env] Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy server/.env.example to server/.env and fill in the values.'
  );
  process.exit(1);
}

// Validate PORT is a positive integer.
// parseInt('abc', 10) returns NaN, which passes the presence check above
// but causes Node to throw ERR_SOCKET_BAD_PORT with no useful context.
const parsedPort = parseInt(process.env.PORT, 10);
if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  console.error(
    `[config/env] PORT must be a number between 1 and 65535. Received: "${process.env.PORT}"`
  );
  process.exit(1);
}

/**
 * Exported configuration object.
 * Object.freeze() prevents accidental mutation anywhere in the codebase.
 */
const config = Object.freeze({
  port: parsedPort,
  nodeEnv: process.env.NODE_ENV,
  corsOrigin: process.env.CORS_ORIGIN,
});

module.exports = config;
