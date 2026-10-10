'use strict';

/**
 * utils/exposureCalculator.js — AirSafe Exposure Estimation Engine.
 *
 * PURPOSE & SCIENTIFIC BASIS:
 *   This module estimates a relative environmental exposure score (0–100) for
 *   an outdoor or indoor activity performed under a given ambient air quality.
 *   It is a heuristic, weighted composite indicator designed to guide
 *   precautionary behaviour. It is NOT:
 *     - Clinical dosimetry
 *     - A validated personal health measurement
 *     - A certified medical risk assessment
 *     - A substitute for professional medical advice
 *
 * FORMULA (mirrors client-side exposureEngine.js exactly):
 *   score = (aqiComponent * 0.45) +
 *           (pm25Component * 0.30) +
 *           (durationFactor * 0.15 * actMultiplier) +
 *           (activityComponent * 0.10)
 *
 *   AQI component:       min((aqi / 300) * 100, 100)
 *   PM2.5 component:     min((pm25 / 120) * 100, 100)  — WHO 24-hr guideline 15 µg/m³; 120 is 8× threshold
 *   Duration factor:     min((minutes / 120) * 100, 100)
 *   Activity component:  min(multiplier * 80, 100)
 *   Final score:         clamped to [5, 100] — never claims zero risk in polluted outdoor conditions
 *
 * ACTIVITY RESPIRATION MULTIPLIERS (aligned with client ACTIVITIES array):
 *   Indoor activities reduce inhaled outdoor particulates substantially.
 *   Outdoor high-intensity activities amplify particle intake via increased minute ventilation.
 */

/**
 * Valid activity definitions — must match client-side exposureEngine.js ACTIVITIES array exactly.
 */
const ACTIVITIES = {
  sitting_indoor: { id: 'sitting_indoor', label: 'Sitting / Resting Indoors',           multiplier: 0.2, indoor: true  },
  indoor_work:    { id: 'indoor_work',    label: 'Office / Indoor Light Activity',        multiplier: 0.3, indoor: true  },
  walking:        { id: 'walking',        label: 'Walking / Commuting',                   multiplier: 0.6, indoor: false },
  cycling:        { id: 'cycling',        label: 'Biking / Cycling',                      multiplier: 0.8, indoor: false },
  running:        { id: 'running',        label: 'Running / Jogging',                     multiplier: 1.0, indoor: false },
  outdoor_work:   { id: 'outdoor_work',   label: 'Outdoor Labor / Delivery',              multiplier: 1.0, indoor: false },
  heavy_sports:   { id: 'heavy_sports',   label: 'Heavy Outdoor Sports (Football/Cardio)', multiplier: 1.2, indoor: false },
};

const VALID_ACTIVITY_IDS = Object.keys(ACTIVITIES);
const DURATION_MIN = 1;
const DURATION_MAX = 720;

/**
 * Risk classification thresholds — must match client RISK_LEVELS array exactly.
 */
const RISK_LEVELS = [
  {
    min: 0,  max: 25,
    level: 'LOW',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'Minimal Exposure Impact',
    summary: 'The planned activity has negligible pollution exposure risk. Ideal conditions for outdoor exertion.',
  },
  {
    min: 26, max: 50,
    level: 'MODERATE',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: 'Moderate Exposure Impact',
    summary: 'Acceptable for most individuals. Sensitive individuals may consider moderating heavy workouts.',
  },
  {
    min: 51, max: 75,
    level: 'HIGH',
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    title: 'High Inhalation Exposure Risk',
    summary: 'Elevated particle inhalation due to air pollution combined with activity duration and respiration rate.',
  },
  {
    min: 76, max: 100,
    level: 'VERY HIGH',
    color: '#ef4444',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    title: 'Critical Exposure Alert',
    summary: 'Severe cumulative inhalation risk. High risk of respiratory strain, asthma triggers, and blood-stream PM absorption.',
  },
];

/**
 * getRiskClassification — maps a numeric score to a risk level object.
 * @param {number} score - 0–100
 * @returns {object} Risk level metadata
 */
function getRiskClassification(score) {
  const bounded = Math.min(Math.max(Math.round(score), 0), 100);
  if (bounded <= 25) return RISK_LEVELS[0];
  if (bounded <= 50) return RISK_LEVELS[1];
  if (bounded <= 75) return RISK_LEVELS[2];
  return RISK_LEVELS[3];
}

