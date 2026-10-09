import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AirQualityProvider } from './context/AirQualityContext';
import { SimulationProvider } from './context/SimulationContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ExposureCalculatorPage from './pages/ExposureCalculatorPage';
import ForecastPage from './pages/ForecastPage';
import RouteComparisonPage from './pages/RouteComparisonPage';
import HistoryPage from './pages/HistoryPage';
import SchoolSafePage from './pages/SchoolSafePage';

export default function App() {
  return (
    <ThemeProvider>
      <SimulationProvider>
        <AirQualityProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white transition-colors duration-200 relative">
              <Navbar />

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/exposure" element={<ExposureCalculatorPage />} />
                  <Route path="/forecast" element={<ForecastPage />} />
                  <Route path="/routes" element={<RouteComparisonPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/school" element={<SchoolSafePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </Router>
        </AirQualityProvider>
      </SimulationProvider>
    </ThemeProvider>
  );
}
