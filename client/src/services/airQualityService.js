import apiClient from './api';
import { generateMockCurrentAir, generateMockForecast, MOCK_LOCATIONS } from './mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true; // Fallback-safe

export const airQualityService = {
  /**
   * Fetch current air quality by coordinates or location ID
   */
  async getCurrentAirQuality(params = {}) {
    const { latitude, longitude, locationId } = params;
    
    // Try backend if not forced mock
    if (!USE_MOCK_DATA) {
      try {
        const query = latitude && longitude ? `?lat=${latitude}&lon=${longitude}` : '';
        const response = await apiClient.get(`/air/current${query}`);
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/air/current unavailable, falling back to mock service.', err.message);
      }
    }

    // Mock response fallback
    await new Promise((resolve) => setTimeout(resolve, 350));
    let matchedLocation = MOCK_LOCATIONS[0];
    if (locationId && MOCK_LOCATIONS.some((l) => l.id === locationId)) {
      matchedLocation = MOCK_LOCATIONS.find((l) => l.id === locationId);
    } else if (params.name || (latitude && longitude)) {
      // Arbitrary location or GPS coordinates
      matchedLocation = {
        id: locationId || `loc-${latitude}-${longitude}`,
        name: params.name || 'Detected Local Area',
        latitude: typeof latitude === 'number' ? latitude : 11.0168,
        longitude: typeof longitude === 'number' ? longitude : 76.9558,
        country: params.country || 'Local',
        defaultAqi: 154,
        dominantPollutant: 'PM2.5',
        temp: 26,
        humidity: 64,
        windSpeed: 3.8,
      };
    }

    const mockData = generateMockCurrentAir(matchedLocation);
    return { data: mockData, isMock: true };
  },

  /**
   * Fetch hourly and 7-day forecast
   */
  async getForecast(params = {}) {
    const { latitude, longitude, baseAqi = 186 } = params;

    if (!USE_MOCK_DATA) {
      try {
        const query = latitude && longitude ? `?lat=${latitude}&lon=${longitude}` : '';
        const response = await apiClient.get(`/air/forecast${query}`);
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/air/forecast unavailable, falling back to mock.', err.message);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const mockForecast = generateMockForecast(baseAqi);
    return { data: mockForecast, isMock: true };
  },

  /**
   * Get available demo locations
   */
  getAvailableLocations() {
    return MOCK_LOCATIONS;
  }
};

export default airQualityService;
