import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { fetchGeocodeAutocomplete } from '@/functions/navigationEngine';
import { MapPin, Clock, Heart, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DestinationPicker({ isOpen, onClose, onSelectDestination, userLocation, isDark }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);

  const { data: recentDestinations = [] } = useQuery({
    queryKey: ['recentDestinations'],
    queryFn: () => base44.entities.RecentDestination.list('-created_date', 10),
    enabled: isOpen,
  });

  const { data: favoriteDestinations = [] } = useQuery({
    queryKey: ['favoriteDestinations'],
    queryFn: () => base44.entities.FavoriteDestination.list(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      const results = await fetchGeocodeAutocomplete({
        query: searchQuery,
        boundingbox: userLocation ? {
          west: userLocation[1] - 0.5,
          east: userLocation[1] + 0.5,
          south: userLocation[0] - 0.5,
          north: userLocation[0] + 0.5,
        } : null
      });
      setSuggestions(results);
      setLoading(false);
    }, 300);
  }, [searchQuery, userLocation]);

  const handleSelectDestination = async (destination) => {
    // Save to recent destinations
    await base44.entities.RecentDestination.create({
      label: destination.label,
      address: destination.address || destination.label,
      lat: destination.lat,
      lng: destination.lng,
    });

    onSelectDestination(destination);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`fixed inset-0 z-[1000] flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}
    >
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-gray-50 border-gray-200'} p-4 flex items-center gap-3`}>
        <button onClick={onClose} className="text-2xl">✕</button>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bestemming</h2>
      </div>

      {/* Search Input */}
      <div className={`border-b ${isDark ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-gray-200'} p-4`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
          isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'
        }`}>
          <Search size={18} className={isDark ? 'text-gray-500' : 'text-gray-600'} />
          <input
            type="text"
            placeholder="Waar wil je naartoe?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className={`flex-1 bg-transparent border-0 outline-none text-sm ${
              isDark ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-500'
            }`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={18} className={isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {/* Suggestions */}
        {searchQuery && (suggestions.length > 0 || loading) && (
          <div className={`border-b ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
            {loading && (
              <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                Zoeken...
              </div>
            )}
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectDestination(suggestion)}
                className={`w-full p-4 text-left border-b transition-colors ${
                  isDark 
                    ? 'bg-[#1E1E1E] border-[#2A2A2A] hover:bg-[#2A2A2A]' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#2F80ED] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {suggestion.label.split(',')[0]}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      {suggestion.address}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Favorites */}
        {!searchQuery && favoriteDestinations.length > 0 && (
          <div className={`border-b ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
            <div className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'bg-[#2A2A2A] text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              Favorieten
            </div>
            {favoriteDestinations.map((fav) => (
              <button
                key={fav.id}
                onClick={() => handleSelectDestination({ lat: fav.lat, lng: fav.lng, label: fav.label || fav.name })}
                className={`w-full p-4 text-left border-b transition-colors ${
                  isDark 
                    ? 'bg-[#1E1E1E] border-[#2A2A2A] hover:bg-[#2A2A2A]' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-red-500" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fav.label || (fav.name === 'home' ? '🏠 Thuis' : fav.name === 'work' ? '💼 Werk' : fav.name)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Destinations */}
        {!searchQuery && recentDestinations.length > 0 && (
          <div>
            <div className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'bg-[#2A2A2A] text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              Recente bestemmingen
            </div>
            {recentDestinations.map((recent) => (
              <button
                key={recent.id}
                onClick={() => handleSelectDestination({ lat: recent.lat, lng: recent.lng, label: recent.label, address: recent.address })}
                className={`w-full p-4 text-left border-b transition-colors ${
                  isDark 
                    ? 'bg-[#1E1E1E] border-[#2A2A2A] hover:bg-[#2A2A2A]' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Clock size={18} className={`${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {recent.label}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      {recent.address}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!searchQuery && recentDestinations.length === 0 && favoriteDestinations.length === 0 && (
          <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            <p className="text-sm">Zoek naar een locatie om te starten</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}