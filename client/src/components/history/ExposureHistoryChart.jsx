import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card } from '../common/Card';
import { formatDate } from '../../utils/formatters';

export default function ExposureHistoryChart({ history }) {
  if (!history || history.length === 0) return null;

  const data = [...history].reverse().map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const getBarColor = (score) => {
    if (score <= 25) return '#10b981';
    if (score <= 50) return '#f59e0b';
    if (score <= 75) return '#f97316';
    return '#ef4444';
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cumulative Daily Inhalation Trend</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track your daily exposure load over past workouts and commutes</p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Past 5 Recorded Events</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-200">{d.activity} ({d.duration} mins)</p>
                      <p className="text-slate-600 dark:text-slate-300">Exposure Score: <strong style={{ color: getBarColor(d.exposureScore) }}>{d.exposureScore}/100</strong></p>
                      <p className="text-slate-500 dark:text-slate-400">Ambient AQI: {d.aqi}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" />
            <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
            <Bar dataKey="exposureScore" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.exposureScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
