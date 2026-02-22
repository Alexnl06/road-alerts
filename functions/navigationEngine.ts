import { base44 } from '@/api/base44Client';

/**
 * Fetch geocoding suggestions using Nominatim API
 */
export async function fetchGeocodeAutocomplete({ query, boundingbox } = {}) {
  if (!query || query.length < 2) return [];
  
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: 10,
      countrycodes: 'nl',
    });
    
    if (boundingbox) {
      params.append('viewbox', `${boundingbox.west},${boundingbox.south},${boundingbox.east},${boundingbox.north}`);
      params.append('bounded', '1');
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { 
        headers: { 
          'Accept-Language': 'nl',
          'User-Agent': 'NavigationApp/1.0'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) {
      console.warn(`Nominatim returned ${response.status}`);
      return [];
    }
    
    const results = await response.json();
    return results.map(r => ({
      label: r.display_name,
      address: r.address || r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: r.type,
    }));
  } catch (error) {
    console.error('Geocode error:', error);
    return [];
  }
}

// Route cache (5 minute TTL)
const routeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-flight request lock
let inFlightRequest = null;

/**
 * Fetch directions/route via Base44 backend (OpenRouteService)
 */
export async function fetchRoute(start, end, alternatives = false, routePreference = 'fastest') {
  try {
    // Check cache first
    const cacheKey = `${start.lat},${start.lng}-${end.lat},${end.lng}-${routePreference}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Using cached route');
      return cached.routes;
    }

    // Wait if request in flight
    if (inFlightRequest) {
      console.log('⏳ Waiting for in-flight request...');
      await inFlightRequest;
    }

    // Create new request promise
    const requestPromise = base44.functions.invoke('getRoute', {
      startLat: start.lat,
      startLng: start.lng,
      endLat: end.lat,
      endLng: end.lng,
      includeTraffic: true,
    });

    inFlightRequest = requestPromise;

    const response = await requestPromise;
    inFlightRequest = null;

    if (response.status === 429) {
      throw new Error('Te veel aanvragen, wacht even');
    }

    if (!response.data?.routes || response.data.routes.length === 0) {
      throw new Error('Geen route gevonden');
    }

    const routes = response.data.routes;

    // Cache the result
    routeCache.set(cacheKey, {
      routes,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    for (const [key, value] of routeCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        routeCache.delete(key);
      }
    }

    return routes;
  } catch (error) {
    inFlightRequest = null;
    console.error('Route error:', error);
    throw error;
  }
}

/**
 * Calculate progress on polyline
 */
export function getProgressOnRoute(userLat, userLng, polyline) {
  let closest = { distance: Infinity, index: 0, lat: polyline[0][0], lng: polyline[0][1] };
  
  for (let i = 0; i < polyline.length; i++) {
    const dist = haversineDistance(userLat, userLng, polyline[i][0], polyline[i][1]);
    if (dist < closest.distance) {
      closest = { distance: dist, index: i, lat: polyline[i][0], lng: polyline[i][1] };
    }
  }
  
  return closest;
}

/**
 * Get the next instruction based on progress
 */
export function getNextInstruction(steps, userProgress) {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepStart = step.maneuver.location;
    const distToStep = haversineDistance(
      userProgress.lat,
      userProgress.lng,
      stepStart[1],
      stepStart[0]
    );
    
    if (distToStep > 0) {
      return {
        index: i,
        step: step,
        distance: distToStep,
        instruction: step.maneuver.instruction,
        modifier: step.maneuver.modifier,
        type: step.maneuver.type,
      };
    }
  }
  
  return null;
}

/**
 * Haversine distance in meters
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format time (seconds -> "5 min" or "1 h 20 min")
 */
export function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes} min`;
}

/**
 * Format distance (meters -> "500 m" or "2,5 km")
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return 'N/A';
  
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Check if user is significantly off route
 */
export function isOffRoute(userProgress, threshold = 50) {
  return userProgress.distance > threshold;
}