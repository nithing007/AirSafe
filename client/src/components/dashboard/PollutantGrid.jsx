import React from 'react';
import { POLLUTANT_INFO } from '../../utils/aqiUtils';
import { useAirQuality } from '../../context/AirQualityContext';

export default function PollutantGrid() {
  const { airData, loading } = useAirQuality();

  if (loading && !airData) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-28 bg-slate-200 dark:bg-slate-900/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const pollutants = airData?.pollutants || {
    pm2_5: 78,
    pm10: 112,
    no2: 42,
    o3: 61,
    so2: 12,
    co: 0.8,
  };

  const pollutantKeys = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Air Pollutant Breakdown
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Standard safe limits shown</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {pollutantKeys.map((key) => {
          const info = POLLUTANT_INFO[key];
          const value = pollutants[key] ?? 0;
          const ratio = Math.round((value / info.standard) * 100);
          const isElevated = ratio > 100;

          return (
            <div
              key={key}
              className="surface-card p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{info.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isElevated 
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/20' 
                    : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/20'
                }`}>
                  {isElevated ? 'High' : 'Normal'}
                </span>
              </div>

              <div className="my-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1 font-medium">{info.unit}</span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={info.fullName}>
                {info.fullName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
