import { describe, it, expect } from 'vitest';
import { calculateExposure, getRiskClassification } from '../utils/exposureEngine';

describe('Exposure Engine Unit Tests', () => {
  it('calculates low risk for indoor sitting in good air', () => {
    const result = calculateExposure({
      aqi: 35,
      pm25: 10,
      activityId: 'sitting_indoor',
      durationMinutes: 30,
    });

    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.risk.level).toBe('LOW');
    expect(result.recommendations.actions.length).toBeGreaterThan(0);
  });

  it('calculates very high risk for a 60-minute outdoor run in high PM2.5 air', () => {
    const result = calculateExposure({
      aqi: 250,
      pm25: 110,
      activityId: 'running',
      durationMinutes: 60,
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.risk.level).toBe('VERY HIGH');
    expect(result.recommendations.maskRecommendation).toContain('N95');
  });

  it('includes proper deterministic breakdown factors', () => {
    const result = calculateExposure({
      aqi: 186,
      pm25: 78,
      activityId: 'walking',
      durationMinutes: 45,
    });

    expect(result.breakdown).toHaveProperty('aqiContribution');
    expect(result.breakdown).toHaveProperty('pm25Contribution');
    expect(result.breakdown).toHaveProperty('durationContribution');
    expect(result.breakdown).toHaveProperty('activityContribution');
  });
});
