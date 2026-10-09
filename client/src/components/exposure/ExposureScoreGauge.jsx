import React from 'react';
import { Card, Badge } from '../common/Card';

export default function ExposureScoreGauge({ result }) {
  if (!result) return null;

  const { score, risk } = result;

  const getRiskBadge = (level) => {
    switch (level) {
      case 'LOW':
        return 'good';
      case 'MODERATE':
        return 'moderate';
      case 'HIGH':
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <Card className="text-center p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Personal Exposure Result
        </span>
        <Badge variant={getRiskBadge(risk.level)}>
          {risk.level} RISK
        </Badge>
      </div>

      {/* Clean Circular Gauge */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#e2e8f0"
              className="dark:stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={risk.color}
              strokeWidth="7"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (score / 100) * 251.2}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span
              className="text-4xl font-extrabold tracking-tight font-sans"
              style={{ color: risk.color }}
            >
              {score}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              out of 100
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{risk.title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          {risk.summary}
        </p>

        {/* Clean Risk Scale */}
        <div className="pt-3">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 opacity-90" />
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 px-1">
            <span>Low (0-25)</span>
            <span>Moderate (26-50)</span>
            <span>High (51-75)</span>
            <span>Very High (76+)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
