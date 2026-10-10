/**
 * __tests__/airQualityService.test.js
 *
 * Covers:
 *   - Mock mode: VITE_USE_MOCK_DATA=true  → always returns { isMock: true }
 *   - Live mode: VITE_USE_MOCK_DATA=false → calls backend; falls back on failure
 *   - Verifies the `|| true` bug is absent — env var must now control the flag.
 *   - Arbitrary coordinates are preserved in mock responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Dynamically import airQualityService with a specific env value.
 * Each call resets the module registry so the top-level constant is re-evaluated.
 */
async function importServiceWith(mockDataFlag) {
  vi.stubEnv('VITE_USE_MOCK_DATA', mockDataFlag);
  vi.resetModules();
  const mod = await import('../services/airQualityService');
  return mod.airQualityService ?? mod.default;
}

// ─── Mock mode ───────────────────────────────────────────────────────────────

describe('airQualityService — mock mode (VITE_USE_MOCK_DATA=true)', () => {
  let service;

  beforeEach(async () => {
    service = await importServiceWith('true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns isMock:true for a preset location id', async () => {
    const res = await service.getCurrentAirQuality({ locationId: 'delhi' });
    expect(res.isMock).toBe(true);
    expect(res.data).toBeDefined();
    expect(typeof res.data.aqi).toBe('number');
  });

  it('returns isMock:true for arbitrary coordinates and preserves them', async () => {
    const res = await service.getCurrentAirQuality({
      latitude: 19.076,
      longitude: 72.877,
      name: 'Mumbai Harbour',
    });
    expect(res.isMock).toBe(true);
    expect(res.data.location.latitude).toBeCloseTo(19.076, 2);
    expect(res.data.location.longitude).toBeCloseTo(72.877, 2);
  });

  it('returns isMock:true for forecast', async () => {
    const res = await service.getForecast({ latitude: 11.0168, longitude: 76.9558 });
    expect(res.isMock).toBe(true);
    expect(res.data).toHaveProperty('hourly');
    expect(Array.isArray(res.data.hourly)).toBe(true);
  });

  it('getAvailableLocations returns at least 5 preset entries', () => {
    const locs = service.getAvailableLocations();
    expect(Array.isArray(locs)).toBe(true);
    expect(locs.length).toBeGreaterThanOrEqual(5);
    expect(locs[0]).toHaveProperty('latitude');
    expect(locs[0]).toHaveProperty('longitude');
  });
});

// ─── Live mode — backend unavailable (fallback) ───────────────────────────────

describe('airQualityService — live mode with backend failure (fallback)', () => {
  let service;

  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
    // vi.doMock is NOT hoisted — it is applied against the current module registry
    // before the dynamic import, which is the correct pattern when combined with
    // vi.resetModules(). vi.mock() is statically hoisted and does not interact
    // correctly with resetModules.
    vi.doMock('../services/api', () => ({
      default: {
        get: vi.fn().mockRejectedValue({ message: 'Network Error', isNetworkError: true }),
        post: vi.fn().mockRejectedValue({ message: 'Network Error', isNetworkError: true }),
        interceptors: { response: { use: vi.fn() }, request: { use: vi.fn() } },
      },
    }));
    vi.resetModules();
    const mod = await import('../services/airQualityService');
    service = mod.airQualityService ?? mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('falls back gracefully when backend GET /air/current fails', async () => {
    const res = await service.getCurrentAirQuality({
      latitude: 12.9716,
      longitude: 77.5946,
      name: 'Bengaluru',
    });
    // Fallback: must still return a valid data envelope
    expect(res).toHaveProperty('data');
    expect(res.data).toHaveProperty('aqi');
    expect(typeof res.data.aqi).toBe('number');
  });

  it('falls back gracefully when backend GET /air/forecast fails', async () => {
    const res = await service.getForecast({ latitude: 12.97, longitude: 77.59 });
    expect(res).toHaveProperty('data');
    expect(res.data).toHaveProperty('hourly');
  });
});

// ─── Regression: || true bug must be absent ──────────────────────────────────

describe('airQualityService — env-var must control mock flag (regression)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('attempts a live GET when VITE_USE_MOCK_DATA is false (regression: no || true)', async () => {
    // Strategy: use vi.doMock (not vi.mock which is hoisted) so the spy is
    // registered against the module registry BEFORE the dynamic import.
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
    let liveAttempted = false;
    vi.doMock('../services/api', () => ({
      default: {
        get: vi.fn().mockImplementation(() => {
          liveAttempted = true;
          return Promise.reject({ message: 'Connection refused', isNetworkError: true });
        }),
        post: vi.fn(),
        interceptors: { response: { use: vi.fn() }, request: { use: vi.fn() } },
      },
    }));
    vi.resetModules();
    const mod = await import('../services/airQualityService');
    const svc = mod.airQualityService ?? mod.default;

    await svc.getCurrentAirQuality({ latitude: 28.6, longitude: 77.2 });
    expect(liveAttempted).toBe(true);
  });
});
