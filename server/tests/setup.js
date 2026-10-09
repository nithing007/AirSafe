'use strict';

/**
 * tests/setup.js — Jest setup file (runs before each test file).
 *
 * Problem this solves:
 *   env.js calls dotenv.config() then validates that PORT, NODE_ENV and
 *   CORS_ORIGIN are present, calling process.exit(1) if any are missing.
 *   In CI there is no .env file, and the required variables would not be
 *   set unless explicitly provided. Without this file, the entire test
 *   suite would fail before the first test ran — not because the code is
 *   broken, but because the environment was not configured.
 *
 * Solution:
 *   Set safe, non-production test defaults before any module is required.
 *   This file runs before each test file (configured via jest.setupFiles
 *   in package.json), so env.js always sees these values when imported.
 *
 *   Real secrets (MONGODB_URI, OPENWEATHER_API_KEY, JWT_SECRET) are NOT
 *   set here — they will be added in future phases when those services
 *   are integrated. CI will inject real secrets via GitHub Actions secrets.
 *
 * Note: process.env values set here are only visible within the Jest worker
 * process; they do not leak to the system environment or other processes.
 */

process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
// Mock URI to satisfy config/env.js presence check during tests.
// Tests mock database connections and must NOT connect to a real MongoDB instance.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airsafe_test';

