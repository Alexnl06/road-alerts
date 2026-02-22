import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    const { query, country = 'NL', limit = 10, userLat, userLng } = await req.json();

    if (!query || query.length < 2) {
      return Response.json({ ok: true, data: { results: [] } });
    }

    // Check cache
    const cacheKey = `${query}-${country}-${userLat}-${userLng}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json({ results: cached.data });
    }

    // Build TomTom Search API URL
    const baseUrl = 'https://api.tomtom.com/search/2/search';
    const params = new URLSearchParams({
      key: apiKey,
      query: query,
      language: 'nl-NL',
      countrySet: country,
      limit: String(limit),
    });

    if (userLat && userLng) {
      params.append('lat', String(userLat));
      params.append('lon', String(userLng));
    }

    const response = await fetch(`${baseUrl}/${encodeURIComponent(query)}.json?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 429) {
      return Response.json({ 
        ok: false, 
        error: 'TOMTOM_RATE_LIMIT', 
        status: 429,
        details: 'Too many search requests' 
      }, { status: 429 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Search error ${response.status}:`, errorText);
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
        details: 'Search response is not valid JSON' 
      }, { status: 502 });
    }

    const results = (data.results || []).map(item => ({
      label: item.poi?.name || item.address?.freeformAddress || query,
      address: item.address?.freeformAddress || '',
      lat: item.position?.lat,
      lng: item.position?.lon,
      score: item.score || 0,
      type: item.type,
    }));

    // Cache results
    searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    for (const [key, value] of searchCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        searchCache.delete(key);
      }
    }

    return Response.json({ ok: true, data: { results } });
  } catch (error) {
    console.error('TomTom search error:', error.message);
    return Response.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error.message 
    }, { status: 500 });
  }
});