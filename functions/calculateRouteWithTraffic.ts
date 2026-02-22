Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const orsApiKey = Deno.env.get('ORS_API_KEY');
    if (!orsApiKey) {
      return Response.json({ error: 'ORS_API_KEY not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { startLat, startLng, endLat, endLng } = body;

    if (startLat == null || startLng == null || endLat == null || endLng == null) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch route from OpenRouteService
    const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const payload = {
      coordinates: [[startLng, startLat], [endLng, endLat]],
      format: 'geojson',
      elevation: false,
      instructions: true,
      alternative_routes: { target_count: 2, weight_factor: 1.4 }
    };

    const routeResponse = await fetch(orsUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': orsApiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    if (!routeResponse.ok) {
      const errorText = await routeResponse.text();
      console.error(`ORS error ${routeResponse.status}:`, errorText);
      return Response.json({ 
        error: `Route fetch failed: ${routeResponse.status}`, 
        details: errorText 
      }, { status: routeResponse.status });
    }

    const routeData = await routeResponse.json();

    if (!routeData.routes?.length) {
      return Response.json({ error: 'No routes found', routes: [], trafficData: null }, { status: 404 });
    }

    // Estimate traffic impact based on time of day (simplified)
    const now = new Date();
    const hour = now.getHours();
    let trafficMultiplier = 1.0;
    
    // Rush hour estimates (Netherlands)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      trafficMultiplier = 1.3; // 30% slower during rush hour
    } else if (hour >= 10 && hour <= 16) {
      trafficMultiplier = 1.1; // 10% slower during day
    }

    const routes = routeData.routes.map((route, idx) => {
      const baseDuration = route.summary.duration;
      const adjustedDuration = baseDuration * trafficMultiplier;

      return {
        id: idx,
        polyline: route.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: route.summary.distance,
        duration: baseDuration,
        adjustedDuration: adjustedDuration,
        trafficMultiplier: trafficMultiplier,
        legs: route.segments || [],
        steps: route.segments ? route.segments.flatMap(seg => seg.steps || []) : [],
        isAlternative: idx > 0,
        avgSpeed: Math.round((route.summary.distance / route.summary.duration) * 3.6),
      };
    });

    return Response.json({ 
      routes,
      trafficData: {
        multiplier: trafficMultiplier,
        peakHour: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19),
        message: trafficMultiplier > 1.1 ? 'Druk verkeer verwacht' : 'Normaal verkeer'
      }
    });
  } catch (error) {
    console.error('Route with traffic error:', error.message);
    return Response.json({ routes: [], trafficData: null }, { status: 500 });
  }
});