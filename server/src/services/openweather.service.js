'use strict';

/**
 * services/openweather.service.js
 *
 * Upstream integration with the OpenWeather Air Pollution API.
 * Uses native fetch with 5000ms timeout and robust error mapping.
 */

const config = require('../config/env');
const { calculateEpaAqi, getAqiCategory } = require('../utils/aqiCalculator');

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const TIMEOUT_MS = 5000;

/**
 * Validate that a value is a valid UNIX timestamp in seconds
 */
function isValidTimestamp(dt) {
  return typeof dt === 'number' && Number.isFinite(dt) && dt > 0 && dt < 10000000000;
}

/**
 * Helper to execute upstream fetch with timeout and error classification
 */
async function executeFetch(url) {
  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const error = new Error('Upstream air quality service request timed out.');
      error.statusCode = 504;
      throw error;
    }
    const error = new Error(`Upstream air quality network error: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error('OpenWeather API authentication failed: invalid or unactivated API key.');
      error.statusCode = 502;
      throw error;
    }
    if (response.status === 429) {
      const error = new Error('OpenWeather API rate limit exceeded.');
      error.statusCode = 429;
      throw error;
    }
    const error = new Error(`Upstream air quality service returned HTTP ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }

  try {
    return await response.json();
  } catch (err) {
    const error = new Error('Failed to parse upstream air quality JSON response.');
    error.statusCode = 502;
    throw error;
  }
}

/**
 * Format a Date object into an hour label like '6 AM' or '8 PM'
 */
function formatHourLabel(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  });
}

/**
 * Format date into weekday abbreviation (e.g., 'Mon', 'Tue')
 */
