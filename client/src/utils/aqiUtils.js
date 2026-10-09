/**
 * Utility functions for AQI levels, colors, and health indicators
 */

export const AQI_LEVELS = [
  {
    min: 0,
    max: 50,
    category: 'Good',
    code: 'good',
    color: '#10b981', // Emerald-500
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    icon: 'smile',
    actionText: 'Great day for outdoor activities and ventilation.',
  },
  {
    min: 51,
    max: 100,
    category: 'Moderate',
    code: 'moderate',
    color: '#f59e0b', // Amber-500
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Air quality is acceptable; however, sensitive individuals may experience minor irritation.',
    icon: 'meh',
    actionText: 'Safe for most; unusually sensitive people should watch for symptoms.',
  },
  {
    min: 101,
    max: 150,
    category: 'Unhealthy for Sensitive Groups',
    code: 'unhealthy-sensitive',
    color: '#f97316', // Orange-500
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    description: 'Members of sensitive groups (asthma, children, elderly) may experience health effects.',
    icon: 'alert-triangle',
    actionText: 'Sensitive groups should reduce prolonged outdoor exertion.',
  },
  {
    min: 151,
    max: 200,
    category: 'Unhealthy',
    code: 'unhealthy',
    color: '#ef4444', // Red-500
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    description: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
    icon: 'shield-alert',
    actionText: 'Avoid prolonged outdoor exertion. Wear N95 masks if commuting.',
  },
  {
    min: 201,
    max: 300,
    category: 'Very Unhealthy',
    code: 'very-unhealthy',
    color: '#8b5cf6', // Violet-500
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Health alert: The risk of health effects is increased for everyone in the population.',
    icon: 'alert-octagon',
    actionText: 'Avoid all outdoor physical activities. Keep indoor air filtered.',
  },
  {
    min: 301,
    max: 500,
    category: 'Hazardous',
    code: 'hazardous',
    color: '#7f1d1d', // Red-900 / Maroon
    badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-700/50',
    description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
    icon: 'skull',
    actionText: 'Emergency condition. Stay indoors, seal windows, run HEPA purifiers.',
  }
];

export function getAqiCategory(aqiValue = 0) {
  const num = Number(aqiValue) || 0;
  if (num <= 50) return AQI_LEVELS[0];
  if (num <= 100) return AQI_LEVELS[1];
  if (num <= 150) return AQI_LEVELS[2];
  if (num <= 200) return AQI_LEVELS[3];
  if (num <= 300) return AQI_LEVELS[4];
  return AQI_LEVELS[5];
}

export const POLLUTANT_INFO = {
  pm2_5: {
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'µg/m³',
    standard: 15, // WHO 24h guideline
    description: 'Tiny particles (≤2.5µm) that can penetrate deep into the lungs and bloodstream.',
  },
  pm10: {
    name: 'PM10',
    fullName: 'Coarse Particulate Matter',
    unit: 'µg/m³',
    standard: 45,
    description: 'Inhalable dust, pollen, and mold particles with diameters 10µm and smaller.',
  },
  no2: {
    name: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    standard: 25,
    description: 'Gaseous air pollutant primarily from vehicle emissions and power plants.',
  },
  o3: {
    name: 'O₃',
    fullName: 'Ground-level Ozone',
    unit: 'µg/m³',
    standard: 100,
    description: 'Formed when pollutants emit photochemical reactions in sunlight; triggers asthma.',
  },
  so2: {
    name: 'SO₂',
    fullName: 'Sulfur Dioxide',
    unit: 'µg/m³',
    standard: 40,
    description: 'Produced by burning fossil fuels; causes throat and lung irritation.',
  },
  co: {
    name: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'mg/m³',
    standard: 4,
    description: 'Colorless, odorless gas emitted by combustion engines and heating systems.',
  }
};
