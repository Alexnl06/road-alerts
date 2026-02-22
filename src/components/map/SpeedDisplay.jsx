import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function SpeedDisplay() {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(50);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isPremium = user?.is_premium || false;
  const isDark = user?.theme !== 'light';

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Speed in m/s, convert to km/h
          const speedInKmh = (position.coords.speed || 0) * 3.6;
          setCurrentSpeed(Math.round(speedInKmh));
        },
        null,
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const isOverLimit = currentSpeed > speedLimit;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed top-20 left-4 z-[800]"
    >
      <div className={`backdrop-blur-xl border rounded-2xl shadow-lg overflow-hidden ${
        isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
      }`}>
        {isPremium ? (
          // Premium: Show actual speed + limit
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Current Speed */}
              <div className={`flex flex-col items-center ${
                isOverLimit ? 'text-red-500' : 'text-[#2F80ED]'
              }`}>
                <div className={`text-4xl font-bold leading-none ${
                  isOverLimit ? 'animate-pulse' : ''
                }`}>
                  {currentSpeed}
                </div>
                <div className="text-xs opacity-70 mt-1">km/h</div>
              </div>

              {/* Separator */}
              <div className={`w-px h-12 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-300'}`} />

              {/* Speed Limit */}
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                <div className="text-2xl font-semibold leading-none">
                  {speedLimit}
                </div>
                <div className="text-[10px] opacity-70 mt-1">limiet</div>
              </div>
            </div>
          </div>
        ) : (
          // Non-premium: Only show limit with premium badge
          <div className="p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} className="text-yellow-500" />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Premium
                </span>
              </div>
              <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {speedLimit}
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                km/h limiet
              </div>
            </div>
          </div>
        )}
      </div>

      {!isPremium && (
        <div className={`mt-2 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          <p>Upgrade voor snelheidsmeter</p>
        </div>
      )}
    </motion.div>
  );
}