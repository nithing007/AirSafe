'use strict';

/**
 * tests/exposure.test.js
 *
 * Integration tests for:
 *   POST /api/exposure/calculate
 *   GET  /api/exposure/history
 *
 * All external fetch calls and Mongoose operations are mocked.
 * No real network requests or database connections are made.
 */

const request    = require('supertest');
const app        = require('../src/app');
const mongoose   = require('mongoose');

// ─── Shared Mock Payload ──────────────────────────────────────────────────────

const MOCK_OPENWEATHER_CURRENT = {
  list: [{
    dt: 1728500000,
    main: { aqi: 4 },
    components: { co: 420.0, no: 0.1, no2: 18.4, o3: 65.1, so2: 8.3, pm2_5: 78.2, pm10: 112.5, nh3: 2.1 },
  }],
};

const MOCK_OPENWEATHER_FORECAST = {
  list: Array.from({ length: 10 }, (_, i) => ({
    dt: 1728500000 + i * 3600,
    main: { aqi: 3 },
    components: { co: 350.0, no: 0.1, no2: 20.0, o3: 50.0, so2: 5.0, pm2_5: 30.0, pm10: 50.0, nh3: 1.0 },
  })),
};

// ─── POST /api/exposure/calculate ────────────────────────────────────────────

describe('POST /api/exposure/calculate', () => {
  let originalFetch;
  let originalNodeEnv;
  let originalReadyState;

  beforeAll(() => {
    originalFetch       = global.fetch;
    originalNodeEnv     = process.env.NODE_ENV;
    originalReadyState  = mongoose.connection.readyState;
  });

  afterAll(() => {
    global.fetch          = originalFetch;
    process.env.NODE_ENV  = originalNodeEnv;
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    // Simulate DB disconnected so no Mongoose write is attempted in tests
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  // ── Explicit AQI/PM2.5 overrides ───────────────────────────────────────────

  it('returns 200 with valid explicit aqi + pm25 override', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, aqi: 186, pm25: 78 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body.score).toBeGreaterThanOrEqual(5);
    expect(res.body.score).toBeLessThanOrEqual(100);
    expect(res.body).toHaveProperty('risk');
    expect(res.body).toHaveProperty('breakdown');
    expect(res.body.breakdown).toHaveProperty('aqiContribution');
    expect(res.body.breakdown).toHaveProperty('pm25Contribution');
    expect(res.body.breakdown).toHaveProperty('durationContribution');
    expect(res.body.breakdown).toHaveProperty('activityContribution');
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body).toHaveProperty('disclaimer');
    expect(res.body.dataSource).toBe('explicit-override');
  });

  it.each([
    'sitting_indoor', 'indoor_work', 'walking', 'cycling',
    'running', 'outdoor_work', 'heavy_sports',
  ])('returns 200 for activity %s', async (activity) => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity, duration: 45, aqi: 150, pm25: 60 });

    expect(res.statusCode).toBe(200);
    expect(res.body.activity.id).toBe(activity);
    expect(res.body.score).toBeGreaterThanOrEqual(5);
  });

  it('returns score with pm25DataAvailable: false when pm25 not provided', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, aqi: 200 });

    expect(res.statusCode).toBe(200);
    expect(res.body.pm25).toBeNull();
    expect(res.body.pm25DataAvailable).toBe(false);
    expect(res.body.breakdown.pm25Contribution).toBe(0);
  });

  // ── Live data lookup via coordinates ───────────────────────────────────────

  it('fetches live air data when no aqi override and coordinates are provided', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_OPENWEATHER_CURRENT })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_OPENWEATHER_FORECAST });

    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, latitude: 11.0168, longitude: 76.9558 });

    expect(res.statusCode).toBe(200);
    expect(res.body.dataSource).toBe('live-openweather');
    expect(typeof res.body.aqi).toBe('number');
    expect(res.body).toHaveProperty('airDataTimestamp');
  });

  it('returns 502 when upstream fetch fails during live data lookup', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ message: 'Invalid API key' }),
    });

    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, latitude: 11.0168, longitude: 76.9558 });

    expect(res.statusCode).toBe(502);
    expect(res.body.status).toBe('error');
  });

  it('returns 504 when upstream request times out during live data lookup', async () => {
    const timeoutError = new Error('The operation was aborted');
    timeoutError.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValueOnce(timeoutError);

    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, latitude: 11.0168, longitude: 76.9558 });

    expect(res.statusCode).toBe(504);
    expect(res.body.status).toBe('error');
  });

  // ── Input validation ───────────────────────────────────────────────────────

  it('returns 400 when activity is missing from body', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ duration: 60, aqi: 186 });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/activity/i);
  });

  it('returns 400 when duration is missing from body', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', aqi: 186 });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 for invalid activity ID', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'swimming', duration: 60, aqi: 186 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/activity/i);
  });

  it('returns 400 for duration below minimum (0)', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 0, aqi: 186 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/duration/i);
  });

  it('returns 400 for duration above maximum (721)', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 721, aqi: 186 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/duration/i);
  });

  it('returns 400 when neither aqi nor coordinates are provided', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60 });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 for invalid coordinate bounds', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, latitude: 95.0, longitude: 76.9558 });

    expect(res.statusCode).toBe(400);
  });

  // ── Recommendations shape ──────────────────────────────────────────────────

  it('response recommendations have summary, actions, maskRecommendation, saferAlternativeTime', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, aqi: 200, pm25: 80 });

    const { recommendations } = res.body;
    expect(recommendations).toHaveProperty('summary');
    expect(recommendations).toHaveProperty('actions');
    expect(Array.isArray(recommendations.actions)).toBe(true);
    expect(recommendations).toHaveProperty('maskRecommendation');
    expect(recommendations).toHaveProperty('saferAlternativeTime');
  });

  it('actions include icon and text fields compatible with RecommendationCard.jsx', async () => {
    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, aqi: 200, pm25: 80 });

    const { actions } = res.body.recommendations;
    for (const action of actions) {
      expect(typeof action.icon).toBe('string');
      expect(typeof action.text).toBe('string');
    }
  });

  // ── Database persistence when connected (readyState === 1) ─────────────────

  describe('database persistence (readyState === 1)', () => {
    it('persists exposure record successfully when DB is connected', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
        writable: true,
      });

      const ExposureRecord = require('../src/models/exposureRecord.model');
      const createSpy = jest.spyOn(ExposureRecord, 'create').mockResolvedValueOnce({ _id: 'rec-123' });

      const res = await request(app)
        .post('/api/exposure/calculate')
        .send({ activity: 'running', duration: 45, aqi: 186, pm25: 78 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('score');
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          activity: 'running',
          activityLabel: 'Running / Jogging',
          duration: 45,
          aqi: 186,
          pm25: 78,
          exposureScore: res.body.score,
          riskLevel: res.body.risk.level,
          dataSource: 'explicit-override',
        })
      );

      createSpy.mockRestore();
    });

    it('does not crash or fail exposure calculation when DB write rejects', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
        writable: true,
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const ExposureRecord = require('../src/models/exposureRecord.model');
      const createSpy = jest.spyOn(ExposureRecord, 'create').mockRejectedValueOnce(
        new Error('MongoNetworkTimeout: write concern failed')
      );

      const res = await request(app)
        .post('/api/exposure/calculate')
        .send({ activity: 'cycling', duration: 30, aqi: 90, pm25: 35 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('score');
      expect(res.body.activity.id).toBe('cycling');
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[exposure.controller] Failed to persist exposure record:'),
        'MongoNetworkTimeout: write concern failed'
      );

      createSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  // ── Production error masking ───────────────────────────────────────────────

  it('masks internal 500 errors in production', async () => {
    process.env.NODE_ENV = 'production';
    const exposureService = require('../src/services/exposure.service');
    const spy = jest.spyOn(exposureService, 'computeExposure').mockRejectedValueOnce(
      new Error('Secret DB connection string on line 42')
    );

    const res = await request(app)
      .post('/api/exposure/calculate')
      .send({ activity: 'running', duration: 60, aqi: 186 });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal server error');
    expect(JSON.stringify(res.body)).not.toMatch(/secret|password|connection string/i);
    spy.mockRestore();
  });
});

