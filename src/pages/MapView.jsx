import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import AlertMarker from '@/components/map/AlertMarker';
import ReportSheet from '@/components/map/ReportSheet';
import AlertDetailSheet from '@/components/map/AlertDetailSheet';
import ControlPanel from '@/components/map/ControlPanel';
import SearchBar from '@/components/map/SearchBar';

const NL_CENTER = [52.1326, 5.2913];
const NL_ZOOM = 8;

function LocationUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function MapView() {
  const [userLocation, setUserLocation] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const queryClient = useQueryClient();

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(NL_CENTER),
        { enableHighAccuracy: true }
      );
    } else {
      setUserLocation(NL_CENTER);
    }
  }, []);

  // Fetch active alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-active'],
    queryFn: () => base44.entities.Alert.filter({ status: 'active' }, '-created_date', 200),
    refetchInterval: 15000,
  });

  // Filter expired alerts client-side
  const activeAlerts = alerts.filter(a => {
    if (!a.expires_at) return true;
    return new Date(a.expires_at) > Date.now();
  });

  const emergencyCount = activeAlerts.filter(a => a.category === 'emergency').length;
  const speedCount = activeAlerts.filter(a => a.category === 'speed').length;

  // Create alert mutation
  const createAlert = useMutation({
    mutationFn: (data) => base44.entities.Alert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-active'] });
      toast.success('Melding geplaatst!', { description: 'Bedankt voor je bijdrage.' });
    },
  });

  // Vote mutation
  const voteAlert = useMutation({
    mutationFn: async ({ alertId, vote }) => {
      await base44.entities.AlertVote.create({ alert_id: alertId, vote });
      const alert = activeAlerts.find(a => a.id === alertId);
      if (alert) {
        const update = vote === 'confirm'
          ? { confirm_count: (alert.confirm_count || 0) + 1 }
          : { deny_count: (alert.deny_count || 0) + 1 };
        await base44.entities.Alert.update(alertId, update);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-active'] });
      toast.success('Stem geregistreerd');
      setSelectedAlert(null);
    },
  });

  // Flag mutation
  const flagAlert = useMutation({
    mutationFn: (alertId) =>
      base44.entities.AlertFlag.create({ alert_id: alertId, reason: 'inaccurate', status: 'pending' }),
    onSuccess: () => {
      toast.success('Melding gerapporteerd');
      setSelectedAlert(null);
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = base44.entities.Alert.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['alerts-active'] });
    });
    return unsub;
  }, [queryClient]);

  return (
    <div className="h-screen w-screen bg-[#121212] relative overflow-hidden">
      <style>{`
        .leaflet-container { background: #121212 !important; }
        .leaflet-popup-content-wrapper { background: #1E1E1E !important; border-radius: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; }
        .leaflet-popup-tip { background: #1E1E1E !important; }
        .leaflet-popup-close-button { color: #666 !important; }
        .leaflet-control-zoom { border: none !important; }
        .leaflet-control-zoom a { background: #1E1E1E !important; color: #fff !important; border: none !important; border-radius: 12px !important; width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; }
        .leaflet-control-zoom a:first-child { border-radius: 12px 12px 0 0 !important; }
        .leaflet-control-zoom a:last-child { border-radius: 0 0 12px 12px !important; }
        .leaflet-control-attribution { display: none !important; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(47,128,237,0.4); }
          50% { box-shadow: 0 0 16px 6px rgba(47,128,237,0.6); }
        }
      `}</style>

      <SearchBar />

      <MapContainer
        center={userLocation || NL_CENTER}
        zoom={userLocation ? 13 : NL_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {userLocation && <LocationUpdater position={userLocation} />}

        {/* User location dot */}
        {userLocation && (
          <>
            <CircleMarker
              center={userLocation}
              radius={24}
              pathOptions={{ color: 'transparent', fillColor: '#2F80ED', fillOpacity: 0.08 }}
            />
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{
                color: '#2F80ED',
                fillColor: '#2F80ED',
                fillOpacity: 1,
                weight: 3,
              }}
            />
          </>
        )}

        {/* Alert markers */}
        {activeAlerts.map(alert => (
          <AlertMarker
            key={alert.id}
            alert={alert}
            onClick={(a) => setSelectedAlert(a)}
          />
        ))}
      </MapContainer>

      <ControlPanel
        emergencyCount={emergencyCount}
        speedCount={speedCount}
        onReport={() => setReportOpen(true)}
      />

      <ReportSheet
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(data) => createAlert.mutateAsync(data)}
        userLocation={userLocation}
      />

      <AlertDetailSheet
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onVote={(alertId, vote) => voteAlert.mutateAsync({ alertId, vote })}
        onFlag={(alertId) => flagAlert.mutateAsync(alertId)}
      />
    </div>
  );
}