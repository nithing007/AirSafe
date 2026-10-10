import apiClient from './api';
import { MOCK_LOCATIONS } from './mockData';

// Fallback catalog of known places if backend/network is unavailable
const CLIENT_FALLBACK_CATALOG = [
  ...MOCK_LOCATIONS.map((loc) => ({
    id: `loc-${loc.id}`,
    name: loc.name,
    displayName: `${loc.name}, ${loc.country || 'India'}`,
    latitude: loc.latitude,
    longitude: loc.longitude,
    city: loc.name.split(',')[0].trim(),
    country: loc.country || 'India',
    state: loc.name.split(',')[1]?.trim() || '',
  })),
  {
    id: 'loc-cbe-central',
    name: 'Gandhipuram Central',
    displayName: 'Gandhipuram Central, Coimbatore, Tamil Nadu, India',
    latitude: 11.0168,
    longitude: 76.9558,
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
  },
  {
    id: 'loc-cbe-techpark',
    name: 'Saravanampatti Tech Park',
    displayName: 'Saravanampatti Tech Park, Coimbatore, Tamil Nadu, India',
    latitude: 11.0825,
    longitude: 76.9945,
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
  },
  {
    id: 'loc-cbe-rspuram',
    name: 'RS Puram',
    displayName: 'RS Puram, Coimbatore, Tamil Nadu, India',
    latitude: 11.0088,
    longitude: 76.9482,
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
  },
  {
    id: 'loc-del-cp',
    name: 'Connaught Place',
    displayName: 'Connaught Place, New Delhi, Delhi, India',
    latitude: 28.6315,
    longitude: 77.2167,
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
  },
  {
    id: 'loc-noida-sec62',
    name: 'Noida Sector 62',
    displayName: 'Sector 62, Noida, Uttar Pradesh, India',
    latitude: 28.6258,
    longitude: 77.3673,
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
  },
  {
    id: 'loc-blr-koramangala',
    name: 'Koramangala',
    displayName: 'Koramangala, Bengaluru, Karnataka, India',
    latitude: 12.9352,
    longitude: 77.6245,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
  },
  {
    id: 'loc-blr-whitefield',
    name: 'Whitefield',
    displayName: 'Whitefield, Bengaluru, Karnataka, India',
    latitude: 12.9698,
    longitude: 77.7500,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
  },
  {
    id: 'loc-mum-bandra',
    name: 'Bandra West',
    displayName: 'Bandra West, Mumbai, Maharashtra, India',
    latitude: 19.0596,
    longitude: 72.8295,
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
  },
  {
    id: 'loc-chennai',
    name: 'Chennai',
    displayName: 'Chennai, Tamil Nadu, India',
    latitude: 13.0827,
    longitude: 80.2707,
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
  },
];

/**
 * Filter fallback catalog matching query terms
 */
function searchClientFallback(query, limit = 5) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = [];

  for (const item of CLIENT_FALLBACK_CATALOG) {
    const text = `${item.name} ${item.displayName} ${item.city || ''} ${item.state || ''} ${item.country || ''}`.toLowerCase();
    if (terms.every((term) => text.includes(term))) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
}

export const geocodingService = {
  /**
   * Search locations by user query.
   * This is explicitly triggered by the user clicking Search or pressing Enter,
   * NOT by keystroke autocomplete, in full compliance with public provider policies.
   *
   * @param {string} query - Location to search
   * @param {object} [options]
   * @param {number} [options.limit=5]
   * @returns {Promise<{ results: Array, provider: string }>}
   */
  async searchLocations(query, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Please enter at least 2 characters to search.');
    }

    const trimmed = query.trim();
    const limit = options.limit || 5;

    // 1. Try backend geocoding endpoint
    try {
      const response = await apiClient.get(`/geo/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`);
      if (response.data && Array.isArray(response.data.results) && response.data.results.length > 0) {
        return {
          results: response.data.results,
          provider: 'server-geocoding',
        };
      }
    } catch (err) {
      console.warn('[geocodingService] Backend geocoding unavailable, using client fallback catalog:', err.message);
    }

    // 2. Client fallback catalog
    const fallbackResults = searchClientFallback(trimmed, limit);
    return {
      results: fallbackResults,
      provider: 'client-fallback',
    };
  },

  /**
   * Get predefined quick selection cities
   */
  getPresetLocations() {
    return MOCK_LOCATIONS;
  },
};

export default geocodingService;
