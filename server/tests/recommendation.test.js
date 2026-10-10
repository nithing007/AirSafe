'use strict';

/**
 * tests/recommendation.test.js
 *
 * Integration tests for:
 *   GET /api/recommendations/current?lat=...&lon=...
 *   GET /api/recommendations/best-time?lat=...&lon=...
 *
 * Unit tests for buildAdvisoryFromAqi across all AQI categories.
 *
 * All external fetch calls are mocked. No real network requests.
 */

const request = require('supertest');
const app     = require('../src/app');
const { buildAdvisoryFromAqi, getBestTimeRecommendation } = require('../src/services/recommendation.service');

const MOCK_CURRENT_GOOD = {
  list: [{ dt: 1728500000, main: { aqi: 1 }, components: { pm2_5: 5.0, pm10: 8.0, no2: 4.0, o3: 20.0, so2: 2.0, co: 200.0, nh3: 0.5 } }],
};
const MOCK_CURRENT_UNHEALTHY = {
  list: [{ dt: 1728500000, main: { aqi: 4 }, components: { pm2_5: 78.2, pm10: 112.5, no2: 18.4, o3: 65.1, so2: 8.3, co: 420.0, nh3: 2.1 } }],
};
const MOCK_FORECAST = {
  list: Array.from({ length: 10 }, (_, i) => ({
    dt: 1728500000 + i * 3600,
    main: { aqi: 2 },
    components: { co: 300.0, no: 0.1, no2: 15.0, o3: 40.0, so2: 4.0, pm2_5: 25.0, pm10: 40.0, nh3: 0.8 },
  })),
};

// ─── Unit: buildAdvisoryFromAqi ───────────────────────────────────────────────

describe('buildAdvisoryFromAqi — AQI category advisory rules', () => {
  it('AQI 25 (Good) — returns low-risk advisory', () => {
    const advisory = buildAdvisoryFromAqi(25);
    expect(advisory.summary).toMatch(/good|lower risk/i);
    expect(advisory.maskRecommendation).toMatch(/not required/i);
    expect(Array.isArray(advisory.actions)).toBe(true);
    expect(advisory.actions.length).toBeGreaterThan(0);
  });

  it('AQI 75 (Moderate) — references sensitive groups', () => {
    const advisory = buildAdvisoryFromAqi(75);
    expect(advisory.summary).toMatch(/moderate|sensitive/i);
    expect(advisory.maskRecommendation).toMatch(/optional|sensitive/i);
  });

  it('AQI 125 (Unhealthy for Sensitive Groups) — recommends limiting duration', () => {
    const advisory = buildAdvisoryFromAqi(125);
    expect(advisory.actions.some(a => a.text.match(/limit|shorten|shorter/i))).toBe(true);
    expect(advisory.maskRecommendation).toMatch(/N95/i);
  });

  it('AQI 175 (Unhealthy) — recommends rescheduling outdoor exercise', () => {
    const advisory = buildAdvisoryFromAqi(175);
    expect(advisory.actions.some(a => a.text.match(/reschedule|indoor/i))).toBe(true);
    expect(advisory.maskRecommendation).toMatch(/N95/i);
  });

  it('AQI 250 (Very Unhealthy) — recommends avoiding all outdoor activity', () => {
    const advisory = buildAdvisoryFromAqi(250);
    expect(advisory.actions.some(a => a.icon === 'XCircle')).toBe(true);
    expect(advisory.maskRecommendation).toMatch(/mandatory/i);
  });

  it('AQI 400 (Hazardous) — emergency advisory with sealed windows and mandatory respirator', () => {
    const advisory = buildAdvisoryFromAqi(400);
    expect(advisory.maskRecommendation).toMatch(/mandatory/i);
    expect(advisory.actions.some(a => a.type === 'danger')).toBe(true);
  });

  it('never claims outdoor activity is universally safe in any tier', () => {
    for (const aqi of [10, 75, 125, 175, 250, 400]) {
      const advisory = buildAdvisoryFromAqi(aqi);
      // Must not claim blanket safety for outdoor activities
      expect(advisory.summary).not.toMatch(/^outdoor activities are safe$/i);
      expect(advisory.summary).not.toMatch(/^no risk$/i);
    }
  });

  it('injects best window into saferAlternativeTime when provided', () => {
    const bestWindow = { startHour: '5 AM', endHour: '8 AM', averageAqi: 42, recommendation: 'Good time for a run.' };
    const advisory = buildAdvisoryFromAqi(180, bestWindow);
    expect(advisory.saferAlternativeTime).toMatch(/5 AM/);
    expect(advisory.saferAlternativeTime).toMatch(/8 AM/);
  });

  it('falls back gracefully when bestWindow is null', () => {
    const advisory = buildAdvisoryFromAqi(180, null);
    expect(typeof advisory.saferAlternativeTime).toBe('string');
    expect(advisory.saferAlternativeTime.length).toBeGreaterThan(5);
  });

  it('each action has icon and text fields compatible with RecommendationCard.jsx', () => {
    for (const aqi of [25, 75, 125, 175, 250]) {
      const advisory = buildAdvisoryFromAqi(aqi);
      for (const action of advisory.actions) {
        expect(typeof action.icon).toBe('string');
        expect(typeof action.text).toBe('string');
      }
    }
  });
});

