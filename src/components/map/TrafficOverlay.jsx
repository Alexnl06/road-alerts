import React, { useState, useEffect } from 'react';
import { Circle } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';

const TRAFFIC_COLORS = {
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  dark_red: '#991B1B'
};

export default function TrafficOverlay({ userLocation, radius = 5 }) {
  const [trafficSegments, setTrafficSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userLocation) return;

    const fetchTraffic = async () => {
      if (isLoading) return;
      
      try {
        setIsLoading(true);
        const { data } = await base44.functions.invoke('getTrafficData', {
          userLat: userLocation[0],
          userLng: userLocation[1],
          radiusKm: radius,
        });
        setTrafficSegments(data || []);
      } catch (error) {
        if (error?.response?.status !== 429) {
          console.error('Traffic fetch error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchTraffic();

    // Update every 3 minutes to avoid rate limits
    const interval = setInterval(fetchTraffic, 180000);

    return () => clearInterval(interval);
  }, [userLocation, radius]);

  return (
    <>
      {trafficSegments.map((segment) => (
        <Circle
          key={segment.id}
          center={[segment.lat, segment.lng]}
          radius={300}
          pathOptions={{
            color: TRAFFIC_COLORS[segment.congestion_level] || TRAFFIC_COLORS.green,
            fillColor: TRAFFIC_COLORS[segment.congestion_level] || TRAFFIC_COLORS.green,
            fillOpacity: 0.3,
            weight: 3,
            opacity: 0.6,
          }}
        >
          <L.Popup>
            <div className="text-sm">
              <p className="font-medium">{segment.road_name}</p>
              <p className="text-xs text-gray-600">
                {segment.delay_minutes} min vertraging
              </p>
            </div>
          </L.Popup>
        </Circle>
      ))}
    </>
  );
}