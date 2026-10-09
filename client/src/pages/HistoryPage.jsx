import React, { useState, useEffect } from 'react';
import ExposureHistoryChart from '../components/history/ExposureHistoryChart';
import HistoryTable from '../components/history/HistoryTable';
import { exposureService } from '../services/exposureService';
import { LoadingSkeleton, Card } from '../components/common/Card';
import { History, TrendingUp, ShieldCheck } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await exposureService.getExposureHistory();
        setHistory(res.data);
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const averageScore = history.length
    ? Math.round(history.reduce((acc, curr) => acc + curr.exposureScore, 0) / history.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Personal Exposure History & Logs
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review your cumulative exposure burden over time and monitor improvements in your outdoor planning.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Average Exposure Score
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">{averageScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Across all recorded sessions</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Sessions Logged
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{history.length}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +2 this week
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Outdoor & indoor sessions</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Exposure Avoidance Rating
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">84%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Optimal
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Peak pollution avoided</span>
        </Card>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-80 w-full" />
      ) : (
        <div className="space-y-6">
          <ExposureHistoryChart history={history} />
          <HistoryTable history={history} />
        </div>
      )}
    </div>
  );
}
