'use strict';

/**
 * controllers/exposure.controller.js
 *
 * Handles:
 *   POST /api/exposure/calculate  — Validates inputs, computes exposure, saves record
 *   GET  /api/exposure/history    — Returns logged exposure records (anonymous; no auth)
 */

const exposureService = require('../services/exposure.service');
const ExposureRecord = require('../models/exposureRecord.model');
const { VALID_ACTIVITY_IDS } = require('../utils/exposureCalculator');
const mongoose = require('mongoose');

/**
 * calculateExposure — POST /api/exposure/calculate
 *
 * Expected request body (matches api-contract.md and client exposureService.js):
 *   {
 *     "activity":  "running",    // required — one of VALID_ACTIVITY_IDS
 *     "duration":  45,           // required — minutes, 1–720
 *     "latitude":  11.0168,      // optional — if provided with longitude, fetches live AQI
 *     "longitude": 76.9558,      // optional
 *     "aqi":       186,          // optional — explicit override; takes precedence
 *     "pm25":      78            // optional — explicit pm25 override
 *   }
 */
async function calculateExposure(req, res, next) {
  const { activity, duration, latitude, longitude, aqi, pm25 } = req.body || {};

  // Basic presence check — detailed validation is inside computeExposure
  if (activity === undefined || duration === undefined) {
    return res.status(400).json({
      status: 'error',
      message: `Request body must include 'activity' (one of: ${VALID_ACTIVITY_IDS.join(', ')}) and 'duration' (minutes, 1–720).`,
    });
  }

  try {
    const result = await exposureService.computeExposure({
      activity,
      duration,
      aqi,
      pm25,
      latitude,
      longitude,
    });

    // Persist the record if database is connected (best-effort; non-fatal on failure)
    if (mongoose.connection.readyState === 1) {
      try {
        await ExposureRecord.create({
          activity:      result.activity.id,
          activityLabel: result.activity.label,
          duration:      result.duration,
          aqi:           result.aqi,
          pm25:          result.pm25,
          exposureScore: result.score,
          riskLevel:     result.risk.level,
          location:      result.location || {},
          dataSource:    result.dataSource,
        });
      } catch (dbErr) {
        // Log but do not fail the request — calculation result is still returned
        console.error('[exposure.controller] Failed to persist exposure record:', dbErr.message);
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * formatLocationDisplay — Serializes location into a human-readable string.
 *
 * Falls back gracefully to coordinates or 'Detected Coordinates' when a name
 * is not stored, ensuring UI components (e.g. HistoryTable.jsx) never encounter
 * unrenderable object children.
 *
 * @param {object|string|null} location
 * @returns {string} Human-readable location string
 */
function formatLocationDisplay(location) {
  if (!location) {
    return 'Detected Coordinates';
  }
  if (typeof location === 'string') {
    return location.trim() || 'Detected Coordinates';
  }
  if (location.name && typeof location.name === 'string' && location.name.trim()) {
    return location.name.trim();
  }
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  return 'Detected Coordinates';
}

/**
 * getExposureHistory — GET /api/exposure/history
 *
 * LIMITATION: Authentication is not implemented in Phase 4.
 * This endpoint returns all anonymous exposure records in reverse chronological
 * order. Records are not associated with a specific user.
 *
 * Behavior when database is unavailable:
 *   Returns 200 with an empty array and a clearly marked limitation notice.
 *   Does NOT fabricate or seed records.
 */
async function getExposureHistory(req, res, next) {
  // Check database connectivity
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      history: [],
      count: 0,
      limitation:
        'Database is currently unavailable. No exposure history can be retrieved. ' +
        'Additionally, user authentication is not implemented in Phase 4 — records ' +
        'are anonymous session logs, not personalised user history.',
    });
  }

  try {
    const records = await ExposureRecord.find({})
      .sort({ createdAt: -1 })
      .limit(50) // Guard against unbounded responses
      .lean();

    return res.status(200).json({
      history: records.map((r) => ({
        id:            r._id,
        activity:      r.activity,
        activityLabel: r.activityLabel,
        duration:      r.duration,
        aqi:           r.aqi,
        pm25:          r.pm25,
        exposureScore: r.exposureScore,
        risk:          r.riskLevel, // Aligns with frontend MOCK_HISTORY schema
        riskLevel:     r.riskLevel,
        location:      formatLocationDisplay(r.location), // Guaranteed renderable string
        dataSource:    r.dataSource,
        date:          r.createdAt,
      })),
      count: records.length,
      limitation:
        'User authentication is not implemented in Phase 4. ' +
        'Records are anonymous session logs, not personalised user history.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  calculateExposure,
  getExposureHistory,
};