/**
 * validateExposureInputs — validates activity ID and duration.
 *
 * @param {string}  activityId
 * @param {number}  durationMinutes
 * @returns {{ valid: boolean, error?: string }}
 */
function validateExposureInputs(activityId, durationMinutes) {
  if (!activityId || !VALID_ACTIVITY_IDS.includes(activityId)) {
    return {
      valid: false,
      error: `Invalid activity. Must be one of: ${VALID_ACTIVITY_IDS.join(', ')}.`,
    };
  }

  const dur = Number(durationMinutes);
  if (!Number.isFinite(dur) || dur < DURATION_MIN || dur > DURATION_MAX) {
    return {
      valid: false,
      error: `Duration must be a number between ${DURATION_MIN} and ${DURATION_MAX} minutes.`,
    };
  }

  return { valid: true };
}

/**
 * calculateExposureScore — core calculation function.
 *
 * @param {object}  params
 * @param {string}  params.activityId        - Activity identifier
 * @param {number}  params.durationMinutes   - Duration in minutes (1–720)
 * @param {number}  params.aqi               - Ambient AQI (0–500+)
 * @param {number|null} params.pm25          - PM2.5 in µg/m³; null means unavailable
 * @returns {object} Exposure calculation result
 */
function calculateExposureScore({ activityId, durationMinutes, aqi, pm25 }) {
  const activity = ACTIVITIES[activityId];
  const actMultiplier = activity.multiplier;

  // AQI normalized component: scaled by 300 (Hazardous upper reference) capped at 100
  const aqiComponent = Math.min((aqi / 300) * 100, 100);

  // PM2.5 component: 120 µg/m³ as upper normalization reference (8× WHO 24hr guideline)
  // If pm25 is null (upstream data missing), contribution is 0 and flagged in metadata.
  const pm25Available = typeof pm25 === 'number' && Number.isFinite(pm25) && pm25 >= 0;
  const pm25Component = pm25Available ? Math.min((pm25 / 120) * 100, 100) : 0;

  // Duration factor: 2 hours as full-saturation reference
  const durationFactor = Math.min((durationMinutes / 120) * 100, 100);

  // Activity factor: multiplier × 80 to scale to max 100 (heavy_sports × 1.2 → 96)
  const activityComponent = Math.min(actMultiplier * 80, 100);

  // Weighted sum — formula is identical to client-side exposureEngine.js
  const rawScore =
    (aqiComponent * 0.45) +
    (pm25Component * 0.30) +
    (durationFactor * 0.15 * actMultiplier) +
    (activityComponent * 0.10);

  // Clamp to [5, 100]: floor prevents misleading zero-risk claim in polluted outdoor conditions
  const finalScore = Math.min(Math.max(Math.round(rawScore), 5), 100);
  const risk = getRiskClassification(finalScore);

  // Component breakdown for visualization (matches ExposureBreakdownChart.jsx field names)
  const breakdown = {
    aqiContribution:      Math.round(aqiComponent * 0.45),
    pm25Contribution:     Math.round(pm25Component * 0.30),
    durationContribution: Math.round(durationFactor * 0.15 * actMultiplier),
    activityContribution: Math.round(activityComponent * 0.10),
  };

  return {
    score: finalScore,
    risk,
    breakdown,
    activity,
    duration: Number(durationMinutes),
    aqi,
    pm25: pm25Available ? pm25 : null,
    pm25DataAvailable: pm25Available,
    calculatedAt: new Date().toISOString(),
    disclaimer:
      'AirSafe exposure scores are estimated environmental risk indicators based on ambient air quality ' +
      'and standard physiological ventilation rates. They are not certified medical measurements, ' +
      'clinical dosimetry, or personalized medical diagnoses. Consult a qualified health professional ' +
      'for personal health guidance.',
  };
}

module.exports = {
  ACTIVITIES,
  VALID_ACTIVITY_IDS,
  RISK_LEVELS,
  DURATION_MIN,
  DURATION_MAX,
  getRiskClassification,
  validateExposureInputs,
  calculateExposureScore,
};
