import React, { useState, useEffect } from 'react';
import RouteMap from '../components/routes/RouteMap';
import RouteComparisonCard from '../components/routes/RouteComparisonCard';
import LocationSearchInput from '../components/common/LocationSearchInput';
import { routeService } from '../services/routeService';
import { Card, Button, LoadingSkeleton } from '../components/common/Card';
import { Sparkles, Navigation, MapPin, AlertCircle, Info } from 'lucide-react';

const DEFAULT_ORIGIN = {
  label: 'Gandhipuram Central, Coimbatore',
  name: 'Gandhipuram Central',
  latitude: 11.0168,
  longitude: 76.9558,
};

const DEFAULT_DESTINATION = {
  label: 'Saravanampatti Tech Park, Coimbatore',
  name: 'Saravanampatti Tech Park',
  latitude: 11.0825,
  longitude: 76.9945,
};

export default function RouteComparisonPage() {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('route-green');
  const [loading, setLoading] = useState(true);
  const [compareError, setCompareError] = useState(null);

  // Controlled input strings
  const [originInput, setOriginInput] = useState(DEFAULT_ORIGIN.label);
  const [destinationInput, setDestinationInput] = useState(DEFAULT_DESTINATION.label);

  // Resolved location objects with separate coordinates
  const [resolvedOrigin, setResolvedOrigin] = useState(DEFAULT_ORIGIN);
  const [resolvedDestination, setResolvedDestination] = useState(DEFAULT_DESTINATION);

  const fetchRoutes = async (originObj = resolvedOrigin, destObj = resolvedDestination) => {
    // Validate that both locations are resolved with numbers
    if (!originObj || typeof originObj.latitude !== 'number' || typeof originObj.longitude !== 'number') {
      setCompareError('Please search and select a verified location for Origin before comparing routes.');
      return;
    }

    if (!destObj || typeof destObj.latitude !== 'number' || typeof destObj.longitude !== 'number') {
      setCompareError('Please search and select a verified location for Destination before comparing routes.');
      return;
    }

    setCompareError(null);
    setLoading(true);

    try {
      const response = await routeService.compareRoutes({
        origin: originObj.label || originObj.name,
        destination: destObj.label || destObj.name,
        originCoords: {
          latitude: originObj.latitude,
          longitude: originObj.longitude,
        },
        destinationCoords: {
          latitude: destObj.latitude,
          longitude: destObj.longitude,
        },
      });

      setRoutes(response.data);
      if (response.data?.length > 0) {
        setSelectedRouteId(response.data[0].id);
      }
    } catch (err) {
      console.error('Route error:', err);
      setCompareError(err.message || 'Failed to calculate route comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes(DEFAULT_ORIGIN, DEFAULT_DESTINATION);
  }, []);

  const canCompare =
    resolvedOrigin &&
    resolvedDestination &&
    typeof resolvedOrigin.latitude === 'number' &&
    typeof resolvedDestination.latitude === 'number';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Clean Route Comparison
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Compare route corridors based on estimated air exposure to breathe cleaner on your daily commute.
        </p>
      </div>

      {/* Origin & Destination Bar */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Origin Location Input */}
            <LocationSearchInput
              id="route-origin-input"
              label="Starting Point (Origin)"
              placeholder="Search origin city, area, or landmark..."
              icon={MapPin}
              iconColor="text-teal-600 dark:text-teal-400"
              value={originInput}
              onChange={(val) => {
                setOriginInput(val);
                setCompareError(null);
              }}
              onSelect={(item) => {
                setResolvedOrigin(item);
                if (item) setOriginInput(item.label);
                setCompareError(null);
              }}
              resolvedLocation={resolvedOrigin}
            />

            {/* Destination Location Input */}
            <LocationSearchInput
              id="route-destination-input"
              label="Destination"
              placeholder="Search destination city, area, or landmark..."
              icon={Navigation}
              iconColor="text-rose-500 dark:text-rose-400"
              value={destinationInput}
              onChange={(val) => {
                setDestinationInput(val);
                setCompareError(null);
              }}
              onSelect={(item) => {
                setResolvedDestination(item);
                if (item) setDestinationInput(item.label);
                setCompareError(null);
              }}
              resolvedLocation={resolvedDestination}
            />
          </div>

          <Button
            onClick={() => fetchRoutes()}
            loading={loading}
            disabled={!canCompare}
            className="w-full lg:w-auto shrink-0 h-10 mt-2 lg:mt-0"
            icon={Sparkles}
          >
            Compare Routes
          </Button>
        </div>

        {/* Validation / Error Message */}
        {compareError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{compareError}</span>
          </div>
        )}

        {/* Simulation Notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            Type any city or place and click <strong>Search</strong> to verify coordinates. Corridors simulate air exposure comparisons between the selected points.
          </span>
        </div>
      </Card>

      {/* Map & Comparison Cards */}
      {loading ? (
        <LoadingSkeleton className="h-96 w-full" />
      ) : (
        <div className="space-y-6">
          <RouteMap
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />

          <RouteComparisonCard
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        </div>
      )}
    </div>
  );
}
