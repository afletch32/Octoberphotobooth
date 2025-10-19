export async function onRequestGet({ request, env }) {
  try {
    if (!env.ASSETS) return new Response(JSON.stringify({ error: 'R2 not configured' }), { status: 500 });
    const { searchParams } = new URL(request.url);
    const prefix = (searchParams.get('prefix') || '').replace(/^\/+/, '');
    const list = await env.ASSETS.list({ prefix, limit: 1000 });
    const files = (list.objects || []).map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded, url: `/files/${encodeURIComponent(o.key)}` }));
    return new Response(JSON.stringify({ files }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

