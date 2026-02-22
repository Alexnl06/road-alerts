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

    // Fetch route
    const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const payload = {
      coordinates: [[startLng, startLat], [endLng, endLat]],
      format: 'geojson',
      elevation: false,
      instructions: true,
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
      console.error(`ORS offline route error ${response.status}:`, errorText);
      return Response.json({ 
        route: null, 
        tilesToCache: [], 
        error: `Route fetch failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    if (!data.routes?.length) {
      return Response.json({ error: 'No routes found', route: null, tilesToCache: [] }, { status: 404 });
    }

    const route = data.routes[0];
    const polyline = route.geometry.coordinates.map(c => [c[1], c[0]]);

    // Calculate bounding box and tiles to cache
    const tilesToCache = calculateTilesToCache(polyline, 14); // Zoom level 14

    const offlineRoute = {
      id: Math.random().toString(36),
      polyline: polyline,
      distance: route.summary.distance,
      duration: route.summary.duration,
      legs: route.segments || [],
      steps: route.segments ? route.segments.flatMap(seg => seg.steps || []) : [],
      avgSpeed: Math.round((route.summary.distance / route.summary.duration) * 3.6),
      savedAt: new Date().toISOString(),
    };

    return Response.json({
      route: offlineRoute,
      tilesToCache: tilesToCache,
      message: `Route bereid voor offline gebruik. ${tilesToCache.length} kaartegels nodig.`
    });
  } catch (error) {
    console.error('Offline route error:', error.message);
    return Response.json({ route: null, tilesToCache: [], error: error.message }, { status: 500 });
  }
});

function calculateTilesToCache(polyline, zoomLevel) {
  const tiles = new Set();
  
  polyline.forEach(([lat, lng]) => {
    const tile = latlngToTile(lat, lng, zoomLevel);
    tiles.add(`${zoomLevel}/${tile.x}/${tile.y}`);
    
    // Add surrounding tiles for coverage
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        tiles.add(`${zoomLevel}/${tile.x + dx}/${tile.y + dy}`);
      }
    }
  });
  
  return Array.from(tiles);
}

function latlngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y };
}