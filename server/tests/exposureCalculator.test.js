'use strict';

/**
 * tests/exposureCalculator.test.js
 *
 * Unit tests for server/src/utils/exposureCalculator.js.
 *
 * Covers:
 *   1. All 7 activity types and their multipliers.
 *   2. Risk classification thresholds (25/50/75 boundaries).
 *   3. Score clamping at low (AQI 0) and extreme high (AQI 500+) inputs.
 *   4. Duration boundaries (1 min, 720 min, above-max).
 *   5. PM2.5 null-safety (missing upstream data must not fabricate values).
 *   6. Input validation for invalid activities and out-of-range durations.
 *   7. Breakdown field presence and names (match ExposureBreakdownChart.jsx).
 *   8. Disclaimer presence and non-medical framing.
 */

const {
  ACTIVITIES,
  VALID_ACTIVITY_IDS,
  getRiskClassification,
  validateExposureInputs,
  calculateExposureScore,
  DURATION_MIN,
  DURATION_MAX,
} = require('../src/utils/exposureCalculator');

// ─── Activity Definitions ─────────────────────────────────────────────────────

describe('Activity definitions', () => {
  it('exports exactly 7 valid activity IDs', () => {
    expect(VALID_ACTIVITY_IDS).toHaveLength(7);
    expect(VALID_ACTIVITY_IDS).toEqual(expect.arrayContaining([
      'sitting_indoor', 'indoor_work', 'walking', 'cycling',
      'running', 'outdoor_work', 'heavy_sports',
    ]));
  });

  it('all activities have a multiplier, indoor flag, and label', () => {
    for (const id of VALID_ACTIVITY_IDS) {
      const act = ACTIVITIES[id];
      expect(typeof act.multiplier).toBe('number');
      expect(typeof act.indoor).toBe('boolean');
      expect(typeof act.label).toBe('string');
    }
  });

  it('indoor activities have multiplier < 0.5', () => {
    expect(ACTIVITIES.sitting_indoor.multiplier).toBe(0.2);
    expect(ACTIVITIES.indoor_work.multiplier).toBe(0.3);
    expect(ACTIVITIES.sitting_indoor.indoor).toBe(true);
    expect(ACTIVITIES.indoor_work.indoor).toBe(true);
  });

  it('heavy_sports has the highest multiplier (1.2)', () => {
    expect(ACTIVITIES.heavy_sports.multiplier).toBe(1.2);
  });
});

// ─── Input Validation ─────────────────────────────────────────────────────────

describe('validateExposureInputs', () => {
  it('passes for valid activity and duration', () => {
    expect(validateExposureInputs('running', 60).valid).toBe(true);
    expect(validateExposureInputs('sitting_indoor', 1).valid).toBe(true);
    expect(validateExposureInputs('heavy_sports', 720).valid).toBe(true);
  });

  it('rejects unknown activity ID', () => {
    const result = validateExposureInputs('swimming', 30);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/activity/i);
  });

  it('rejects null or undefined activity', () => {
    expect(validateExposureInputs(null, 30).valid).toBe(false);
    expect(validateExposureInputs(undefined, 30).valid).toBe(false);
  });

  it('rejects duration below minimum (1)', () => {
    expect(validateExposureInputs('running', 0).valid).toBe(false);
    expect(validateExposureInputs('running', -10).valid).toBe(false);
  });

  it('rejects duration above maximum (720)', () => {
    expect(validateExposureInputs('running', 721).valid).toBe(false);
    expect(validateExposureInputs('running', 9999).valid).toBe(false);
  });

  it('rejects non-numeric duration', () => {
    expect(validateExposureInputs('running', NaN).valid).toBe(false);
    expect(validateExposureInputs('running', 'long').valid).toBe(false);
  });

  it('exposes DURATION_MIN = 1 and DURATION_MAX = 720', () => {
    expect(DURATION_MIN).toBe(1);
    expect(DURATION_MAX).toBe(720);
  });
});

// ─── Risk Classification ──────────────────────────────────────────────────────

describe('getRiskClassification', () => {
  it('maps 0 to LOW', () => {
    expect(getRiskClassification(0).level).toBe('LOW');
  });
  it('maps 25 to LOW', () => {
    expect(getRiskClassification(25).level).toBe('LOW');
  });
  it('maps 26 to MODERATE', () => {
    expect(getRiskClassification(26).level).toBe('MODERATE');
  });
  it('maps 50 to MODERATE', () => {
    expect(getRiskClassification(50).level).toBe('MODERATE');
  });
  it('maps 51 to HIGH', () => {
    expect(getRiskClassification(51).level).toBe('HIGH');
  });
  it('maps 75 to HIGH', () => {
    expect(getRiskClassification(75).level).toBe('HIGH');
  });
  it('maps 76 to VERY HIGH', () => {
    expect(getRiskClassification(76).level).toBe('VERY HIGH');
  });
  it('maps 100 to VERY HIGH', () => {
    expect(getRiskClassification(100).level).toBe('VERY HIGH');
  });

  it('every risk level has color, title, and summary', () => {
    for (const score of [10, 40, 65, 90]) {
      const r = getRiskClassification(score);
      expect(typeof r.color).toBe('string');
      expect(typeof r.title).toBe('string');
      expect(typeof r.summary).toBe('string');
    }
  });
});

