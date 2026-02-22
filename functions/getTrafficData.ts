import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userLat, userLng, radiusKm = 5 } = body;

    if (!userLat || !userLng) {
      return Response.json([]);
    }

    // Get all traffic segments
    const segments = await base44.asServiceRole.entities.TrafficSegment.list('-created_date', 500);

    if (!segments) {
      return Response.json([]);
    }

    // Filter by radius
    const R = 6371; // Earth radius in km
    const filtered = segments.filter(seg => {
      const φ1 = userLat * Math.PI / 180;
      const φ2 = seg.lat * Math.PI / 180;
      const Δφ = (seg.lat - userLat) * Math.PI / 180;
      const Δλ = (seg.lng - userLng) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusKm;
    });

    return Response.json(filtered);
  } catch (error) {
    console.error('Traffic data error:', error);
    return Response.json([]);
  }
});