import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mountain, DollarSign, Shuffle } from 'lucide-react';

const PREFERENCES = [
  {
    id: 'fastest',
    label: 'Snelste route',
    icon: Zap,
    description: 'Kortste reistijd',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'scenic',
    label: 'Mooiste route',
    icon: Mountain,
    description: 'Mooi uitzicht',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'avoid_tolls',
    label: 'Geen tolwegen',
    icon: DollarSign,
    description: 'Bespaar kosten',
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'balanced',
    label: 'Evenwichtig',
    icon: Shuffle,
    description: 'Alles meegenomen',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function RoutePreferences({ onSelect, isDark }) {
  const [selected, setSelected] = useState('balanced');

  const handleSelect = (id) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}
    >
      <p className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Voorkeur voor route
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const isSelected = selected === pref.id;

          return (
            <button
              key={pref.id}
              onClick={() => handleSelect(pref.id)}
              className={`p-3 rounded-xl transition-all ${
                isSelected
                  ? `bg-gradient-to-br ${pref.color} text-white`
                  : isDark
                  ? 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2A2A2A]'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <p className="text-xs font-semibold leading-tight">{pref.label}</p>
              <p className="text-[10px] opacity-75">{pref.description}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}