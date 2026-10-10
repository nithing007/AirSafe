'use strict';

/**
 * controllers/geo.controller.js
 *
 * Handles:
 *   GET /api/geo/search?q=...&limit=...
 */

const geocodingService = require('../services/geocoding.service');

async function searchLocationsHandler(req, res, next) {
  const query = req.query.q;
  const limit = req.query.limit;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({
      status: 'error',
      message: "Query parameter 'q' must be a string with at least 2 characters.",
    });
  }

  try {
    const results = await geocodingService.searchLocations(query, { limit });
    return res.status(200).json({
      status: 'success',
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchLocationsHandler,
};
