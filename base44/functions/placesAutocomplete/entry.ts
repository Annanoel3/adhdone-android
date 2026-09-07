import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Address / business-name suggestions for the task Location field.
// Biases results toward the user's home zip when one is saved.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const q = (payload?.input || '').trim();
    if (q.length < 2) return Response.json({ suggestions: [] });

    const apiKey = (secrets.get('GOOGLE_MAPS_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY') || '').trim();
    if (!apiKey) {
      console.error('[PLACES] GOOGLE_MAPS_API_KEY missing');
      return Response.json({ suggestions: [], reason: 'no_key' });
    }

    const homeZip = (user.home_zip || '').trim();
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', homeZip ? `${q} near ${homeZip}` : q);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[PLACES] autocomplete error:', data.status, data.error_message);
      return Response.json({ suggestions: [], error: data.error_message || data.status });
    }

    const suggestions = (data.predictions || [])
      .map((p) => p.description)
      .filter(Boolean)
      .slice(0, 5);

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}