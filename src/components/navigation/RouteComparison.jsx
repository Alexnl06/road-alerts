import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Mountain, AlertCircle } from 'lucide-react';
import { formatTime, formatDistance } from '@/functions/navigationEngine';

const PREFERENCE_ICONS = {
  fastest: Zap,
  scenic: Mountain,
  avoid_tolls: AlertCircle,
  balanced: CheckCircle2,
};

const PREFERENCE_LABELS = {
  fastest: 'Snelste',
  scenic: 'Mooist',
  avoid_tolls: 'Geen tolwegen',
  balanced: 'Evenwichtig',
};

export default function RouteComparison({ routes, selectedIdx, onSelectRoute, isDark }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
        Alternatieve routes
      </p>

      {routes.map((route, idx) => {
        const isSelected = idx === selectedIdx;
        const Icon = PREFERENCE_ICONS[route.preference] || CheckCircle2;

        return (
          <motion.button
            key={idx}
            onClick={() => onSelectRoute(idx)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`w-full p-3 rounded-xl transition-all text-left ${
              isSelected
                ? isDark
                  ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40'
                  : 'bg-blue-100 border border-blue-300'
                : isDark
                ? 'bg-[#2A2A2A] border border-transparent hover:bg-[#333]'
                : 'bg-gray-200 border border-transparent hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon
                size={16}
                className={isSelected ? (isDark ? 'text-[#2F80ED]' : 'text-blue-600') : isDark ? 'text-gray-500' : 'text-gray-600'}
              />
              <span className={`text-xs font-semibold ${
                isSelected ? (isDark ? 'text-[#2F80ED]' : 'text-blue-600') : isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {route.name || PREFERENCE_LABELS[route.preference] || 'Route'}
              </span>
              {isSelected && (
                <CheckCircle2 size={14} className={isDark ? 'text-[#2F80ED]' : 'text-blue-600'} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Duur</p>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    const duration = route.estimatedDuration || route.duration || 0;
                    return formatTime(duration);
                  })()}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Afstand</p>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    const distance = route.estimatedDistance || route.distance || 0;
                    return formatDistance(distance);
                  })()}
                </p>
              </div>
            </div>

            {route.description && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {route.description}
              </p>
            )}

            {route.advantages && route.advantages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {route.advantages.slice(0, 2).map((adv, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-1 rounded-full ${
                      isDark
                        ? 'bg-[#2F80ED]/20 text-[#2F80ED]'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {adv}
                  </span>
                ))}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}