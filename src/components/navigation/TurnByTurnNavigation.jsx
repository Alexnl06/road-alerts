import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Phone } from 'lucide-react';
import { formatTime, formatDistance } from '@/functions/navigationEngine';

// Maneuver type to emoji mapping
const MANEUVER_EMOJIS = {
  'turn': '➡️',
  'new name': '➡️',
  'depart': '▶️',
  'arrive': '🎯',
  'merge': '➡️',
  'ramp': '🛣️',
  'on ramp': '🛣️',
  'off ramp': '↗️',
  'fork': '🔀',
  'end of road': '⏹️',
  'continue': '➡️',
  'roundabout': '🔄',
  'rotary': '🔄',
  'roundabout turn': '🔄',
  'notification': '⚠️',
};

export default function TurnByTurnNavigation({
  route,
  currentStepIdx,
  nextInstruction,
  remainingDistance,
  remainingTime,
  eta,
  onStop,
  isDark,
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentStep = route?.steps[currentStepIdx];
  const maneuverEmoji = MANEUVER_EMOJIS[currentStep?.maneuver?.type] || '➡️';

  return (
    <div className={`fixed inset-0 z-[950] flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      {/* Top Banner - Primary Instruction */}
      <motion.div
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className={`border-b ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'} p-4 safe-area-top`}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-start gap-4">
            {/* Maneuver Icon */}
            <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
              isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'
            }`}>
              {maneuverEmoji}
            </div>

            {/* Instruction Details */}
            <div className="flex-1 pt-1">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {currentStep?.maneuver?.modifier || 'Volgen'}
              </p>
              <p className={`text-2xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {nextInstruction?.distance != null ? formatDistance(nextInstruction.distance) : '—'}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                {nextInstruction?.step?.name || currentStep?.name || 'Volg de route'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map Area */}
      <div className="flex-1" />

      {/* Bottom Navigation Bar */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        className={`border-t ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'} p-4 safe-area-bottom`}
      >
        <div className="max-w-md mx-auto space-y-3">
          {/* Main Info Row */}
          <div className="flex items-center justify-between px-4">
            <div className="text-center flex-1">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider`}>
                Resterende tijd
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
               {remainingTime != null ? formatTime(remainingTime) : '—'}
              </p>
            </div>
            <div className={`w-px h-12 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-200'}`} />
            <div className="text-center flex-1">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider`}>
                Afstand
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {remainingDistance != null ? formatDistance(remainingDistance) : '—'}
              </p>
            </div>
            <div className={`w-px h-12 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-200'}`} />
            <div className="text-center flex-1">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider`}>
                ETA
              </p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {eta instanceof Date && !isNaN(eta) ? eta.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                soundEnabled
                  ? isDark ? 'bg-[#2F80ED] text-white' : 'bg-blue-500 text-white'
                  : isDark ? 'bg-[#2A2A2A] text-gray-500' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              className={`px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors ${
                isDark ? 'bg-[#2A2A2A] text-white hover:bg-[#333]' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Phone size={18} />
            </button>

            <button
              onClick={onStop}
              className={`px-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-colors ${
                isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          <p className={`text-center text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            Volg de route en let op verkeersborden
          </p>
        </div>
      </motion.div>
    </div>
  );
}