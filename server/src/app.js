'use strict';

/**
 * app.js — Express application factory.
 *
 * This file creates and configures the Express application and exports it.
 * It does NOT call app.listen(). That is done exclusively in server.js.
 *
 * Why this separation matters:
 *   Supertest imports this file to run integration tests. If app.listen()
 *   were called here, every test file would open a real network port,
 *   causing port conflicts and making tests slower. Supertest handles the
 *   HTTP layer internally without needing a listening server.
 *
 * Middleware order in an Express app is significant. The order here is:
 *   1. CORS          — must be first so pre-flight OPTIONS requests are handled.
 *   2. express.json  — parses incoming JSON request bodies.
 *   3. Routes        — application route handlers.
 *   4. notFound      — catches any request that didn't match a route (404).
 *   5. errorHandler  — catches errors thrown/passed from any route (500).
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');

const healthRouter = require('./routes/health.routes');
const airRouter = require('./routes/air.routes');
const exposureRouter = require('./routes/exposure.routes');
const recommendationRouter = require('./routes/recommendation.routes');
const geoRouter = require('./routes/geo.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────

// CORS: Allow requests from the configured frontend origin.
// In development this is http://localhost:5173 (Vite default).
// In production it will be the deployed frontend domain.
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse incoming request bodies as JSON.
// Requests with Content-Type: application/json are automatically parsed.
// Invalid JSON will trigger a SyntaxError that errorHandler will catch.
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────

// All API routes are prefixed with /api.
app.use('/api/health', healthRouter);
app.use('/api/air', airRouter);
app.use('/api/exposure', exposureRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/geo', geoRouter);

// ── Error handlers (must be mounted last) ──────────────────────────────────

// 404 — catches any request that did not match a registered route above.
app.use(notFound);

// 500 — catches errors passed via next(err) from any route or middleware.
app.use(errorHandler);

module.exports = app;
