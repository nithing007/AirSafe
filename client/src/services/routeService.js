import apiClient from './api';
import { MOCK_ROUTES } from './mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

export const routeService = {
  /**
   * Compare routes for pollution exposure
   * POST /api/routes/compare { origin, destination, travelMode }
   */
  async compareRoutes(payload = {}) {
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.post('/routes/compare', payload);
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/routes/compare unavailable, returning mock routes.', err.message);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: MOCK_ROUTES, isMock: true };
  }
};

export default routeService;
