import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { airQualityService } from '../services/airQualityService';
import { MOCK_LOCATIONS, generateMockCurrentAir } from '../services/mockData';
import { useSimulation } from './SimulationContext';

const AirQualityContext = createContext();

export function AirQualityProvider({ children }) {
  const { isSimulated, simulatedAqi } = useSimulation();
  const [selectedLocation, setSelectedLocation] = useState(MOCK_LOCATIONS[0]);
  const [airData, setAirData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchAirData = useCallback(async (location = selectedLocation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await airQualityService.getCurrentAirQuality({
        latitude: location.latitude,
        longitude: location.longitude,
        locationId: location.id,
        name: location.name,
        country: location.country,
      });

      let currentData = result.data;
      if (isSimulated && simulatedAqi !== null) {
        currentData = generateMockCurrentAir(location, simulatedAqi);
        currentData.isSimulated = true;
      }

      setAirData(currentData);
      setIsUsingMock(result.isMock || isSimulated);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch air quality data');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, isSimulated, simulatedAqi]);

  useEffect(() => {
    fetchAirData(selectedLocation);
  }, [selectedLocation, fetchAirData, isSimulated, simulatedAqi]);

  // Handle geolocation detection from browser
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const customLoc = {
          id: 'current-gps',
          name: 'My Current Location (GPS)',
          latitude,
          longitude,
          country: 'Local',
          defaultAqi: 154,
          dominantPollutant: 'PM2.5',
          temp: 26,
          humidity: 64,
          windSpeed: 3.8,
        };
        setSelectedLocation(customLoc);
      },
      (geoErr) => {
        setLoading(false);
        console.warn('Geolocation permission denied or timed out:', geoErr.message);
        // Soft notification; keep default selected location
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <AirQualityContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        airData,
        loading,
        error,
        isUsingMock,
        lastRefreshed,
        refresh: () => fetchAirData(selectedLocation),
        detectUserLocation,
        availableLocations: airQualityService.getAvailableLocations(),
      }}
    >
      {children}
    </AirQualityContext.Provider>
  );
}

export const useAirQuality = () => {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
};

export default AirQualityContext;
