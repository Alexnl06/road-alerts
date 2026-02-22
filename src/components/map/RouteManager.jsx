import React, { useState } from 'react';
import { X, Plus, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDistance, calculateRouteTotalDistance } from '@/functions/routeOptimizer';

export default function RouteManager({ userLocation, waypoints, onAddWaypoint, onRemoveWaypoint, isDark }) {
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=3.4,50.7,7.3,53.5&bounded=1`
      );
      const results = await response.json();
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const handleSelectLocation = (location) => {
    onAddWaypoint([parseFloat(location.lat), parseFloat(location.lon)]);
    setSearchInput('');
    setSearchResults([]);
    setShowForm(false);
  };

  const totalDistance = userLocation && waypoints.length > 0 
    ? calculateRouteTotalDistance([userLocation, ...waypoints])
    : 0;

  return (
    <div className={`fixed top-28 left-4 right-4 z-[800] backdrop-blur-xl border rounded-2xl shadow-lg ${
      isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
    }`}>
      <div className="p-4 space-y-3">
        {/* Route Info */}
        {waypoints.length > 0 && (
          <div className={`text-sm p-2 rounded-lg ${
            isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'
          }`}>
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Route: {waypoints.length} bestemming{waypoints.length !== 1 ? 'en' : ''}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Totaal: {totalDistance.toFixed(1)} km
            </div>
          </div>
        )}

        {/* Waypoints List */}
        <AnimatePresence>
          {waypoints.map((waypoint, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin size={16} className="text-[#2F80ED] flex-shrink-0" />
                <div className="min-w-0">
                  <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Bestemming {idx + 1}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {waypoint[0].toFixed(3)}°, {waypoint[1].toFixed(3)}°
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemoveWaypoint(idx)}
                className={`p-1 rounded transition-colors flex-shrink-0 ${
                  isDark ? 'hover:bg-[#3A3A3A]' : 'hover:bg-gray-200'
                }`}
              >
                <X size={16} className={isDark ? 'text-gray-500' : 'text-gray-600'} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Waypoint Button */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              isDark ? 'bg-[#2F80ED]/20 text-[#2F80ED] hover:bg-[#2F80ED]/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Plus size={16} />
            Bestemming toevoegen
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Zoek een locatie..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                handleSearch(e.target.value);
              }}
              className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                isDark ? 'bg-[#2A2A2A] border border-[#3A3A3A] text-white placeholder-gray-500' : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            {loading && (
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Zoeken...
              </div>
            )}
            <AnimatePresence>
              {searchResults.map((result) => (
                <motion.button
                  key={result.osm_id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onClick={() => handleSelectLocation(result)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    isDark ? 'bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {result.display_name.split(',')[0]}
                </motion.button>
              ))}
            </AnimatePresence>
            <button
              onClick={() => {
                setShowForm(false);
                setSearchInput('');
                setSearchResults([]);
              }}
              className={`w-full py-2 text-sm rounded-lg transition-colors ${
                isDark ? 'bg-[#2A2A2A] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuleren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}