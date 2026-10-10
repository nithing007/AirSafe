import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons using inline SVG data URIs
const startIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background:#14b8a6; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:black; font-size:10px; font-weight:bold;">A</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const endIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background:#f43f5e; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">B</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapRecenter({ bounds, center }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2 && Array.isArray(bounds[0]) && Array.isArray(bounds[1])) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (err) {
        if (center) map.setView(center, 13);
      }
    } else if (center) {
      map.setView(center, 13);
    }
  }, [bounds, center, map]);
  return null;
}

export default function RouteMap({ routes, selectedRouteId, onSelectRoute }) {
  // Compute bounds and center dynamically from route coordinates
  const { bounds, center } = useMemo(() => {
    const allCoords = [];
    routes?.forEach((r) => {
      if (Array.isArray(r.coordinates)) {
        r.coordinates.forEach((pt) => {
          if (Array.isArray(pt) && pt.length >= 2 && !Number.isNaN(pt[0]) && !Number.isNaN(pt[1])) {
            allCoords.push(pt);
          }
        });
      }
    });

    if (allCoords.length === 0) {
      return { bounds: null, center: [11.0250, 76.9650] };
    }

    let minLat = allCoords[0][0];
    let maxLat = allCoords[0][0];
    let minLon = allCoords[0][1];
    let maxLon = allCoords[0][1];

    allCoords.forEach(([lat, lon]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });

    return {
      bounds: [
        [minLat, minLon],
        [maxLat, maxLon],
      ],
      center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
    };
  }, [routes]);

  return (
    <div className="w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapRecenter bounds={bounds} center={center} />
        {/* OpenStreetMap Standard Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Draw Route Polylines */}
        {routes?.map((route) => {
          const isSelected = selectedRouteId === route.id;
          return (
            <React.Fragment key={route.id}>
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: route.color,
                  weight: isSelected ? 7 : 4,
                  opacity: isSelected ? 0.95 : 0.6,
                  dashArray: route.isRecommended ? null : '8, 8',
                }}
                eventHandlers={{
                  click: () => onSelectRoute && onSelectRoute(route.id),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 p-1">
                    <p className="font-bold text-slate-100">{route.name}</p>
                    <p className="text-slate-300">Exposure: <strong>{route.estimatedExposureScore}/100 ({route.exposureRisk})</strong></p>
                    <p className="text-slate-400">Distance: {route.distanceKm} km (~{route.durationMin} mins)</p>
                    {route.disclaimer && (
                      <p className="text-[10px] text-slate-400 italic mt-1 border-t border-slate-700/50 pt-1">
                        {route.disclaimer}
                      </p>
                    )}
                  </div>
                </Popup>
              </Polyline>

              {/* Start and End Markers */}
              {route.coordinates && route.coordinates.length > 0 && (
                <>
                  <Marker position={route.coordinates[0]} icon={startIcon}>
                    <Popup>Start Point: Origin</Popup>
                  </Marker>
                  <Marker position={route.coordinates[route.coordinates.length - 1]} icon={endIcon}>
                    <Popup>Destination</Popup>
                  </Marker>
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-xs text-slate-200 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-emerald-400 rounded" />
          <span>Green Route (Lower Inhalation Risk)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-rose-500 rounded border-dashed" />
          <span>Direct Route (High Industrial Traffic)</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
          <span>Simulation Corridors</span>
          <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Demo</span>
        </div>
      </div>
    </div>
  );
}
