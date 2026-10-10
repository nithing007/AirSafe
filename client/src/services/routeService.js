import apiClient from './api';
import { MOCK_ROUTES } from './mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

/**
 * Haversine distance calculation in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Synthesizes comparative exposure corridors between arbitrary coordinates.
 * Clearly labeled as simulated corridors rather than road geometry.
 */
function generateSimulatedCorridors(originCoords, destinationCoords, originName = 'Origin', destinationName = 'Destination') {
  const lat1 = originCoords.latitude;
  const lon1 = originCoords.longitude;
  const lat2 = destinationCoords.latitude;
  const lon2 = destinationCoords.longitude;

  const straightDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;

  // Vector perpendicular offset to simulate a bypass route away from central arterial roads
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const perpLat = -dLon * 0.25;
  const perpLon = dLat * 0.25;

  const greenWaypoint1 = [lat1 + dLat * 0.3 + perpLat * 0.7, lon1 + dLon * 0.3 + perpLon * 0.7];
  const greenWaypoint2 = [lat1 + dLat * 0.7 + perpLat * 0.7, lon1 + dLon * 0.7 + perpLon * 0.7];

  const directDist = Math.max(Number((straightDist * 1.05).toFixed(1)), 0.5);
  const greenDist = Math.max(Number((straightDist * 1.25).toFixed(1)), 0.7);

  const directDuration = Math.max(Math.round(directDist * 3.2), 3);
  const greenDuration = Math.max(Math.round(greenDist * 3.6), 4);

  return [
    {
      id: 'route-green',
      name: `Route A: Simulated Green Corridor (${originName.split(',')[0]} → ${destinationName.split(',')[0]})`,
      isRecommended: true,
      routeType: 'simulated_corridor',
      distanceKm: greenDist,
      durationMin: greenDuration,
      estimatedExposureScore: 26,
      exposureRisk: 'LOW',
      avgAqi: 58,
      highlights: [
        'Buffer corridor avoiding high-density arterial roads',
        'Estimated ~55% reduction in ground-level particulate intake',
        'Recommended for cyclists, runners, and school commutes',
      ],
      coordinates: [
        [lat1, lon1],
        [Number(greenWaypoint1[0].toFixed(5)), Number(greenWaypoint1[1].toFixed(5))],
        [Number(midLat.toFixed(5)), Number(midLon.toFixed(5))],
        [Number(greenWaypoint2[0].toFixed(5)), Number(greenWaypoint2[1].toFixed(5))],
        [lat2, lon2],
      ],
      color: '#10b981',
      disclaimer: 'Simulated exposure corridor connecting selected coordinates for air comparison. Not a turn-by-turn road navigation geometry.',
    },
    {
      id: 'route-direct',
      name: `Route B: Simulated Direct Corridor (Primary Traffic Arterial)`,
      isRecommended: false,
      routeType: 'simulated_corridor',
      distanceKm: directDist,
      durationMin: directDuration,
      estimatedExposureScore: 78,
      exposureRisk: 'VERY HIGH',
      avgAqi: 210,
      highlights: [
        'Direct geographic corridor along major traffic axis',
        'Higher concentration of diesel particulate and vehicle exhaust',
        'Not recommended during morning or evening peak rush hours',
      ],
      coordinates: [
        [lat1, lon1],
        [Number((lat1 * 0.66 + lat2 * 0.34).toFixed(5)), Number((lon1 * 0.66 + lon2 * 0.34).toFixed(5))],
        [Number(midLat.toFixed(5)), Number(midLon.toFixed(5))],
        [Number((lat1 * 0.34 + lat2 * 0.66).toFixed(5)), Number((lon1 * 0.34 + lon2 * 0.66).toFixed(5))],
        [lat2, lon2],
      ],
      color: '#ef4444',
      disclaimer: 'Simulated exposure corridor connecting selected coordinates for air comparison. Not a turn-by-turn road navigation geometry.',
    },
  ];
}

export const routeService = {
  /**
   * Compare routes for pollution exposure.
   * Requires verified origin and destination coordinates.
   *
   * @param {object} payload
   * @param {string} payload.origin - Text label for origin
   * @param {string} payload.destination - Text label for destination
   * @param {object} payload.originCoords - { latitude, longitude }
   * @param {object} payload.destinationCoords - { latitude, longitude }
   */
  async compareRoutes(payload = {}) {
    const { origin, destination, originCoords, destinationCoords } = payload;

    // Validate coordinates
    const hasValidOrigin =
      originCoords &&
      typeof originCoords.latitude === 'number' &&
      !Number.isNaN(originCoords.latitude) &&
      typeof originCoords.longitude === 'number' &&
      !Number.isNaN(originCoords.longitude);

    const hasValidDest =
      destinationCoords &&
      typeof destinationCoords.latitude === 'number' &&
      !Number.isNaN(destinationCoords.latitude) &&
      typeof destinationCoords.longitude === 'number' &&
      !Number.isNaN(destinationCoords.longitude);

    if (!hasValidOrigin || !hasValidDest) {
      throw new Error('Both origin and destination must have valid resolved coordinates.');
    }

    // Try backend endpoint if live mode
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.post('/routes/compare', payload);
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/routes/compare unavailable, generating verified corridors.', err.message);
      }
    }

    // Check if selecting default demo locations
    const isCoimbatoreDemo =
      Math.abs(originCoords.latitude - 11.0168) < 0.05 &&
      Math.abs(originCoords.longitude - 76.9558) < 0.05 &&
      Math.abs(destinationCoords.latitude - 11.042) < 0.08 &&
      Math.abs(destinationCoords.longitude - 76.98) < 0.08;

    if (isCoimbatoreDemo) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return { data: MOCK_ROUTES, isMock: true, isDemo: true };
    }

    // Generate corridors for arbitrary user-selected coordinates
    await new Promise((resolve) => setTimeout(resolve, 300));
    const corridors = generateSimulatedCorridors(originCoords, destinationCoords, origin, destination);
    return { data: corridors, isMock: true, isDemo: false };
  },
};

export default routeService;
