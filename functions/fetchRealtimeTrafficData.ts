import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tomtomApiKey = Deno.env.get('TOMTOM_API_KEY');
    if (!tomtomApiKey) {
      // Fall back to cached data if no API key
      const { lat, lng, radius = 5 } = await req.json();
      const allSegments = await base44.asServiceRole.entities.TrafficSegment.list('-updated_date', 50);
      
      const R = 6371;
      const filtered = allSegments.filter(segment => {
        const φ1 = lat * Math.PI / 180;
        const φ2 = segment.lat * Math.PI / 180;
        const Δφ = (segment.lat - lat) * Math.PI / 180;
        const Δλ = (segment.lng - lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c <= radius;
      });

      return Response.json({
        segments: filtered.map(s => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          road_name: s.road_name || 'Onbekend',
          congestion: s.congestion_level,
          delay_minutes: s.delay_minutes || 0,
        })),
        source: 'cached',
      });
    }

    const { lat, lng, radius = 5 } = await req.json();

    if (!lat || !lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch from TomTom Traffic Flow Segment Data API
    try {
      const latOffset = radius / 111;
      const lngOffset = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      // Sample multiple points in the area
      const samplePoints = [
        { lat, lng },
        { lat: lat + latOffset/2, lng },
        { lat: lat - latOffset/2, lng },
        { lat, lng: lng + lngOffset/2 },
        { lat, lng: lng - lngOffset/2 },
      ];

      const segments = [];
      
      for (const point of samplePoints) {
        const tomtomUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${point.lat},${point.lng}&key=${tomtomApiKey}`;
        
        const response = await fetch(tomtomUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.flowSegmentData) {
            const flow = data.flowSegmentData;
            
            // Calculate congestion
            const currentSpeed = flow.currentSpeed || 0;
            const freeFlowSpeed = flow.freeFlowSpeed || 100;
            const speedRatio = currentSpeed / (freeFlowSpeed || 1);
            
            let congestion = 'green';
            let delayMinutes = 0;
            
            if (speedRatio < 0.3) {
              congestion = 'dark_red';
              delayMinutes = Math.round((freeFlowSpeed - currentSpeed) / currentSpeed * 2);
            } else if (speedRatio < 0.5) {
              congestion = 'red';
              delayMinutes = Math.round((freeFlowSpeed - currentSpeed) / currentSpeed * 1.5);
            } else if (speedRatio < 0.7) {
              congestion = 'orange';
              delayMinutes = Math.round((freeFlowSpeed - currentSpeed) / currentSpeed);
            }
            
            if (congestion !== 'green') {
              const segment = {
                id: `tt-${Date.now()}-${Math.random()}`,
                lat: point.lat,
                lng: point.lng,
                road_name: flow.roadClosure ? `Gesloten weg` : 'Weg',
                congestion,
                delay_minutes: Math.max(0, delayMinutes),
              };
              
              segments.push(segment);
              
              // Cache in database
              try {
                await base44.asServiceRole.entities.TrafficSegment.create({
                  road_name: segment.road_name,
                  lat: point.lat,
                  lng: point.lng,
                  congestion_level: congestion,
                  delay_minutes: delayMinutes,
                });
              } catch (err) {
                console.error('Cache save error:', err);
              }
            }
          }
        }
      }

      return Response.json({ 
        segments,
        source: 'TomTom',
        cached: false,
        realtime: true
      });
    } catch (error) {
      console.error('TomTom traffic fetch error:', error);
      
      // Fallback to database cache
      const allSegments = await base44.asServiceRole.entities.TrafficSegment.list('-updated_date', 50);
      
      const R = 6371;
      const filtered = allSegments.filter(segment => {
        const φ1 = lat * Math.PI / 180;
        const φ2 = segment.lat * Math.PI / 180;
        const Δφ = (segment.lat - lat) * Math.PI / 180;
        const Δλ = (segment.lng - lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c <= radius;
      });

      return Response.json({
        segments: filtered.map(s => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          road_name: s.road_name || 'Onbekend',
          congestion: s.congestion_level,
          delay_minutes: s.delay_minutes || 0,
        })),
        source: 'cached',
      });
    }
  } catch (error) {
    console.error('Traffic data error:', error);
    return Response.json({ error: error.message, segments: [] }, { status: 500 });
  }
});