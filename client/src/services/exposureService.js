import apiClient from './api';
import { calculateExposure } from '../utils/exposureEngine';
import { MOCK_HISTORY } from './mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

export const exposureService = {
  /**
   * Calculate personal exposure score
   * Matches API Contract: POST /api/exposure/calculate { activity, duration, latitude, longitude }
   */
  async calculatePersonalExposure(payload) {
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.post('/exposure/calculate', payload);
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/exposure/calculate unavailable, using local calculation engine.', err.message);
      }
    }

    // Local exposure engine calculation
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = calculateExposure({
      aqi: payload.aqi || 186,
      pm25: payload.pm25 || 78,
      activityId: payload.activity || 'running',
      durationMinutes: payload.duration || 60,
    });

    return { data: result, isMock: true };
  },

  /**
   * Fetch exposure history
   */
  async getExposureHistory() {
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get('/exposure/history');
        return { data: response.data, isMock: false };
      } catch (err) {
        console.warn('Backend /api/exposure/history unavailable, returning local history.', err.message);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    return { data: MOCK_HISTORY, isMock: true };
  }
};

export default exposureService;