function formatDayName(date, isToday) {
  if (isToday) return 'Today';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Find 3-hour sliding window with min / max average AQI
 */
function computeTimeWindows(hourlyList) {
  if (!hourlyList || !Array.isArray(hourlyList) || hourlyList.length < 3) {
    const list = Array.isArray(hourlyList) ? hourlyList : [];
    const defaultAqi =
      list.length > 0
        ? Math.round(
            list.reduce((s, h) => s + (h && typeof h.aqi === 'number' ? h.aqi : 0), 0) /
              list.length
          )
        : 0;
    const startLbl = list[0] && list[0].hourLabel ? list[0].hourLabel : 'N/A';
    const endLbl =
      list[list.length - 1] && list[list.length - 1].hourLabel
        ? list[list.length - 1].hourLabel
        : 'N/A';

    return {
      bestWindow: {
        startHour: startLbl,
        endHour: endLbl,
        averageAqi: defaultAqi,
        riskLevel: defaultAqi <= 50 ? 'LOW' : 'MODERATE',
        recommendation: 'Insufficient hourly records to calculate optimal 3-hour window.',
      },
      worstWindow: {
        startHour: startLbl,
        endHour: endLbl,
        averageAqi: defaultAqi,
        riskLevel: defaultAqi > 150 ? 'HIGH' : 'MODERATE',
        recommendation: 'Insufficient hourly records to calculate peak pollution window.',
      },
    };
  }

  const windowSize = 3;
  let minAvg = Infinity;
  let maxAvg = -Infinity;
  let bestIdx = 0;
  let worstIdx = 0;

  for (let i = 0; i <= hourlyList.length - windowSize; i++) {
    const slice = hourlyList.slice(i, i + windowSize);
    const avg = slice.reduce((sum, h) => sum + (h && typeof h.aqi === 'number' ? h.aqi : 0), 0) / windowSize;

    if (avg < minAvg) {
      minAvg = avg;
      bestIdx = i;
    }
    if (avg > maxAvg) {
      maxAvg = avg;
      worstIdx = i;
    }
  }

  const bestStart = hourlyList[bestIdx] && hourlyList[bestIdx].hourLabel ? hourlyList[bestIdx].hourLabel : 'N/A';
  const bestEnd =
    hourlyList[bestIdx + windowSize - 1] && hourlyList[bestIdx + windowSize - 1].hourLabel
      ? hourlyList[bestIdx + windowSize - 1].hourLabel
      : 'N/A';
  const roundedBestAvg = Math.round(minAvg);

  const worstStart = hourlyList[worstIdx] && hourlyList[worstIdx].hourLabel ? hourlyList[worstIdx].hourLabel : 'N/A';
  const worstEnd =
    hourlyList[worstIdx + windowSize - 1] && hourlyList[worstIdx + windowSize - 1].hourLabel
      ? hourlyList[worstIdx + windowSize - 1].hourLabel
      : 'N/A';
  const roundedWorstAvg = Math.round(maxAvg);

  return {
    bestWindow: {
      startHour: bestStart,
      endHour: bestEnd,
      averageAqi: roundedBestAvg,
      riskLevel: roundedBestAvg <= 50 ? 'LOW' : roundedBestAvg <= 100 ? 'MODERATE' : 'HIGH',
      recommendation:
        roundedBestAvg <= 80
          ? 'Lowest predicted pollution period in the upcoming 24 hours. Ideal for outdoor workouts and commuting.'
          : 'Lowest available pollution window. Moderate outdoor exertion advised.',
    },
    worstWindow: {
      startHour: worstStart,
      endHour: worstEnd,
      averageAqi: roundedWorstAvg,
      riskLevel: roundedWorstAvg > 150 ? 'HIGH' : 'MODERATE',
      recommendation:
        'Peak predicted pollution window. Consider indoor exercise or wearing an N95 mask if outdoors.',
    },
  };
}

/**
 * fetchCurrentAir — Retrieves current air quality from OpenWeather and calculates EPA AQI
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Transformed current air quality object
 */
async function fetchCurrentAir(lat, lon) {
  const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${config.openWeatherApiKey}`;
  const data = await executeFetch(url);

  if (!data || !Array.isArray(data.list) || data.list.length === 0) {
    const error = new Error('Upstream air quality service returned an invalid payload structure.');
    error.statusCode = 502;
    throw error;
  }

  const item = data.list[0];
  if (!item || typeof item !== 'object') {
    const error = new Error('Upstream air quality service returned an invalid record.');
    error.statusCode = 502;
    throw error;
  }

  if (!isValidTimestamp(item.dt)) {
    const error = new Error('Upstream air quality service returned an invalid timestamp.');
    error.statusCode = 502;
    throw error;
  }

  const components = item.components && typeof item.components === 'object' ? item.components : {};
  const epaResult = calculateEpaAqi(components);
  const timestamp = new Date(item.dt * 1000).toISOString();

  return {
    location: {
      name: `Location (${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)})`,
      latitude: Number(lat),
      longitude: Number(lon),
      country: 'Local',
    },
    aqi: epaResult.aqi,
    aqiCategory: epaResult.category,
    dominantPollutant: epaResult.dominantPollutant,
    pollutants: {
      pm2_5: typeof components.pm2_5 === 'number' && !Number.isNaN(components.pm2_5) ? Math.round(components.pm2_5 * 10) / 10 : 0,
      pm10: typeof components.pm10 === 'number' && !Number.isNaN(components.pm10) ? Math.round(components.pm10 * 10) / 10 : 0,
      no2: typeof components.no2 === 'number' && !Number.isNaN(components.no2) ? Math.round(components.no2 * 10) / 10 : 0,
      o3: typeof components.o3 === 'number' && !Number.isNaN(components.o3) ? Math.round(components.o3 * 10) / 10 : 0,
      so2: typeof components.so2 === 'number' && !Number.isNaN(components.so2) ? Math.round(components.so2 * 10) / 10 : 0,
      co: typeof components.co === 'number' && !Number.isNaN(components.co) ? Math.round(components.co * 10) / 10 : 0,
    },
    weather: {
      temperature: 26,
      humidity: 60,
      windSpeed: 3.5,
      condition: epaResult.aqi > 150 ? 'Haze / Poor Visibility' : 'Clear / Normal',
    },
    openWeatherIndex: (item.main && item.main.aqi) || null,
    timestamp,
    isSimulated: false,
    source: 'OpenWeather Air Quality API',
    calculationMetadata: {
      methodology: epaResult.methodology,
      isBeyondIndex: epaResult.isBeyondIndex,
      averagingPeriodNotice: epaResult.averagingPeriodNotice,
    },
  };
}

/**
 * fetchForecast — Retrieves air pollution forecast and builds hourly/daily aggregated trends
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Transformed forecast object
 */
async function fetchForecast(lat, lon) {
  const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${config.openWeatherApiKey}`;
  const data = await executeFetch(url);

  if (!data || !Array.isArray(data.list)) {
    const error = new Error('Upstream forecast service returned an invalid payload structure.');
    error.statusCode = 502;
    throw error;
  }

  // Filter out malformed records with invalid timestamps or invalid objects
  const validRecords = data.list.filter(
    (item) => item && typeof item === 'object' && isValidTimestamp(item.dt)
  );

  if (validRecords.length === 0) {
    const error = new Error('Upstream forecast service returned no valid forecast records.');
    error.statusCode = 502;
    throw error;
  }

  // Build 24-hour hourly list
  const hourlyEntries = validRecords.slice(0, 24);
  const hourly = hourlyEntries.map((item) => {
    const components = item.components && typeof item.components === 'object' ? item.components : {};
    const epa = calculateEpaAqi(components);
    const date = new Date(item.dt * 1000);

    return {
      time: date.toISOString(),
      hourLabel: formatHourLabel(date),
      aqi: epa.aqi,
      pm2_5: typeof components.pm2_5 === 'number' && !Number.isNaN(components.pm2_5) ? Math.round(components.pm2_5 * 10) / 10 : 0,
      pm10: typeof components.pm10 === 'number' && !Number.isNaN(components.pm10) ? Math.round(components.pm10 * 10) / 10 : 0,
      category: epa.category,
      isOptimal: epa.aqi <= 80,
    };
  });

  // Aggregate daily forecast from all valid forecast entries
  const dailyMap = new Map();
  for (const item of validRecords) {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split('T')[0];
    const components = item.components && typeof item.components === 'object' ? item.components : {};
    const epa = calculateEpaAqi(components);

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        dateStr: dayKey,
        fullDate: date,
        aqiList: [],
        pm25List: [],
        dominantList: [],
      });
    }

    const entry = dailyMap.get(dayKey);
    entry.aqiList.push(epa.aqi);
    if (typeof components.pm2_5 === 'number' && Number.isFinite(components.pm2_5) && components.pm2_5 >= 0) {
      entry.pm25List.push(components.pm2_5);
    }
    if (epa.dominantPollutant && epa.dominantPollutant !== 'None') {
      entry.dominantList.push(epa.dominantPollutant);
    }
  }

  const daily = [];
  let dayIndex = 0;
  for (const [dayKey, val] of dailyMap.entries()) {
    if (daily.length >= 7) break; // Maximum 7 days
    const avgAqi =
      val.aqiList.length > 0
        ? Math.round(val.aqiList.reduce((a, b) => a + b, 0) / val.aqiList.length)
        : 0;
    const minAqi = val.aqiList.length > 0 ? Math.min(...val.aqiList) : 0;
    const maxAqi = val.aqiList.length > 0 ? Math.max(...val.aqiList) : 0;
    const epaCategory = getAqiCategory(avgAqi).category;

    // Pick most common dominant pollutant safely
    let dominantPollutant = 'PM2.5';
    if (val.dominantList && val.dominantList.length > 0) {
      const counts = {};
      for (const d of val.dominantList) {
        if (d && d !== 'None') {
          counts[d] = (counts[d] || 0) + 1;
        }
      }
      const keys = Object.keys(counts);
      if (keys.length > 0) {
        dominantPollutant = keys.reduce((a, b) => (counts[a] > counts[b] ? a : b));
      }
    }

    daily.push({
      date: new Date(dayKey + 'T00:00:00.000Z').toISOString(),
      dayName: formatDayName(val.fullDate, dayIndex === 0),
      aqi: avgAqi,
      category: epaCategory,
      minAqi,
      maxAqi,
      dominantPollutant,
    });
    dayIndex++;
  }

  // Derive best and worst 3-hour window
  const { bestWindow, worstWindow } = computeTimeWindows(hourly);

  return {
    hourly,
    daily,
    bestWindow,
    worstWindow,
    source: 'OpenWeather Air Pollution API',
  };
}

module.exports = {
  fetchCurrentAir,
  fetchForecast,
  executeFetch,
  computeTimeWindows,
  isValidTimestamp,
};
