import React, { useState } from 'react';
import { 
  Footprints, 
  Bike, 
  Zap, 
  HardHat, 
  Home, 
  Briefcase, 
  Flame, 
  MapPin 
} from 'lucide-react';
import { ACTIVITIES, DURATIONS } from '../../utils/exposureEngine';
import { useAirQuality } from '../../context/AirQualityContext';
import { Card, Button } from '../common/Card';

export default function ExposureCalculatorForm({ onCalculate, isCalculating }) {
  const { airData, selectedLocation } = useAirQuality();

  const [selectedActivity, setSelectedActivity] = useState('running');
  const [duration, setDuration] = useState(45);
  const [customAqi, setCustomAqi] = useState(airData?.aqi || 186);
  const [customPm25, setCustomPm25] = useState(airData?.pollutants?.pm2_5 || 78);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconMap = {
    Home: Home,
    Briefcase: Briefcase,
    Footprints: Footprints,
    Bike: Bike,
    Zap: Zap,
    HardHat: HardHat,
    Flame: Flame,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate({
      activity: selectedActivity,
      duration: Number(duration),
      aqi: showAdvanced ? Number(customAqi) : (airData?.aqi || 186),
      pm25: showAdvanced ? Number(customPm25) : (airData?.pollutants?.pm2_5 || 78),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    });
  };

  return (
    <Card className="p-6 sm:p-7">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">1. Select Your Activity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Different activities increase your breathing rate and particle intake</p>
        </div>

        {/* Activity Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {ACTIVITIES.map((act) => {
            const IconComp = iconMap[act.icon] || Zap;
            const isSelected = selectedActivity === act.id;

            return (
              <button
                type="button"
                key={act.id}
                onClick={() => setSelectedActivity(act.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-slate-800 border-teal-500 text-teal-900 dark:text-slate-100 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'bg-slate-200/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-200">{act.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {act.indoor ? 'Indoor' : 'Outdoor'} • {act.multiplier}x breathing
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Duration */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-200">2. Planned Duration</span>
            <span className="font-bold text-teal-600 dark:text-teal-300">{duration} minutes</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((dur) => (
              <button
                type="button"
                key={dur.value}
                onClick={() => setDuration(dur.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  duration === dur.value
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="10"
            max="180"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-2"
          />
        </div>

        {/* Location / Sensor info */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {selectedLocation.name}
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              {showAdvanced ? 'Use live air data' : 'Adjust AQI manually'}
            </button>
          </div>

          {!showAdvanced ? (
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Using live sensor air: <strong>AQI {airData?.aqi || 186}</strong> ({airData?.dominantPollutant} {airData?.pollutants?.pm2_5 || 78} µg/m³)
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Custom AQI</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={customAqi}
                  onChange={(e) => setCustomAqi(e.target.value)}
                  className="w-full app-input py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Custom PM2.5</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={customPm25}
                  onChange={(e) => setCustomPm25(e.target.value)}
                  className="w-full app-input py-1.5 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isCalculating}
        >
          {isCalculating ? 'Estimating...' : 'Calculate Exposure Score'}
        </Button>
      </form>
    </Card>
  );
}
