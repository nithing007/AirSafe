import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom icons using inline SVG data URIs
const startIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background:#14b8a6; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-center; color:black; font-size:10px; font-weight:bold;">A</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const endIcon = L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background:#f43f5e; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-center; color:white; font-size:10px; font-weight:bold;">B</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function RouteMap({ routes, selectedRouteId, onSelectRoute }) {
  const defaultCenter = [11.0250, 76.9650];

  return (
    <div className="w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapRecenter center={defaultCenter} />
        {/* OpenStreetMap Dark / Standard CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
                    <p className="text-slate-400">Distance: {route.distanceKm} km ({route.durationMin} mins)</p>
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
      </div>
    </div>
  );
}
