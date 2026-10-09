import React, { useState, useEffect } from 'react';
import HourlyAqiChart from '../components/forecast/HourlyAqiChart';
import BestTimeWindowCard from '../components/forecast/BestTimeWindowCard';
import ForecastDaySelector from '../components/forecast/ForecastDaySelector';
import { airQualityService } from '../services/airQualityService';
import { useAirQuality } from '../context/AirQualityContext';
import { LoadingSkeleton, ErrorAlert } from '../components/common/Card';

export default function ForecastPage() {
  const { selectedLocation, airData } = useAirQuality();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await airQualityService.getForecast({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        baseAqi: airData?.aqi || 186,
      });
      setForecast(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load air pollution forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [selectedLocation, airData?.aqi]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Air Quality Forecast & Clean Windows
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Hourly trends to help you plan workouts and transit during lower-pollution hours in {selectedLocation.name}.
        </p>
      </div>

      {error && <ErrorAlert title="Forecast Notice" message={error} onRetry={fetchForecast} />}

      {loading && !forecast ? (
        <div className="space-y-6">
          <LoadingSkeleton className="h-80 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LoadingSkeleton className="h-44 w-full" />
            <LoadingSkeleton className="h-44 w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* Best / Worst Time Window Highlights */}
          <BestTimeWindowCard forecast={forecast} />

          {/* 24-Hour Hourly Curve */}
          <HourlyAqiChart hourlyData={forecast?.hourly} />

          {/* 7-Day Extended Trend */}
          <ForecastDaySelector dailyData={forecast?.daily} />
        </>
      )}
    </div>
  );
}
