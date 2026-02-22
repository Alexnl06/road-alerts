import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALERT_CONFIG } from './AlertMarker';

export default function ProximityPrompt({ alert, onConfirm, onDeny, onDismiss }) {
  if (!alert) return null;

  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unknown;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-20 left-4 right-4 z-[1000] mx-auto max-w-md"
      >
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${config.color}22` }}
              >
                {config.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm mb-1">{config.label}</h3>
                <p className="text-gray-400 text-xs">Je rijdt erlangs</p>
              </div>
              <button 
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-white text-base font-medium mb-4 text-center">
              Staat deze er nog?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={onConfirm}
                className="flex-1 h-12 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-green-400 border-0 font-semibold"
              >
                <ThumbsUp size={18} className="mr-2" />
                Ja
              </Button>
              <Button
                onClick={onDeny}
                className="flex-1 h-12 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border-0 font-semibold"
              >
                <ThumbsDown size={18} className="mr-2" />
                Nee
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}