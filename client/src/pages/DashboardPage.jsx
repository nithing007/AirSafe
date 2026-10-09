import React from 'react';
import AqiOverviewCard from '../components/dashboard/AqiOverviewCard';
import PollutantGrid from '../components/dashboard/PollutantGrid';
import QuickExposureWidget from '../components/dashboard/QuickExposureWidget';
import RecommendationSummaryCard from '../components/dashboard/RecommendationSummaryCard';
import { useAirQuality } from '../context/AirQualityContext';
import { ErrorAlert } from '../components/common/Card';

export default function DashboardPage() {
  const { error, refresh } = useAirQuality();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <ErrorAlert
          title="Air Quality Service Notice"
          message={error}
          onRetry={refresh}
        />
      )}

      {/* Hero Overview */}
      <AqiOverviewCard />

      {/* Pollutant Breakdown Grid */}
      <PollutantGrid />

      {/* Bottom Section: Quick Calculator & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickExposureWidget />
        <RecommendationSummaryCard />
      </div>
    </div>
  );
}
