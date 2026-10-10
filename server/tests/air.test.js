'use strict';

/**
 * tests/air.test.js
 *
 * Integration and route tests for GET /api/air/current and GET /api/air/forecast.
 * Uses Supertest and offline mocked native fetch.
 */

const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config/env');
const { computeTimeWindows, isValidTimestamp } = require('../src/services/openweather.service');

// Mock sample payload from OpenWeather Air Pollution API
const MOCK_OPENWEATHER_CURRENT = {
  coord: [76.9558, 11.0168],
  list: [
    {
      dt: 1728500000,
      main: {
        aqi: 4,
      },
      components: {
        co: 420.0,
        no: 0.1,
        no2: 18.4,
        o3: 65.1,
        so2: 8.3,
        pm2_5: 78.2,
        pm10: 112.5,
        nh3: 2.1,
      },
    },
  ],
};

const MOCK_OPENWEATHER_FORECAST = {
  coord: [76.9558, 11.0168],
  list: Array.from({ length: 30 }, (_, i) => ({
    dt: 1728500000 + i * 3600,
    main: { aqi: 3 },
    components: {
      co: 350.0 + i * 10,
      no: 0.1,
      no2: 20.0 + i,
      o3: 50.0 + i,
      so2: 5.0,
      pm2_5: 30.0 + (i % 8) * 10, // ranges from 30 to 100
      pm10: 50.0 + (i % 8) * 12,
      nh3: 1.0,
    },
  })),
};

