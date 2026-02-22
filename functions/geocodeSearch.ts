import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { query, userLocation } = body;

    if (!query || query.length < 2) {
      return Response.json([]);
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: 10,
      countrycodes: 'nl',
    });

    if (userLocation) {
      const { lat, lng } = userLocation;
      const west = lng - 1;
      const east = lng + 1;
      const south = lat - 1;
      const north = lat + 1;
      params.append('viewbox', `${west},${south},${east},${north}`);
      params.append('bounded', '0');
    }

    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'Accept-Language': 'nl',
          'User-Agent': 'NavigationApp/1.0',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return Response.json([]);
    }

    let results = await response.json();

    // If no results with bounding box, try without it (wider search)
    if (results.length === 0 && userLocation) {
      params.delete('viewbox');
      params.delete('bounded');
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'Accept-Language': 'nl',
            'User-Agent': 'NavigationApp/1.0',
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        results = await response.json();
      }
    }

    const formatted = results.map(r => ({
      label: r.display_name,
      address: r.address || r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: r.type,
    }));

    return Response.json(formatted);
  } catch (error) {
    console.error('Geocode error:', error);
    return Response.json([]);
  }
});