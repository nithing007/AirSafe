'use strict';

/**
 * controllers/recommendation.controller.js
 *
 * Handles:
 *   GET /api/recommendations/current   — AQI-graded advisories for a location
 *   GET /api/recommendations/best-time — Forecast-derived optimal outdoor window
 */

const { fetchCurrentAir, fetchForecast } = require('../services/openweather.service');
const {
  getCurrentRecommendations,
  getBestTimeRecommendation,
} = require('../services/recommendation.service');

/**
 * Validates lat/lon query parameters. Reuses the same pattern as air.controller.
 */
function validateCoordinates(req) {
  const { lat, lon } = req.query;
  if (lat === undefined || lat === '' || lon === undefined || lon === '') {
    return {
      valid: false,
      error: "Query parameters 'lat' and 'lon' are required (-90 <= lat <= 90, -180 <= lon <= 180).",
    };
  }
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (
    Number.isNaN(parsedLat) || Number.isNaN(parsedLon) ||
    parsedLat < -90 || parsedLat > 90 ||
    parsedLon < -180 || parsedLon > 180
  ) {
    return {
      valid: false,
      error: "Query parameters 'lat' and 'lon' must be numeric and within coordinate bounds (-90 <= lat <= 90, -180 <= lon <= 180).",
    };
  }
  return { valid: true, lat: parsedLat, lon: parsedLon };
}

/**
 * getCurrentRecommendations — GET /api/recommendations/current?lat=...&lon=...
 */
async function getCurrentRecommendationsHandler(req, res, next) {
  const validation = validateCoordinates(req);
  if (!validation.valid) {
    return res.status(400).json({ status: 'error', message: validation.error });
  }

  try {
    const airData = await fetchCurrentAir(validation.lat, validation.lon);
    const payload = getCurrentRecommendations(airData);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
}

/**
 * getBestTimeHandler — GET /api/recommendations/best-time?lat=...&lon=...
 */
async function getBestTimeHandler(req, res, next) {
  const validation = validateCoordinates(req);
  if (!validation.valid) {
    return res.status(400).json({ status: 'error', message: validation.error });
  }

  try {
    const forecastData = await fetchForecast(validation.lat, validation.lon);
    const payload = getBestTimeRecommendation(forecastData);
    return res.status(200).json(payload);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCurrentRecommendationsHandler,
  getBestTimeHandler,
  validateCoordinates,
};
