'use strict';

/**
 * tests/route.test.js
 *
 * Integration tests for POST /api/routes/compare.
 * Uses Supertest and offline mocked native fetch for OpenWeather API calls.
 */

const request = require('supertest');
const app = require('../src/app');

// Shared mock OpenWeather API response
const MOCK_OPENWEATHER_CURRENT = {
  coord: [76.9558, 11.0168],
  list: [
    {
      dt: 1728500000,
      main: { aqi: 4 },
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

describe('Route Comparison API (POST /api/routes/compare)', () => {
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
    // Default mock fetch to return valid air quality payload
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_OPENWEATHER_CURRENT,
    });
  });

  describe('Input validation', () => {
    it('returns 400 when originCoords is missing', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          origin: 'Origin City',
          destination: 'Dest City',
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/missing origin coordinates/i);
    });

    it('returns 400 when destinationCoords is missing', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          origin: 'Origin City',
          destination: 'Dest City',
          originCoords: { latitude: 11.0168, longitude: 76.9558 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/missing destination coordinates/i);
    });

    it('returns 400 when origin latitude is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/both 'latitude' and 'longitude' are required/i);
    });

    it('returns 400 when origin latitude is out of bounds (> 90)', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { latitude: 95.0, longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/latitude must be between -90 and 90/i);
    });

    it('returns 400 when destination longitude is out of bounds (< -180)', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { latitude: 11.0168, longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: -190.5 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/longitude between -180 and 180/i);
    });

    it('returns 400 when coordinates are non-numeric strings', async () => {
      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { latitude: 'invalid_lat', longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/invalid coordinates/i);
    });
  });

  describe('Successful comparison response', () => {
    it('returns HTTP 200 with 2 corridor objects and valid structure', async () => {
      const payload = {
        origin: 'Gandhipuram, Coimbatore',
        destination: 'Saravanampatti, Coimbatore',
        originCoords: {
          latitude: 11.0168,
          longitude: 76.9558,
        },
        destinationCoords: {
          latitude: 11.042,
          longitude: 76.98,
        },
      };

      const res = await request(app)
        .post('/api/routes/compare')
        .send(payload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const greenRoute = res.body.find((r) => r.isRecommended);
      const directRoute = res.body.find((r) => !r.isRecommended);

      expect(greenRoute).toBeDefined();
      expect(directRoute).toBeDefined();

      // Check required route properties
      const requiredProps = [
        'id',
        'name',
        'isRecommended',
        'routeType',
        'distanceKm',
        'durationMin',
        'estimatedExposureScore',
        'exposureRisk',
        'avgAqi',
        'highlights',
        'coordinates',
        'color',
        'disclaimer',
      ];

      for (const prop of requiredProps) {
        expect(greenRoute).toHaveProperty(prop);
        expect(directRoute).toHaveProperty(prop);
      }

      // Check route styling and simulation type
      expect(greenRoute.color).toBe('#10b981');
      expect(directRoute.color).toBe('#ef4444');
      expect(greenRoute.routeType).toBe('simulated_corridor');
      expect(directRoute.routeType).toBe('simulated_corridor');

      // Check exposure score comparison: green corridor must have lower exposure than direct route
      expect(greenRoute.estimatedExposureScore).toBeLessThan(directRoute.estimatedExposureScore);

      // Verify coordinate waypoints start at origin and end at destination
      const coords = greenRoute.coordinates;
      expect(Array.isArray(coords)).toBe(true);
      expect(coords.length).toBeGreaterThanOrEqual(2);
      expect(coords[0][0]).toBeCloseTo(11.0168, 4);
      expect(coords[0][1]).toBeCloseTo(76.9558, 4);
      expect(coords[coords.length - 1][0]).toBeCloseTo(11.042, 4);
      expect(coords[coords.length - 1][1]).toBeCloseTo(76.98, 4);

      // Verify disclaimer explicitly indicates simulated comparison corridor
      expect(greenRoute.disclaimer).toMatch(/simulated/i);
      expect(directRoute.disclaimer).toMatch(/simulated/i);
    });

    it('works correctly when origin and destination coordinates are identical', async () => {
      const payload = {
        origin: 'Point A',
        destination: 'Point A',
        originCoords: { latitude: 11.0168, longitude: 76.9558 },
        destinationCoords: { latitude: 11.0168, longitude: 76.9558 },
      };

      const res = await request(app)
        .post('/api/routes/compare')
        .send(payload);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('Error handling for external dependencies', () => {
    it('returns HTTP 502 when upstream OpenWeather service returns HTTP 500', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal OpenWeather Error' }),
      });

      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { latitude: 11.0168, longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(502);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/upstream air quality service/i);
    });

    it('returns HTTP 504 when upstream OpenWeather service times out', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'TimeoutError';
      global.fetch = jest.fn().mockRejectedValue(timeoutError);

      const res = await request(app)
        .post('/api/routes/compare')
        .send({
          originCoords: { latitude: 11.0168, longitude: 76.9558 },
          destinationCoords: { latitude: 11.042, longitude: 76.98 },
        });

      expect(res.status).toBe(504);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/timed out/i);
    });
  });
});
