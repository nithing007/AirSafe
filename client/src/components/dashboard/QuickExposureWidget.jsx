import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { ACTIVITIES, DURATIONS, calculateExposure } from '../../utils/exposureEngine';
import { useAirQuality } from '../../context/AirQualityContext';
import { Card } from '../common/Card';

export default function QuickExposureWidget() {
  const navigate = useNavigate();
  const { airData } = useAirQuality();

  const [selectedActivityId, setSelectedActivityId] = useState('running');
  const [selectedDuration, setSelectedDuration] = useState(45);

  const aqi = airData?.aqi || 186;
  const pm25 = airData?.pollutants?.pm2_5 || 78;

  const result = calculateExposure({
    aqi,
    pm25,
    activityId: selectedActivityId,
    durationMinutes: selectedDuration,
  });

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Check Your Activity Exposure</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">See how air quality affects your planned workout or commute</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Activity</label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:border-teal-500 outline-none cursor-pointer"
            >
              {ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {act.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Duration</label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:border-teal-500 outline-none cursor-pointer"
            >
              {DURATIONS.map((dur) => (
                <option key={dur.value} value={dur.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {dur.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculated Result Box */}
        <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
              Estimated Exposure Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className="text-3xl font-extrabold font-sans"
                style={{ color: result.risk.color }}
              >
                {result.score}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ 100</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-1 border"
                style={{
                  backgroundColor: `${result.risk.color}15`,
                  color: result.risk.color,
                  borderColor: `${result.risk.color}30`,
                }}
              >
                {result.risk.level}
              </span>
            </div>
          </div>

          <div className="text-right max-w-[200px]">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium">
              {result.recommendations.actions[0]?.text || result.recommendations.summary}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/exposure')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 border border-teal-200 dark:border-slate-700 transition-all group"
      >
        <span>Full exposure analysis</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </Card>
  );
}
