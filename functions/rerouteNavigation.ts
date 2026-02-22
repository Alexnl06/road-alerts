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
    const { currentLat, currentLng, destLat, destLng } = body;

    if (currentLat == null || currentLng == null || destLat == null || destLng == null) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch new route from current position
    const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const payload = {
      coordinates: [[currentLng, currentLat], [destLng, destLat]],
      format: 'geojson',
      elevation: false,
      instructions: true,
      alternative_routes: { target_count: 1, weight_factor: 1.2 }
    };

    const response = await fetch(orsUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': orsApiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ORS reroute error ${response.status}:`, errorText);
      return Response.json({ 
        route: null, 
        error: `Reroute failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    if (!data.routes?.length) {
      return Response.json({ route: null, error: 'No route found' }, { status: 404 });
    }

    const route = data.routes[0];
    const newRoute = {
      id: 0,
      polyline: route.geometry.coordinates.map(c => [c[1], c[0]]),
      distance: route.summary.distance,
      duration: route.summary.duration,
      legs: route.segments || [],
      steps: route.segments ? route.segments.flatMap(seg => seg.steps || []) : [],
      isAlternative: false,
      avgSpeed: Math.round((route.summary.distance / route.summary.duration) * 3.6),
    };

    return Response.json({ 
      route: newRoute,
      distanceSaved: 0,
      timeSaved: 0
    });
  } catch (error) {
    console.error('Reroute error:', error.message);
    return Response.json({ route: null, error: error.message }, { status: 500 });
  }
});