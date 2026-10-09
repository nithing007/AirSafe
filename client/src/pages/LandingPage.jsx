import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Activity, 
  Clock, 
  Navigation, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Heart,
  School,
  MapPin
} from 'lucide-react';
import { Button, Card, Badge } from '../components/common/Card';
import { useAirQuality } from '../context/AirQualityContext';
import { getAqiCategory } from '../utils/aqiUtils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { airData, selectedLocation } = useAirQuality();
  const aqi = airData?.aqi || 186;
  const category = getAqiCategory(aqi);

  return (
    <div className="space-y-24 pt-8 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>Smart pollution exposure insights for everyday life</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15]">
          Know your air. <br />
          <span className="text-teal-600 dark:text-teal-400">Protect your body.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
          Most apps just show a raw AQI number. AirSafe tells you what that air actually means for your planned run, walk, or commute—and helps you pick safer times and cleaner routes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            icon={Wind}
            className="w-full sm:w-auto"
          >
            Check Today's Air
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/exposure')}
            icon={Activity}
            className="w-full sm:w-auto"
          >
            Calculate My Exposure
          </Button>
        </div>

        {/* Real-time ambient location pill */}
        <div className="pt-6">
          <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {selectedLocation.name}:
            </span>
            <span
              className="font-bold text-sm"
              style={{ color: category.color }}
            >
              AQI {aqi} ({category.category})
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <Link to="/dashboard" className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">
              View details →
            </Link>
          </div>
        </div>
      </section>

      {/* Real-World Context Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Why raw AQI isn't enough
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The same air quality impacts an indoor desk worker and an outdoor runner very differently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Standard App */}
          <div className="surface-card p-6 sm:p-7 space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Traditional AQI App
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              "AQI is 186 today."
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tells you the air is unhealthy, but leaves you guessing: Can I still go for a 20-minute jog? Is 6 PM better? Should I wear a mask?
            </p>
          </div>

          {/* Card 2: AirSafe */}
          <div className="surface-card p-6 sm:p-7 space-y-4 border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/10">
            <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              AirSafe Personal Assistant
            </div>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
              "High exposure for a 60-min run."
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Considers your heavy breathing during cardio, estimates your inhaled exposure score, and suggests shifting to 6:30 AM when pollution is 60% lower.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Tools for cleaner living
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Simple, actionable features designed for students, athletes, and daily commuters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Activity Exposure Score</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Personalized 0–100 score that combines outdoor duration, respiration effort, and pollutant levels.
            </p>
            <Link to="/exposure" className="text-xs font-semibold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 pt-1 hover:underline">
              Try calculator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Best Time Windows</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Forecasts show you the cleanest outdoor windows of the day for running, cycling, and airing out your room.
            </p>
            <Link to="/forecast" className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 pt-1 hover:underline">
              See forecast <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Clean Route Comparison</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compare transit routes by estimated pollution exposure, helping you pick tree-lined bypasses over traffic corridors.
            </p>
            <Link to="/routes" className="text-xs font-semibold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 pt-1 hover:underline">
              Compare routes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA Footer Card */}
      <section className="surface-card p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Ready to check your local air?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Start with your live location dashboard or test different activity scenarios in real-time.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/dashboard')}>
            Open Dashboard
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/school')}>
            School Safe Directives
          </Button>
        </div>
      </section>
    </div>
  );
}
