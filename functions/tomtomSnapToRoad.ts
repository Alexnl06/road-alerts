import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const { points, limit = 100 } = await req.json();

    if (!points || points.length === 0) {
      return Response.json({ ok: true, data: { snappedPoints: [] } });
    }

    // Limit points to avoid huge requests
    const limitedPoints = points.slice(0, Math.min(limit, 100));

    // Build points string for TomTom
    const pointsString = limitedPoints.map(p => `${p.lat},${p.lng}`).join(':');
    
    const baseUrl = `https://api.tomtom.com/routing/1/snapToRoads/json`;
    const params = new URLSearchParams({
      key: apiKey,
      points: pointsString,
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_RATE_LIMIT', 
        status: 429,
        details: 'Too many snap requests' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Snap error ${response.status}:`, errorText);
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
        details: 'Snap response is not valid JSON' 
      }, { status: 502 });
    }

    const snappedPoints = (data.snappedPoints || []).map(p => ({
      lat: p.latitude,
      lng: p.longitude,
    }));

    return Response.json({ ok: true, data: { snappedPoints } });
  } catch (error) {
    console.error('TomTom snap error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});