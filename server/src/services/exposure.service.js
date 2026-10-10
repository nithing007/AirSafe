'use strict';

/**
 * services/exposure.service.js
 *
 * Orchestrates the full exposure calculation:
 *   1. Validates activity and duration inputs.
 *   2. Uses explicit aqi/pm25 overrides when provided by the caller.
 *   3. When overrides are absent and coordinates are supplied, fetches live
 *      air data from the OpenWeather service and uses its values.
 *   4. Never fabricates or infers missing pollutant values from other metrics.
 *   5. Generates actionable recommendations via recommendation.service.js.
 *
 * This module does NOT:
 *   - Save records to the database (that is handled by the controller).
 *   - Make any health claims beyond heuristic exposure indicators.
 */

const { fetchCurrentAir, fetchForecast } = require('./openweather.service');
const {
  validateExposureInputs,
  calculateExposureScore,
} = require('../utils/exposureCalculator');
const { buildAdvisoryFromAqi } = require('./recommendation.service');

/**
 * Coordinate validation helper (reused from air.controller pattern).
 * Returns null when coordinates are absent or invalid.
 */
function parseOptionalCoordinates(lat, lon) {
  if (lat === undefined || lat === null || lon === undefined || lon === null) {
    return null;
  }
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (
    Number.isNaN(parsedLat) || Number.isNaN(parsedLon) ||
    parsedLat < -90 || parsedLat > 90 ||
    parsedLon < -180 || parsedLon > 180
  ) {
    return null;
  }
  return { lat: parsedLat, lon: parsedLon };
}

/**
 * computeExposure — validates inputs and calculates an exposure result.
 *
 * @param {object} params
 * @param {string}  params.activity       - Activity ID (required)
 * @param {number}  params.duration       - Duration in minutes (required; 1–720)
 * @param {number|undefined} params.aqi   - Explicit AQI override (optional)
 * @param {number|undefined} params.pm25  - Explicit PM2.5 override in µg/m³ (optional)
 * @param {number|undefined} params.latitude  - Coordinate for live data lookup
 * @param {number|undefined} params.longitude - Coordinate for live data lookup
 * @returns {Promise<object>} Exposure result with recommendations
 */
async function computeExposure({
  activity,
  duration,
  aqi,
  pm25,
  latitude,
  longitude,
}) {
  // 1. Validate activity and duration
  const validation = validateExposureInputs(activity, duration);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.statusCode = 400;
    throw err;
  }

  let resolvedAqi = null;
  let resolvedPm25 = null;
  let dataSource = 'explicit-override';
  let liveAirData = null;
  let forecastData = null;

  const hasExplicitAqi = typeof aqi === 'number' && Number.isFinite(aqi) && aqi >= 0;
  const hasExplicitPm25 = typeof pm25 === 'number' && Number.isFinite(pm25) && pm25 >= 0;

  if (hasExplicitAqi) {
    // Caller supplied AQI; use it. PM2.5 uses supplied value or null (never inferred).
    resolvedAqi = aqi;
    resolvedPm25 = hasExplicitPm25 ? pm25 : null;
    dataSource = 'explicit-override';
  } else {
    // No explicit AQI: fetch live data from coordinates if available
    const coords = parseOptionalCoordinates(latitude, longitude);

    if (!coords) {
      const err = new Error(
        "Either 'aqi' or valid coordinate query fields ('latitude', 'longitude') must be provided to calculate exposure."
      );
      err.statusCode = 400;
      throw err;
    }

    // Fetch live current air data — errors propagate as upstream operational errors
    [liveAirData, forecastData] = await Promise.allSettled([
      fetchCurrentAir(coords.lat, coords.lon),
      fetchForecast(coords.lat, coords.lon),
    ]);

    if (liveAirData.status === 'rejected') {
      // Re-throw the upstream error so the operational errorHandler handles it
      throw liveAirData.reason;
    }

    liveAirData = liveAirData.value;
    forecastData = forecastData.status === 'fulfilled' ? forecastData.value : null;

    resolvedAqi = liveAirData.aqi;
    // Use pm25 from live pollutants if available; never infer from AQI
    const livePm25 = liveAirData.pollutants && typeof liveAirData.pollutants.pm2_5 === 'number'
      ? liveAirData.pollutants.pm2_5
      : null;
    resolvedPm25 = hasExplicitPm25 ? pm25 : livePm25;
    dataSource = 'live-openweather';
  }

  // 2. Compute exposure score
  const calculationResult = calculateExposureScore({
    activityId: activity,
    durationMinutes: Number(duration),
    aqi: resolvedAqi,
    pm25: resolvedPm25,
  });

  // 3. Build actionable recommendations from resolved AQI and any forecast windows
  const bestWindow = forecastData && forecastData.bestWindow ? forecastData.bestWindow : null;
  const recommendations = buildAdvisoryFromAqi(resolvedAqi, bestWindow);

  return {
    ...calculationResult,
    recommendations,
    dataSource,
    airDataTimestamp: liveAirData ? liveAirData.timestamp : null,
    location: liveAirData ? liveAirData.location : null,
  };
}

module.exports = {
  computeExposure,
};
