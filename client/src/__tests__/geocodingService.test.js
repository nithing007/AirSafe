import { describe, it, expect } from 'vitest';
import { geocodingService } from '../services/geocodingService';

describe('geocodingService', () => {
  it('rejects empty or single character queries', async () => {
    await expect(geocodingService.searchLocations('')).rejects.toThrow(/at least 2 characters/i);
    await expect(geocodingService.searchLocations('a')).rejects.toThrow(/at least 2 characters/i);
    await expect(geocodingService.searchLocations(null)).rejects.toThrow(/at least 2 characters/i);
  });

  it('returns normalized location results for known cities in fallback catalog', async () => {
    const response = await geocodingService.searchLocations('Coimbatore');
    expect(response).toHaveProperty('results');
    expect(Array.isArray(response.results)).toBe(true);
    expect(response.results.length).toBeGreaterThan(0);

    const first = response.results[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('latitude');
    expect(first).toHaveProperty('longitude');
    expect(typeof first.latitude).toBe('number');
    expect(typeof first.longitude).toBe('number');
  });

  it('matches landmarks and suburbs in search', async () => {
    const response = await geocodingService.searchLocations('Saravanampatti');
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0].name).toMatch(/Saravanampatti/i);
  });

  it('returns empty array when no matches found', async () => {
    const response = await geocodingService.searchLocations('ZzzyyyxxxNonExistentCity12345');
    expect(response.results).toEqual([]);
  });

  it('returns preset locations list', () => {
    const presets = geocodingService.getPresetLocations();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThanOrEqual(5);
    expect(presets[0]).toHaveProperty('latitude');
    expect(presets[0]).toHaveProperty('longitude');
  });
});
