'use strict';

/**
 * utils/aqiCalculator.js — Scientific US EPA Air Quality Index (AQI) Calculation Engine.
 *
 * References & Standards:
 *   - US EPA 40 CFR Part 58, Appendix G (Uniform Air Quality Index).
 *   - Technical Assistance Document for the Reporting of Daily Air Quality (EPA-454/B-18-007).
 *
 * Scientific Methodology:
 *   The AQI is calculated using piecewise linear interpolation:
 *
 *       I = ((I_hi - I_lo) / (BP_hi - BP_lo)) * (C - BP_lo) + I_lo
 *
 *   Where:
 *     - I     = Calculated Air Quality Index
 *     - C     = Truncated/rounded pollutant concentration
 *     - BP_lo = Lower concentration breakpoint (<= C)
 *     - BP_hi = Upper concentration breakpoint (>= C)
 *     - I_lo  = Lower AQI breakpoint corresponding to BP_lo
 *     - I_hi  = Upper AQI breakpoint corresponding to BP_hi
 *
 *   Overall AQI = max(subIndex_PM25, subIndex_PM10, subIndex_O3, subIndex_NO2, subIndex_SO2, subIndex_CO)
 *   Dominant Pollutant = Pollutant with the highest valid sub-index.
 *
 * Averaging-Period & Scientific Limitations:
 *   1. Regulatory US EPA AQI is officially defined over multi-hour monitoring averages
 *      (24-hr for PM2.5 and PM10; 8-hr for O3 and CO; 1-hr for NO2 and SO2).
 *   2. OpenWeather provides instantaneous modeled/station concentrations in ug/m3.
 *   3. This engine calculates an ESTIMATED INSTANTANEOUS AQI (analogous to the EPA NowCast
 *      surrogate), providing real-time risk indicators rather than certified regulatory compliance.
 *   4. Concentrations exceeding defined upper breakpoints are flagged (isBeyondIndex: true)
 *      and clamped to 500 with a documented warning rather than silent truncation.
 */

/**
 * Standard EPA AQI Category Definitions
 */
const AQI_CATEGORIES = [
  { min: 0, max: 50, category: 'Good', color: '#10b981' },
  { min: 51, max: 100, category: 'Moderate', color: '#f59e0b' },
  { min: 101, max: 150, category: 'Unhealthy for Sensitive Groups', color: '#f97316' },
  { min: 151, max: 200, category: 'Unhealthy', color: '#ef4444' },
  { min: 201, max: 300, category: 'Very Unhealthy', color: '#8b5cf6' },
  { min: 301, max: 500, category: 'Hazardous', color: '#881337' },
];

/**
 * EPA Breakpoint Tables
 *
 * Units:
 *   - pm2_5: ug/m3 (truncated to 1 decimal place)
 *   - pm10:  ug/m3 (truncated to integer)
 *   - o3:    ppm   (truncated to 3 decimal places; 1 ug/m3 ~= 0.0005 ppm at 25C 1atm)
 *   - no2:   ppb   (truncated to integer; 1 ug/m3 ~= 0.5319 ppb)
 *   - so2:   ppb   (truncated to integer; 1 ug/m3 ~= 0.3817 ppb)
 *   - co:    ppm   (truncated to 1 decimal place; 1 ug/m3 ~= 0.000873 ppm)
 */
