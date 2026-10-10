'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/geo/search', () => {
  it('returns 400 when query parameter q is missing', async () => {
    const res = await request(app).get('/api/geo/search');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/at least 2 characters/i);
  });

  it('returns 400 when query parameter q is too short (< 2 chars)', async () => {
    const res = await request(app).get('/api/geo/search?q=a');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 and matches for Coimbatore', async () => {
    const res = await request(app).get('/api/geo/search?q=Coimbatore');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);

    const first = res.body.results[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('latitude');
    expect(first).toHaveProperty('longitude');
    expect(typeof first.latitude).toBe('number');
    expect(typeof first.longitude).toBe('number');
  });

  it('returns 200 and matches for New Delhi', async () => {
    const res = await request(app).get('/api/geo/search?q=Delhi');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('respects the limit query parameter', async () => {
    const res = await request(app).get('/api/geo/search?q=Coimbatore&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(2);
  });
});
