import React from 'react';
import { Clock, Sun, Moon } from 'lucide-react';
import { Card } from '../common/Card';

export default function BestTimeWindowCard({ forecast }) {
  if (!forecast) return null;

  const { bestWindow, worstWindow } = forecast;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Best Window */}
      <div className="surface-card p-6 border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Best Time for Outdoors</h4>
                <p className="text-xs text-slate-400">Lowest estimated pollution levels</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Avg AQI ~{bestWindow?.averageAqi || 52}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-slate-200">
                {bestWindow?.startHour} – {bestWindow?.endHour}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 uppercase">
              Low Risk
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            {bestWindow?.recommendation}
          </p>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          Ideal for running, cycling, outdoor sports, and airing rooms.
        </div>
      </div>

      {/* Worst Window */}
      <div className="surface-card p-6 border-rose-500/30 bg-rose-950/10 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/25">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Peak Pollution Hours</h4>
                <p className="text-xs text-slate-400">Atmospheric smog & traffic accumulation</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              Avg AQI ~{worstWindow?.averageAqi || 235}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-sm font-bold text-slate-200">
                {worstWindow?.startHour} – {worstWindow?.endHour}
              </span>
            </div>
            <span className="text-xs font-semibold text-rose-400 uppercase">
              High Risk
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            {worstWindow?.recommendation}
          </p>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          Avoid high-intensity outdoor exercise during this window.
        </div>
      </div>
    </div>
  );
}
