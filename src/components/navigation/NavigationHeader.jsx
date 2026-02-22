import React from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/functions/navigationEngine';

export default function NavigationHeader({ currentStep, destination, remainingDistance, remainingTime, eta, isDark }) {
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[900] backdrop-blur-xl border-b ${
        isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-200'
      }`}
    >
      <div className="px-4 py-3">
        {/* ETA - Large */}
        <div className="text-center mb-2">
          <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(remainingTime)}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Aankomst {eta.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Destination */}
        <div className="flex items-center justify-center gap-2">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {destination?.label?.split(',')[0]}
          </p>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {(remainingDistance / 1000).toFixed(1)} km
          </span>
        </div>
      </div>
    </motion.div>
  );
}