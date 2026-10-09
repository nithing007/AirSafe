import React from 'react';
import { School, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { Card, Badge } from '../common/Card';
import { MOCK_SCHOOL_STATUS } from '../../services/mockData';
import { useAirQuality } from '../../context/AirQualityContext';

export default function SchoolSafeModeCard() {
  const { airData } = useAirQuality();
  const currentAqi = airData?.aqi || 186;
  const isBadAir = currentAqi > 150;

  const schoolStatus = {
    ...MOCK_SCHOOL_STATUS,
    currentAqi,
    statusLevel: currentAqi > 200 ? 'Emergency Restriction' : currentAqi > 100 ? 'High Alert' : 'Normal Conditions',
  };

  const directives = [
    {
      title: 'Morning Assembly',
      allowed: currentAqi <= 100,
      detail: currentAqi > 100 ? 'Hold assembly inside classrooms or broadcast over audio PA' : 'Permitted outdoors',
    },
    {
      title: 'Physical Education & Sports',
      allowed: currentAqi <= 100,
      detail: currentAqi > 100 ? 'Postpone outdoor sports. Switch to indoor wellness/tactical sessions' : 'Outdoor sports permitted',
    },
    {
      title: 'Outdoor Recess & Lunch',
      allowed: currentAqi <= 150,
      detail: currentAqi > 150 ? 'Students should stay in sheltered indoor halls & cafeteria' : 'Outdoor recess permitted',
    },
    {
      title: 'Classroom Windows & Ventilation',
      allowed: true,
      detail: currentAqi > 150 ? 'Keep road-facing windows closed; run air filtration where available' : 'Natural window airflow fine',
    },
    {
      title: 'Student Commute Masks',
      allowed: currentAqi > 150,
      detail: currentAqi > 150 ? 'Recommend N95 masks for students walking or cycling to school' : 'Optional',
    },
  ];

  return (
    <Card className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/25">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">{schoolStatus.schoolName}</h3>
              <Badge variant={isBadAir ? 'danger' : 'good'}>
                {schoolStatus.statusLevel}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Automated student safety guidelines based on today's air quality</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">Campus Station AQI</span>
          <div className="text-2xl font-bold text-rose-400 font-sans">{currentAqi}</div>
        </div>
      </div>

      {/* Directives */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Campus Activity Guidelines
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {directives.map((dir, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                dir.allowed
                  ? 'bg-emerald-950/15 border-emerald-500/20'
                  : 'bg-rose-950/15 border-rose-500/20'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg mt-0.5 ${
                  dir.allowed ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dir.allowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-200">{dir.title}</h5>
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      dir.allowed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {dir.allowed ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{dir.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-teal-400" /> Compliant with National School Air Safety Standards
        </span>
        <span className="text-[11px] text-teal-400 font-medium">Auto-updated</span>
      </div>
    </Card>
  );
}
