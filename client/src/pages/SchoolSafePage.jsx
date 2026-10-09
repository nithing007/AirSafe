import React from 'react';
import SchoolSafeModeCard from '../components/school/SchoolSafeModeCard';
import { Card } from '../components/common/Card';

export default function SchoolSafePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          School Air Safety Directives
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Automated safety directives for school administrators, sports coaches, and staff to protect students during high-pollution days.
        </p>
      </div>

      {/* School Status Card */}
      <SchoolSafeModeCard />

      {/* Protocol Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">PE & Sports Safeguard</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When AQI exceeds 100, outdoor physical education and competitive endurance sports are automatically flagged for suspension to prevent high-rate lung particulate deposition in children.
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assembly Guidelines</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Morning assemblies coincide with diurnal pollution inversions. AirSafe triggers audio-in-classroom protocols whenever morning air hits the Sensitive threshold.
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Classroom Air Management</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Provides direction on when to seal roadside windows and run air purifiers versus when natural cross-ventilation is safe for clean oxygen flow.
          </p>
        </Card>
      </div>
    </div>
  );
}
