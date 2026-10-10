import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, X, MapPin } from 'lucide-react';
import { geocodingService } from '../../services/geocodingService';

/**
 * LocationSearchInput
 *
 * A controlled, accessible location input component with explicit user-triggered
 * geocoding search, loading/empty/error states, and separate coordinate storage.
 *
 * Compliance:
 *   - Search is explicitly triggered by the user (clicking Search button or pressing Enter).
 *   - No auto-complete on keystroke, respecting public geocoder usage policies.
 */
export default function LocationSearchInput({
  id,
  value,
  onChange,
  onSelect,
  resolvedLocation,
  placeholder = 'Type a city, area, landmark, or address...',
  label,
  icon: Icon = MapPin,
  iconColor = 'text-teal-600 dark:text-teal-400',
  className = '',
  disabled = false,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!value || value.trim().length < 2) {
      setError('Please enter at least 2 characters to search.');
      setIsOpen(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setIsOpen(true);

    try {
      const response = await geocodingService.searchLocations(value);
      setResults(response.results || []);
    } catch (err) {
      setError(err.message || 'Location search failed. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const label = item.displayName || item.name;
    onSelect({
      label,
      name: item.name,
      displayName: item.displayName || item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      city: item.city || '',
      state: item.state || '',
      country: item.country || '',
    });
    setIsOpen(false);
    setError(null);
  };

  const handleClear = () => {
    onChange('');
    onSelect(null);
    setResults([]);
    setError(null);
    setHasSearched(false);
    setIsOpen(false);
  };

  const isResolved =
    resolvedLocation &&
    typeof resolvedLocation.latitude === 'number' &&
    typeof resolvedLocation.longitude === 'number' &&
    value.trim() === resolvedLocation.label?.trim();

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-0.5 cursor-pointer">
          <span>{label}</span>
          {isResolved ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Verified ({resolvedLocation.latitude.toFixed(3)}, {resolvedLocation.longitude.toFixed(3)})
            </span>
          ) : value?.trim().length > 0 ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Press Search to verify
            </span>
          ) : null}
        </label>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all text-xs">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />

        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // If text is altered, current resolved location becomes invalid
            if (resolvedLocation) {
              onSelect(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full font-medium"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors shrink-0"
            title="Clear location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isSearching}
          className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0 shadow-sm disabled:opacity-50"
          title="Search location"
        >
          {isSearching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Search className="w-3 h-3" />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Results / Error Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[1500] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
              <span>Searching locations...</span>
            </div>
          ) : error ? (
            <div className="p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No locations found
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Try searching for a city, landmark, or broader postal area.
              </p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                Matching Locations ({results.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.displayName || `${item.city || ''}, ${item.country || ''}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
