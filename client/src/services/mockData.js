/**
 * Comprehensive Mock Data for AirSafe Frontend
 * Realistic data matching OpenWeather Air Pollution API schemas and hackathon specs.
 */

export const MOCK_LOCATIONS = [
  {
    id: 'coimbatore',
    name: 'Coimbatore, Tamil Nadu',
    latitude: 11.0168,
    longitude: 76.9558,
    country: 'India',
    defaultAqi: 186,
    dominantPollutant: 'PM2.5',
    temp: 28,
    humidity: 65,
    windSpeed: 3.4,
  },
  {
    id: 'delhi',
    name: 'New Delhi, NCR',
    latitude: 28.6139,
    longitude: 77.2090,
    country: 'India',
    defaultAqi: 285,
    dominantPollutant: 'PM2.5',
    temp: 24,
    humidity: 58,
    windSpeed: 2.1,
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru, Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    country: 'India',
    defaultAqi: 74,
    dominantPollutant: 'PM10',
    temp: 22,
    humidity: 70,
    windSpeed: 4.2,
  },
  {
    id: 'mumbai',
    name: 'Mumbai, Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    country: 'India',
    defaultAqi: 132,
    dominantPollutant: 'PM2.5',
    temp: 31,
    humidity: 78,
    windSpeed: 5.1,
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad, Telangana',
    latitude: 17.3850,
    longitude: 78.4867,
    country: 'India',
    defaultAqi: 98,
    dominantPollutant: 'NO₂',
    temp: 27,
    humidity: 62,
    windSpeed: 3.8,
  }
];

export function generateMockCurrentAir(location = MOCK_LOCATIONS[0], aqiOverride = null) {
  const aqi = aqiOverride !== null ? aqiOverride : location.defaultAqi;
  
  // Synthesize realistic pollutant ratios based on AQI
  const pm25 = Math.round(aqi * 0.42 + 5);
  const pm10 = Math.round(aqi * 0.61 + 10);
  const no2 = Math.round(aqi * 0.22 + 4);
  const o3 = Math.round(aqi * 0.33 + 12);
  const so2 = Math.round(aqi * 0.08 + 2);
  const co = Number((aqi * 0.008 + 0.4).toFixed(1));

  return {
    location: {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      country: location.country,
    },
    aqi,
    aqiCategory: getCategoryName(aqi),
    dominantPollutant: location.dominantPollutant || 'PM2.5',
    pollutants: {
      pm2_5: pm25,
      pm10: pm10,
      no2: no2,
      o3: o3,
      so2: so2,
      co: co,
    },
    weather: {
      temperature: location.temp || 26,
      humidity: location.humidity || 65,
      windSpeed: location.windSpeed || 3.5,
      condition: aqi > 150 ? 'Haze / Poor Visibility' : 'Partly Cloudy',
    },
    timestamp: new Date().toISOString(),
    isSimulated: false,
    source: 'OpenWeather Air Quality API (Mock/Live Ready)',
  };
}

function getCategoryName(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function generateMockForecast(baseAqi = 186) {
  const hourly = [];
  const now = new Date();
  
  // Generate 24 hours of hourly projections with realistic morning dip & evening rush spike
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() + i * 3600 * 1000);
    const hour = time.getHours();
    
    // diurnal pattern: clean in early morning (5-8am), spikes at evening rush (6-9pm)
    let diurnalFactor = 1.0;
    if (hour >= 5 && hour <= 8) diurnalFactor = 0.55;
    else if (hour >= 9 && hour <= 12) diurnalFactor = 0.85;
    else if (hour >= 13 && hour <= 16) diurnalFactor = 0.75;
    else if (hour >= 17 && hour <= 21) diurnalFactor = 1.25;
    else diurnalFactor = 1.05;

    const projectedAqi = Math.max(25, Math.round(baseAqi * diurnalFactor + (Math.sin(i) * 8)));
    const pm25 = Math.round(projectedAqi * 0.42);
    
    hourly.push({
      time: time.toISOString(),
      hourLabel: time.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      aqi: projectedAqi,
      pm2_5: pm25,
      pm10: Math.round(projectedAqi * 0.6),
      category: getCategoryName(projectedAqi),
      isOptimal: projectedAqi <= 80,
    });
  }

  // 7-day forecast
  const daily = [];
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(now.getTime() + d * 86400 * 1000);
    const dayAqi = Math.max(30, Math.round(baseAqi * (0.8 + Math.sin(d) * 0.3)));
    daily.push({
      date: dayDate.toISOString(),
      dayName: d === 0 ? 'Today' : dayDate.toLocaleDateString([], { weekday: 'short' }),
      aqi: dayAqi,
      category: getCategoryName(dayAqi),
      minAqi: Math.round(dayAqi * 0.7),
      maxAqi: Math.round(dayAqi * 1.3),
      dominantPollutant: 'PM2.5',
    });
  }

  return {
    hourly,
    daily,
    bestWindow: {
      startHour: '05:30 AM',
      endHour: '08:30 AM',
      averageAqi: 52,
      riskLevel: 'LOW',
      recommendation: 'Ideal time for morning runs, cycling, school commute, and airing out rooms.',
    },
    worstWindow: {
      startHour: '06:00 PM',
      endHour: '09:30 PM',
      averageAqi: 235,
      riskLevel: 'VERY HIGH',
      recommendation: 'Avoid outdoor workouts; high traffic emissions combined with atmospheric inversion.',
    }
  };
}

