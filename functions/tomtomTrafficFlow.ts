import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const flowCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

function roundBbox(bbox, precision = 2) {
  return {
    minLat: Math.floor(bbox.minLat * Math.pow(10, precision)) / Math.pow(10, precision),
    minLng: Math.floor(bbox.minLng * Math.pow(10, precision)) / Math.pow(10, precision),
    maxLat: Math.ceil(bbox.maxLat * Math.pow(10, precision)) / Math.pow(10, precision),
    maxLng: Math.ceil(bbox.maxLng * Math.pow(10, precision)) / Math.pow(10, precision),
  };
}

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

    const { bbox } = await req.json();

    if (!bbox || bbox.minLat == null || bbox.minLng == null || bbox.maxLat == null || bbox.maxLng == null) {
      return Response.json({ error: 'Missing bbox' }, { status: 400 });
    }

    // Round bbox for caching
    const roundedBbox = roundBbox(bbox);
    const cacheKey = `${roundedBbox.minLat},${roundedBbox.minLng}-${roundedBbox.maxLat},${roundedBbox.maxLng}`;
    
    const cached = flowCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json({ ok: true, data: { segments: cached.data }, cached: true });
    }

    // TomTom Traffic Flow Segment Data
    // Using tile-based approach for better coverage
    const zoom = 12;
    const style = 'relative';
    const baseUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/${style}/${zoom}/json`;
    
    // Get center point of bbox for single query
    const centerLat = (bbox.minLat + bbox.maxLat) / 2;
    const centerLng = (bbox.minLng + bbox.maxLng) / 2;

    const params = new URLSearchParams({
      key: apiKey,
      point: `${centerLat},${centerLng}`,
      unit: 'KMPH',
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_RATE_LIMIT', 
        status: 429,
        details: 'Too many traffic flow requests' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Traffic Flow error ${response.status}:`, errorText);
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
        details: 'Traffic flow response is not valid JSON' 
      }, { status: 502 });
    }

    // For now, return simplified segment data
    // In production, you'd query multiple points or use tile API
    const segments = [];
    
    if (data.flowSegmentData) {
      const flow = data.flowSegmentData;
      const jamFactor = flow.currentSpeed / Math.max(flow.freeFlowSpeed || 50, 1);
      
      segments.push({
        geometry: [[centerLat, centerLng]],
        jamFactor: jamFactor,
        currentSpeed: flow.currentSpeed,
        freeFlowSpeed: flow.freeFlowSpeed,
        confidence: flow.confidence || 0.5,
        roadName: flow.roadClosure ? 'Afgesloten' : '',
      });
    }

    // Cache result
    flowCache.set(cacheKey, {
      data: segments,
      timestamp: Date.now(),
    });

    // Clean old cache
    for (const [key, value] of flowCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        flowCache.delete(key);
      }
    }

    return Response.json({ ok: true, data: { segments }, cached: false });
  } catch (error) {
    console.error('TomTom traffic flow error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});