'use strict';

/**
 * config/db.js — MongoDB connection service using Mongoose.
 *
 * Responsibilities:
 *   - Establishes connection to MongoDB Atlas with sensible timeouts.
 *   - Logs lifecycle events (connected, error, disconnected).
 *   - Deduplicates concurrent or repeated connection calls.
 *   - Provides disconnectDB() for graceful shutdown and testing.
 *   - Idempotent: returns existing connection if already connected.
 */

const mongoose = require('mongoose');
const config = require('./env');

/**
 * Mongoose connection options.
 * serverSelectionTimeoutMS: 5000 ensures rapid failure if DNS or network is unreachable,
 * rather than hanging for 30s.
 */
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
};

let listenersAttached = false;
let connectionPromise = null;

/**
 * Attach global event listeners to the mongoose connection once.
 */
function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected.');
  });
}

/**
 * connectDB — connects to MongoDB using the configured MONGODB_URI.
 *
 * @param {string} [uri] - Optional URI override (defaults to config.mongodbUri)
 * @returns {Promise<import('mongoose').Connection>} Active mongoose connection
 */
async function connectDB(uri = config.mongodbUri) {
  // If already connected (readyState 1), reuse the active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is already in-flight, return the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  attachConnectionListeners();

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, MONGOOSE_OPTIONS);
      console.log('[db] MongoDB connected successfully.');
      return mongoose.connection;
    } catch (err) {
      console.error('[db] Failed to connect to MongoDB:', err.message);
      throw err;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * disconnectDB — gracefully closes the active MongoDB connection.
 *
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[db] MongoDB connection closed.');
  }
}

/**
 * Reset module state for unit tests
 */
function _resetDbState() {
  listenersAttached = false;
  connectionPromise = null;
}

module.exports = {
  connectDB,
  disconnectDB,
  _resetDbState,
};
