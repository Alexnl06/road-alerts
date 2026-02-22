import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function SearchBar({ onLocationSelect, userLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [favoriteDestinations, setFavoriteDestinations] = useState([]);
  const timeoutRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isDark = user?.theme !== 'light';

  // Load destinations when search opens
  useEffect(() => {
    if (showResults && !query) {
      loadDestinations();
    }
  }, [showResults]);

  // Load destinations on mount
  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const [recent, favorites] = await Promise.all([
        base44.entities.RecentDestination.list('-created_date', 5),
        base44.entities.FavoriteDestination.list()
      ]);
      setRecentDestinations(recent || []);
      setFavoriteDestinations(favorites || []);
    } catch (error) {
      console.error('Error loading destinations:', error);
    }
  };

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      if (!query && showResults) {
        loadDestinations();
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await base44.functions.invoke('tomtomSearch', {
          query,
          country: 'NL',
          limit: 10,
          userLat: userLocation?.[0],
          userLng: userLocation?.[1]
        });
        // Handle both old and new response formats
        const results = data?.data?.results || data?.results || [];
        setResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setLoading(false);
    }, 400);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSelect = async (result) => {
    // Save to recent destinations
    if (result.label) {
      try {
        await base44.entities.RecentDestination.create({
          label: result.label,
          address: result.address || result.label,
          lat: result.lat,
          lng: result.lng,
        });
      } catch (error) {
        console.error('Error saving recent destination:', error);
      }
    }

    onLocationSelect({
      lat: result.lat,
      lng: result.lng,
      label: result.label,
      address: result.address,
    });
    setQuery(result.label);
    setResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-4 right-4 z-[800]"
    >
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
        <input
          type="text"
          placeholder="Waar wil je naartoe?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setShowResults(true);
            if (!query) loadDestinations();
          }}
          className={`w-full backdrop-blur-xl border rounded-2xl pl-11 pr-11 py-3 shadow-lg transition-all font-medium ${
            isDark 
              ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white placeholder-gray-500' 
              : 'bg-white/95 border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
        />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-2 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto ${
              isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
            }`}
          >
            {/* Search Results */}
            {query && (
              <>
                {loading && (
                  <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Zoeken...
                  </div>
                )}

                {results.length > 0 && (
                  <>
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(result)}
                        className={`w-full text-left p-3 flex items-start gap-3 transition-colors border-b ${
                          isDark 
                            ? 'hover:bg-[#2A2A2A] border-[#2A2A2A] last:border-0' 
                            : 'hover:bg-gray-100 border-gray-200 last:border-0'
                        }`}
                      >
                        <MapPin size={16} className="text-[#2F80ED] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {result.label.split(',')[0]}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {result.address}
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {!loading && results.length === 0 && (
                  <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Geen resultaten gevonden
                  </div>
                )}
              </>
            )}

            {/* Empty State with Help */}
            {!query && results.length === 0 && favoriteDestinations.length === 0 && recentDestinations.length === 0 && (
              <div className={`p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="text-sm">Typ een bestemming of voeg favorieten toe in Instellingen</p>
              </div>
            )}

            {/* Favorites Section */}
            {!query && favoriteDestinations.length > 0 && (
              <div className={`border-b ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'}`}>
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'bg-[#2A2A2A] text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  Favorieten
                </div>
                {favoriteDestinations.map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => handleSelect({ lat: fav.lat, lng: fav.lng, label: fav.label || fav.name })}
                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors border-b ${
                      isDark 
                        ? 'hover:bg-[#2A2A2A] border-[#2A2A2A] last:border-0'
                        : 'hover:bg-gray-100 border-gray-200 last:border-0'
                    }`}
                  >
                    <Heart size={16} className="text-red-500 shrink-0" />
                    <p className={`text-sm font-medium flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fav.label || (fav.name === 'home' ? '🏠 Thuis' : fav.name === 'work' ? '💼 Werk' : fav.name)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Section */}
            {!query && recentDestinations.length > 0 && (
              <div>
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'bg-[#2A2A2A] text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  Recente bestemmingen
                </div>
                {recentDestinations.map((recent) => (
                  <button
                    key={recent.id}
                    onClick={() => handleSelect({ lat: recent.lat, lng: recent.lng, label: recent.label, address: recent.address })}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors border-b ${
                      isDark 
                        ? 'hover:bg-[#2A2A2A] border-[#2A2A2A] last:border-0'
                        : 'hover:bg-gray-100 border-gray-200 last:border-0'
                    }`}
                  >
                    <Clock size={16} className={`${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {recent.label}
                      </p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {recent.address}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}