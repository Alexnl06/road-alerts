import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AlertMarker from '../components/map/AlertMarker';
import ReportSheet from '../components/map/ReportSheet';
import AlertDetailSheet from '../components/map/AlertDetailSheet';
import ControlPanel from '../components/map/ControlPanel';
import SearchBar from '../components/map/SearchBar';
import ProximityPrompt from '../components/map/ProximityPrompt';
import TomTomTrafficOverlay from '../components/map/TomTomTrafficOverlay';
import TrafficIncidentsOverlay from '../components/map/TrafficIncidentsOverlay';
import TrafficLegend from '../components/map/TrafficLegend';
import OfflineCacheManager from '../components/map/OfflineCacheManager';
import InstallPrompt from '../components/InstallPrompt';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ position, isFollowing, onMapMoved }) {
  const map = require('react-leaflet').useMap();

  useEffect(() => {
    if (position && isFollowing) {
      map.panTo(position);
    }
  }, [position, map, isFollowing]);

  useEffect(() => {
    if (!map) return;

    const handleInteraction = () => onMapMoved();

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
    };
  }, [map, onMapMoved]);

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

function MapController({ userLocation }) {
  const map = require('react-leaflet').useMap();

  useEffect(() => {
    if (userLocation) {
      map.panTo(userLocation);
    }
  }, [userLocation, map]);

  return null;
}

