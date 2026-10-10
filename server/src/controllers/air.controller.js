'use strict';

/**
 * controllers/air.controller.js
 *
 * Handles GET /api/air/current and GET /api/air/forecast requests.
 * Enforces strict coordinate validation and standard JSON responses.
 */

const openweatherService = require('../services/openweather.service');

/**
 * Validates latitude and longitude query parameters
 *
 * @param {import('express').Request} req
 * @returns {{ valid: boolean, lat?: number, lon?: number, error?: string }}
 */
function validateCoordinates(req) {
  const { lat, lon } = req.query;

  if (lat === undefined || lon === undefined || lat === '' || lon === '') {
    return {
      valid: false,
      error: "Query parameters 'lat' and 'lon' are required and must be valid numeric coordinates (-90 <= lat <= 90, -180 <= lon <= 180).",
    };
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (
    Number.isNaN(parsedLat) ||
    Number.isNaN(parsedLon) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLon < -180 ||
    parsedLon > 180
  ) {
    return {
      valid: false,
      error: "Query parameters 'lat' and 'lon' must be valid numbers within coordinate bounds (-90 <= lat <= 90, -180 <= lon <= 180).",
    };
  }

  return {
    valid: true,
    lat: parsedLat,
    lon: parsedLon,
  };
}

/**
 * getCurrentAir — GET /api/air/current?lat=...&lon=...
 */
async function getCurrentAir(req, res, next) {
  const validation = validateCoordinates(req);
  if (!validation.valid) {
    return res.status(400).json({
      status: 'error',
      message: validation.error,
    });
  }

  try {
    const data = await openweatherService.fetchCurrentAir(validation.lat, validation.lon);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

/**
 * getForecast — GET /api/air/forecast?lat=...&lon=...
 */
async function getForecast(req, res, next) {
  const validation = validateCoordinates(req);
  if (!validation.valid) {
    return res.status(400).json({
      status: 'error',
      message: validation.error,
    });
  }

  try {
    const data = await openweatherService.fetchForecast(validation.lat, validation.lon);
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCurrentAir,
  getForecast,
  validateCoordinates,
};
