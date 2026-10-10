'use strict';

/**
 * services/recommendation.service.js
 *
 * Generates actionable, AQI-graded health precaution advisories.
 *
 * Recommendation logic is driven by:
 *   1. Ambient AQI category (current or from forecast data).
 *   2. Exposure risk level when available (from a calculateExposureScore result).
 *   3. Best/worst 3-hour forecast windows from openweather.service.js.
 *
 * IMPORTANT LIMITATIONS:
 *   - Recommendations are general public-health precautionary guidelines.
 *   - They do not constitute personalised medical advice.
 *   - Outdoor activity is never described as universally safe; risk language
 *     scales with AQI level.
 *   - Best-time windows are derived from modelled forecast data, not ground truth.
 */

const { getAqiCategory } = require('../utils/aqiCalculator');

/**
 * Generate a set of advisory action items from an AQI value.
 * Action items match the icon identifiers expected by RecommendationCard.jsx.
 *
 * @param {number} aqi
 * @param {object|null} bestWindow - best 3-hour window from forecast (may be null)
 * @returns {object} { summary, actions, tips, maskRecommendation, saferAlternativeTime }
 */
function buildAdvisoryFromAqi(aqi, bestWindow = null) {
  const saferAlternativeTime = bestWindow
    ? `Best upcoming window: ${bestWindow.startHour} – ${bestWindow.endHour} (Avg AQI ~${bestWindow.averageAqi})`
    : 'Forecast window data not available. Consider checking again later.';

  // AQI ≤ 50: Good
  if (aqi <= 50) {
    return {
      summary:
        'Air quality is currently rated Good. Outdoor activities carry low pollution exposure risk under these conditions.',
      actions: [
        { icon: 'CheckCircle2', text: 'Outdoor activities are lower risk under current air conditions', type: 'success' },
        { icon: 'Sun',          text: 'Natural room ventilation is appropriate today',                   type: 'info' },
      ],
      tips: [],
      maskRecommendation: 'Not required under current conditions.',
      saferAlternativeTime,
    };
  }

  // AQI ≤ 100: Moderate
  if (aqi <= 100) {
    return {
      summary:
        'Air quality is Moderate. Most individuals can proceed with general outdoor activities. ' +
        'People with respiratory conditions (asthma, COPD) should consider limiting prolonged high-intensity cardio.',
      actions: [
        { icon: 'Info',      text: 'Sensitive groups (asthma, allergies) should limit prolonged intense cardio', type: 'warning' },
        { icon: 'Droplets', text: 'Stay hydrated to help clear airway particles during outdoor exertion',         type: 'info' },
      ],
      tips: [],
      maskRecommendation: 'Optional for individuals with respiratory conditions.',
      saferAlternativeTime,
    };
  }

  // AQI ≤ 150: Unhealthy for Sensitive Groups
  if (aqi <= 150) {
    return {
      summary:
        'Air quality is Unhealthy for Sensitive Groups. Avoid prolonged outdoor exertion if you have ' +
        'asthma, heart disease, or lung conditions. General public should consider shortening outdoor sessions.',
      actions: [
        { icon: 'AlertTriangle', text: 'Limit prolonged outdoor exertion, especially high-intensity cardio',        type: 'warning' },
        { icon: 'Home',          text: 'Sensitive individuals should consider moving physical activity indoors',     type: 'warning' },
        { icon: 'Clock',         text: 'Keep outdoor sessions shorter than 30–45 minutes where possible',           type: 'info' },
      ],
      tips: ['Rinse eyes and face on returning indoors.'],
      maskRecommendation: 'N95 recommended for sensitive groups during outdoor commutes or exercise.',
      saferAlternativeTime,
    };
  }

  // AQI ≤ 200: Unhealthy
  if (aqi <= 200) {
    return {
      summary:
        'Air quality is Unhealthy. Everyone may begin to experience respiratory effects. ' +
        'Reduce or reschedule outdoor physical activity. Members of sensitive groups should avoid outdoor exertion.',
      actions: [
        { icon: 'AlertTriangle', text: 'Reschedule high-intensity outdoor exercise to a lower-AQI period', type: 'danger' },
        { icon: 'Home',          text: 'Substitute with indoor treadmill, gym, or yoga',                   type: 'warning' },
        { icon: 'Shield',        text: 'Wear a well-fitted N95/FFP2 mask if outdoor transit is unavoidable', type: 'warning' },
      ],
      tips: [
        'Keep windows closed during peak traffic and evening hours.',
        'Wash face and rinse eyes with clean water upon returning indoors.',
      ],
      maskRecommendation: 'N95 / FFP2 mask strongly recommended for outdoor exposure.',
      saferAlternativeTime,
    };
  }

  // AQI ≤ 300: Very Unhealthy
  if (aqi <= 300) {
    return {
      summary:
        'Air quality is Very Unhealthy. Health warnings are in effect. Avoid all outdoor physical ' +
        'exertion. Sensitive individuals should remain indoors.',
      actions: [
        { icon: 'XCircle',    text: 'Avoid all outdoor exercise and strenuous activity',         type: 'danger' },
        { icon: 'ShieldAlert', text: 'N95/KN95 respirator mandatory if stepping outside',         type: 'danger' },
        { icon: 'Wind',        text: 'Keep windows sealed and activate HEPA air purifiers indoors', type: 'warning' },
      ],
      tips: [
        'Children, elderly, and individuals with respiratory or cardiovascular conditions must remain indoors.',
        'Avoid deep or forced breathing outdoors under these conditions.',
      ],
      maskRecommendation: 'N95/KN95 respirator mandatory if outdoors.',
      saferAlternativeTime,
    };
  }

  // AQI > 300: Hazardous
  return {
    summary:
      'Air quality is Hazardous. This is an emergency health condition. Avoid all outdoor ' +
      'activity. Everyone is at risk of serious health effects.',
    actions: [
      { icon: 'XCircle',    text: 'Stay indoors with windows and doors sealed',                  type: 'danger' },
      { icon: 'ShieldAlert', text: 'Mandatory N95/KN95 respirator for any unavoidable outdoor exposure', type: 'danger' },
      { icon: 'Wind',        text: 'Run HEPA air purifiers on maximum setting indoors',            type: 'danger' },
    ],
    tips: [
      'Do not exercise outdoors under any circumstances.',
      'Monitor local authority health advisories for further guidance.',
      'Vulnerable populations must remain in filtered indoor air.',
    ],
    maskRecommendation: 'N95/KN95 respirator is mandatory for any outdoor exposure.',
    saferAlternativeTime,
  };
}

