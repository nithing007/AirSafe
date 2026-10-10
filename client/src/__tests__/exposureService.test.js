/**
 * __tests__/exposureService.test.js
 *
 * Covers:
 *   - Mock mode: local exposureEngine is used, isMock:true returned
 *   - Live mode: backend is called; falls back to local engine on failure
 *   - History: mock vs. backend response shape
 *   - Regression: env var must control mock flag (no || true)
 *
 * NOTE on vi.doMock vs vi.mock:
 *   vi.mock() is statically hoisted to the top of the file by Vite/Vitest.
 *   When combined with vi.resetModules() + dynamic import(), the hoisted mock
 *   registers against the old module registry that resetModules() has already
 *   discarded — so the freshly imported module never sees the spy.
 *   vi.doMock() is NOT hoisted; it runs at call time against the current
 *   module registry, making it the correct pattern here.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock mode ────────────────────────────────────────────────────────────────

describe('exposureService — mock mode (VITE_USE_MOCK_DATA=true)', () => {
  let service;

  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCK_DATA', 'true');
    vi.resetModules();
    const mod = await import('../services/exposureService');
    service = mod.exposureService ?? mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns isMock:true and a numeric score for exposure calculation', async () => {
    const res = await service.calculatePersonalExposure({
      activity: 'running',
      duration: 30,
      aqi: 140,
      pm25: 55,
    });
    expect(res.isMock).toBe(true);
    expect(res.data).toBeDefined();
  });

  it('returns isMock:true with valid MOCK_HISTORY shape', async () => {
    const res = await service.getExposureHistory();
    expect(res.isMock).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    const first = res.data[0];
    expect(first).toHaveProperty('activity');
    expect(first).toHaveProperty('aqi');
    expect(first).toHaveProperty('exposureScore');
  });
});

// ─── Live mode — backend unavailable (fallback) ────────────────────────────

describe('exposureService — live mode with backend failure (fallback)', () => {
  let service;

  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
    // vi.doMock (non-hoisted) runs against the module registry at call time
    vi.doMock('../services/api', () => ({
      default: {
        get: vi.fn().mockRejectedValue({ message: 'Network Error' }),
        post: vi.fn().mockRejectedValue({ message: 'Network Error' }),
        interceptors: { response: { use: vi.fn() }, request: { use: vi.fn() } },
      },
    }));
    vi.resetModules();
    const mod = await import('../services/exposureService');
    service = mod.exposureService ?? mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('falls back to local engine when backend POST /exposure/calculate fails', async () => {
    const res = await service.calculatePersonalExposure({
      activity: 'walking',
      duration: 45,
      aqi: 180,
    });
    expect(res).toHaveProperty('data');
  });

  it('falls back to MOCK_HISTORY when GET /exposure/history backend fails', async () => {
    const res = await service.getExposureHistory();
    expect(res).toHaveProperty('data');
    expect(Array.isArray(res.data)).toBe(true);
  });
});

// ─── Regression: || true bug must be absent ──────────────────────────────────

describe('exposureService — env-var controls mock flag (regression)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('attempts a live backend POST when VITE_USE_MOCK_DATA is false (regression: no || true)', async () => {
    // Use vi.doMock so the spy is registered against the module registry
    // BEFORE the dynamic import resolves.
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
    let liveAttempted = false;
    vi.doMock('../services/api', () => ({
      default: {
        get: vi.fn(),
        post: vi.fn().mockImplementation(() => {
          liveAttempted = true;
          return Promise.reject({ message: 'Connection refused' });
        }),
        interceptors: { response: { use: vi.fn() }, request: { use: vi.fn() } },
      },
    }));
    vi.resetModules();
    const mod = await import('../services/exposureService');
    const svc = mod.exposureService ?? mod.default;

    await svc.calculatePersonalExposure({ activity: 'running', duration: 30, aqi: 150 });
    expect(liveAttempted).toBe(true);
  });
});
