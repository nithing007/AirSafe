/**
 * AirSafe Exposure Calculation Engine & Recommendation Rules
 * 
 * Formula:
 * Exposure Score = (AQI Score * 0.45) + (PM2.5 Score * 0.30) + (Duration Factor * 0.15) + (Activity Factor * 0.10)
 * Scaled and clamped to 0 - 100.
 */

export const ACTIVITIES = [
  { id: 'sitting_indoor', label: 'Sitting / Resting Indoors', multiplier: 0.2, icon: 'Home', indoor: true },
  { id: 'indoor_work', label: 'Office / Indoor Light Activity', multiplier: 0.3, icon: 'Briefcase', indoor: true },
  { id: 'walking', label: 'Walking / Commuting', multiplier: 0.6, icon: 'Footprints', indoor: false },
  { id: 'cycling', label: 'Biking / Cycling', multiplier: 0.8, icon: 'Bike', indoor: false },
  { id: 'running', label: 'Running / Jogging', multiplier: 1.0, icon: 'Zap', indoor: false },
  { id: 'outdoor_work', label: 'Outdoor Labor / Delivery', multiplier: 1.0, icon: 'HardHat', indoor: false },
  { id: 'heavy_sports', label: 'Heavy Outdoor Sports (Football/Cardio)', multiplier: 1.2, icon: 'Flame', indoor: false },
];

export const DURATIONS = [
  { value: 15, label: '15 mins', factor: 0.3 },
  { value: 30, label: '30 mins', factor: 0.5 },
  { value: 45, label: '45 mins', factor: 0.7 },
  { value: 60, label: '1 Hour', factor: 1.0 },
  { value: 90, label: '1.5 Hours', factor: 1.3 },
  { value: 120, label: '2 Hours', factor: 1.6 },
  { value: 180, label: '3+ Hours', factor: 2.0 },
];

export const RISK_LEVELS = [
  {
    min: 0,
    max: 25,
    level: 'LOW',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'Minimal Exposure Impact',
    summary: 'The planned activity has negligible pollution exposure risk. Ideal conditions for outdoor exertion.',
  },
  {
    min: 26,
    max: 50,
    level: 'MODERATE',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: 'Moderate Exposure Impact',
    summary: 'Acceptable for most individuals. Sensitive individuals may consider moderating heavy workouts.',
  },
  {
    min: 51,
    max: 75,
    level: 'HIGH',
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    title: 'High Inhalation Exposure Risk',
    summary: 'Elevated particle inhalation due to air pollution combined with activity duration and respiration rate.',
  },
  {
    min: 76,
    max: 100,
    level: 'VERY HIGH',
    color: '#ef4444',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    title: 'Critical Exposure Alert',
    summary: 'Severe cumulative inhalation risk. High risk of respiratory strain, asthma triggers, and blood-stream PM absorption.',
  }
];

export function getRiskClassification(score) {
  const cleanScore = Math.min(Math.max(Math.round(score), 0), 100);
  if (cleanScore <= 25) return RISK_LEVELS[0];
  if (cleanScore <= 50) return RISK_LEVELS[1];
  if (cleanScore <= 75) return RISK_LEVELS[2];
  return RISK_LEVELS[3];
}

/**
 * Calculates exposure score on client side (matching backend algorithm)
 */
