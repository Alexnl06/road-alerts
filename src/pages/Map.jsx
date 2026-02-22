import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

import AlertMarker from '../components/map/AlertMarker';
import ReportSheet from '../components/map/ReportSheet';
import AlertDetailSheet from '../components/map/AlertDetailSheet';
import ControlPanel from '../components/map/ControlPanel';
import ProximityPrompt from '../components/map/ProximityPrompt';
import TomTomTrafficOverlay from '../components/map/TomTomTrafficOverlay';
import TrafficIncidentsOverlay from '../components/map/TrafficIncidentsOverlay';
import TrafficLegend from '../components/map/TrafficLegend';
import OfflineCacheManager from '../components/map/OfflineCacheManager';
import InstallPrompt from '../components/InstallPrompt';

function LocationDot({ position }) {
  if (!position) return null;
  return (
    <Circle
      center={position}
      radius={20}
      pathOptions={{
        color: '#2F80ED',
        fillColor: '#2F80ED',
        fillOpacity: 0.8,
        weight: 3,
      }}
    />
  );
}

export default function MapPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isDark = user?.theme !== 'light';
  const mapLayer = user?.map_layer || 'dark';

  const [userLocation, setUserLocation] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);

  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [proximityAlert, setProximityAlert] = useState(null);
  const [shownProximityAlerts, setShownProximityAlerts] = useState(new Set());

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    ambulance: true,
    fire: true,
    police: true,
    rescue: true,
    undercover: true,
    other: true,
    mobile_check: true,
    fixed_camera: true,
    average_speed_zone: true,
    accident: true,
    roadworks: true,
    stationary_vehicle: true,
    animal: true,
    object: true,
  });

  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showIncidents, setShowIncidents] = useState(false);

  // Load user prefs
  useEffect(() => {
    if (!user) return;
    if (user.active_filters) setActiveFilters(user.active_filters);
    if (user.show_traffic_overlay !== undefined) setShowTrafficOverlay(user.show_traffic_overlay);
    if (user.show_incidents !== undefined) setShowIncidents(user.show_incidents);
  }, [user?.id]);

  // Save prefs (debounced)
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      base44.auth.updateMe({
        active_filters: activeFilters,
        show_traffic_overlay: showTrafficOverlay,
        show_incidents: showIncidents,
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [activeFilters, showTrafficOverlay, showIncidents, user?.id]);

  const mapConfig = useMemo(() => {
    if (mapLayer === 'dark') {
      return {
        url: isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        filter: isDark ? 'brightness(0.95) sepia(0.3) hue-rotate(190deg) saturate(2.5) contrast(1.1)' : 'none',
      };
    }
    if (mapLayer === 'terrain') {
      return {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; OpenStreetMap contributors &copy; OpenTopoMap',
        filter: isDark ? 'brightness(0.7) contrast(1.2)' : 'brightness(1) contrast(1)',
      };
    }
    // satellite
    return {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; Esri',
      filter: isDark ? 'brightness(0.8) contrast(1.1)' : 'brightness(1) contrast(1)',
      overlay: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
    };
  }, [mapLayer, isDark]);

  // Alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 500);
      const now = new Date();
      return allAlerts.filter(a => {
        if (a.status !== 'active') return false;
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        return true;
      });
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    // realtime refresh
    base44.entities.Alert.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });
  }, [queryClient]);

  // Geolocation (smooth + minder “stotteren”)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);

        // optioneel: km tracking (noise filter)
        if (previousLocation && user) {
          const R = 6371e3;
          const φ1 = previousLocation[0] * Math.PI / 180;
          const φ2 = loc[0] * Math.PI / 180;
          const Δφ = (loc[0] - previousLocation[0]) * Math.PI / 180;
          const Δλ = (loc[1] - previousLocation[1]) * Math.PI / 180;
          const a =
            Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const km = (R * c) / 1000;

          if (km > 0.005 && km < 1) {
            base44.auth.updateMe({
              total_km_driven: (user.total_km_driven || 0) + km,
            }).catch(() => {});
          }
        }

        setPreviousLocation(loc);
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 8000,
        timeout: 12000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.id, previousLocation]);

  // Proximity prompt (100m)
  useEffect(() => {
    if (!userLocation || !alerts.length) return;

    const [userLat, userLng] = userLocation;
    const R = 6371e3;

    const distanceM = (lat2, lng2) => {
      const φ1 = userLat * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - userLat) * Math.PI / 180;
      const Δλ = (lng2 - userLng) * Math.PI / 180;
      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const a of alerts) {
      if (!activeFilters[a.type]) continue;
      if (shownProximityAlerts.has(a.id)) continue;

      const d = distanceM(a.lat, a.lng);
      if (d <= 100) {
        setProximityAlert(a);
        setShownProximityAlerts(prev => new Set([...prev, a.id]));
        break;
      }
    }
  }, [userLocation, alerts, activeFilters, shownProximityAlerts]);

  // Mutations
  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Melding geplaatst!');
    },
    onError: (e) => {
      // dit vangt ook “429 / rate limit” gevallen beter op als Base44 dat doorgeeft
      toast.error('Er ging iets mis. Probeer opnieuw.');
      console.error(e);
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ alertId, vote }) => {
      const existingVotes = await base44.entities.AlertVote.filter({ alert_id: alertId });
      const userVote = existingVotes.find(v => v.created_by === user?.email);
      if (userVote) throw new Error('already_voted');

      await base44.entities.AlertVote.create({ alert_id: alertId, vote });

      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        await base44.entities.Alert.update(alertId, {
          confirm_count: vote === 'confirm' ? (alert.confirm_count || 0) + 1 : (alert.confirm_count || 0),
          deny_count: vote === 'deny' ? (alert.deny_count || 0) + 1 : (alert.deny_count || 0),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Stem geregistreerd');
      setDetailSheetOpen(false);
    },
    onError: (error) => {
      if (error.message === 'already_voted') toast.error('Je hebt al gestemd op deze melding');
      else toast.error('Er ging iets mis');
    },
  });

  const flagMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.AlertFlag.create({
        alert_id: alertId,
        reason: 'spam',
        status: 'pending',
      }),
    onSuccess: () => {
      toast.success('Melding gerapporteerd');
      setDetailSheetOpen(false);
    },
  });

  const handleReportSubmit = async (reportData) => {
    await createAlertMutation.mutateAsync(reportData);
    if (user) {
      base44.auth.updateMe({ alert_count: (user.alert_count || 0) + 1 }).catch(() => {});
    }
  };

  const filteredAlerts = useMemo(
    () => alerts.filter(a => activeFilters[a.type]),
    [alerts, activeFilters]
  );

  const emergencyAlerts = useMemo(
    () => filteredAlerts.filter(a => a.category === 'emergency'),
    [filteredAlerts]
  );

  const speedAlerts = useMemo(
    () => filteredAlerts.filter(a => a.category === 'speed'),
    [filteredAlerts]
  );

  const handleMarkerClick = (alert) => {
    setSelectedAlert(alert);
    setDetailSheetOpen(true);
  };

  const handleProximityVote = async (vote) => {
    if (!proximityAlert) return;
    await voteMutation.mutateAsync({ alertId: proximityAlert.id, vote });
    setProximityAlert(null);
  };

  return (
    <div className={`h-screen w-full relative ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <style>{`
        .leaflet-container { 
          background: ${isDark ? '#0A0A0A' : '#E5E5E5'}; 
          height: 100%; width: 100%;
        }
        .leaflet-tile { filter: ${mapConfig?.filter || 'none'}; }
        .leaflet-control-attribution { display: none !important; }
      `}</style>

      {userLocation ? (
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          preferCanvas={true}
        >
          <TileLayer
            key={`${mapLayer}-${isDark}`}
            url={mapConfig.url}
            attribution={mapConfig.attribution}
            maxZoom={19}
          />
          {mapConfig.overlay && (
            <TileLayer
              key={`${mapLayer}-overlay-${isDark}`}
              url={mapConfig.overlay}
              maxZoom={19}
            />
          )}

          <LocationDot position={userLocation} />

          <TomTomTrafficOverlay enabled={showTrafficOverlay} />
          <TrafficIncidentsOverlay enabled={showIncidents} isDark={isDark} />

          {filteredAlerts.map(alert => (
            <AlertMarker key={alert.id} alert={alert} onClick={handleMarkerClick} />
          ))}
        </MapContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-[#2F80ED] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <OfflineCacheManager userLocation={userLocation} isDark={isDark} />

      {showTrafficOverlay && (
        <div className="fixed top-20 left-4 z-[700]">
          <TrafficLegend isDark={isDark} />
        </div>
      )}

      {/* Filter button + menu */}
      <div className="fixed top-4 right-4 z-[800]">
        <button
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className={`backdrop-blur-xl border rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
            isDark
              ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]'
              : 'bg-white/95 border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium">Filter</span>
        </button>

        {filterMenuOpen && (
          <div
            className={`absolute top-14 right-0 backdrop-blur-xl border rounded-2xl shadow-2xl p-4 w-64 ${
              isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
            }`}
          >
            <h3 className={`font-semibold mb-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Toon op kaart
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
                className={`w-full p-2.5 rounded-xl text-left ${
                  showTrafficOverlay ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' : isDark ? 'bg-[#2A2A2A]/50' : 'bg-gray-100'
                }`}
              >
                🚗 Verkeersgegevens
              </button>

              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`w-full p-2.5 rounded-xl text-left ${
                  showIncidents ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' : isDark ? 'bg-[#2A2A2A]/50' : 'bg-gray-100'
                }`}
              >
                💥 Incidenten
              </button>
            </div>

            <button
              onClick={() => {
                const allTrue = Object.values(activeFilters).every(v => v);
                const next = Object.keys(activeFilters).reduce((acc, k) => ({ ...acc, [k]: !allTrue }), {});
                setActiveFilters(next);
              }}
              className={`w-full mt-3 p-2 rounded-xl text-xs font-medium ${
                isDark ? 'bg-[#2A2A2A] hover:bg-[#333] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              {Object.values(activeFilters).every(v => v) ? 'Alles uitschakelen' : 'Alles inschakelen'}
            </button>
          </div>
        )}
      </div>

      <ControlPanel
        emergencyCount={emergencyAlerts.length}
        speedCount={speedAlerts.length}
        onReport={() => setReportSheetOpen(true)}
      />

      <ReportSheet
        isOpen={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        onSubmit={handleReportSubmit}
        userLocation={userLocation}
      />

      <AlertDetailSheet
        alert={selectedAlert}
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        onVote={(alertId, vote) => voteMutation.mutate({ alertId, vote })}
        onFlag={(alertId) => flagMutation.mutate(alertId)}
      />

      {proximityAlert && (
        <ProximityPrompt
          alert={proximityAlert}
          onConfirm={() => handleProximityVote('confirm')}
          onDeny={() => handleProximityVote('deny')}
          onDismiss={() => setProximityAlert(null)}
        />
      )}

      <InstallPrompt />
    </div>
  );
}