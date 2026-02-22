import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const incidentsCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

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
    
    const cached = incidentsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json({ ok: true, data: { incidents: cached.data }, cached: true });
    }

    // TomTom Traffic Incidents API
    const style = 's3';
    const baseUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails`;
    
    const bboxString = `${roundedBbox.minLng},${roundedBbox.minLat},${roundedBbox.maxLng},${roundedBbox.maxLat}`;
    
    const params = new URLSearchParams({
      key: apiKey,
      bbox: bboxString,
      fields: '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime}}}',
      language: 'nl-NL',
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_RATE_LIMIT', 
        status: 429,
        details: 'Too many incident requests' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Incidents error ${response.status}:`, errorText);
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
        details: 'Incident response is not valid JSON' 
      }, { status: 502 });
    }

    const incidents = (data.incidents || []).map(incident => {
      const props = incident.properties || {};
      const geometry = incident.geometry || {};
      const coords = geometry.coordinates || [];
      
      // Get first coordinate as incident location
      let lat, lng;
      if (geometry.type === 'Point') {
        [lng, lat] = coords;
      } else if (geometry.type === 'LineString' && coords.length > 0) {
        [lng, lat] = coords[0];
      }

      const description = props.events?.[0]?.description || 'Incident';
      
      return {
        id: incident.id || `${lat}-${lng}`,
        lat,
        lng,
        type: props.iconCategory || 'unknown',
        description,
        severity: props.magnitudeOfDelay || 0,
        startTime: props.startTime,
        endTime: props.endTime,
      };
    }).filter(i => i.lat && i.lng);

    // Cache result
    incidentsCache.set(cacheKey, {
      data: incidents,
      timestamp: Date.now(),
    });

    // Clean old cache
    for (const [key, value] of incidentsCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        incidentsCache.delete(key);
      }
    }

    return Response.json({ ok: true, data: { incidents }, cached: false });
  } catch (error) {
    console.error('TomTom incidents error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});