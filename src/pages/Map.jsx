import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Polyline, Marker, useMap } from 'react-leaflet';
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
import SpeedDisplay from '../components/map/SpeedDisplay';
import RouteManager from '../components/map/RouteManager';
import OfflineCacheManager from '../components/map/OfflineCacheManager';
import DestinationPicker from '../components/navigation/DestinationPicker';
import RouteOverview from '../components/navigation/RouteOverview';
import TurnByTurnNavigation from '../components/navigation/TurnByTurnNavigation';
import RoutePreferences from '../components/navigation/RoutePreferences';
import TrafficLegend from '../components/map/TrafficLegend';
import LocationNeededModal from '../components/navigation/LocationNeededModal';
import LoadingOverlay from '../components/navigation/LoadingOverlay';
import RouteErrorCard from '../components/navigation/RouteErrorCard';
import InstallPrompt from '../components/InstallPrompt';
import { fetchRoute, getProgressOnRoute, getNextInstruction, isOffRoute, formatTime, formatDistance } from '../functions/navigationEngine';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeManager } from '../components/utils/routeRequestManager';
import { apiCall } from '../components/utils/apiHelper';

function LocationMarker({ position, isFollowing, onMapMoved }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && isFollowing) {
      map.panTo(position);
    }
  }, [position, map, isFollowing]);

  useEffect(() => {
    if (!map) return;
    
    const handleInteraction = () => {
      onMapMoved();
    };
    
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
  const map = useMap();
  
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
    <div style="
      width: 48px; height: 48px; 
      display: flex; align-items: center; justify-content: center;
      position: relative;
    ">
      <div style="
        width: 16px; height: 16px; border-radius: 50%;
        background: #FF3B30;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(255,59,48,0.5);
      "></div>
      <div style="
        position: absolute; width: 32px; height: 32px; border-radius: 50%;
        border: 2px solid #FF3B30; opacity: 0.4;
        animation: pulse-ring 2s ease-out infinite;
      "></div>
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
  const [startLocation, setStartLocation] = useState(null);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [pendingDestination, setPendingDestination] = useState(null);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(null);
  const [shownProximityAlerts, setShownProximityAlerts] = useState(new Set());
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sprintStartSpeed, setSprintStartSpeed] = useState(null);
  const [sprintStartTime, setSprintStartTime] = useState(null);
  const [sprintTime, setSprintTime] = useState(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  
  // Navigation state
  const [navMode, setNavMode] = useState(null); // 'picker', 'overview', 'active'
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [navRoutes, setNavRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [nextInstruction, setNextInstruction] = useState(null);
  const [navRemainingDistance, setNavRemainingDistance] = useState(0);
  const [navRemainingTime, setNavRemainingTime] = useState(0);
  const [showMissedRoute, setShowMissedRoute] = useState(false);
  const [routePreference, setRoutePreference] = useState('balanced');
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  
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
    if (user?.active_filters) {
      setActiveFilters(user.active_filters);
    }
    if (user?.show_traffic_overlay !== undefined) {
      setShowTrafficOverlay(user.show_traffic_overlay);
    }
    if (user?.show_incidents !== undefined) {
      setShowIncidents(user.show_incidents);
    }
  }, [user?.id]);

  const mapLayer = user?.map_layer || 'dark';
  const isDark = user?.theme !== 'light';

  const getMapConfig = () => {
    if (mapLayer === 'dark') {
      return {
        url: isDark 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        filter: isDark ? 'brightness(0.95) sepia(0.3) hue-rotate(190deg) saturate(2.5) contrast(1.1)' : 'none'
      };
    }
    if (mapLayer === 'terrain') {
      return {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; OpenStreetMap contributors &copy; OpenTopoMap',
        filter: isDark ? 'brightness(0.7) contrast(1.2)' : 'brightness(1) contrast(1)'
      };
    }
    if (mapLayer === 'satellite') {
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri',
        filter: isDark ? 'brightness(0.8) contrast(1.1)' : 'brightness(1) contrast(1)',
        overlay: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
      };
    }
  };

  const mapConfig = getMapConfig();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-created_date', 500);
      const now = new Date();
      return allAlerts.filter(alert => {
        if (alert.status !== 'active') return false;
        if (alert.expires_at && new Date(alert.expires_at) < now) return false;
        return true;
      });
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    base44.entities.Alert.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });
  }, [queryClient]);

  // Get and watch user location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          const currentSpeedKmh = (position.coords.speed || 0) * 3.6;
          setUserLocation(newLocation);
          
          // Track 0-100 sprint
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
          
          // Track kilometers
          if (previousLocation) {
            const R = 6371e3;
            const φ1 = previousLocation[0] * Math.PI / 180;
            const φ2 = newLocation[0] * Math.PI / 180;
            const Δφ = (newLocation[0] - previousLocation[0]) * Math.PI / 180;
            const Δλ = (newLocation[1] - previousLocation[1]) * Math.PI / 180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c / 1000; // in km
            
            // Only count if distance is reasonable (not noise)
            if (distance > 0.005 && distance < 1) {
              if (user) {
                base44.auth.updateMe({ 
                  total_km_driven: (user.total_km_driven || 0) + distance 
                }).catch(() => {}); // Fire and forget
              }
            }
          }
          
          setPreviousLocation(newLocation);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user, sprintStartTime]);

  // Proximity detection
  useEffect(() => {
    if (!userLocation || !alerts.length) return;

    const PROXIMITY_RADIUS = 100; // meters
    const [userLat, userLng] = userLocation;

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    for (const alert of alerts) {
      const distance = calculateDistance(userLat, userLng, alert.lat, alert.lng);
      
      if (distance <= PROXIMITY_RADIUS && !shownProximityAlerts.has(alert.id)) {
        setProximityAlert(alert);
        setShownProximityAlerts(prev => new Set([...prev, alert.id]));
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
      // Check if user already voted
      const existingVotes = await base44.entities.AlertVote.filter({ alert_id: alertId });
      const userVote = existingVotes.find(v => v.created_by === user?.email);
      
      if (userVote) {
        throw new Error('already_voted');
      }

      await base44.entities.AlertVote.create({ alert_id: alertId, vote });
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        await base44.entities.Alert.update(alertId, {
          confirm_count: vote === 'confirm' ? (alert.confirm_count || 0) + 1 : alert.confirm_count,
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
      if (error.message === 'already_voted') {
        toast.error('Je hebt al gestemd op deze melding');
      } else {
        toast.error('Er ging iets mis');
      }
    },
  });

  const flagMutation = useMutation({
    mutationFn: (alertId) => 
      base44.entities.AlertFlag.create({ 
        alert_id: alertId, 
        reason: 'spam',
        status: 'pending' 
      }),
    onSuccess: () => {
      toast.success('Melding gerapporteerd');
      setDetailSheetOpen(false);
    },
  });

  const handleReportSubmit = async (reportData) => {
    await createAlertMutation.mutateAsync(reportData);
    if (user) {
      await base44.auth.updateMe({ alert_count: (user.alert_count || 0) + 1 });
    }
  };

  const filteredAlerts = alerts.filter(alert => activeFilters[alert.type]);
  const emergencyAlerts = filteredAlerts.filter(a => a.category === 'emergency');
  const speedAlerts = filteredAlerts.filter(a => a.category === 'speed');

  const handleMarkerClick = (alert) => {
    setSelectedAlert(alert);
    setDetailSheetOpen(true);
  };

  const handleAddWaypoint = async (location) => {
    const newWaypoints = [...waypoints, location];
    setWaypoints(newWaypoints);
    
     };

  const handleRemoveWaypoint = (index) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    
    if (newWaypoints.length === 0) {
      setOptimizedRoute(null);
    }
  };

  const handleProximityVote = async (vote) => {
    if (!proximityAlert) return;
    await voteMutation.mutateAsync({ alertId: proximityAlert.id, vote });
    setProximityAlert(null);
  };

  // Save filter preferences to user profile
  const saveFilterPreferences = async () => {
    if (user) {
      await base44.auth.updateMe({ 
        active_filters: activeFilters,
        show_traffic_overlay: showTrafficOverlay,
        show_incidents: showIncidents
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(saveFilterPreferences, 1000);
    return () => clearTimeout(timer);
  }, [activeFilters, showTrafficOverlay, showIncidents]);

  // Navigation handlers
  const handleStartDestinationPicker = () => {
    setNavMode('picker');
  };

  const handleSelectDestination = async (dest) => {
    console.log('🎯 Destination selected:', dest);
    setSelectedDestination(dest);
    setPendingDestination(dest);
    setRouteError(null);

    // Check if we have a start location
    const effectiveStart = startLocation || (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null);
    
    if (!effectiveStart) {
      console.log('⚠️ No start location - showing modal');
      setShowLocationModal(true);
      return;
    }

    console.log('📍 Start location:', effectiveStart);
    
    // Debounce route calculation (1.2 seconds)
    setTimeout(() => {
      calculateRoute(effectiveStart, dest);
    }, 1200);
  };

  const calculateRoute = async (start, dest) => {
    console.log('🚀 Calculating route from', start, 'to', dest);
    
    // Check cache first
    const cached = routeManager.getCached(start.lat, start.lng, dest.lat, dest.lng, routePreference);
    if (cached) {
      setNavRoutes(cached);
      setSelectedRouteIdx(0);
      setNavMode('overview');
      toast.success('Route berekend! (cached)');
      return;
    }
    
    // Check if we can make request
    const canRequest = routeManager.canMakeRequest();
    if (!canRequest.allowed) {
      if (canRequest.waitSeconds) {
        setRouteError(`${canRequest.reason}`);
        toast.error(canRequest.reason);
        return;
      }
      setTimeout(() => calculateRoute(start, dest), canRequest.waitMs || 1000);
      return;
    }
    
    setIsOptimizingRoute(true);
    setRouteError(null);
    routeManager.startRequest();

    try {
      const routeData = await apiCall('calculateRoute', {
        startLat: start.lat,
        startLng: start.lng,
        endLat: dest.lat,
        endLng: dest.lng,
        preference: routePreference,
      });

      routeManager.endRequest();

      console.log('✅ Route fetched:', routeData);

      // Validate polyline
      if (!routeData.polyline || !Array.isArray(routeData.polyline) || routeData.polyline.length < 2) {
        console.error('❌ Invalid polyline');
        setRouteError('Routegegevens zijn ongeldig');
        setIsOptimizingRoute(false);
        setNavMode(null);
        return;
      }

      // Format for UI
      const formattedRoute = {
        id: 0,
        polyline: routeData.polyline,
        distance: routeData.summary?.distance || 0,
        duration: routeData.summary?.duration || 0,
        adjustedDuration: routeData.summary?.duration || 0,
        steps: routeData.steps || [],
        hasTrafficData: false,
      };

      const routes = [formattedRoute];

      // Cache
      routeManager.setCache(start.lat, start.lng, dest.lat, dest.lng, routePreference, routes);
      routeManager.reset429();

      setNavRoutes(routes);
      setSelectedRouteIdx(0);
      setNavMode('overview');
      setIsOptimizingRoute(false);
      toast.success('Route berekend!');
    } catch (error) {
      routeManager.endRequest();
      
      if (error.code === 'ORS_RATE_LIMIT') {
        const { backoffSeconds } = routeManager.handle429();
        toast.error(`Even wachten... (${backoffSeconds}s)`);
      } else {
        toast.error('Route berekening mislukt');
      }
      
      console.error('❌ Route error:', error);
      
      setRouteError(error.details || error.message || 'Onbekende fout');
      setIsOptimizingRoute(false);
      setNavMode(null);
    }
  };

  const handleEnableLocation = () => {
    setShowLocationModal(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setStartLocation({ lat: loc[0], lng: loc[1] });
          toast.success('Locatie ingeschakeld');
          
          if (pendingDestination) {
            calculateRoute({ lat: loc[0], lng: loc[1] }, pendingDestination);
          }
        },
        () => {
          toast.error('Locatie kon niet worden opgehaald');
          setShowLocationModal(true);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handlePickOnMap = () => {
    setShowLocationModal(false);
    toast.info('Klik op de kaart om je startpunt te kiezen');
    // TODO: Implement map click handler for start location
  };

  const handleSearchStart = () => {
    setShowLocationModal(false);
    toast.info('Functie komt binnenkort beschikbaar');
  };

  const handleRetryRoute = () => {
    if (pendingDestination) {
      const effectiveStart = startLocation || (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null);
      if (effectiveStart) {
        calculateRoute(effectiveStart, pendingDestination);
      }
    }
  };

  const handleNewDestination = () => {
    setRouteError(null);
    setNavMode(null);
    setSelectedDestination(null);
    setPendingDestination(null);
  };

  const handleStartNavigation = () => {
    if (!navRoutes[selectedRouteIdx]) return;
    
    setNavigationActive(true);
    setCurrentStepIdx(0);
    setNavMode('active');
    setIsFollowingUser(true);
  };

  const handleStopNavigation = () => {
    setNavigationActive(false);
    setNavMode(null);
    setSelectedDestination(null);
    setNavRoutes([]);
    setCurrentStepIdx(0);
  };

  // Reroute throttle state
  const [lastRerouteTime, setLastRerouteTime] = React.useState(0);
  const REROUTE_THROTTLE = 15000; // 15 seconds

  const handleAutoReroute = async (currentPos, dest) => {
    if (!currentPos || !dest || !navigationActive) return;
    
    // Throttle reroute: max 1 per 15 seconds
    const now = Date.now();
    if (now - lastRerouteTime < REROUTE_THROTTLE) {
      console.log('⏱️ Reroute throttled');
      return;
    }
    
    setLastRerouteTime(now);
    
    try {
      const response = await base44.functions.invoke('tomtomRoute', {
        startLat: currentPos[0],
        startLng: currentPos[1],
        endLat: dest.lat,
        endLng: dest.lng,
        routeType: 'fastest',
        traffic: true,
      });

      if (response.status === 429) {
        console.log('🚫 Reroute rate limited');
        toast.error('Te veel aanvragen, wacht even');
        setShowMissedRoute(false);
        return;
      }

      if (response.data?.route) {
        const route = response.data.route;
        const formattedRoute = {
          id: 0,
          polyline: route.polyline,
          distance: route.summary.distanceMeters,
          duration: route.summary.travelTimeSeconds,
          adjustedDuration: route.summary.travelTimeSeconds + (route.summary.trafficDelaySeconds || 0),
          steps: route.steps,
          hasTrafficData: route.summary.trafficDelaySeconds > 0,
        };
        
        setNavRoutes([formattedRoute]);
        setSelectedRouteIdx(0);
        setCurrentStepIdx(0);
        setShowMissedRoute(false);
        toast.success('Route aangepast');
      }
    } catch (error) {
      console.error('Reroute error:', error);
      setShowMissedRoute(false);
    }
  };

  // Navigation logic - runs every 1-2 seconds when active
  useEffect(() => {
    if (!navigationActive || !userLocation || !navRoutes[selectedRouteIdx]) return;

    const route = navRoutes[selectedRouteIdx];
    const progress = getProgressOnRoute(userLocation[0], userLocation[1], route.polyline);

    // Check if off route (60m threshold)
    if (isOffRoute(progress, 60)) {
      if (!showMissedRoute) {
        setShowMissedRoute(true);
        toast.info('Herberekening van route...');
        
        // Auto-reroute - fetch new route from current position
        handleAutoReroute(userLocation, selectedDestination);
      }
      return;
    }

    // Get next instruction
    const nextInstr = getNextInstruction(route.steps, progress);
    setNextInstruction(nextInstr);

    if (nextInstr) {
      setCurrentStepIdx(nextInstr.index);
    }

    // Calculate remaining distance and time
    const remainingDist = route.polyline.slice(progress.index).reduce((sum, point, idx, arr) => {
      if (idx === 0) return 0;
      const R = 6371e3;
      const φ1 = arr[idx - 1][0] * Math.PI / 180;
      const φ2 = point[0] * Math.PI / 180;
      const Δφ = (point[0] - arr[idx - 1][0]) * Math.PI / 180;
      const Δλ = (point[1] - arr[idx - 1][1]) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return sum + R * c;
    }, 0);

    const remainingTime = (remainingDist / (route.distance || 1)) * (route.duration || 0);
    setNavRemainingDistance(remainingDist);
    setNavRemainingTime(remainingTime);
  }, [userLocation, navigationActive, navRoutes, selectedRouteIdx]);

  // Watch location during navigation
  useEffect(() => {
    if (!navigationActive) return;

    const interval = setInterval(() => {
      // Trigger navigation logic update
    }, 2000);

    return () => clearInterval(interval);
  }, [navigationActive]);

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
        .leaflet-control-attribution {
          display: none !important;
        }
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
          <LocationMarker position={userLocation} isFollowing={isFollowingUser && !destination} onMapMoved={() => setIsFollowingUser(false)} />
          {optimizedRoute && userLocation && (
            <>
              <Polyline
                positions={optimizedRoute}
                pathOptions={{
                  color: '#2F80ED',
                  weight: 5,
                  opacity: 0.9,
                }}
              />
              <Polyline
                positions={optimizedRoute}
                pathOptions={{
                  color: 'white',
                  weight: 2,
                  opacity: 0.8,
                }}
              />
              {waypoints.map((wp, idx) => (
                <Marker key={idx} position={wp} icon={destinationIcon} />
              ))}
            </>
          )}
          {navRoutes[selectedRouteIdx] && !navigationActive && navMode === 'overview' && 
           navRoutes[selectedRouteIdx].polyline && Array.isArray(navRoutes[selectedRouteIdx].polyline) && 
           navRoutes[selectedRouteIdx].polyline.length > 1 && (
            <>
              <Polyline
                positions={navRoutes[selectedRouteIdx].polyline}
                pathOptions={{
                  color: '#2F80ED',
                  weight: 5,
                  opacity: 0.9,
                }}
              />
              <Polyline
                positions={navRoutes[selectedRouteIdx].polyline}
                pathOptions={{
                  color: 'white',
                  weight: 2,
                  opacity: 0.8,
                }}
              />
              <Marker position={selectedDestination && [selectedDestination.lat, selectedDestination.lng] || destination} icon={destinationIcon} />
            </>
          )}
          {navigationActive && navRoutes[selectedRouteIdx] && 
           navRoutes[selectedRouteIdx].polyline && Array.isArray(navRoutes[selectedRouteIdx].polyline) && 
           navRoutes[selectedRouteIdx].polyline.length > 1 && (
            <>
              <Polyline
                positions={navRoutes[selectedRouteIdx].polyline}
                pathOptions={{
                  color: '#2F80ED',
                  weight: 5,
                  opacity: 0.9,
                }}
              />
              <Polyline
                positions={navRoutes[selectedRouteIdx].polyline}
                pathOptions={{
                  color: 'white',
                  weight: 2,
                  opacity: 0.8,
                }}
              />
            </>
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

      {/* Traffic Legend */}
      {showTrafficOverlay && (
        <div className="fixed top-20 left-4 z-[700]">
          <TrafficLegend isDark={isDark} />
        </div>
      )}
      
      {waypoints.length > 0 && userLocation && (
        <RouteManager 
          userLocation={userLocation} 
          waypoints={waypoints} 
          onAddWaypoint={handleAddWaypoint}
          onRemoveWaypoint={handleRemoveWaypoint}
          isDark={isDark}
        />
      )}

      {!navigationActive && (
        <SearchBar 
          userLocation={userLocation}
          onLocationSelect={handleSelectDestination}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isOptimizingRoute}
        message="Route wordt berekend..."
      />

      {/* Location Modal */}
      <LocationNeededModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onEnableLocation={handleEnableLocation}
        onPickOnMap={handlePickOnMap}
        onSearchStart={handleSearchStart}
        isDark={isDark}
      />

      {/* Route Error Card */}
      {routeError && !isOptimizingRoute && (
        <RouteErrorCard
          error={routeError}
          onRetry={handleRetryRoute}
          onNewDestination={handleNewDestination}
          isDark={isDark}
        />
      )}
      
      {/* Center Button - Bottom Right */}
      {userLocation && !isFollowingUser && (
        <button
          onClick={() => {
            setIsFollowingUser(true);
            setWaypoints([]);
            setOptimizedRoute(null);
            setDestination(null);
          }}
          className={`fixed bottom-24 right-4 z-[800] backdrop-blur-xl border rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
            isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]' : 'bg-white/95 border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V5m0 0L4 9m5-4l5 4m6 0v14m0 0l5-4m-5 4l-5-4" />
          </svg>
          Centreren
        </button>
      )}

      {/* Filter Button */}
      <div className="absolute top-4 right-4 z-[800]">
        <button
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className={`backdrop-blur-xl border rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
            isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]' : 'bg-white/95 border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium">Filter</span>
        </button>

        {/* Filter Menu */}
        {filterMenuOpen && (
          <div className={`absolute top-14 right-0 backdrop-blur-xl border rounded-2xl shadow-2xl p-4 w-64 ${
            isDark ? 'bg-[#1E1E1E]/95 border-[#2A2A2A]' : 'bg-white/95 border-gray-300'
          }`}>
            <h3 className={`font-semibold mb-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Toon op kaart</h3>
            
            <div className="space-y-2.5">
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Kaartlagen</p>
              <button
                onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  showTrafficOverlay 
                    ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' 
                    : isDark ? 'bg-[#2A2A2A]/50 border border-transparent' : 'bg-gray-100 border border-transparent'
                }`}
              >
                <span className="text-lg">🚗</span>
                <span className={`text-sm flex-1 text-left ${
                  showTrafficOverlay 
                    ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                    : isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  Verkeersgegevens
                </span>
                {showTrafficOverlay && (
                  <svg className="w-4 h-4 text-[#2F80ED]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  showIncidents 
                    ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' 
                    : isDark ? 'bg-[#2A2A2A]/50 border border-transparent' : 'bg-gray-100 border border-transparent'
                }`}
              >
                <span className="text-lg">💥</span>
                <span className={`text-sm flex-1 text-left ${
                  showIncidents 
                    ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                    : isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  Incidenten
                </span>
                {showIncidents && (
                  <svg className="w-4 h-4 text-[#2F80ED]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <p className={`text-xs uppercase tracking-wider pt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hulpdiensten</p>
              {['ambulance', 'fire', 'police', 'rescue', 'undercover', 'other'].map(type => {
                const config = {
                  ambulance: { label: 'Ambulance', emoji: '🚑' },
                  fire: { label: 'Brandweer', emoji: '🚒' },
                  police: { label: 'Politie', emoji: '🚔' },
                  rescue: { label: 'Rescue', emoji: '🚨' },
                  undercover: { label: 'Undercover', emoji: '🕵️' },
                  other: { label: 'Overig', emoji: '⚠️' },
                }[type];
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      activeFilters[type] 
                        ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' 
                        : isDark ? 'bg-[#2A2A2A]/50 border border-transparent' : 'bg-gray-100 border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <span className={`text-sm flex-1 text-left ${
                      activeFilters[type] 
                        ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                        : isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {config.label}
                    </span>
                    {activeFilters[type] && (
                      <svg className="w-4 h-4 text-[#2F80ED]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}

              <p className={`text-xs uppercase tracking-wider mt-4 pt-3 border-t ${
                isDark ? 'text-gray-400 border-[#2A2A2A]' : 'text-gray-600 border-gray-300'
              }`}>Flitsers</p>
              {['mobile_check', 'fixed_camera', 'average_speed_zone'].map(type => {
                const config = {
                  mobile_check: { label: 'Mobiele flitser', emoji: '📸' },
                  fixed_camera: { label: 'Vaste flitser', emoji: '📷' },
                  average_speed_zone: { label: 'Trajectcontrole', emoji: '🛣️' },
                }[type];
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      activeFilters[type] 
                        ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' 
                        : isDark ? 'bg-[#2A2A2A]/50 border border-transparent' : 'bg-gray-100 border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <span className={`text-sm flex-1 text-left ${
                      activeFilters[type] 
                        ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                        : isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {config.label}
                    </span>
                    {activeFilters[type] && (
                      <svg className="w-4 h-4 text-[#2F80ED]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}

              <p className={`text-xs uppercase tracking-wider mt-4 pt-3 border-t ${
                isDark ? 'text-gray-400 border-[#2A2A2A]' : 'text-gray-600 border-gray-300'
              }`}>Gevaren</p>
              {['accident', 'roadworks', 'stationary_vehicle', 'animal', 'object'].map(type => {
                const config = {
                  accident: { label: 'Ongeval', emoji: '💥' },
                  roadworks: { label: 'Wegwerkzaamheden', emoji: '🚧' },
                  stationary_vehicle: { label: 'Stilstaand voertuig', emoji: '🚗' },
                  animal: { label: 'Dier op de weg', emoji: '🦌' },
                  object: { label: 'Object op de weg', emoji: '📦' },
                }[type];
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      activeFilters[type] 
                        ? 'bg-[#2F80ED]/20 border border-[#2F80ED]/40' 
                        : isDark ? 'bg-[#2A2A2A]/50 border border-transparent' : 'bg-gray-100 border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <span className={`text-sm flex-1 text-left ${
                      activeFilters[type] 
                        ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                        : isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {config.label}
                    </span>
                    {activeFilters[type] && (
                      <svg className="w-4 h-4 text-[#2F80ED]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                const allTrue = Object.values(activeFilters).every(v => v);
                const newState = allTrue ? 
                  Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {}) :
                  Object.keys(activeFilters).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                setActiveFilters(newState);
              }}
              className={`w-full mt-3 p-2 rounded-xl text-xs font-medium transition-all ${
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

      {/* Navigation Components */}
      <DestinationPicker
        isOpen={navMode === 'picker'}
        onClose={() => setNavMode(null)}
        onSelectDestination={handleSelectDestination}
        userLocation={userLocation}
        isDark={isDark}
      />

      {navMode === 'overview' && navRoutes.length > 0 && (
        <RouteOverview
          routes={navRoutes}
          selectedRouteIdx={selectedRouteIdx}
          onSelectRoute={setSelectedRouteIdx}
          onStart={handleStartNavigation}
          onClose={() => {
            setNavMode(null);
            setSelectedDestination(null);
          }}
          destination={selectedDestination}
          isDark={isDark}
          preference={routePreference}
          onPreferenceChange={setRoutePreference}
          isOptimizing={isOptimizingRoute}
        />
      )}

      {navigationActive && navRoutes[selectedRouteIdx] && (
        <TurnByTurnNavigation
          route={navRoutes[selectedRouteIdx]}
          currentStepIdx={currentStepIdx}
          nextInstruction={nextInstruction}
          remainingDistance={navRemainingDistance}
          remainingTime={navRemainingTime}
          eta={new Date(Date.now() + navRemainingTime * 1000)}
          onStop={handleStopNavigation}
          isDark={isDark}
        />
      )}

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