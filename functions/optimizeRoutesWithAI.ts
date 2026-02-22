import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startLat, startLng, endLat, endLng, preference, trafficData, hazards } = await req.json();

    if (!startLat || !startLng || !endLat || !endLng || !preference) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const prompt = `Je bent een expert in routeplanning en verkeerslogistiek. Gegeven de volgende informatie, genereer 3 optimale routeopties en hun voordelen.

STARTPUNT: ${startLat}, ${startLng}
EINDPUNT: ${endLat}, ${endLng}
VOORKEUR: ${preference} (opties: "fastest", "scenic", "avoid_tolls", "balanced")
LIVE VERKEERSDATA: ${trafficData ? JSON.stringify(trafficData) : 'Geen data beschikbaar'}
HAZARDS/WEGWERKZAAMHEDEN: ${hazards ? JSON.stringify(hazards) : 'Geen'}

Geef 3 alternatieve routes met:
1. Route naam/beschrijving
2. Geschatte duur in minuten
3. Geschatte afstand in km
4. Belangrijkste voordelen
5. Voorzichtigheid/waarschuwingen

Antwoord in JSON format:
{
  "routes": [
    {
      "name": "string",
      "description": "string",
      "estimatedDuration": number,
      "estimatedDistance": number,
      "advantages": ["string"],
      "warnings": ["string"],
      "preference": "fastest|scenic|avoid_tolls|balanced"
    }
  ],
  "recommendation": "string"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          routes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                estimatedDuration: { type: 'number' },
                estimatedDistance: { type: 'number' },
                advantages: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                preference: { type: 'string' },
              },
            },
          },
          recommendation: { type: 'string' },
        },
      },
    });

    return Response.json(response);
  } catch (error) {
    console.error('Route optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});