// ─── GET /api/exposure/history ────────────────────────────────────────────────

describe('GET /api/exposure/history', () => {
  let originalReadyState;

  beforeAll(() => {
    originalReadyState = mongoose.connection.readyState;
  });

  afterAll(() => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  it('returns 200 with empty history and limitation notice when DB is disconnected', async () => {
    const res = await request(app).get('/api/exposure/history');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('history');
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history).toHaveLength(0);
    expect(res.body).toHaveProperty('limitation');
    expect(res.body.limitation).toMatch(/unavailable|authentication/i);
  });

  it('does not return seeded or fabricated records when DB is disconnected', async () => {
    const res = await request(app).get('/api/exposure/history');

    // History must be genuinely empty — no fabricated data
    expect(res.body.history).toHaveLength(0);
    expect(res.body.count).toBe(0);
  });

  it('returns history records with expected fields when DB is connected and records exist', async () => {
    // Simulate connected DB and mock the Mongoose query
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
      writable: true,
    });

    const ExposureRecord = require('../src/models/exposureRecord.model');
    const mockFind = jest.spyOn(ExposureRecord, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => ([
            {
              _id: 'abc123',
              activity: 'running',
              activityLabel: 'Running / Jogging',
              duration: 45,
              aqi: 186,
              pm25: 78,
              exposureScore: 68,
              riskLevel: 'HIGH',
              location: { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, country: 'India' },
              dataSource: 'explicit-override',
              createdAt: new Date('2026-10-10T09:00:00Z'),
            },
          ]),
        }),
      }),
    });

    const res = await request(app).get('/api/exposure/history');

    expect(res.statusCode).toBe(200);
    expect(res.body.history).toHaveLength(1);
    const record = res.body.history[0];
    expect(record).toHaveProperty('activity', 'running');
    expect(record).toHaveProperty('exposureScore', 68);
    expect(record).toHaveProperty('risk', 'HIGH'); // Aligns with frontend MOCK_HISTORY
    expect(record).toHaveProperty('riskLevel', 'HIGH');
    expect(record.location).toBe('Coimbatore'); // Serialized string for HistoryTable.jsx
    expect(record).toHaveProperty('date');
    // Limitation notice must always be present (no auth in Phase 4)
    expect(res.body).toHaveProperty('limitation');
    expect(res.body.limitation).toMatch(/authentication/i);

    mockFind.mockRestore();
  });

  it('serializes location to coordinate string when location name is absent', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
      writable: true,
    });

    const ExposureRecord = require('../src/models/exposureRecord.model');
    const mockFind = jest.spyOn(ExposureRecord, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => ([
            {
              _id: 'rec-coords',
              activity: 'walking',
              activityLabel: 'Walking / Commuting',
              duration: 30,
              aqi: 50,
              pm25: 15,
              exposureScore: 20,
              riskLevel: 'LOW',
              location: { name: null, latitude: 11.0168, longitude: 76.9558 },
              dataSource: 'live-openweather',
              createdAt: new Date('2026-10-10T10:00:00Z'),
            },
          ]),
        }),
      }),
    });

    const res = await request(app).get('/api/exposure/history');

    expect(res.statusCode).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0].location).toBe('11.0168, 76.9558');
    expect(res.body.history[0].risk).toBe('LOW');

    mockFind.mockRestore();
  });

  it('falls back to "Detected Coordinates" when location is null or empty', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
      writable: true,
    });

    const ExposureRecord = require('../src/models/exposureRecord.model');
    const mockFind = jest.spyOn(ExposureRecord, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => ([
            {
              _id: 'rec-null-loc',
              activity: 'indoor_work',
              activityLabel: 'Office / Indoor Light Activity',
              duration: 60,
              aqi: 70,
              pm25: 25,
              exposureScore: 24,
              riskLevel: 'LOW',
              location: null,
              dataSource: 'explicit-override',
              createdAt: new Date('2026-10-10T11:00:00Z'),
            },
          ]),
        }),
      }),
    });

    const res = await request(app).get('/api/exposure/history');

    expect(res.statusCode).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0].location).toBe('Detected Coordinates');
    expect(res.body.history[0].risk).toBe('LOW');

    mockFind.mockRestore();
  });
});