/**
 * getCurrentRecommendations — builds AQI-graded advisory from a current air payload.
 *
 * @param {object} airData - Response from openweather.service.fetchCurrentAir
 * @returns {object} Recommendations payload
 */
function getCurrentRecommendations(airData) {
  const aqi = typeof airData.aqi === 'number' ? airData.aqi : 0;
  const aqiCategory = getAqiCategory(aqi);
  const advisory = buildAdvisoryFromAqi(aqi, null);

  return {
    location: airData.location || null,
    aqi,
    aqiCategory: aqiCategory.category,
    color: aqiCategory.color || null,
    timestamp: airData.timestamp || new Date().toISOString(),
    ...advisory,
    disclaimer:
      'These recommendations are general public-health precautionary guidelines derived from ' +
      'ambient AQI estimates. They are not personalised medical advice.',
  };
}

/**
 * getBestTimeRecommendation — builds a forecast-aware best-time advisory.
 *
 * @param {object} forecastData - Response from openweather.service.fetchForecast
 * @returns {object} Best time window recommendation payload
 */
function getBestTimeRecommendation(forecastData) {
  const { bestWindow, worstWindow, hourly, source } = forecastData;

  // Validate that forecast windows contain expected fields
  const hasBestWindow = bestWindow && typeof bestWindow.startHour === 'string';
  const hasWorstWindow = worstWindow && typeof worstWindow.startHour === 'string';

  const currentHourlyAqi =
    hourly && hourly.length > 0 && typeof hourly[0].aqi === 'number' ? hourly[0].aqi : null;

  return {
    bestWindow: hasBestWindow ? bestWindow : null,
    worstWindow: hasWorstWindow ? worstWindow : null,
    currentHourlyAqi,
    hourlyCount: Array.isArray(hourly) ? hourly.length : 0,
    source: source || 'OpenWeather Air Pollution API',
    advisory:
      hasBestWindow
        ? `Lowest predicted pollution period: ${bestWindow.startHour} – ${bestWindow.endHour} ` +
          `(Avg AQI ~${bestWindow.averageAqi}). ${bestWindow.recommendation}`
        : 'Forecast window data is currently unavailable.',
    disclaimer:
      'Forecast windows are derived from modelled air pollution data, not ground-level measurements. ' +
      'Actual conditions may differ. These are indicative guidance windows, not medically verified safe periods.',
  };
}

module.exports = {
  buildAdvisoryFromAqi,
  getCurrentRecommendations,
  getBestTimeRecommendation,
};
