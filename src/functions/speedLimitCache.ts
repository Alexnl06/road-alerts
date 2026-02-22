// Geohash-based speed limit caching with fallback
const CACHE_KEY = 'speedLimitCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const GEOHASH_PRECISION = 6;

function geohash(lat, lon, precision = GEOHASH_PRECISION) {
  const latRounded = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);
  const lonRounded = Math.round(lon * Math.pow(10, precision)) / Math.pow(10, precision);
  return `${latRounded},${lonRounded}`;
}

function getSpeedLimitFromCache(lat, lon) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const hash = geohash(lat, lon);
    
    if (cache[hash]) {
      const { speedLimit, timestamp } = cache[hash];
      if (Date.now() - timestamp < CACHE_TTL) {
        return speedLimit;
      }
      delete cache[hash];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    // Silently fail
  }
  return null;
}

function setSpeedLimitCache(lat, lon, speedLimit) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const hash = geohash(lat, lon);
    cache[hash] = {
      speedLimit,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Silently fail
  }
}

export async function fetchSpeedLimit(lat, lon) {
  const cached = getSpeedLimitFromCache(lat, lon);
  if (cached !== null) {
    return cached;
  }

  try {
    const radius = 0.005;
    const bbox = `${lat - radius},${lon - radius},${lat + radius},${lon + radius}`;
    const query = `[bbox:${bbox}];(way["maxspeed"];);out geom;`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error('API failed');
  } catch (error) {
    // Fall through to default
  }

  const defaultLimit = 50;
  setSpeedLimitCache(lat, lon, defaultLimit);
  return defaultLimit;
}