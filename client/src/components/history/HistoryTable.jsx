import React from 'react';
import { Card } from '../common/Card';
import { formatDate, formatTime } from '../../utils/formatters';

export default function HistoryTable({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <Card className="p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Activity Log Records</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {history.length} logged sessions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="pb-3 font-semibold">Date & Time</th>
              <th className="pb-3 font-semibold">Location</th>
              <th className="pb-3 font-semibold">Activity</th>
              <th className="pb-3 font-semibold">Duration</th>
              <th className="pb-3 font-semibold">Ambient AQI</th>
              <th className="pb-3 font-semibold text-right">Exposure Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 font-medium text-slate-800 dark:text-slate-300">
                  {formatDate(item.date)} <span className="text-slate-400 dark:text-slate-500 text-[11px] ml-1">{formatTime(item.date)}</span>
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-200">{item.location}</td>
                <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{item.activity}</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">{item.duration} mins</td>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-300">{item.aqi}</td>
                <td className="py-3 text-right">
                  <span
                    className="px-2.5 py-1 rounded-full font-bold text-xs border"
                    style={{
                      backgroundColor:
                        item.exposureScore <= 25
                          ? '#10b98115'
                          : item.exposureScore <= 50
                          ? '#f59e0b15'
                          : item.exposureScore <= 75
                          ? '#f9731615'
                          : '#ef444415',
                      color:
                        item.exposureScore <= 25
                          ? '#059669'
                          : item.exposureScore <= 50
                          ? '#d97706'
                          : item.exposureScore <= 75
                          ? '#ea580c'
                          : '#dc2626',
                      borderColor:
                        item.exposureScore <= 25
                          ? '#10b98130'
                          : item.exposureScore <= 50
                          ? '#f59e0b30'
                          : item.exposureScore <= 75
                          ? '#f9731630'
                          : '#ef444430',
                    }}
                  >
                    {item.exposureScore}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
