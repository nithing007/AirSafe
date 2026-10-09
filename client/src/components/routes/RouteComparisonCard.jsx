import React from 'react';
import { Check, AlertTriangle, Navigation } from 'lucide-react';

export default function RouteComparisonCard({ routes, selectedRouteId, onSelectRoute }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {routes.map((route) => {
        const isSelected = selectedRouteId === route.id;
        const isGreen = route.isRecommended;

        return (
          <div
            key={route.id}
            onClick={() => onSelectRoute && onSelectRoute(route.id)}
            className={`cursor-pointer surface-card p-6 flex flex-col justify-between space-y-4 ${
              isSelected
                ? isGreen
                  ? 'border-emerald-500/80 bg-emerald-950/15'
                  : 'border-rose-500/80 bg-rose-950/15'
                : 'hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isGreen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{route.name}</h4>
                    <span className="text-xs text-slate-400">
                      {route.distanceKm} km • ~{route.durationMin} mins
                    </span>
                  </div>
                </div>

                {isGreen && (
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/25">
                    Recommended
                  </span>
                )}
              </div>

              {/* Exposure Score */}
              <div className="my-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Estimated Inhaled Exposure</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: route.color }}
                    >
                      {route.estimatedExposureScore}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase ml-1"
                      style={{
                        backgroundColor: `${route.color}15`,
                        color: route.color,
                      }}
                    >
                      {route.exposureRisk}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Avg AQI</span>
                  <p className="text-base font-bold text-slate-200">{route.avgAqi}</p>
                </div>
              </div>

              {/* Factors */}
              <div className="space-y-1.5">
                {route.highlights.map((hl, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    {isGreen ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>{isGreen ? '🌱 ~60% less particle inhalation' : '⚠️ Heavy truck exhaust corridor'}</span>
              <span className="text-teal-400 font-medium">{isSelected ? 'Selected' : 'Click to view'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
