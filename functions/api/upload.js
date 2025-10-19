export async function onRequestPost({ request, env }) {
  try {
    if (!env.ASSETS) return new Response(JSON.stringify({ error: 'R2 bucket not bound (ASSETS)' }), { status: 500 });
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Expected multipart/form-data', { status: 400 });
    }
    const form = await request.formData();
    const file = form.get('file');
    const kind = (form.get('kind') || 'misc').toString(); // overlays|templates|backgrounds|logo
    const theme = (form.get('theme') || 'general').toString().replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    const name = (form.get('filename') || file?.name || `${Date.now()}.bin`).toString().replace(/[^a-z0-9._-]+/gi, '-');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return new Response('Missing file', { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const key = `assets/${theme}/${kind}/${Date.now()}-${name}`;
    await env.ASSETS.put(key, buf, {
      httpMetadata: { contentType: file.type || 'application/octet-stream', cacheControl: 'public, max-age=31536000, immutable' }
    });
    const url = `/files/${encodeURIComponent(key)}`;
    return new Response(JSON.stringify({ ok: true, url, key }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

