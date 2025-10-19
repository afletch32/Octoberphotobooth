export async function onRequestGet({ env }) {
  try {
    const raw = await env.FONTS_KV.get('fonts');
    return new Response(raw || '[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.text();
    // Basic sanity: must be JSON array
    try {
      const v = JSON.parse(body || '[]');
      if (!Array.isArray(v)) return new Response('Expected array', { status: 400 });
    } catch (_) { return new Response('Invalid JSON', { status: 400 }); }
    await env.FONTS_KV.put('fonts', body || '[]');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

