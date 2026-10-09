import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';
import { useAirQuality } from '../../context/AirQualityContext';
import { Card } from '../common/Card';

export default function RecommendationSummaryCard() {
  const { airData } = useAirQuality();
  const aqi = airData?.aqi || 186;

  const getAdvisoryItems = (aqiVal) => {
    if (aqiVal <= 50) {
      return [
        { icon: CheckCircle2, text: 'Great for jogging, cycling, and outdoor walks', color: 'text-emerald-600 dark:text-emerald-400' },
        { icon: CheckCircle2, text: 'Keep windows open for fresh room ventilation', color: 'text-emerald-600 dark:text-emerald-400' },
        { icon: CheckCircle2, text: 'No face mask needed', color: 'text-emerald-600 dark:text-emerald-400' },
      ];
    }
    if (aqiVal <= 100) {
      return [
        { icon: CheckCircle2, text: 'Safe for daily commutes and general outdoor work', color: 'text-amber-600 dark:text-amber-400' },
        { icon: Info, text: 'Sensitive people (asthma) should avoid intense long runs', color: 'text-amber-600 dark:text-amber-400' },
        { icon: CheckCircle2, text: 'Normal room ventilation is fine today', color: 'text-amber-600 dark:text-amber-400' },
      ];
    }
    if (aqiVal <= 200) {
      return [
        { icon: AlertTriangle, text: 'Shorten intense cardio workouts or exercise indoors', color: 'text-orange-600 dark:text-orange-400' },
        { icon: Shield, text: 'Consider wearing an N95 mask during heavy traffic commutes', color: 'text-orange-600 dark:text-orange-400' },
        { icon: Clock, text: 'Best outdoor window is early morning (6:00 – 8:00 AM)', color: 'text-orange-600 dark:text-orange-400' },
      ];
    }
    return [
      { icon: XCircle, text: 'Avoid outdoor exercise and sports today', color: 'text-rose-600 dark:text-rose-400' },
      { icon: Shield, text: 'Keep windows closed and run air purifiers indoors', color: 'text-rose-600 dark:text-rose-400' },
      { icon: AlertTriangle, text: 'Wear a well-fitted mask if stepping outside', color: 'text-rose-600 dark:text-rose-400' },
    ];
  };

  const items = getAdvisoryItems(aqi);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recommended Actions Today</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Simple precautions based on current air</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 my-2">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Tailored for your current location</span>
        <span className="text-teal-600 dark:text-teal-400 font-semibold">Updated live</span>
      </div>
    </Card>
  );
}
