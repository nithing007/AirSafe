import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wind, 
  XCircle, 
  Info,
  Shield,
  Sun
} from 'lucide-react';
import { Card } from '../common/Card';

export default function RecommendationCard({ recommendations }) {
  if (!recommendations) return null;

  const { summary, actions, maskRecommendation, saferAlternativeTime } = recommendations;

  const iconMap = {
    CheckCircle2: CheckCircle2,
    Sun: Sun,
    Clock: Clock,
    AlertTriangle: AlertTriangle,
    Shield: Shield,
    XCircle: XCircle,
    ShieldAlert: ShieldAlert,
    Wind: Wind,
  };

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Personalized Advice</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Actionable steps for your planned activity</p>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        {summary}
      </div>

      {/* Direct Action Items */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Suggested Actions
        </h4>
        <div className="space-y-2">
          {actions.map((act, idx) => {
            const IconComponent = iconMap[act.icon] || Info;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <IconComponent className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span>{act.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mask & Time Window guidance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 mb-1">
            <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Mask Guidance
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{maskRecommendation}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Better Time Window
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{saferAlternativeTime}</p>
        </div>
      </div>
    </Card>
  );
}
