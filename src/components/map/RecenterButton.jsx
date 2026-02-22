import React from 'react';
import { Navigation2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecenterButton({ onClick, isDark }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${
        isDark ? 'bg-[#1E1E1E]' : 'bg-white'
      }`}
    >
      <Navigation2 size={20} className="text-[#2F80ED]" />
    </motion.button>
  );
}