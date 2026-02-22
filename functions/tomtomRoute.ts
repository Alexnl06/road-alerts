import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const routeCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('TOMTOM_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_API_KEY_MISSING', 
        details: 'Set TOMTOM_API_KEY in Base44 Secrets' 
      }, { status: 500 });
    }

    const { startLat, startLng, endLat, endLng, routeType = 'fastest', traffic = true } = await req.json();

    if (startLat == null || startLng == null || endLat == null || endLng == null) {
      return Response.json({ 
        ok: false, 
        error: 'MISSING_COORDINATES', 
        details: 'startLat, startLng, endLat, endLng are required' 
      }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${startLat},${startLng}-${endLat},${endLng}-${routeType}-${traffic}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json({ ok: true, data: cached.data, cached: true });
    }

    // Build TomTom Routing API URL
    const locations = `${startLat},${startLng}:${endLat},${endLng}`;
    const baseUrl = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json`;
    
    const params = new URLSearchParams({
      key: apiKey,
      routeType: routeType,
      traffic: String(traffic),
      language: 'nl-NL',
      instructionsType: 'text',
      computeBestOrder: 'false',
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_RATE_LIMIT', 
        status: 429,
        details: 'Too many requests to TomTom API. Wait a moment and try again.' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Routing error ${response.status}:`, errorText);
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_HTTP_ERROR', 
        status: response.status,
        details: errorText.slice(0, 2000) 
      }, { status: response.status });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_PARSE_ERROR', 
        details: 'TomTom response is not valid JSON' 
      }, { status: 502 });
    }

    if (!data.routes || data.routes.length === 0) {
      return Response.json({ 
        ok: false, 
        error: 'NO_ROUTES_FOUND', 
        details: 'TomTom found no routes between these locations' 
      }, { status: 404 });
    }

    const route = data.routes[0];
    const summary = route.summary;
    const legs = route.legs || [];

    // Decode polyline
    const polyline = [];
    legs.forEach(leg => {
      leg.points?.forEach(point => {
        polyline.push([point.latitude, point.longitude]);
      });
    });

    // Extract maneuvers/steps
    const steps = [];
    legs.forEach(leg => {
      leg.guidance?.instructions?.forEach((instruction, idx) => {
        steps.push({
          index: idx,
          instruction: instruction.message || instruction.instructionType,
          distance: instruction.routeOffsetInMeters || 0,
          maneuverType: instruction.maneuver || 'turn',
          point: instruction.point ? [instruction.point.latitude, instruction.point.longitude] : null,
        });
      });
    });

    const routeData = {
      polyline,
      summary: {
        distanceMeters: summary.lengthInMeters,
        travelTimeSeconds: summary.travelTimeInSeconds,
        trafficDelaySeconds: summary.trafficDelayInSeconds || 0,
        departureTime: summary.departureTime,
        arrivalTime: summary.arrivalTime,
      },
      steps,
      bbox: {
        minLat: Math.min(...polyline.map(p => p[0])),
        maxLat: Math.max(...polyline.map(p => p[0])),
        minLng: Math.min(...polyline.map(p => p[1])),
        maxLng: Math.max(...polyline.map(p => p[1])),
      },
    };

    // Cache result
    routeCache.set(cacheKey, {
      data: routeData,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    for (const [key, value] of routeCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        routeCache.delete(key);
      }
    }

    return Response.json({ ok: true, data: routeData, cached: false });
  } catch (error) {
    console.error('TomTom route error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});