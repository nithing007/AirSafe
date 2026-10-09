'use strict';

/**
 * tests/health.test.js
 *
 * Integration test for GET /api/health using Supertest.
 *
 * Supertest imports the Express app directly (without calling app.listen),
 * spins up an internal test server for the duration of each test, and tears
 * it down automatically. This is why app.js and server.js are kept separate.
 *
 * What these tests verify:
 *   1. The endpoint returns HTTP 200.
 *   2. The Content-Type header is application/json (Axios requires this).
 *   3. The response body contains the three agreed fields: status, timestamp, version.
 *   4. The status field value is exactly "ok".
 *   5. The timestamp is a valid ISO 8601 string.
 *   6. Unknown routes return HTTP 404 with a JSON error body.
 */

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });

  it('responds with Content-Type: application/json', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns status: "ok"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns a valid ISO 8601 timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toBeDefined();
    // Date constructor returns NaN for invalid strings
    expect(Number.isNaN(new Date(res.body.timestamp).getTime())).toBe(false);
  });

  it('returns a version string', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.version).toBe('string');
    expect(res.body.version.length).toBeGreaterThan(0);
  });
});

describe('Unknown routes', () => {
  it('returns HTTP 404 for an unregistered GET route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
  });

  it('returns a JSON error body for unregistered routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
  });
});
