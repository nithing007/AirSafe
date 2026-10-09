import React from 'react';
import { Wind, Shield, Cloud, Server, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md text-slate-500 dark:text-slate-400 py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/25">
                <Wind className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">AirSafe</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Personalized air-pollution exposure intelligence & safer-action platform. WeMakeDevs × AWS Hackathon Project.
            </p>
          </div>

          {/* Core Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Real-Time AQI & Pollutant Breakdown</li>
              <li className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Activity-Based Personal Exposure Score</li>
              <li className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Explainable Recommendation Engine</li>
              <li className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Safer Time Window Forecasts</li>
            </ul>
          </div>

          {/* AWS Cloud Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Powered By AWS</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-amber-500" /> S3 & CloudFront (Frontend)</li>
              <li className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-orange-500" /> EC2 Node.js REST API</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500" /> SNS Real-time Pollution Alerts</li>
            </ul>
          </div>

          {/* Disclaimer & Notice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Disclaimer</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              AirSafe exposure scores are mathematical risk models based on environmental inputs and exercise respiration rates, not invasive clinical diagnoses.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AirSafe Team. Built for the WeMakeDevs × AWS Hackathon.</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/nithing007/AirSafe" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              GitHub Repository <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
