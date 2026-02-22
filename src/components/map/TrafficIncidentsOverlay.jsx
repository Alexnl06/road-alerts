import React, { useState, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';

const INCIDENT_ICONS = {
  accident: '💥',
  roadworks: '🚧',
  closure: '🚫',
  jam: '🚗',
  weather: '🌧️',
  unknown: '⚠️',
};

function getIncidentIcon(type) {
  const emoji = INCIDENT_ICONS[type] || INCIDENT_ICONS.unknown;
  
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(239, 68, 68, 0.9);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function TrafficIncidentsOverlay({ enabled = true, isDark = true }) {
  const map = useMap();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !map) return;

    const fetchIncidents = async () => {
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

        const response = await base44.functions.invoke('tomtomTrafficIncidents', { bbox });
        
        // Handle both old and new response formats
        const incidents = response.data?.data?.incidents || response.data?.incidents || [];
        setIncidents(incidents);
      } catch (error) {
        if (error?.response?.status !== 429) {
          console.error('Traffic incidents error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchIncidents();

    // Refetch on map move (debounced)
    let moveTimeout;
    const handleMove = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(fetchIncidents, 1500);
    };

    map.on('moveend', handleMove);

    // Periodic update (60 seconds)
    const interval = setInterval(fetchIncidents, 60000);

    return () => {
      map.off('moveend', handleMove);
      clearInterval(interval);
      clearTimeout(moveTimeout);
    };
  }, [enabled, map]);

  if (!enabled || incidents.length === 0) return null;

  return (
    <>
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.lat, incident.lng]}
          icon={getIncidentIcon(incident.type)}
        >
          <Popup className={isDark ? 'dark-popup' : ''}>
            <div className="text-sm">
              <p className="font-semibold">{incident.description}</p>
              {incident.severity > 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  Vertraging: {incident.severity} min
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}