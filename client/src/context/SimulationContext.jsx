import React, { createContext, useContext, useState } from 'react';

const SimulationContext = createContext();

export function SimulationProvider({ children }) {
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedAqi, setSimulatedAqi] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  // Trigger simulated spike (e.g., from Moderate/Unhealthy to Hazardous 285+)
  const triggerAqiSpike = (targetAqi = 275) => {
    setIsSimulated(true);
    setSimulatedAqi(targetAqi);
    setActiveAlert({
      id: Date.now(),
      title: '🚨 AWS SNS Pollution Alert Triggered',
      message: `Critical threshold crossed! AQI spiked to ${targetAqi} (Hazardous). High particulate concentration detected in your zone. Immediate action required.`,
      severity: 'critical',
      timestamp: new Date().toLocaleTimeString(),
      deliveredVia: 'AWS SNS Push Notification / SMS Simulation',
    });
  };

  // Reset to live / normal baseline
  const resetSimulation = () => {
    setIsSimulated(false);
    setSimulatedAqi(null);
    setActiveAlert(null);
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return (
    <SimulationContext.Provider
      value={{
        isSimulated,
        simulatedAqi,
        activeAlert,
        triggerAqiSpike,
        resetSimulation,
        dismissAlert,
        setSimulatedAqi,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export default SimulationContext;
