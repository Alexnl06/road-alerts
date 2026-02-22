import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const routeCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        ok: false, 
        error: 'UNAUTHORIZED', 
        details: 'Authentication required' 
      }, { status: 401 });
    }

    const apiKey = Deno.env.get('ORS_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        ok: false, 
        error: 'ORS_API_KEY_MISSING', 
        details: 'Set ORS_API_KEY in Base44 Secrets' 
      }, { status: 500 });
    }

    const { startLat, startLng, endLat, endLng, preference = 'fastest' } = await req.json();

    if (startLat == null || startLng == null || endLat == null || endLng == null) {
      return Response.json({ 
        ok: false, 
        error: 'MISSING_COORDINATES', 
        details: 'startLat, startLng, endLat, endLng are required' 
      }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${startLat},${startLng}-${endLat},${endLng}-${preference}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json({ ok: true, data: cached.data });
    }

    // Call OpenRouteService
    const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    
    const response = await fetch(orsUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [[startLng, startLat], [endLng, endLat]],
        preference: preference === 'shortest' ? 'shortest' : 'fastest',
        instructions: true,
        language: 'nl',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'ORS_RATE_LIMIT', 
        status: 429,
        details: 'Te veel aanvragen naar OpenRouteService. Wacht even en probeer opnieuw.' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ORS error ${response.status}:`, errorText);
      return Response.json({ 
        ok: false, 
        error: 'ORS_HTTP_ERROR', 
        status: response.status,
        details: `OpenRouteService fout: ${errorText.slice(0, 200)}` 
      }, { status: response.status });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return Response.json({ 
        ok: false, 
        error: 'ORS_PARSE_ERROR', 
        details: 'Kon OpenRouteService antwoord niet verwerken' 
      }, { status: 502 });
    }

    if (!data.features || data.features.length === 0) {
      return Response.json({ 
        ok: false, 
        error: 'NO_ROUTES_FOUND', 
        details: 'Geen route gevonden tussen deze locaties' 
      }, { status: 404 });
    }

    const feature = data.features[0];
    const properties = feature.properties;
    const summary = properties.summary;
    const segments = properties.segments || [];

    // Build polyline from GeoJSON coordinates
    const coordinates = feature.geometry?.coordinates || [];
    const polyline = coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]

    // Extract steps from segments
    const steps = [];
    segments.forEach(segment => {
      segment.steps?.forEach((step, idx) => {
        steps.push({
          index: idx,
          instruction: step.instruction || '',
          distance: step.distance || 0,
          duration: step.duration || 0,
          type: step.type || 'turn',
          name: step.name || '',
        });
      });
    });

    const routeData = {
      polyline,
      summary: {
        distance: summary.distance,
        duration: summary.duration,
      },
      steps,
      bbox: feature.bbox || null,
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

    return Response.json({ ok: true, data: routeData });
  } catch (error) {
    console.error('Route calculation error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});