const BREAKPOINTS = {
  pm2_5: [
    { bpLo: 0.0, bpHi: 12.0, iLo: 0, iHi: 50 },
    { bpLo: 12.1, bpHi: 35.4, iLo: 51, iHi: 100 },
    { bpLo: 35.5, bpHi: 55.4, iLo: 101, iHi: 150 },
    { bpLo: 55.5, bpHi: 150.4, iLo: 151, iHi: 200 },
    { bpLo: 150.5, bpHi: 250.4, iLo: 201, iHi: 300 },
    { bpLo: 250.5, bpHi: 350.4, iLo: 301, iHi: 400 },
    { bpLo: 350.5, bpHi: 500.4, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { bpLo: 0, bpHi: 54, iLo: 0, iHi: 50 },
    { bpLo: 55, bpHi: 154, iLo: 51, iHi: 100 },
    { bpLo: 155, bpHi: 254, iLo: 101, iHi: 150 },
    { bpLo: 255, bpHi: 354, iLo: 151, iHi: 200 },
    { bpLo: 355, bpHi: 424, iLo: 201, iHi: 300 },
    { bpLo: 425, bpHi: 504, iLo: 301, iHi: 400 },
    { bpLo: 505, bpHi: 604, iLo: 401, iHi: 500 },
  ],
  o3: [
    { bpLo: 0.0, bpHi: 0.054, iLo: 0, iHi: 50 },
    { bpLo: 0.055, bpHi: 0.07, iLo: 51, iHi: 100 },
    { bpLo: 0.071, bpHi: 0.085, iLo: 101, iHi: 150 },
    { bpLo: 0.086, bpHi: 0.105, iLo: 151, iHi: 200 },
    { bpLo: 0.106, bpHi: 0.2, iLo: 201, iHi: 300 },
    { bpLo: 0.201, bpHi: 0.504, iLo: 301, iHi: 400 },
    { bpLo: 0.505, bpHi: 0.604, iLo: 401, iHi: 500 },
  ],
  no2: [
    { bpLo: 0, bpHi: 53, iLo: 0, iHi: 50 },
    { bpLo: 54, bpHi: 100, iLo: 51, iHi: 100 },
    { bpLo: 101, bpHi: 360, iLo: 101, iHi: 150 },
    { bpLo: 361, bpHi: 649, iLo: 151, iHi: 200 },
    { bpLo: 650, bpHi: 1249, iLo: 201, iHi: 300 },
    { bpLo: 1250, bpHi: 1649, iLo: 301, iHi: 400 },
    { bpLo: 1650, bpHi: 2049, iLo: 401, iHi: 500 },
  ],
  so2: [
    { bpLo: 0, bpHi: 35, iLo: 0, iHi: 50 },
    { bpLo: 36, bpHi: 75, iLo: 51, iHi: 100 },
    { bpLo: 76, bpHi: 185, iLo: 101, iHi: 150 },
    { bpLo: 186, bpHi: 304, iLo: 151, iHi: 200 },
    { bpLo: 305, bpHi: 604, iLo: 201, iHi: 300 },
    { bpLo: 605, bpHi: 804, iLo: 301, iHi: 400 },
    { bpLo: 805, bpHi: 1004, iLo: 401, iHi: 500 },
  ],
  co: [
    { bpLo: 0.0, bpHi: 4.4, iLo: 0, iHi: 50 },
    { bpLo: 4.5, bpHi: 9.4, iLo: 51, iHi: 100 },
    { bpLo: 9.5, bpHi: 12.4, iLo: 101, iHi: 150 },
    { bpLo: 12.5, bpHi: 15.4, iLo: 151, iHi: 200 },
    { bpLo: 15.5, bpHi: 30.4, iLo: 201, iHi: 300 },
    { bpLo: 30.5, bpHi: 40.4, iLo: 301, iHi: 400 },
    { bpLo: 40.5, bpHi: 50.4, iLo: 401, iHi: 500 },
  ],
};

const DISPLAY_NAMES = {
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  o3: 'Ozone (O₃)',
  no2: 'Nitrogen Dioxide (NO₂)',
  so2: 'Sulfur Dioxide (SO₂)',
  co: 'Carbon Monoxide (CO)',
};

/**
 * Truncate concentration according to EPA pollutant rounding rules
 */
function truncateConcentration(pollutant, rawUgM3) {
  if (typeof rawUgM3 !== 'number' || Number.isNaN(rawUgM3) || rawUgM3 < 0) {
    return null;
  }

  switch (pollutant) {
    case 'pm2_5':
      // Truncate to 1 decimal place (ug/m3)
      return Math.floor(rawUgM3 * 10) / 10;

    case 'pm10':
      // Truncate to integer (ug/m3)
      return Math.floor(rawUgM3);

    case 'o3': {
      // 1 ug/m3 ~= 0.0005 ppm at 25C; truncate to 3 decimal places (ppm)
      const ppm = rawUgM3 / 1963.0;
      return Math.floor(ppm * 1000) / 1000;
    }

    case 'no2': {
      // 1 ug/m3 ~= 0.5319 ppb; truncate to integer (ppb)
      const ppb = (rawUgM3 * 24.45) / 46.01;
      return Math.floor(ppb);
    }

    case 'so2': {
      // 1 ug/m3 ~= 0.3817 ppb; truncate to integer (ppb)
      const ppb = (rawUgM3 * 24.45) / 64.06;
      return Math.floor(ppb);
    }

    case 'co': {
      // 1 ug/m3 ~= 0.000873 ppm; truncate to 1 decimal place (ppm)
      const ppm = (rawUgM3 * 24.45) / (28.01 * 1000.0);
      return Math.floor(ppm * 10) / 10;
    }

    default:
      return null;
  }
}

/**
 * Calculate individual pollutant sub-index using linear interpolation
 */
function calculateSubIndex(pollutant, concentration) {
  const table = BREAKPOINTS[pollutant];
  if (!table || concentration === null || concentration === undefined) {
    return null;
  }

  const highestBp = table[table.length - 1];

  // Check if concentration exceeds upper EPA limit
  if (concentration > highestBp.bpHi) {
    return {
      subIndex: 500,
      isBeyondIndex: true,
      concentration,
    };
  }

  // Find corresponding breakpoint bracket
  for (const bp of table) {
    if (concentration >= bp.bpLo && concentration <= bp.bpHi) {
      const aqi =
        ((bp.iHi - bp.iLo) / (bp.bpHi - bp.bpLo)) * (concentration - bp.bpLo) +
        bp.iLo;

      return {
        subIndex: Math.round(aqi),
        isBeyondIndex: false,
        concentration,
      };
    }
  }

  // If concentration is 0 or below lowest bracket
  return {
    subIndex: 0,
    isBeyondIndex: false,
    concentration,
  };
}

/**
 * Get category metadata for an AQI value
 */
function getAqiCategory(aqi) {
  const boundedAqi = Math.max(0, Math.min(500, Math.round(aqi || 0)));
  for (const cat of AQI_CATEGORIES) {
    if (boundedAqi >= cat.min && boundedAqi <= cat.max) {
      return cat;
    }
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

/**
 * calculateEpaAqi — Primary calculation entry point.
 *
 * @param {object} components - Raw OpenWeather component concentrations in ug/m3
 * @returns {object} Calculated EPA AQI metadata
 */
function calculateEpaAqi(components = {}) {
  if (!components || typeof components !== 'object') {
    return {
      aqi: 0,
      category: 'Good',
      dominantPollutant: 'None',
      subIndices: {},
      isBeyondIndex: false,
      methodology: 'US EPA Piecewise Linear (Estimated Instantaneous AQI)',
    };
  }

  const subIndices = {};
  let maxSubIndex = 0;
  let dominantKey = 'PM2.5';
  let hasBeyondIndex = false;

  const pollutantKeys = ['pm2_5', 'pm10', 'o3', 'no2', 'so2', 'co'];

  for (const key of pollutantKeys) {
    const rawVal = components[key];
    if (typeof rawVal === 'number' && !Number.isNaN(rawVal) && rawVal >= 0) {
      const truncated = truncateConcentration(key, rawVal);
      const res = calculateSubIndex(key, truncated);

      if (res !== null) {
        subIndices[key] = {
          aqi: res.subIndex,
          rawConcentration: rawVal,
          truncatedConcentration: truncated,
          isBeyondIndex: res.isBeyondIndex,
          name: DISPLAY_NAMES[key] || key,
        };

        if (res.isBeyondIndex) {
          hasBeyondIndex = true;
        }

        if (res.subIndex > maxSubIndex) {
          maxSubIndex = res.subIndex;
          dominantKey = DISPLAY_NAMES[key] || key;
        }
      }
    }
  }

  const categoryObj = getAqiCategory(maxSubIndex);

  return {
    aqi: maxSubIndex,
    category: categoryObj.category,
    dominantPollutant: dominantKey,
    subIndices,
    isBeyondIndex: hasBeyondIndex,
    methodology: 'US EPA Piecewise Linear (Estimated Instantaneous AQI)',
    averagingPeriodNotice:
      'Calculated from instantaneous hourly concentrations. Official EPA regulatory AQI requires multi-hour averaging.',
  };
}

module.exports = {
  calculateEpaAqi,
  calculateSubIndex,
  truncateConcentration,
  getAqiCategory,
  AQI_CATEGORIES,
  BREAKPOINTS,
};