// ─── Unit: getBestTimeRecommendation ─────────────────────────────────────────

describe('getBestTimeRecommendation', () => {
  it('returns bestWindow and worstWindow from forecast data', () => {
    const mockForecast = {
      bestWindow:  { startHour: '5 AM', endHour: '7 AM', averageAqi: 42, riskLevel: 'LOW', recommendation: 'Good window.' },
      worstWindow: { startHour: '7 PM', endHour: '9 PM', averageAqi: 210, riskLevel: 'HIGH', recommendation: 'Avoid outdoors.' },
      hourly: [{ aqi: 42, hourLabel: '5 AM' }],
      source: 'OpenWeather Air Pollution API',
    };

    const result = getBestTimeRecommendation(mockForecast);
    expect(result.bestWindow).not.toBeNull();
    expect(result.bestWindow.startHour).toBe('5 AM');
    expect(result.worstWindow).not.toBeNull();
    expect(result).toHaveProperty('advisory');
    expect(result).toHaveProperty('disclaimer');
    expect(result.disclaimer).toBeDefined();
  });

  it('returns null windows and advisory notice when windows are absent from forecast', () => {
    const mockForecast = { hourly: [], source: 'OpenWeather Air Pollution API' };
    const result = getBestTimeRecommendation(mockForecast);
    expect(result.bestWindow).toBeNull();
    expect(result.advisory).toMatch(/unavailable/i);
  });
});

// ─── Integration: GET /api/recommendations/current ───────────────────────────

describe('GET /api/recommendations/current', () => {
  let originalFetch;
  let originalNodeEnv;

  beforeAll(() => {
    originalFetch   = global.fetch;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    global.fetch         = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('returns 200 with advisory fields for valid good-air conditions', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, status: 200, json: async () => MOCK_CURRENT_GOOD,
    });

    const res = await request(app).get('/api/recommendations/current?lat=11.0168&lon=76.9558');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('aqi');
    expect(res.body).toHaveProperty('aqiCategory');
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('actions');
    expect(res.body).toHaveProperty('maskRecommendation');
    expect(res.body).toHaveProperty('disclaimer');
    expect(res.body.disclaimer).toMatch(/not.*medical|not.*personalised/i);
  });

  it('returns 200 with stronger advisory for unhealthy air conditions', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, status: 200, json: async () => MOCK_CURRENT_UNHEALTHY,
    });

    const res = await request(app).get('/api/recommendations/current?lat=11.0168&lon=76.9558');

    expect(res.statusCode).toBe(200);
    expect(res.body.maskRecommendation).toMatch(/N95/i);
  });

  it('returns 400 for missing lat/lon query parameters', async () => {
    const res = await request(app).get('/api/recommendations/current?lat=11.0168');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 for out-of-bounds coordinates', async () => {
    const res = await request(app).get('/api/recommendations/current?lat=95.0&lon=76.9558');
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when OpenWeather returns 401 Unauthorized', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ message: 'Invalid API key' }),
    });

    const res = await request(app).get('/api/recommendations/current?lat=11.0168&lon=76.9558');
    expect(res.statusCode).toBe(502);
    expect(res.body.status).toBe('error');
  });

  it('returns 504 when upstream times out', async () => {
    const timeoutErr = new Error('timeout'); timeoutErr.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValueOnce(timeoutErr);

    const res = await request(app).get('/api/recommendations/current?lat=11.0168&lon=76.9558');
    expect(res.statusCode).toBe(504);
  });
});

// ─── Integration: GET /api/recommendations/best-time ─────────────────────────

describe('GET /api/recommendations/best-time', () => {
  let originalFetch;

  beforeAll(() => { originalFetch = global.fetch; });
  afterAll(() => { global.fetch = originalFetch; });
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns 200 with bestWindow, worstWindow, advisory, and disclaimer', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true, status: 200, json: async () => MOCK_FORECAST,
    });

    const res = await request(app).get('/api/recommendations/best-time?lat=11.0168&lon=76.9558');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('bestWindow');
    expect(res.body).toHaveProperty('worstWindow');
    expect(res.body).toHaveProperty('advisory');
    expect(res.body).toHaveProperty('disclaimer');
    expect(res.body).toHaveProperty('hourlyCount');
  });

  it('returns 400 for missing coordinates', async () => {
    const res = await request(app).get('/api/recommendations/best-time');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 502 when upstream forecast fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false, status: 500, json: async () => ({}),
    });

    const res = await request(app).get('/api/recommendations/best-time?lat=11.0168&lon=76.9558');
    expect(res.statusCode).toBe(502);
  });

  it('returns 504 when forecast request times out', async () => {
    const timeoutErr = new Error('timeout'); timeoutErr.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValueOnce(timeoutErr);

    const res = await request(app).get('/api/recommendations/best-time?lat=11.0168&lon=76.9558');
    expect(res.statusCode).toBe(504);
  });
});
