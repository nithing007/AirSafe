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
    if (locationId) {
      matchedLocation = MOCK_LOCATIONS.find((l) => l.id === locationId) || MOCK_LOCATIONS[0];
    } else if (latitude && longitude) {
      // Find closest or return dynamic object
      matchedLocation = {
        name: 'Detected Local Coordinates',
        latitude,
        longitude,
        country: 'Local',
        defaultAqi: 172,
        dominantPollutant: 'PM2.5',
        temp: 27,
        humidity: 60,
        windSpeed: 3.2,
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
