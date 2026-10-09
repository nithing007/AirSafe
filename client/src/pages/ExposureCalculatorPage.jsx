import React, { useState } from 'react';
import ExposureCalculatorForm from '../components/exposure/ExposureCalculatorForm';
import ExposureScoreGauge from '../components/exposure/ExposureScoreGauge';
import ExposureBreakdownChart from '../components/exposure/ExposureBreakdownChart';
import RecommendationCard from '../components/exposure/RecommendationCard';
import { exposureService } from '../services/exposureService';
import { calculateExposure } from '../utils/exposureEngine';
import { useAirQuality } from '../context/AirQualityContext';

export default function ExposureCalculatorPage() {
  const { airData } = useAirQuality();
  const [isCalculating, setIsCalculating] = useState(false);

  // Initial calculation state
  const [calculationResult, setCalculationResult] = useState(() =>
    calculateExposure({
      aqi: airData?.aqi || 186,
      pm25: airData?.pollutants?.pm2_5 || 78,
      activityId: 'running',
      durationMinutes: 45,
    })
  );

  const handleCalculate = async (payload) => {
    setIsCalculating(true);
    try {
      const response = await exposureService.calculatePersonalExposure(payload);
      setCalculationResult(response.data);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Personal Pollution Exposure Check
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Estimate inhaled particulate intake based on your activity effort and duration outdoors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Config Form (5 cols) */}
        <div className="lg:col-span-5">
          <ExposureCalculatorForm
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
        </div>

        {/* Right Column: Score Gauge & Insights (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ExposureScoreGauge result={calculationResult} />
          <ExposureBreakdownChart breakdown={calculationResult?.breakdown} />
          <RecommendationCard
            recommendations={calculationResult?.recommendations}
            activity={calculationResult?.activity}
            duration={calculationResult?.duration}
            aqi={calculationResult?.aqi}
          />
        </div>
      </div>
    </div>
  );
}
