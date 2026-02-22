import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Clock, Navigation2, AlertCircle, Loader } from 'lucide-react';
import { formatTime, formatDistance } from '@/functions/navigationEngine';
import RouteComparison from './RouteComparison';
import RoutePreferences from './RoutePreferences';

export default function RouteOverview({ 
  routes, 
  selectedRouteIdx, 
  onSelectRoute, 
  onStart, 
  onClose, 
  destination, 
  isDark,
  preference,
  onPreferenceChange,
  isOptimizing
}) {
  // Validation: prevent rendering with invalid data
  if (!routes || routes.length === 0) return null;
  if (!routes[selectedRouteIdx]) return null;

  const selectedRoute = routes[selectedRouteIdx];
  
  // Validate route has required data
  if (!selectedRoute || typeof selectedRoute !== 'object') {
    console.error('Invalid route object:', selectedRoute);
    return null;
  }

  const duration = selectedRoute?.adjustedDuration || selectedRoute?.duration || 0;
  const eta = new Date(Date.now() + duration * 1000);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`fixed inset-0 z-[900] flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}
    >
      {/* Map area (simplified - just shows area behind) */}
      <div className="flex-1 bg-gradient-to-b from-[#2F80ED]/10 to-transparent" />

      {/* Bottom Sheet */}
      <div className={`border-t rounded-t-3xl ${
        isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'
      } p-4 space-y-4 max-h-[70vh] overflow-y-auto`}>
        
        {/* Drag Handle */}
        <div className="flex justify-center mb-2">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-300'}`} />
        </div>

        {/* Destination Info */}
        <div className="space-y-2">
          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Bestemming
          </p>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {destination?.label?.split(',')[0] || 'Bestemming'}
          </p>
        </div>

        {/* Route Preferences */}
        <RoutePreferences 
          onSelect={onPreferenceChange}
          isDark={isDark}
        />

        {/* Primary Route Info */}
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(selectedRoute?.adjustedDuration || selectedRoute?.duration || 0)}
              </p>
              {selectedRoute?.adjustedDuration && selectedRoute.adjustedDuration > selectedRoute.duration && (
                <p className={`text-xs text-orange-500 mt-1`}>
                  +{formatTime(selectedRoute.adjustedDuration - selectedRoute.duration)} verkeer
                </p>
              )}
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDistance(selectedRoute?.distance || 0)}
                {selectedRoute?.hasTrafficData && (
                  <span className="ml-2 text-xs text-green-500">🚦 Live</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Aankomst</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {eta.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Route Features */}
        {selectedRoute?.advantages && selectedRoute.advantages.length > 0 && (
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}>
            <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Voordelen van deze route
            </p>
            <ul className="space-y-1">
              {selectedRoute.advantages.map((adv, idx) => (
                <li key={idx} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-start gap-2`}>
                  <span className="text-[#2F80ED] mt-0.5">✓</span>
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {selectedRoute?.warnings && selectedRoute.warnings.length > 0 && (
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-red-400' : 'text-red-700'} flex items-center gap-2`}>
              <AlertCircle size={14} /> Waarschuwingen
            </p>
            <ul className="space-y-1">
              {selectedRoute.warnings.map((warning, idx) => (
                <li key={idx} className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Route Comparison */}
        <RouteComparison 
          routes={routes} 
          selectedIdx={selectedRouteIdx} 
          onSelectRoute={onSelectRoute}
          isDark={isDark}
        />

        {/* Options */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-2xl font-semibold transition-colors ${
              isDark 
                ? 'bg-[#2A2A2A] text-white hover:bg-[#333]' 
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Annuleren
          </button>
          <button
            onClick={onStart}
            disabled={isOptimizing}
            className={`flex-1 px-4 py-3 rounded-2xl text-white font-semibold transition-colors flex items-center justify-center gap-2 ${
              isOptimizing
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-[#2F80ED] hover:bg-[#2570D4]'
            }`}
          >
            {isOptimizing && <Loader size={18} className="animate-spin" />}
            {isOptimizing ? 'Optimaliseren...' : 'Start navigatie'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}