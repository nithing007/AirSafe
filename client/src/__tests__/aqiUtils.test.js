import { describe, it, expect } from 'vitest';
import { getAqiCategory } from '../utils/aqiUtils';

describe('AQI Classification Utilities', () => {
  it('correctly maps values to AQI categories', () => {
    expect(getAqiCategory(30).category).toBe('Good');
    expect(getAqiCategory(75).category).toBe('Moderate');
    expect(getAqiCategory(125).category).toBe('Unhealthy for Sensitive Groups');
    expect(getAqiCategory(185).category).toBe('Unhealthy');
    expect(getAqiCategory(250).category).toBe('Very Unhealthy');
    expect(getAqiCategory(350).category).toBe('Hazardous');
  });
});
