import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Wind, 
  Activity, 
  Clock, 
  MapPin, 
  Navigation, 
  History, 
  School, 
  SlidersHorizontal, 
  Menu, 
  X,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { useAirQuality } from '../../context/AirQualityContext';
import { useTheme } from '../../context/ThemeContext';
import SimulationControlModal from '../simulation/SimulationControlModal';

export default function Navbar() {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const { isSimulated, activeAlert, dismissAlert } = useSimulation();
  const { selectedLocation, availableLocations, setSelectedLocation, detectUserLocation } = useAirQuality();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Wind },
    { name: 'Exposure Check', path: '/exposure', icon: Activity },
    { name: 'Forecast', path: '/forecast', icon: Clock },
    { name: 'Routes', path: '/routes', icon: Navigation },
    { name: 'History', path: '/history', icon: History },
    { name: 'School Safety', path: '/school', icon: School },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* Active Alert Notification */}
        {activeAlert && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-900/60 px-4 py-2 text-xs text-rose-800 dark:text-rose-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-semibold text-rose-700 dark:text-rose-300">{activeAlert.title}:</span>
                <span className="text-rose-800 dark:text-rose-200/90">{activeAlert.message}</span>
              </div>
              <button
                onClick={dismissAlert}
                className="text-[11px] underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 dark:border-teal-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                AirSafe
              </span>
            </Link>

            {/* Center: Clean spacious Nav Links on a single line (no horizontal scrollbar) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-slate-700 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Location Dropdown + Theme Toggle + Demo Mode */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {/* Location Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mr-1 shrink-0" />
                <select
                  value={selectedLocation.id}
                  onChange={(e) => {
                    const loc = availableLocations.find((l) => l.id === e.target.value);
                    if (loc) setSelectedLocation(loc);
                  }}
                  className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-0 cursor-pointer pr-1"
                >
                  {availableLocations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                      {loc.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={detectUserLocation}
                  title="Detect GPS location"
                  className="ml-1 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 text-[11px] font-bold"
                >
                  GPS
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Demo Mode Button */}
              <button
                onClick={() => setSimModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                  isSimulated
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{isSimulated ? 'Sim Active' : 'Demo Mode'}</span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSimModalOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <SimulationControlModal isOpen={simModalOpen} onClose={() => setSimModalOpen(false)} />
    </>
  );
}
