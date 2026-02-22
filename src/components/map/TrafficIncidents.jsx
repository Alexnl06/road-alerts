import React, { useState, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';

const incidentIcon = (type) => L.divIcon({
  className: 'custom-incident-marker',
  html: `
    <div style="
      width: 32px; height: 32px; 
      background: ${type === 'accident' ? '#EF4444' : '#F59E0B'};
      border: 2px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 16px;
    ">
      ${type === 'accident' ? '💥' : '⚠️'}
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function TrafficIncidents({ showIncidents }) {
  const map = useMap();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!map || !showIncidents) return;

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

        if (response.status === 429) {
          console.log('Incidents rate limited');
          return;
        }

        setIncidents(response.data?.incidents || []);
      } catch (error) {
        if (error?.response?.status !== 429) {
          console.error('Incidents fetch error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchIncidents();

    // Update every 60 seconds
    const interval = setInterval(fetchIncidents, 60000);

    // Fetch on map move (debounced)
    let moveTimeout;
    const handleMove = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(fetchIncidents, 1000);
    };
    
    map.on('moveend', handleMove);

    return () => {
      clearInterval(interval);
      clearTimeout(moveTimeout);
      map.off('moveend', handleMove);
    };
  }, [map, showIncidents]);

  if (!showIncidents) return null;

  return (
    <>
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.lat, incident.lng]}
          icon={incidentIcon(incident.type)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{incident.type}</p>
              <p className="text-xs text-gray-600 mt-1">{incident.description}</p>
              {incident.severity && (
                <p className="text-xs text-red-600 mt-1">
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