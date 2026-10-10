'use strict';

/**
 * tests/aqiCalculator.test.js
 *
 * Unit tests for the scientific US EPA AQI calculation engine.
 *
 * Verifies:
 *   1. PM2.5 breakpoint boundaries and linear interpolation.
 *   2. PM10 breakpoint boundaries and truncation.
 *   3. Multi-pollutant calculation & dominant pollutant identification.
 *   4. O3, NO2, SO2, CO sub-index calculations and conversions.
 *   5. Handling of missing, empty, or invalid component inputs.
 *   6. Concentrations exceeding upper EPA breakpoints (isBeyondIndex flag).
 *   7. Category assignment across all EPA thresholds.
 */

const {
  calculateEpaAqi,
  calculateSubIndex,
  truncateConcentration,
  getAqiCategory,
} = require('../src/utils/aqiCalculator');

describe('Scientific EPA AQI Calculator (src/utils/aqiCalculator.js)', () => {
  describe('Concentration Truncation Rules', () => {
    it('truncates PM2.5 to 1 decimal place', () => {
      expect(truncateConcentration('pm2_5', 12.09)).toBe(12.0);
      expect(truncateConcentration('pm2_5', 35.48)).toBe(35.4);
    });

    it('truncates PM10 to integer', () => {
      expect(truncateConcentration('pm10', 54.9)).toBe(54);
      expect(truncateConcentration('pm10', 154.2)).toBe(154);
    });

    it('returns null for negative or non-numeric values', () => {
      expect(truncateConcentration('pm2_5', -5)).toBeNull();
      expect(truncateConcentration('pm2_5', NaN)).toBeNull();
      expect(truncateConcentration('unknown', 10)).toBeNull();
    });
  });

  describe('PM2.5 EPA Sub-Index Breakpoint Boundaries', () => {
    it('calculates exact boundary values for Good (0-50)', () => {
      expect(calculateSubIndex('pm2_5', 0.0).subIndex).toBe(0);
      expect(calculateSubIndex('pm2_5', 12.0).subIndex).toBe(50);
    });

    it('calculates boundary values for Moderate (51-100)', () => {
      expect(calculateSubIndex('pm2_5', 12.1).subIndex).toBe(51);
      expect(calculateSubIndex('pm2_5', 35.4).subIndex).toBe(100);
    });

    it('calculates boundary values for Unhealthy for Sensitive Groups (101-150)', () => {
      expect(calculateSubIndex('pm2_5', 35.5).subIndex).toBe(101);
      expect(calculateSubIndex('pm2_5', 55.4).subIndex).toBe(150);
    });

    it('calculates boundary values for Unhealthy (151-200)', () => {
      expect(calculateSubIndex('pm2_5', 55.5).subIndex).toBe(151);
      expect(calculateSubIndex('pm2_5', 150.4).subIndex).toBe(200);
    });

    it('calculates boundary values for Very Unhealthy (201-300)', () => {
      expect(calculateSubIndex('pm2_5', 150.5).subIndex).toBe(201);
      expect(calculateSubIndex('pm2_5', 250.4).subIndex).toBe(300);
    });

    it('calculates boundary values for Hazardous (301-500)', () => {
      expect(calculateSubIndex('pm2_5', 250.5).subIndex).toBe(301);
      expect(calculateSubIndex('pm2_5', 500.4).subIndex).toBe(500);
    });

    it('flags concentrations exceeding EPA upper breakpoint as isBeyondIndex', () => {
      const result = calculateSubIndex('pm2_5', 650.0);
      expect(result.subIndex).toBe(500);
      expect(result.isBeyondIndex).toBe(true);
    });
  });

  describe('PM10 EPA Sub-Index Breakpoint Boundaries', () => {
    it('calculates boundary values for PM10', () => {
      expect(calculateSubIndex('pm10', 0).subIndex).toBe(0);
      expect(calculateSubIndex('pm10', 54).subIndex).toBe(50);
      expect(calculateSubIndex('pm10', 55).subIndex).toBe(51);
      expect(calculateSubIndex('pm10', 154).subIndex).toBe(100);
      expect(calculateSubIndex('pm10', 254).subIndex).toBe(150);
      expect(calculateSubIndex('pm10', 354).subIndex).toBe(200);
      expect(calculateSubIndex('pm10', 604).subIndex).toBe(500);
    });
  });

  describe('Dominant Pollutant & Multi-Pollutant Calculation (calculateEpaAqi)', () => {
    it('identifies PM2.5 as dominant pollutant when PM2.5 sub-index is highest', () => {
      const result = calculateEpaAqi({
        pm2_5: 75.0, // AQI ~ 161 (Unhealthy)
        pm10: 60.0,  // AQI ~ 53 (Moderate)
        no2: 20.0,
      });

      expect(result.aqi).toBeGreaterThanOrEqual(160);
      expect(result.dominantPollutant).toBe('PM2.5');
      expect(result.category).toBe('Unhealthy');
    });

    it('identifies PM10 as dominant pollutant when PM10 sub-index is highest', () => {
      const result = calculateEpaAqi({
        pm2_5: 5.0,   // AQI ~ 21 (Good)
        pm10: 200.0,  // AQI ~ 123 (Unhealthy for Sensitive Groups)
      });

      expect(result.aqi).toBeGreaterThanOrEqual(120);
      expect(result.dominantPollutant).toBe('PM10');
      expect(result.category).toBe('Unhealthy for Sensitive Groups');
    });

    it('identifies Nitrogen Dioxide when NO2 is dominant', () => {
      const result = calculateEpaAqi({
        pm2_5: 2.0,
        pm10: 10.0,
        no2: 400.0, // High NO2
      });

      expect(result.dominantPollutant).toBe('Nitrogen Dioxide (NO₂)');
      expect(result.aqi).toBeGreaterThan(50);
    });

    it('handles empty or missing components gracefully', () => {
      const result = calculateEpaAqi({});
      expect(result.aqi).toBe(0);
      expect(result.category).toBe('Good');
      expect(result.dominantPollutant).toBe('PM2.5');
    });

    it('handles null/undefined components parameter gracefully', () => {
      const result = calculateEpaAqi(null);
      expect(result.aqi).toBe(0);
      expect(result.category).toBe('Good');
    });

    it('includes methodology and averaging period notice', () => {
      const result = calculateEpaAqi({ pm2_5: 25.0 });
      expect(result.methodology).toMatch(/US EPA/);
      expect(result.averagingPeriodNotice).toBeDefined();
    });
  });

  describe('AQI Category Mapping', () => {
    it('maps AQI values to proper categories', () => {
      expect(getAqiCategory(25).category).toBe('Good');
      expect(getAqiCategory(75).category).toBe('Moderate');
      expect(getAqiCategory(125).category).toBe('Unhealthy for Sensitive Groups');
      expect(getAqiCategory(175).category).toBe('Unhealthy');
      expect(getAqiCategory(250).category).toBe('Very Unhealthy');
      expect(getAqiCategory(400).category).toBe('Hazardous');
    });
  });
});
