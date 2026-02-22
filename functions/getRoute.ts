Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const orsApiKey = Deno.env.get('ORS_API_KEY');
    if (!orsApiKey) {
      return Response.json({ error: 'ORS_API_KEY not configured' }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { startLat, startLng, endLat, endLng, includeTraffic = false } = body;

    if (startLat == null || startLng == null || endLat == null || endLng == null) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch TomTom traffic data if requested
    const tomtomApiKey = Deno.env.get('TOMTOM_API_KEY');
    let trafficData = null;
    
    if (includeTraffic && tomtomApiKey) {
      try {
        const trafficUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${startLat},${startLng}&key=${tomtomApiKey}`;
        const trafficResponse = await fetch(trafficUrl, { signal: AbortSignal.timeout(3000) });
        
        if (trafficResponse.ok) {
          trafficData = await trafficResponse.json();
        }
      } catch (error) {
        console.log('TomTom traffic data unavailable:', error.message);
      }
    } else if (includeTraffic && !tomtomApiKey) {
      console.log('TomTom API key not configured, skipping traffic data');
    }

    const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    const payload = {
      coordinates: [[startLng, startLat], [endLng, endLat]],
      instructions: true
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

    if (response.status === 429) {
      return Response.json({ 
        error: 'RATE_LIMIT', 
        message: 'Te veel route-aanvragen, wacht even.' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ORS error ${response.status}:`, errorText);
      return Response.json({ 
        error: 'ORS_ERROR', 
        message: `ORS fout ${response.status}`,
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();

    if (!data.features?.length) {
      return Response.json({ error: 'No routes found', routes: [] }, { status: 404 });
    }

    const routes = data.features.map((feature, idx) => {
      const props = feature.properties;
      let adjustedDuration = props.summary.duration;
      
      // Apply traffic multiplier if we have traffic data
      if (trafficData?.flowSegmentData) {
        const flow = trafficData.flowSegmentData;
        const currentSpeed = flow.currentSpeed || 50;
        const freeFlowSpeed = flow.freeFlowSpeed || 80;
        const trafficMultiplier = freeFlowSpeed / Math.max(currentSpeed, 10);
        adjustedDuration = props.summary.duration * Math.min(trafficMultiplier, 2.5);
      }
      
      return {
        id: idx,
        polyline: feature.geometry.coordinates.map(c => [c[1], c[0]]),
        distance: props.summary.distance,
        duration: props.summary.duration,
        adjustedDuration: Math.round(adjustedDuration),
        legs: props.segments || [],
        steps: props.segments ? props.segments.flatMap(seg => seg.steps || []) : [],
        isAlternative: idx > 0,
        avgSpeed: Math.round((props.summary.distance / props.summary.duration) * 3.6),
        hasTrafficData: !!trafficData,
      };
    });

    return Response.json({ 
      routes,
      trafficApplied: !!trafficData 
    });
  } catch (error) {
    console.error('Route error:', error.message);
    return Response.json({ 
      error: error.message, 
      routes: [] 
    }, { status: 500 });
  }
});