export function calculateExposure({
  aqi = 100,
  pm25 = 35,
  activityId = 'walking',
  durationMinutes = 60,
}) {
  const selectedActivity = ACTIVITIES.find(a => a.id === activityId) || ACTIVITIES[2];
  const actMultiplier = selectedActivity.multiplier;

  // Normalized AQI component (0 - 500 mapped to 0 - 100)
  const aqiComponent = Math.min((aqi / 300) * 100, 100);

  // Normalized PM2.5 component (WHO baseline is 15µg/m³, dangerous > 150)
  const pm25Component = Math.min((pm25 / 120) * 100, 100);

  // Duration factor (scaled around 60 mins)
  const durationFactor = Math.min((durationMinutes / 120) * 100, 100);

  // Activity respiration factor
  const activityComponent = Math.min(actMultiplier * 80, 100);

  // Weighted calculation
  const rawScore = 
    (aqiComponent * 0.45) +
    (pm25Component * 0.30) +
    (durationFactor * 0.15 * actMultiplier) +
    (activityComponent * 0.10);

  const finalScore = Math.min(Math.max(Math.round(rawScore), 5), 100);
  const risk = getRiskClassification(finalScore);

  // Breakdown numbers for visualization
  const breakdown = {
    aqiContribution: Math.round(aqiComponent * 0.45),
    pm25Contribution: Math.round(pm25Component * 0.30),
    durationContribution: Math.round(durationFactor * 0.15 * actMultiplier),
    activityContribution: Math.round(activityComponent * 0.10),
  };

  // Generate explainable recommendations
  const recommendations = generateRecommendations({
    score: finalScore,
    risk: risk.level,
    activity: selectedActivity,
    duration: durationMinutes,
    aqi,
    pm25
  });

  return {
    score: finalScore,
    risk,
    breakdown,
    activity: selectedActivity,
    duration: durationMinutes,
    aqi,
    pm25,
    recommendations,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Generate actionable & explainable recommendations
 */
export function generateRecommendations({ score, risk, activity, duration, aqi, pm25 }) {
  const actions = [];
  const tips = [];
  let summary = '';
  let maskRecommendation = 'No mask necessary in normal conditions.';

  if (score <= 25) {
    summary = `Conditions are great for ${duration} mins of ${activity.label.toLowerCase()}. Enjoy your outdoor session!`;
    actions.push({ icon: 'CheckCircle2', text: 'Safe to proceed with planned outdoor activity', type: 'success' });
    actions.push({ icon: 'Sun', text: 'Good natural ventilation for homes and offices', type: 'info' });
    maskRecommendation = 'Not needed.';
  } else if (score <= 50) {
    summary = `Moderate exposure score (${score}/100). Safe for general activity, though sensitive individuals should avoid strenuous long-distance cardio.`;
    actions.push({ icon: 'Clock', text: `Keep outdoor duration under ${Math.min(duration, 45)} mins if breathing feels labored`, type: 'warning' });
    actions.push({ icon: 'Droplets', text: 'Stay hydrated to help clear airway particles', type: 'info' });
    maskRecommendation = 'Optional for sensitive groups (asthma/allergies).';
  } else if (score <= 75) {
    summary = `High estimated exposure (${score}/100) for a ${duration}-min ${activity.label.toLowerCase()} during an AQI of ${aqi}. High particulate inhalation rate detected.`;
    actions.push({ icon: 'AlertTriangle', text: 'Consider rescheduling high-intensity workout to early morning window', type: 'danger' });
    actions.push({ icon: 'Home', text: 'Substitute with indoor treadmill/gym or yoga workout', type: 'warning' });
    actions.push({ icon: 'Shield', text: 'Wear a well-fitted N95 / FFP2 mask if transit is unavoidable', type: 'warning' });
    maskRecommendation = 'N95 / FFP2 mask strongly recommended if outdoors.';
    tips.push('Wash face and rinse eyes with clean water upon returning indoors.');
  } else {
    summary = `CRITICAL EXPOSURE RISK (${score}/100). Deep inhalation of toxic PM2.5 particles at ${pm25} µg/m³ during strenuous activity poses acute cardiovascular & respiratory stress.`;
    actions.push({ icon: 'XCircle', text: `Cancel or move ${activity.label.toLowerCase()} indoors immediately`, type: 'danger' });
    actions.push({ icon: 'ShieldAlert', text: 'Mandatory N95 respirator if stepping outside', type: 'danger' });
    actions.push({ icon: 'Wind', text: 'Keep windows sealed and turn on HEPA air purifiers', type: 'warning' });
    maskRecommendation = 'N95/KN95 respirator mandatory.';
    tips.push('Avoid deep breathing or high cardiovascular strain outdoors in this air quality.');
    tips.push('Children, elderly, and respiratory patients must strictly stay indoors.');
  }

  return {
    summary,
    actions,
    tips,
    maskRecommendation,
    saferAlternativeTime: 'Best upcoming window: 06:00 AM – 08:30 AM (Estimated AQI: 48 - Good)',
  };
}
