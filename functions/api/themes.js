export async function onRequestGet({ env }) {
  try {
    const store = env.THEMES_KV || env.FONTS_KV; // Fallback if THEMES_KV not bound
    if (!store) return new Response(JSON.stringify({ error: 'KV not configured (THEMES_KV)' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const raw = await store.get('themes');
    return new Response(raw || '{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.text();
    // Basic sanity check: must be JSON object
    try { JSON.parse(body || '{}'); } catch (_) { return new Response('Invalid JSON', { status: 400 }); }
    const store = env.THEMES_KV || env.FONTS_KV; // Fallback if THEMES_KV not bound
    if (!store) return new Response(JSON.stringify({ ok: false, error: 'KV not configured (THEMES_KV)' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    await store.put('themes', body || '{}');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
