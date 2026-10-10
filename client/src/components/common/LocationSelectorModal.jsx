import React, { useState } from 'react';
import { MapPin, Navigation, Search, Loader2, Check, X, Compass, Globe } from 'lucide-react';
import { useAirQuality } from '../../context/AirQualityContext';
import { geocodingService } from '../../services/geocodingService';

export default function LocationSelectorModal({ isOpen, onClose }) {
  const { selectedLocation, setSelectedLocation, availableLocations, detectUserLocation } = useAirQuality();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchError('Please enter at least 2 characters to search.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await geocodingService.searchLocations(searchTerm);
      setSearchResults(response.results || []);
    } catch (err) {
      setSearchError(err.message || 'Location search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (loc) => {
    setSelectedLocation({
      id: loc.id || `loc-${loc.latitude}-${loc.longitude}`,
      name: loc.name,
      displayName: loc.displayName || loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      country: loc.country || 'India',
      state: loc.state || '',
      defaultAqi: loc.defaultAqi || 135,
    });
    onClose();
  };

  const handleGpsClick = () => {
    detectUserLocation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Choose Location
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search any global city or pick a preset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any city, area, landmark, or address..."
                className="bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {/* Search Error */}
          {searchError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300">
              {searchError}
            </div>
          )}

          {/* Search Results Section */}
          {hasSearched && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Search Results ({searchResults.length})
              </span>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  No matching locations found for "{searchTerm}".
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.displayName || `${item.city || ''}, ${item.country || ''}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                        {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GPS Quick Action */}
          <div>
            <button
              type="button"
              onClick={handleGpsClick}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/60 dark:bg-teal-950/20 hover:bg-teal-100/60 dark:hover:bg-teal-950/40 transition-colors text-xs text-teal-800 dark:text-teal-300 font-semibold"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Use My Exact GPS Location</span>
              </div>
              <span className="text-[11px] font-normal text-teal-600 dark:text-teal-400">
                Browser Geolocation
              </span>
            </button>
          </div>

          {/* Preset Cities Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Preset Quick Cities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                      <span className="truncate">{loc.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Selected: <strong className="text-slate-700 dark:text-slate-300">{selectedLocation?.name}</strong> ({selectedLocation?.latitude?.toFixed(2)}, {selectedLocation?.longitude?.toFixed(2)})
        </div>
      </div>
    </div>
  );
}