// ─── Score Calculation ────────────────────────────────────────────────────────

describe('calculateExposureScore — output structure', () => {
  const baseParams = { activityId: 'running', durationMinutes: 60, aqi: 186, pm25: 78 };

  it('returns score in [5, 100]', () => {
    const result = calculateExposureScore(baseParams);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns all required fields (matches frontend response schema)', () => {
    const result = calculateExposureScore(baseParams);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('risk');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('activity');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('aqi');
    expect(result).toHaveProperty('pm25');
    expect(result).toHaveProperty('calculatedAt');
    expect(result).toHaveProperty('disclaimer');
  });

  it('breakdown has the 4 named fields matching ExposureBreakdownChart.jsx', () => {
    const { breakdown } = calculateExposureScore(baseParams);
    expect(breakdown).toHaveProperty('aqiContribution');
    expect(breakdown).toHaveProperty('pm25Contribution');
    expect(breakdown).toHaveProperty('durationContribution');
    expect(breakdown).toHaveProperty('activityContribution');
  });

  it('disclaimer is present and does not contain medical or clinical diagnostic claims', () => {
    const { disclaimer } = calculateExposureScore(baseParams);
    expect(typeof disclaimer).toBe('string');
    expect(disclaimer.length).toBeGreaterThan(50);
    // Should reference non-medical / non-diagnostic framing
    expect(disclaimer).toMatch(/not.*medical|not.*clinical|not.*diagnosis/i);
  });
});

describe('calculateExposureScore — all 7 activity types', () => {
  const aqiParams = { aqi: 150, pm25: 60, durationMinutes: 60 };

  it.each(Object.keys(ACTIVITIES))('activity %s produces a valid score', (activityId) => {
    const result = calculateExposureScore({ ...aqiParams, activityId });
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.activity.id).toBe(activityId);
  });

  it('heavy_sports produces a higher score than sitting_indoor at the same AQI', () => {
    const heavy = calculateExposureScore({ ...aqiParams, activityId: 'heavy_sports' });
    const indoor = calculateExposureScore({ ...aqiParams, activityId: 'sitting_indoor' });
    expect(heavy.score).toBeGreaterThan(indoor.score);
  });
});

describe('calculateExposureScore — score boundaries & extremes', () => {
  it('score is at least 5 even at AQI=0, pm25=0, sitting_indoor, 1 min', () => {
    const result = calculateExposureScore({
      activityId: 'sitting_indoor',
      durationMinutes: 1,
      aqi: 0,
      pm25: 0,
    });
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it('score is at most 100 at AQI=500, pm25=200, heavy_sports, 720 min', () => {
    const result = calculateExposureScore({
      activityId: 'heavy_sports',
      durationMinutes: 720,
      aqi: 500,
      pm25: 200,
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.risk.level).toBe('VERY HIGH');
  });

  it('longer duration produces higher score than shorter duration at same AQI', () => {
    const short = calculateExposureScore({ activityId: 'running', durationMinutes: 15, aqi: 200, pm25: 80 });
    const long  = calculateExposureScore({ activityId: 'running', durationMinutes: 180, aqi: 200, pm25: 80 });
    expect(long.score).toBeGreaterThan(short.score);
  });

  it('higher AQI produces higher score at same activity and duration', () => {
    const low  = calculateExposureScore({ activityId: 'running', durationMinutes: 60, aqi: 30, pm25: 10 });
    const high = calculateExposureScore({ activityId: 'running', durationMinutes: 60, aqi: 250, pm25: 100 });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

describe('calculateExposureScore — PM2.5 null safety', () => {
  it('returns pm25: null and pm25DataAvailable: false when pm25 is null', () => {
    const result = calculateExposureScore({
      activityId: 'running',
      durationMinutes: 60,
      aqi: 186,
      pm25: null,
    });
    expect(result.pm25).toBeNull();
    expect(result.pm25DataAvailable).toBe(false);
    // Score should still be returned (only AQI/activity/duration contribute)
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it('pm25 score contribution is 0 when pm25 is null', () => {
    const withPm25    = calculateExposureScore({ activityId: 'running', durationMinutes: 60, aqi: 186, pm25: 80 });
    const withoutPm25 = calculateExposureScore({ activityId: 'running', durationMinutes: 60, aqi: 186, pm25: null });
    // pm25 weight is 0.30, so missing pm25 should give lower score
    expect(withPm25.score).toBeGreaterThanOrEqual(withoutPm25.score);
    expect(withoutPm25.breakdown.pm25Contribution).toBe(0);
  });

  it('does not infer pm25 from AQI when pm25 is absent', () => {
    // This test asserts the engine does not generate a synthetic pm25 value
    const result = calculateExposureScore({ activityId: 'running', durationMinutes: 60, aqi: 300, pm25: null });
    expect(result.pm25).toBeNull();
    expect(result.pm25DataAvailable).toBe(false);
  });
});
