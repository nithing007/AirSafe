'use strict';

/**
 * middleware/errorHandler.js
 *
 * Two middleware functions that must be the LAST things mounted in app.js:
 *
 *   1. notFound   — catches any request that fell through all registered routes
 *                   and returns a consistent 404 JSON response.
 *
 *   2. errorHandler — Express's global error-handling middleware (identified by
 *                     its four-parameter signature: err, req, res, next).
 *                     Catches errors thrown or passed via next(err) anywhere in
 *                     the application and returns a consistent 500 JSON response.
 *
 * Why consistent JSON errors matter:
 *   The frontend uses Axios. Axios error handling reads error.response.data.
 *   If any error response is not JSON (e.g. a plain "Not Found" string),
 *   Axios will throw a JSON parse error, making debugging much harder.
 *   Every error response from this server must be { status, message } JSON.
 */

const config = require('../config/env');

/**
 * notFound — 404 handler.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function notFound(req, res) {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * errorHandler — global Express error handler.
 * The four-parameter signature is required by Express to recognise this
 * function as an error-handling middleware (not a regular middleware).
 *
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  — required by Express; unused.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error internally for debugging, but never send stack traces
  // or internal details to the client — that would be a security risk.
  console.error('[errorHandler]', err);

  const statusCode = err.statusCode || 500;

  // Safe operational errors (4xx client errors and 502/503/504 upstream gateway errors)
  // retain their safe messages in production. Unhandled 500 errors are masked.
  const isOperational =
    (statusCode >= 400 && statusCode < 500) ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504;

  const isProduction =
    config.nodeEnv === 'production' || process.env.NODE_ENV === 'production';

  const message =
    isProduction && !isOperational
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
  });
}

module.exports = { notFound, errorHandler };
