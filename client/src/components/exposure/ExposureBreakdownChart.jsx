import React from 'react';
import { Card } from '../common/Card';
import { Info } from 'lucide-react';

export default function ExposureBreakdownChart({ breakdown }) {
  if (!breakdown) return null;

  const data = [
    { name: 'Air Pollution Level', value: breakdown.aqiContribution, max: 45, color: '#f59e0b', desc: 'Current outdoor smog intensity' },
    { name: 'PM2.5 Micro-particles', value: breakdown.pm25Contribution, max: 30, color: '#f97316', desc: 'Fine lung-penetrating dust' },
    { name: 'Time Spent Outdoors', value: breakdown.durationContribution, max: 15, color: '#0d9488', desc: 'Cumulative minutes of exposure' },
    { name: 'Breathing Effort', value: breakdown.activityContribution, max: 10, color: '#8b5cf6', desc: 'Increased respiration rate' },
  ];

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">What contributes to this score?</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Clear breakdown of how your score was calculated</p>
      </div>

      <div className="space-y-3.5 my-2">
        {data.map((item, idx) => {
          const pctOfMax = Math.min(Math.round((item.value / item.max) * 100), 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <span className="text-[10px] text-slate-500 ml-1.5 hidden sm:inline font-normal">({item.desc})</span>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {item.value} / {item.max} pts
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pctOfMax}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
        <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>Higher workout intensity and longer outdoor duration increase inhaled particulate volume.</span>
      </div>
    </Card>
  );
}
