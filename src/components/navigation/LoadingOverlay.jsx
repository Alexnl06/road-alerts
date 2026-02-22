import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';

export default function LoadingOverlay({ isVisible, message = "Route wordt berekend..." }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1E1E1E] rounded-2xl p-8 flex flex-col items-center gap-4 max-w-xs mx-4"
          >
            <Loader size={48} className="text-[#2F80ED] animate-spin" />
            <p className="text-white text-center font-medium">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}