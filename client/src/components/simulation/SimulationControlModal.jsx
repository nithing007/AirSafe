import React, { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export default function SimulationControlModal({ isOpen, onClose }) {
  const { isSimulated, simulatedAqi, triggerAqiSpike, resetSimulation, setSimulatedAqi } = useSimulation();
  const [sliderValue, setSliderValue] = useState(simulatedAqi || 186);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md surface-card p-6 bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Live Demo Testing Panel</h3>
              <p className="text-xs text-slate-400">Simulate different air scenarios in 1-click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Scenarios */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">
            Preset Scenarios
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setSimulatedAqi(38);
                setSliderValue(38);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-center flex flex-col items-center gap-1"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Clean Air</span>
              <span className="text-[10px] text-slate-500">AQI 38</span>
            </button>

            <button
              onClick={() => {
                setSimulatedAqi(115);
                setSliderValue(115);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all text-center flex flex-col items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Moderate</span>
              <span className="text-[10px] text-slate-500">AQI 115</span>
            </button>

            <button
              onClick={() => {
                triggerAqiSpike(270);
                setSliderValue(270);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-center flex flex-col items-center gap-1"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-200">Smog Spike</span>
              <span className="text-[10px] text-rose-400">AQI 270</span>
            </button>
          </div>
        </div>

        {/* Manual Slider */}
        <div className="surface-subtle p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Custom AQI Level:</span>
            <span className="font-bold text-teal-300 font-sans">{sliderValue}</span>
          </div>
          <input
            type="range"
            min="10"
            max="400"
            step="5"
            value={sliderValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSliderValue(val);
              setSimulatedAqi(val);
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        {/* State Footer */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">
            {isSimulated ? 'Simulation active' : 'Live sensor data mode'}
          </span>
          {isSimulated && (
            <button
              onClick={resetSimulation}
              className="flex items-center gap-1 text-teal-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
