import React, { useState, useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';

const TRAFFIC_COLORS = {
  free: '#10B981',      // Green - jamFactor > 0.8
  slow: '#F59E0B',      // Orange - jamFactor 0.5-0.8
  heavy: '#EF4444',     // Red - jamFactor 0.2-0.5
  blocked: '#991B1B'    // Dark red - jamFactor < 0.2
};

function getColorFromJamFactor(jamFactor) {
  if (jamFactor >= 0.8) return TRAFFIC_COLORS.free;
  if (jamFactor >= 0.5) return TRAFFIC_COLORS.slow;
  if (jamFactor >= 0.2) return TRAFFIC_COLORS.heavy;
  return TRAFFIC_COLORS.blocked;
}

export default function TomTomTrafficOverlay({ enabled = true }) {
  const map = useMap();
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !map) return;

    const fetchTraffic = async () => {
      if (isLoading) return;
      
      try {
        setIsLoading(true);
        const bounds = map.getBounds();
        const bbox = {
          minLat: bounds.getSouth(),
          minLng: bounds.getWest(),
          maxLat: bounds.getNorth(),
          maxLng: bounds.getEast(),
        };

        const response = await base44.functions.invoke('tomtomTrafficFlow', { bbox });
        
        // Handle both old and new response formats
        const segments = response.data?.data?.segments || response.data?.segments || [];
        setSegments(segments);
      } catch (error) {
        if (error?.response?.status !== 429) {
          console.error('Traffic flow error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchTraffic();

    // Refetch on map move (debounced)
    let moveTimeout;
    const handleMove = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(fetchTraffic, 1000);
    };

    map.on('moveend', handleMove);

    // Periodic update (30 seconds)
    const interval = setInterval(fetchTraffic, 30000);

    return () => {
      map.off('moveend', handleMove);
      clearInterval(interval);
      clearTimeout(moveTimeout);
    };
  }, [enabled, map]);

  if (!enabled || segments.length === 0) return null;

  return (
    <>
      {segments.map((segment, idx) => {
        const color = getColorFromJamFactor(segment.jamFactor || 1);
        
        return (
          <Polyline
            key={idx}
            positions={segment.geometry}
            pathOptions={{
              color: color,
              weight: 4,
              opacity: 0.7,
            }}
          />
        );
      })}
    </>
  );
}