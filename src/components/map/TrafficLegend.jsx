import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

const TRAFFIC_LEGEND = [
  { level: 'green', label: 'Vrij', delay: '0-2 min' },
  { level: 'orange', label: 'Druk', delay: '2-5 min' },
  { level: 'red', label: 'Zwaar', delay: '5-15 min' },
  { level: 'dark_red', label: 'Zeer druk', delay: '15+ min' },
];

const COLOR_MAP = {
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  dark_red: '#991B1B',
};

export default function TrafficLegend({ isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-3 backdrop-blur-xl border ${
        isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Info size={14} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
        <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Verkeersinfo
        </p>
      </div>

      <div className="space-y-1.5">
        {TRAFFIC_LEGEND.map((item) => (
          <div key={item.level} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLOR_MAP[item.level] }}
            />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              {item.label}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              ({item.delay})
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}