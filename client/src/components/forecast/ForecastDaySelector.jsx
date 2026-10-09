import React from 'react';
import { Card } from '../common/Card';
import { getAqiCategory } from '../../utils/aqiUtils';
import { Calendar } from 'lucide-react';

export default function ForecastDaySelector({ dailyData }) {
  if (!dailyData || dailyData.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">7-Day Extended Trend Outlook</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Weekly expected air quality progression</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {dailyData.map((day, idx) => {
          const category = getAqiCategory(day.aqi);
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between text-center gap-2"
            >
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{day.dayName}</div>
              
              <div className="my-1">
                <span
                  className="text-2xl font-black font-sans"
                  style={{ color: category.color }}
                >
                  {day.aqi}
                </span>
                <span className="text-[10px] block text-slate-500 font-mono mt-0.5">
                  {day.minAqi}-{day.maxAqi}
                </span>
              </div>

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate border"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                  borderColor: `${category.color}30`,
                }}
              >
                {category.category}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