const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: `
    <div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;position:relative;">
      <div style="width:16px;height:16px;border-radius:50%;background:#FF3B30;border:3px solid white;box-shadow:0 2px 8px rgba(255,59,48,0.5);"></div>
      <div style="position:absolute;width:32px;height:32px;border-radius:50%;border:2px solid #FF3B30;opacity:0.4;animation:pulse-ring 2s ease-out infinite;"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default function MapPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);

  // “Route/Navigation” tijdelijk uit
  const [destination, setDestination] = useState(null);

  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [proximityAlert, setProximityAlert] = useState(null);
  const [shownProximityAlerts, setShownProximityAlerts] = useState(new Set());

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);

  const [sprintStartSpeed, setSprintStartSpeed] = useState(null);
  const [sprintStartTime, setSprintStartTime] = useState(null);
  const [sprintTime, setSprintTime] = useState(null);

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

  // Load user preferences on mount
  useEffect(() => {
    if (user?.active_filters) setActiveFilters(user.active_filters);
    if (user?.show_traffic_overlay !== undefined) setShowTrafficOverlay(user.show_traffic_overlay);
    if (user?.show_incidents !== undefined) setShowIncidents(user.show_incidents);
  }, [user?.id]);

  const mapLayer = user?.map_layer || 'dark';
  const isDark = user?.theme !== 'light';

  const getMapConfig = () => {
    if (mapLayer === 'dark') {
      return {
        url: isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        filter: isDark
          ? 'brightness(0.95) sepia(0.3) hue-rotate(190deg) saturate(2.5) contrast(1.1)'
          : 'none',
      };
    }
    if (mapLayer === 'terrain') {
      return {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; OpenTopoMap',
        filter: isDark ? 'brightness(0.7) contrast(1.2)' : 'brightness(1) contrast(1)',
      };
    }
    if (mapLayer === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri',
        filter: isDark ? 'brightness(0.8) contrast(1.1)' : 'brightness(1) contrast(1)',
        overlay: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      };
    }
    // fallback
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      filter: 'none',
    };
  };

  const mapConfig = getMapConfig();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 500);
      const now = new Date();
      return allAlerts.filter((alert) => {
        if (alert.status !== 'active') return false;
        if (alert.expires_at && new Date(alert.expires_at) < now) return false;
        return true;
      });
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    // live updates
    base44.entities.Alert.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });
  }, [queryClient]);

  // Location watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = [position.coords.latitude, position.coords.longitude];
        const currentSpeedKmh = (position.coords.speed || 0) * 3.6;

        setUserLocation(newLocation);

        // Sprint tracking
        if (currentSpeedKmh >= 5 && !sprintStartTime) {
          setSprintStartSpeed(currentSpeedKmh);
          setSprintStartTime(Date.now());
        } else if (sprintStartTime && currentSpeedKmh >= 100) {
          const elapsed = (Date.now() - sprintStartTime) / 1000;
          setSprintTime(elapsed);
        } else if (currentSpeedKmh < 5 && sprintStartTime) {
          setSprintStartSpeed(null);
          setSprintStartTime(null);
        }

        // KM tracking (fire & forget)
        if (previousLocation) {
          const R = 6371e3;
          const φ1 = (previousLocation[0] * Math.PI) / 180;
          const φ2 = (newLocation[0] * Math.PI) / 180;
          const Δφ = ((newLocation[0] - previousLocation[0]) * Math.PI) / 180;
          const Δλ = ((newLocation[1] - previousLocation[1]) * Math.PI) / 180;
          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = (R * c) / 1000;

          if (distanceKm > 0.005 && distanceKm < 1) {
            if (user) {
              base44.auth
                .updateMe({ total_km_driven: (user.total_km_driven || 0) + distanceKm })
                .catch(() => {});
            }
          }
        }

        setPreviousLocation(newLocation);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, sprintStartTime, previousLocation]);

  // Proximity detection
  useEffect(() => {
    if (!userLocation || !alerts.length) return;

    const PROXIMITY_RADIUS = 100; // meters
    const [userLat, userLng] = userLocation;

    const calcDist = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const alert of alerts) {
      const distance = calcDist(userLat, userLng, alert.lat, alert.lng);
      if (distance <= PROXIMITY_RADIUS && !shownProximityAlerts.has(alert.id)) {
        setProximityAlert(alert);
        setShownProximityAlerts((prev) => new Set([...prev, alert.id]));
        break;
      }
    }
  }, [userLocation, alerts, shownProximityAlerts]);

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Melding geplaatst!');
    },
    onError: () => {
      toast.error('Fout bij plaatsen melding');
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ alertId, vote }) => {
      const existingVotes = await base44.entities.AlertVote.filter({ alert_id: alertId });
      const userVote = existingVotes.find((v) => v.created_by === user?.email);

      if (userVote) throw new Error('already_voted');

      await base44.entities.AlertVote.create({ alert_id: alertId, vote });

      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        await base44.entities.Alert.update(alertId, {
          confirm_count:
            vote === 'confirm' ? (alert.confirm_count || 0) + 1 : alert.confirm_count,
          deny_count: vote === 'deny' ? (alert.deny_count || 0) + 1 : alert.deny_count,
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
      await base44.auth.updateMe({ alert_count: (user.alert_count || 0) + 1 }).catch(() => {});
    }
  };

  const filteredAlerts = alerts.filter((alert) => activeFilters[alert.type]);

  const emergencyAlerts = filteredAlerts.filter((a) => a.category === 'emergency');
  const speedAlerts = filteredAlerts.filter((a) => a.category === 'speed');

  const handleMarkerClick = (alert) => {
    setSelectedAlert(alert);
    setDetailSheetOpen(true);
  };

  const handleProximityVote = async (vote) => {
    if (!proximityAlert) return;
    await voteMutation.mutateAsync({ alertId: proximityAlert.id, vote });
    setProximityAlert(null);
  };

  // Save filter preferences
  const saveFilterPreferences = async () => {
    if (!user) return;
    await base44.auth
      .updateMe({
        active_filters: activeFilters,
        show_traffic_overlay: showTrafficOverlay,
        show_incidents: showIncidents,
      })
      .catch(() => {});
  };

  useEffect(() => {
    const timer = setTimeout(saveFilterPreferences, 1000);
    return () => clearTimeout(timer);
  }, [activeFilters, showTrafficOverlay, showIncidents]);

  // “Route” / zoeken: coming soon
  const handleSelectDestination = (dest) => {
    setDestination(dest);
    toast.info('Navigatie komt binnenkort (V2).');
  };

  return (
    <div className={`h-screen w-full relative ${isDark ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
      <style>{`
        .leaflet-container { 
          background: ${isDark ? '#0A0A0A' : '#E5E5E5'}; 
          height: 100%; 
          width: 100%;
        }
        .leaflet-tile { 
          filter: ${mapConfig?.filter || 'none'};
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: #1E1E1E;
          color: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        }
        .dark-popup .leaflet-popup-tip {
          background: #1E1E1E;
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }
        .leaflet-control-attribution { display: none !important; }
      `}</style>

      {userLocation ? (
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
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

          {isFollowingUser && !destination && <MapController userLocation={userLocation} />}
          <LocationMarker
            position={userLocation}
            isFollowing={isFollowingUser && !destination}
            onMapMoved={() => setIsFollowingUser(false)}
          />

          {/* Destination marker (coming soon) */}
          {destination?.lat && destination?.lng && (
            <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
          )}

          <TomTomTrafficOverlay enabled={showTrafficOverlay} />
          <TrafficIncidentsOverlay enabled={showIncidents} isDark={isDark} />

          {filteredAlerts.map((alert) => (
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

      {!createAlertMutation.isPending && (
        <SearchBar userLocation={userLocation} onLocationSelect={handleSelectDestination} />
      )}

      {/* Center Button */}
      {userLocation && !isFollowingUser && (
        <button
          onClick={() => {
            setIsFollowingUser(true);
            setDestination(null);
          }}
          className={`fixed bottom-24 right-4 z-[800] backdrop-blur-xl border rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
            isDark
              ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]'
              : 'bg-white/95 border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium">Centreren</span>
        </button>
      )}

      {/* Filter Button */}
      <div className="absolute top-4 right-4 z-[800]">
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
                className={`w-full p-2.5 rounded-xl transition-all ${
                  showTrafficOverlay ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' : 'opacity-80'
                }`}
              >
                Verkeersgegevens: {showTrafficOverlay ? 'Aan' : 'Uit'}
              </button>

              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`w-full p-2.5 rounded-xl transition-all ${
                  showIncidents ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' : 'opacity-80'
                }`}
              >
                Incidenten: {showIncidents ? 'Aan' : 'Uit'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ControlPanel
        emergencyCount={emergencyAlerts.length}
        speedCount={speedAlerts.length}
        onReport={() => setReportSheetOpen(true)}
      />

      {/* Report & Alert Sheets */}
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