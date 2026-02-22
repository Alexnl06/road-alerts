// Singleton route request manager to prevent ORS rate limiting (429)
class RouteRequestManager {
  constructor() {
    this.inFlight = false;
    this.lastRequestAt = 0;
    this.backoffUntil = 0;
    this.backoffCount = 0;
    this.routeCache = new Map();
    this.CACHE_TTL = 180000; // 3 minutes
    this.MIN_REQUEST_INTERVAL = 1200; // 1.2 seconds between requests
    this.MAX_REROUTE_INTERVAL = 10000; // 10 seconds between reroutes
    this.lastRerouteAt = 0;
  }

  getCacheKey(startLat, startLng, endLat, endLng, preference = 'balanced') {
    return `${startLat.toFixed(4)},${startLng.toFixed(4)}|${endLat.toFixed(4)},${endLng.toFixed(4)}|${preference}`;
  }

  getCached(startLat, startLng, endLat, endLng, preference) {
    const key = this.getCacheKey(startLat, startLng, endLat, endLng, preference);
    const cached = this.routeCache.get(key);
    
    if (cached && Date.now() - cached.createdAt < this.CACHE_TTL) {
      console.log('✅ Using cached route');
      return cached.routes;
    }
    
    return null;
  }

  setCache(startLat, startLng, endLat, endLng, preference, routes) {
    const key = this.getCacheKey(startLat, startLng, endLat, endLng, preference);
    this.routeCache.set(key, { routes, createdAt: Date.now() });
    
    // Limit cache size
    if (this.routeCache.size > 50) {
      const firstKey = this.routeCache.keys().next().value;
      this.routeCache.delete(firstKey);
    }
  }

  canMakeRequest() {
    const now = Date.now();
    
    if (this.inFlight) {
      console.log('⚠️ Request already in flight');
      return { allowed: false, reason: 'Request already in progress' };
    }
    
    if (now < this.backoffUntil) {
      const waitSeconds = Math.ceil((this.backoffUntil - now) / 1000);
      console.log(`⏳ Backoff active, wait ${waitSeconds}s`);
      return { allowed: false, reason: `Even wachten... (${waitSeconds}s)`, waitSeconds };
    }
    
    const timeSinceLastRequest = now - this.lastRequestAt;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitMs = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏱️ Throttling, wait ${waitMs}ms`);
      return { allowed: false, reason: 'Throttling', waitMs };
    }
    
    return { allowed: true };
  }

  canReroute() {
    const now = Date.now();
    if (now - this.lastRerouteAt < this.MAX_REROUTE_INTERVAL) {
      return false;
    }
    return true;
  }

  startRequest() {
    this.inFlight = true;
    this.lastRequestAt = Date.now();
  }

  endRequest() {
    this.inFlight = false;
  }

  markReroute() {
    this.lastRerouteAt = Date.now();
  }

  handle429() {
    this.backoffCount++;
    let backoffMs;
    
    if (this.backoffCount === 1) {
      backoffMs = 2000; // 2 seconds
    } else if (this.backoffCount === 2) {
      backoffMs = 5000; // 5 seconds
    } else {
      backoffMs = 15000; // 15 seconds
    }
    
    this.backoffUntil = Date.now() + backoffMs;
    console.log(`🚫 429 received, backing off ${backoffMs}ms`);
    
    return { backoffSeconds: Math.ceil(backoffMs / 1000) };
  }

  reset429() {
    this.backoffCount = 0;
    this.backoffUntil = 0;
  }

  clearCache() {
    this.routeCache.clear();
  }
}

// Export singleton instance
export const routeManager = new RouteRequestManager();