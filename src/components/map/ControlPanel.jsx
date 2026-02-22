import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { fetchSpeedLimit } from '@/functions/speedLimitCache';

export default function ControlPanel({ emergencyCount, speedCount, onReport }) {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(50);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isPremium = user?.is_premium || false;
  const isDark = user?.theme !== 'light';
  const isOverLimit = currentSpeed > speedLimit;

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const speedInKmh = (position.coords.speed || 0) * 3.6;
          setCurrentSpeed(Math.round(speedInKmh));
          
          // Fetch real speed limit for premium users
          if (isPremium) {
            const limit = await fetchSpeedLimit(position.coords.latitude, position.coords.longitude);
            setSpeedLimit(limit);
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isPremium]);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', damping: 20 }}
      className="fixed bottom-[68px] left-0 right-0 z-[500] px-4"
    >
      <div className="bg-[#1E1E1E] rounded-3xl p-4 shadow-2xl shadow-black/40" style={{ height: 110 }}>
        <div className="flex items-center justify-between h-full">
          <div className="flex gap-3">
            {/* Current Speed (Premium only) */}
            {isPremium ? (
              <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center ${
                isOverLimit ? 'bg-red-500/20 animate-pulse' : 'bg-[#2F80ED]/20'
              }`}>
                <div className={`text-xl font-bold leading-none ${
                  isOverLimit ? 'text-red-500' : 'text-[#2F80ED]'
                }`}>
                  {currentSpeed}
                </div>
                <div className={`text-[9px] mt-0.5 ${
                  isOverLimit ? 'text-red-400' : 'text-blue-400'
                }`}>
                  km/h
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex flex-col items-center justify-center">
                <Crown size={18} className="text-yellow-500" />
                <div className="text-gray-400 text-[8px] mt-0.5">premium</div>
              </div>
            )}
            
            {/* Speed Limit */}
            <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex flex-col items-center justify-center">
              <div className="text-white text-xl font-bold leading-none">{speedLimit}</div>
              <div className="text-gray-400 text-[9px] mt-0.5">limiet</div>
            </div>
          </div>

          <button
            onClick={onReport}
            className="h-14 flex-1 rounded-[20px] bg-[#2F80ED] hover:bg-[#2570D4] active:scale-95 
              text-white font-semibold text-base transition-all shadow-lg shadow-blue-500/25
              flex items-center justify-center gap-2 ml-2"
          >
            <span className="text-xl">+</span>
            Melding
          </button>
        </div>
      </div>
    </motion.div>
  );
}