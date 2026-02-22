import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lat, lng, radius = 5 } = await req.json();

    if (!lat || !lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch traffic segments from database
    const trafficSegments = await base44.asServiceRole.entities.TrafficSegment.filter(
      {
        // Simple radius filter - in production use geohashing
      },
      '-updated_date',
      100
    );

    // Filter by distance
    const R = 6371; // Earth radius in km
    const filteredSegments = trafficSegments.filter(segment => {
      const φ1 = lat * Math.PI / 180;
      const φ2 = segment.lat * Math.PI / 180;
      const Δφ = (segment.lat - lat) * Math.PI / 180;
      const Δλ = (segment.lng - lng) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= radius;
    });

    // Calculate impact on routes
    const trafficImpact = {
      segments: filteredSegments.map(s => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        road: s.road_name,
        congestion: s.congestion_level,
        delay: s.delay_minutes,
      })),
      averageCongestion: filteredSegments.length > 0
        ? filteredSegments.reduce((sum, s) => sum + (s.delay_minutes || 0), 0) / filteredSegments.length
        : 0,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(trafficImpact);
  } catch (error) {
    console.error('Traffic data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});