export const MOCK_HISTORY = [
  { id: 'h1', date: '2026-10-08T07:15:00Z', location: 'Coimbatore', activity: 'Running', duration: 45, aqi: 165, exposureScore: 68, risk: 'HIGH' },
  { id: 'h2', date: '2026-10-07T18:00:00Z', location: 'Coimbatore', activity: 'Walking', duration: 30, aqi: 195, exposureScore: 62, risk: 'HIGH' },
  { id: 'h3', date: '2026-10-06T06:30:00Z', location: 'Coimbatore', activity: 'Cycling', duration: 60, aqi: 62, exposureScore: 32, risk: 'MODERATE' },
  { id: 'h4', date: '2026-10-05T08:00:00Z', location: 'Coimbatore', activity: 'Outdoor Labor', duration: 120, aqi: 140, exposureScore: 78, risk: 'VERY HIGH' },
  { id: 'h5', date: '2026-10-04T19:30:00Z', location: 'Coimbatore', activity: 'Sitting Indoors', duration: 60, aqi: 180, exposureScore: 22, risk: 'LOW' },
];

export const MOCK_ROUTES = [
  {
    id: 'route-green',
    name: 'Route A: Park & Lake Perimeter Bypass',
    isRecommended: true,
    distanceKm: 9.2,
    durationMin: 32,
    estimatedExposureScore: 28,
    exposureRisk: 'LOW',
    avgAqi: 65,
    highlights: ['70% green canopy coverage', 'Bypasses major industrial arterial roads', 'Dedicated bicycle/pedestrian lane'],
    coordinates: [
      [11.0168, 76.9558],
      [11.0210, 76.9620],
      [11.0280, 76.9690],
      [11.0350, 76.9740],
      [11.0420, 76.9800],
    ],
    color: '#10b981',
  },
  {
    id: 'route-direct',
    name: 'Route B: Direct Highway & Industrial Corridor',
    isRecommended: false,
    distanceKm: 7.8,
    durationMin: 26,
    estimatedExposureScore: 76,
    exposureRisk: 'VERY HIGH',
    avgAqi: 215,
    highlights: ['Shortest direct path', 'Heavy diesel truck traffic', 'High ground-level NO₂ & PM2.5 concentrations'],
    coordinates: [
      [11.0168, 76.9558],
      [11.0200, 76.9580],
      [11.0250, 76.9620],
      [11.0320, 76.9680],
      [11.0420, 76.9800],
    ],
    color: '#ef4444',
  }
];

export const MOCK_SCHOOL_STATUS = {
  schoolName: 'Coimbatore Model Higher Secondary School',
  currentAqi: 192,
  statusLevel: 'HIGH_ALERT',
  directives: {
    morningAssembly: { allowed: false, message: 'Move morning assembly indoors or broadcast via PA system.' },
    sportsAndPT: { allowed: false, message: 'Postpone outdoor PE classes. Replace with indoor tactical / wellness sessions.' },
    recessOutdoor: { allowed: false, message: 'Keep students in sheltered classrooms during lunch and breaks.' },
    classroomVentilation: { allowed: true, message: 'Keep windows closed on highway-facing sides. Use air circulators.' },
    masksDistribution: { allowed: true, message: 'Recommended N95 masks for students commuting via bicycle or walking.' },
  },
  lastUpdated: new Date().toISOString(),
};
