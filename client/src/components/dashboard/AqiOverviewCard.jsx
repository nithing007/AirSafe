import React from 'react';
import { RefreshCw, MapPin, Wind, Droplets, Thermometer } from 'lucide-react';
import { getAqiCategory } from '../../utils/aqiUtils';
import { formatTimeAgo } from '../../utils/formatters';
import { useAirQuality } from '../../context/AirQualityContext';
import { Badge } from '../common/Card';

export default function AqiOverviewCard() {
  const { airData, loading, refresh, lastRefreshed } = useAirQuality();

  if (loading && !airData) {
    return (
      <div className="surface-card p-8 animate-pulse space-y-4">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-20 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-4 w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  const aqi = airData?.aqi || 0;
  const category = getAqiCategory(aqi);
  const location = airData?.location;
  const weather = airData?.weather;

  const getHumanFriendlySummary = (aqiVal) => {
    if (aqiVal <= 50) return "Air quality is great today. Perfect for morning runs, outdoor walks, and keeping windows open.";
    if (aqiVal <= 100) return "Air quality is acceptable. Safe for most people, though sensitive individuals should take it easy during heavy workouts.";
    if (aqiVal <= 150) return "Air quality is mildly polluted. If you have asthma or dust allergies, consider limiting prolonged outdoor cardio.";
    if (aqiVal <= 200) return "Air quality is unhealthy right now. It is recommended to reduce heavy outdoor exertion or wear an N95 mask.";
    return "Air pollution is currently severe. Avoid strenuous outdoor activities and keep indoor air filtered.";
  };

  return (
    <div className="surface-card p-6 sm:p-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Location, Numerical AQI, Humanized Guidance */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {location?.name || 'Local Area'}
            </span>
            <Badge variant={aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'warning' : 'danger'}>
              {category.category}
            </Badge>
            {airData?.isSimulated && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/20">
                Simulation Active
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            <div
              className="text-6xl sm:text-7xl font-extrabold tracking-tight font-sans"
              style={{ color: category.color }}
            >
              {aqi}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Air Quality Index (AQI)
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                Main pollutant: <strong className="text-slate-900 dark:text-slate-100">{airData?.dominantPollutant}</strong> ({airData?.pollutants?.pm2_5 || 78} µg/m³)
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {getHumanFriendlySummary(aqi)}
          </p>
        </div>

        {/* Right: Weather & Refresh */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>{weather?.temperature ?? 27}°C</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>{weather?.humidity ?? 65}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
              <Wind className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{weather?.windSpeed ?? 3.4} m/s</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Updated {formatTimeAgo(lastRefreshed)}</span>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600 dark:text-teal-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
