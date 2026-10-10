'use strict';

/**
 * services/geocoding.service.js
 *
 * Geocoding provider abstraction for AirSafe.
 *
 * Features:
 *   - Explicit query validation (min 2 characters, sanitization).
 *   - Fallback catalog of major cities and landmarks for offline/demo reliability.
 *   - Upstream integration with compliant geocoding providers (Photon / OpenWeather Geo).
 *   - Keeps any provider credentials securely on the server.
 *   - Standardized output format: [{ id, name, displayName, latitude, longitude, country, state, type }]
 */

const config = require('../config/env');

const TIMEOUT_MS = 4000;

// Curated reference catalog for fast offline lookups and reliable demo testing
const LOCAL_CATALOG = [
  { id: 'geo-cbe-central', name: 'Gandhipuram Central', displayName: 'Gandhipuram Central, Coimbatore, Tamil Nadu, India', latitude: 11.0168, longitude: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', type: 'area' },
  { id: 'geo-cbe-techpark', name: 'Saravanampatti Tech Park', displayName: 'Saravanampatti Tech Park, Coimbatore, Tamil Nadu, India', latitude: 11.0825, longitude: 76.9945, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', type: 'area' },
  { id: 'geo-cbe-rs-puram', name: 'RS Puram', displayName: 'RS Puram, Coimbatore, Tamil Nadu, India', latitude: 11.0088, longitude: 76.9482, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', type: 'suburb' },
  { id: 'geo-coimbatore', name: 'Coimbatore', displayName: 'Coimbatore, Tamil Nadu, India', latitude: 11.0168, longitude: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', type: 'city' },
  { id: 'geo-delhi', name: 'New Delhi', displayName: 'New Delhi, National Capital Region, India', latitude: 28.6139, longitude: 77.2090, city: 'New Delhi', state: 'Delhi', country: 'India', type: 'city' },
  { id: 'geo-connaught', name: 'Connaught Place', displayName: 'Connaught Place, New Delhi, Delhi, India', latitude: 28.6315, longitude: 77.2167, city: 'New Delhi', state: 'Delhi', country: 'India', type: 'landmark' },
  { id: 'geo-noida', name: 'Noida Sector 62', displayName: 'Sector 62, Noida, Uttar Pradesh, India', latitude: 28.6258, longitude: 77.3673, city: 'Noida', state: 'Uttar Pradesh', country: 'India', type: 'suburb' },
  { id: 'geo-bengaluru', name: 'Bengaluru', displayName: 'Bengaluru, Karnataka, India', latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India', type: 'city' },
  { id: 'geo-koramangala', name: 'Koramangala', displayName: 'Koramangala, Bengaluru, Karnataka, India', latitude: 12.9352, longitude: 77.6245, city: 'Bengaluru', state: 'Karnataka', country: 'India', type: 'suburb' },
  { id: 'geo-whitefield', name: 'Whitefield', displayName: 'Whitefield, Bengaluru, Karnataka, India', latitude: 12.9698, longitude: 77.7500, city: 'Bengaluru', state: 'Karnataka', country: 'India', type: 'suburb' },
  { id: 'geo-mumbai', name: 'Mumbai', displayName: 'Mumbai, Maharashtra, India', latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', state: 'Maharashtra', country: 'India', type: 'city' },
  { id: 'geo-bandra', name: 'Bandra West', displayName: 'Bandra West, Mumbai, Maharashtra, India', latitude: 19.0596, longitude: 72.8295, city: 'Mumbai', state: 'Maharashtra', country: 'India', type: 'suburb' },
  { id: 'geo-hyderabad', name: 'Hyderabad', displayName: 'Hyderabad, Telangana, India', latitude: 17.3850, longitude: 78.4867, city: 'Hyderabad', state: 'Telangana', country: 'India', type: 'city' },
  { id: 'geo-chennai', name: 'Chennai', displayName: 'Chennai, Tamil Nadu, India', latitude: 13.0827, longitude: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India', type: 'city' },
  { id: 'geo-kolkata', name: 'Kolkata', displayName: 'Kolkata, West Bengal, India', latitude: 22.5726, longitude: 88.3639, city: 'Kolkata', state: 'West Bengal', country: 'India', type: 'city' },
  { id: 'geo-pune', name: 'Pune', displayName: 'Pune, Maharashtra, India', latitude: 18.5204, longitude: 73.8567, city: 'Pune', state: 'Maharashtra', country: 'India', type: 'city' },
  { id: 'geo-london', name: 'London', displayName: 'London, Greater London, United Kingdom', latitude: 51.5074, longitude: -0.1278, city: 'London', state: 'England', country: 'United Kingdom', type: 'city' },
  { id: 'geo-newyork', name: 'New York', displayName: 'New York City, New York, United States', latitude: 40.7128, longitude: -74.0060, city: 'New York', state: 'New York', country: 'United States', type: 'city' },
  { id: 'geo-tokyo', name: 'Tokyo', displayName: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', state: 'Tokyo', country: 'Japan', type: 'city' },
  { id: 'geo-paris', name: 'Paris', displayName: 'Paris, Île-de-France, France', latitude: 48.8566, longitude: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France', type: 'city' },
];

/**
 * Search the local catalog using fuzzy / substring matching
 */
function searchLocalCatalog(normalizedQuery, limit) {
  const matches = [];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  for (const item of LOCAL_CATALOG) {
    const target = `${item.name} ${item.displayName} ${item.city || ''} ${item.state || ''} ${item.country || ''}`.toLowerCase();
    const allMatch = terms.every((term) => target.includes(term));
    if (allMatch) {
      matches.push(item);
      if (matches.length >= limit) break;
    }
  }

  return matches;
}

/**
 * Fetch from Photon (Komoot OSM Geocoder)
 * Photon is an OSM-based service intended for explicit search queries.
 */
async function fetchPhoton(query, limit) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': 'AirSafeApp/1.0 (airsafe@local.dev)',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Photon returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.features)) return [];

  return data.features.map((feature, idx) => {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0];
    const name = props.name || props.street || props.city || 'Unknown Location';
    const parts = [
      props.name,
      props.street,
      props.district,
      props.city,
      props.state,
      props.country,
    ].filter(Boolean);

    // Deduplicate parts
    const uniqueParts = [...new Set(parts)];
    const displayName = uniqueParts.join(', ');

    return {
      id: `photon-${props.osm_id || idx}-${Math.round(coords[1] * 1000)}`,
      name,
      displayName,
      latitude: Number(coords[1].toFixed(5)),
      longitude: Number(coords[0].toFixed(5)),
      city: props.city || props.county || '',
      state: props.state || '',
      country: props.country || '',
      type: props.type || props.osm_value || 'location',
      source: 'photon',
    };
  });
}

/**
 * Main geocoding service function
 *
 * @param {string} query - Raw search term from user
 * @param {object} [options]
 * @param {number} [options.limit=5]
 * @returns {Promise<Array>} List of normalized matching location objects
 */
async function searchLocations(query, { limit = 5 } = {}) {
  if (typeof query !== 'string') {
    throw new Error('Query must be a string.');
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    const error = new Error("Query parameter 'q' must be at least 2 characters.");
    error.statusCode = 400;
    throw error;
  }

  const normalized = trimmed.toLowerCase();
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

  // 1. Try local catalog exact matches first
  const localMatches = searchLocalCatalog(normalized, safeLimit);
  if (localMatches.length >= safeLimit) {
    return localMatches.slice(0, safeLimit);
  }

  // 2. Query upstream provider (Photon)
  try {
    const upstreamResults = await fetchPhoton(trimmed, safeLimit);
    if (upstreamResults.length > 0) {
      // Merge unique by approx coordinates
      const seen = new Set();
      const combined = [];

      for (const item of [...localMatches, ...upstreamResults]) {
        const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
          if (combined.length >= safeLimit) break;
        }
      }

      return combined;
    }
  } catch (err) {
    // Upstream network failure / timeout — gracefully fall back to local catalog
    console.warn(`[geocoding.service] Upstream search failed: ${err.message}. Using local catalog.`);
  }

  return localMatches;
}

module.exports = {
  searchLocations,
  LOCAL_CATALOG,
};
