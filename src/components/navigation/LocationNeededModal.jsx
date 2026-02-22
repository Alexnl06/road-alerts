import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X } from 'lucide-react';

export default function LocationNeededModal({ isOpen, onClose, onEnableLocation, onPickOnMap, onSearchStart, isDark }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-[1101] rounded-t-3xl ${
              isDark ? 'bg-[#1E1E1E]' : 'bg-white'
            }`}
          >
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3" />
            
            <div className="p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Locatie nodig
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Om een route te berekenen hebben we je startlocatie nodig. Kies een optie:
              </p>

              <div className="space-y-3">
                <button
                  onClick={onEnableLocation}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    isDark 
                      ? 'bg-[#2F80ED]/20 hover:bg-[#2F80ED]/30 border border-[#2F80ED]/40' 
                      : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-[#2F80ED]/20' : 'bg-blue-100'
                  }`}>
                    <Navigation size={24} className="text-[#2F80ED]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Locatie inschakelen
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Gebruik mijn huidige locatie
                    </p>
                  </div>
                </button>

                <button
                  onClick={onPickOnMap}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    isDark 
                      ? 'bg-[#2A2A2A] hover:bg-[#333] border border-[#2A2A2A]' 
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-[#333]' : 'bg-gray-200'
                  }`}>
                    <MapPin size={24} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Startpunt op kaart kiezen
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Klik op de kaart om startpunt te plaatsen
                    </p>
                  </div>
                </button>

                <button
                  onClick={onSearchStart}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                    isDark 
                      ? 'bg-[#2A2A2A] hover:bg-[#333] border border-[#2A2A2A]' 
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-[#333]' : 'bg-gray-200'
                  }`}>
                    <Search size={24} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Startpunt zoeken
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Voer een startadres in
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}