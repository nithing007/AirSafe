'use strict';

/**
 * controllers/route.controller.js
 *
 * Handles:
 *   POST /api/routes/compare — Compares route corridors for pollution exposure.
 */

const { compareRoutes } = require('../services/route.service');

/**
 * Validates a coordinate object containing latitude and longitude.
 *
 * @param {object} coords
 * @param {string} name - 'origin' or 'destination'
 * @returns {{ valid: boolean, lat?: number, lon?: number, error?: string }}
 */
function validateCoordinateObject(coords, name) {
  if (!coords || typeof coords !== 'object') {
    return {
      valid: false,
      error: `Missing ${name} coordinates. An object with 'latitude' and 'longitude' is required.`,
    };
  }

  const rawLat = coords.latitude !== undefined ? coords.latitude : coords.lat;
  const rawLon = coords.longitude !== undefined ? coords.longitude : coords.lon;

  if (
    rawLat === undefined || rawLat === null || rawLat === '' ||
    rawLon === undefined || rawLon === null || rawLon === ''
  ) {
    return {
      valid: false,
      error: `Both 'latitude' and 'longitude' are required for ${name} coordinates.`,
    };
  }

  const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
  const lon = typeof rawLon === 'number' ? rawLon : parseFloat(rawLon);

  if (
    typeof lat !== 'number' || typeof lon !== 'number' ||
    Number.isNaN(lat) || Number.isNaN(lon) ||
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    lat < -90 || lat > 90 ||
    lon < -180 || lon > 180
  ) {
    return {
      valid: false,
      error: `Invalid coordinates for ${name}. Latitude must be between -90 and 90, and longitude between -180 and 180.`,
    };
  }

  return { valid: true, lat, lon };
}

/**
 * compareRoutesHandler — POST /api/routes/compare
 */
async function compareRoutesHandler(req, res, next) {
  const body = req.body || {};
  const { origin, destination, originCoords, destinationCoords } = body;

  const originVal = validateCoordinateObject(originCoords, 'origin');
  if (!originVal.valid) {
    return res.status(400).json({
      status: 'error',
      message: originVal.error,
    });
  }

  const destVal = validateCoordinateObject(destinationCoords, 'destination');
  if (!destVal.valid) {
    return res.status(400).json({
      status: 'error',
      message: destVal.error,
    });
  }

  try {
    const routes = await compareRoutes({
      origin,
      destination,
      originCoords: { latitude: originVal.lat, longitude: originVal.lon },
      destinationCoords: { latitude: destVal.lat, longitude: destVal.lon },
    });

    return res.status(200).json(routes);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  compareRoutesHandler,
  validateCoordinateObject,
};
