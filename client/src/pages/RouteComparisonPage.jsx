import React, { useState, useEffect } from 'react';
import RouteMap from '../components/routes/RouteMap';
import RouteComparisonCard from '../components/routes/RouteComparisonCard';
import { routeService } from '../services/routeService';
import { Card, Button, LoadingSkeleton } from '../components/common/Card';
import { Navigation, Sparkles, MapPin } from 'lucide-react';

export default function RouteComparisonPage() {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('route-green');
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('Gandhipuram Central');
  const [destination, setDestination] = useState('Saravanampatti Tech Park');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await routeService.compareRoutes({ origin, destination });
      setRoutes(response.data);
      if (response.data?.length > 0) {
        setSelectedRouteId(response.data[0].id);
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Clean Route Comparison
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Compare route options based on estimated air exposure to breathe cleaner on your daily commute.
        </p>
      </div>

      {/* Origin & Destination Bar */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin / Starting Point"
                className="bg-transparent text-slate-800 dark:text-slate-200 outline-none w-full font-medium"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Navigation className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                className="bg-transparent text-slate-800 dark:text-slate-200 outline-none w-full font-medium"
              />
            </div>
          </div>

          <Button
            onClick={fetchRoutes}
            loading={loading}
            className="w-full md:w-auto shrink-0"
            icon={Sparkles}
          >
            Compare Routes
          </Button>
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