describe('Air Quality API Routes (/api/air)', () => {
  let originalFetch;
  let originalNodeEnv;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/air/current', () => {
    it('returns HTTP 200 with standard transformed air quality data on valid coordinates', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_OPENWEATHER_CURRENT,
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('location');
      expect(res.body.location.latitude).toBe(11.0168);
      expect(res.body.location.longitude).toBe(76.9558);
      expect(res.body).toHaveProperty('aqi');
      expect(typeof res.body.aqi).toBe('number');
      expect(res.body.aqi).toBeGreaterThanOrEqual(150); // 78.2 ug/m3 PM2.5 is Unhealthy (~163)
      expect(res.body).toHaveProperty('aqiCategory', 'Unhealthy');
      expect(res.body).toHaveProperty('dominantPollutant', 'PM2.5');
      expect(res.body).toHaveProperty('pollutants');
      expect(res.body.pollutants.pm2_5).toBe(78.2);
      expect(res.body.pollutants.pm10).toBe(112.5);
      expect(res.body).toHaveProperty('openWeatherIndex', 4);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('source', 'OpenWeather Air Quality API');
    });

    it('returns HTTP 400 if lat or lon query parameter is missing', async () => {
      const res = await request(app).get('/api/air/current?lat=11.0168');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/required/i);
    });

    it('returns HTTP 400 if lat is out of range (-90 to 90)', async () => {
      const res = await request(app).get('/api/air/current?lat=95.0&lon=76.9558');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/bounds/i);
    });

    it('returns HTTP 400 if lon is out of range (-180 to 180)', async () => {
      const res = await request(app).get('/api/air/current?lat=11.0168&lon=195.0');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/bounds/i);
    });

    it('returns HTTP 400 if lat or lon is non-numeric', async () => {
      const res = await request(app).get('/api/air/current?lat=invalid&lon=76.9558');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('returns HTTP 502 when OpenWeather returns 401 Unauthorized', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(502);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/authentication failed/i);
    });

    it('returns HTTP 429 when OpenWeather returns 429 Rate Limit Exceeded', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/rate limit/i);
    });

    it('returns HTTP 504 when upstream request times out', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'TimeoutError';
      global.fetch = jest.fn().mockRejectedValueOnce(timeoutError);

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(504);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/timed out/i);
    });

    it('returns HTTP 502 if upstream current payload has missing or invalid timestamp', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [{ dt: 'not-a-number', components: { pm2_5: 10 } }],
        }),
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(502);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/invalid timestamp/i);
    });

    it('returns HTTP 200 with AQI 0 and category Good when components are missing or empty', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [{ dt: 1728500000, components: {} }],
        }),
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.body.aqi).toBe(0);
      expect(res.body.aqiCategory).toBe('Good');
      expect(res.body.pollutants.pm2_5).toBe(0);
    });
  });

  describe('GET /api/air/forecast', () => {
    it('returns HTTP 200 with hourly and daily forecast and best/worst windows', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_OPENWEATHER_FORECAST,
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hourly');
      expect(Array.isArray(res.body.hourly)).toBe(true);
      expect(res.body.hourly.length).toBeLessThanOrEqual(24);
      expect(res.body.hourly[0]).toHaveProperty('hourLabel');
      expect(res.body.hourly[0]).toHaveProperty('aqi');
      expect(res.body.hourly[0]).toHaveProperty('pm2_5');
      expect(res.body.hourly[0]).toHaveProperty('isOptimal');

      expect(res.body).toHaveProperty('daily');
      expect(Array.isArray(res.body.daily)).toBe(true);
      expect(res.body.daily[0]).toHaveProperty('dayName');
      expect(res.body.daily[0]).toHaveProperty('aqi');
      expect(res.body.daily[0]).toHaveProperty('minAqi');
      expect(res.body.daily[0]).toHaveProperty('maxAqi');

      expect(res.body).toHaveProperty('bestWindow');
      expect(res.body.bestWindow).toHaveProperty('startHour');
      expect(res.body.bestWindow).toHaveProperty('endHour');
      expect(res.body.bestWindow).toHaveProperty('averageAqi');
      expect(res.body.bestWindow).toHaveProperty('recommendation');

      expect(res.body).toHaveProperty('worstWindow');
      expect(res.body.worstWindow).toHaveProperty('startHour');
      expect(res.body.worstWindow).toHaveProperty('endHour');
      expect(res.body.worstWindow).toHaveProperty('averageAqi');
    });

    it('returns HTTP 400 for missing forecast query coordinates', async () => {
      const res = await request(app).get('/api/air/forecast');
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('skips malformed forecast records with invalid timestamps and processes valid ones', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [
            { dt: 'bad-timestamp', components: { pm2_5: 25 } },
            { dt: 1728500000, components: { pm2_5: 15.0 } },
            { dt: null, components: { pm2_5: 50 } },
            { dt: 1728503600, components: { pm2_5: 20.0 } },
            { dt: 1728507200, components: { pm2_5: 25.0 } },
          ],
        }),
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.body.hourly.length).toBe(3); // 3 valid records retained
    });

    it('returns HTTP 502 when all forecast records have invalid timestamps', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [
            { dt: null, components: { pm2_5: 25 } },
            { dt: -100, components: { pm2_5: 15.0 } },
          ],
        }),
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(502);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/no valid forecast records/i);
    });

    it('returns HTTP 502 when forecast list is empty', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ list: [] }),
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(502);
      expect(res.body.status).toBe('error');
    });

    it('safely handles forecast records with missing components', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [
            { dt: 1728500000, components: null },
            { dt: 1728503600 },
            { dt: 1728507200, components: {} },
          ],
        }),
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.body.hourly.length).toBe(3);
      expect(res.body.hourly[0].aqi).toBe(0);
      expect(res.body.daily[0].aqi).toBe(0);
    });

    it('safely computes fallback windows when fewer than 3 hourly records exist', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          list: [
            { dt: 1728500000, components: { pm2_5: 12.0 } }, // AQI 50
            { dt: 1728503600, components: { pm2_5: 35.4 } }, // AQI 100
          ],
        }),
      });

      const res = await request(app).get('/api/air/forecast?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(200);
      expect(res.body.hourly.length).toBe(2);
      expect(res.body.bestWindow.recommendation).toMatch(/insufficient/i);
      expect(res.body.worstWindow.recommendation).toMatch(/insufficient/i);
      expect(res.body.bestWindow.averageAqi).toBe(75);
    });
  });

  describe('Production Error Handling & Masking', () => {
    it('preserves safe operational error messages in production (e.g. 502 upstream auth failure)', async () => {
      process.env.NODE_ENV = 'production';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      });

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(502);
      expect(res.body).toEqual({
        status: 'error',
        message: 'OpenWeather API authentication failed: invalid or unactivated API key.',
      });
      // Ensure no stack trace or sensitive info leaked
      expect(res.body.stack).toBeUndefined();
    });

    it('preserves 504 gateway timeout operational message in production', async () => {
      process.env.NODE_ENV = 'production';

      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'TimeoutError';
      global.fetch = jest.fn().mockRejectedValueOnce(timeoutError);

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(504);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Upstream air quality service request timed out.',
      });
    });

    it('masks unexpected 500 internal errors in production with generic message', async () => {
      process.env.NODE_ENV = 'production';

      const openweatherService = require('../src/services/openweather.service');
      const serviceSpy = jest
        .spyOn(openweatherService, 'fetchCurrentAir')
        .mockRejectedValueOnce(
          new Error('Database password / secret connection failed on line 42')
        );

      const res = await request(app).get('/api/air/current?lat=11.0168&lon=76.9558');

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Internal server error',
      });
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/secret|password/i);

      serviceSpy.mockRestore();
    });
  });

  describe('Time Windows Calculation Unit Tests', () => {
    it('handles empty or non-array hourly list gracefully', () => {
      const resultNull = computeTimeWindows(null);
      expect(resultNull.bestWindow.averageAqi).toBe(0);
      expect(resultNull.bestWindow.recommendation).toMatch(/insufficient/i);

      const resultEmpty = computeTimeWindows([]);
      expect(resultEmpty.bestWindow.averageAqi).toBe(0);
      expect(resultEmpty.worstWindow.averageAqi).toBe(0);
    });

    it('handles single-item list gracefully', () => {
      const result = computeTimeWindows([{ hourLabel: '2 PM', aqi: 75 }]);
      expect(result.bestWindow.startHour).toBe('2 PM');
      expect(result.bestWindow.endHour).toBe('2 PM');
      expect(result.bestWindow.averageAqi).toBe(75);
    });

    it('identifies best and worst 3-hour windows from hourly data', () => {
      const hourly = [
        { hourLabel: '1 AM', aqi: 100 },
        { hourLabel: '2 AM', aqi: 120 },
        { hourLabel: '3 AM', aqi: 110 }, // Window 1 avg = 110
        { hourLabel: '4 AM', aqi: 30 },
        { hourLabel: '5 AM', aqi: 40 },
        { hourLabel: '6 AM', aqi: 35 }, // Window 4-6 avg = 35 (best)
        { hourLabel: '7 AM', aqi: 200 },
        { hourLabel: '8 AM', aqi: 210 },
        { hourLabel: '9 AM', aqi: 220 }, // Window 7-9 avg = 210 (worst)
      ];

      const { bestWindow, worstWindow } = computeTimeWindows(hourly);
      expect(bestWindow.startHour).toBe('4 AM');
      expect(bestWindow.endHour).toBe('6 AM');
      expect(bestWindow.averageAqi).toBe(35);
      expect(bestWindow.riskLevel).toBe('LOW');

      expect(worstWindow.startHour).toBe('7 AM');
      expect(worstWindow.endHour).toBe('9 AM');
      expect(worstWindow.averageAqi).toBe(210);
      expect(worstWindow.riskLevel).toBe('HIGH');
    });

    it('validates timestamps correctly using isValidTimestamp helper', () => {
      expect(isValidTimestamp(1728500000)).toBe(true);
      expect(isValidTimestamp(0)).toBe(false);
      expect(isValidTimestamp(-100)).toBe(false);
      expect(isValidTimestamp(NaN)).toBe(false);
      expect(isValidTimestamp(Infinity)).toBe(false);
      expect(isValidTimestamp('1728500000')).toBe(false);
      expect(isValidTimestamp(null)).toBe(false);
      expect(isValidTimestamp(undefined)).toBe(false);
    });
  });
});
