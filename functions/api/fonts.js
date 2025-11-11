const DEFAULT_FONTS_PAYLOAD = {
  available: [
    { name: 'Comic Neue', weights: [400, 700], preview: 'Welcome to the celebration!' },
    { name: 'Creepster', weights: [400], preview: 'Spooky season starts now!' },
    { name: 'Nosifer', weights: [400], preview: 'Dripping thrills at Fletch Photobooth!' },
    { name: 'Montserrat', weights: [400, 600, 700], preview: 'Modern, clean, and easy to read.' },
    { name: 'Bangers', weights: [400], preview: "Let's make some noise tonight!" },
    { name: 'Great Vibes', weights: [400], preview: 'Love is in the air.' }
  ],
  defaults: {
    heading: 'Comic Neue',
    body: 'Montserrat'
  },
  pairings: [
    { heading: 'Creepster', body: 'Comic Neue', notes: 'Halloween ready mix', preview: 'Spooky season starts now!' },
    { heading: 'Nosifer', body: 'Inter', notes: 'Dripping horror headline', preview: 'Dripping thrills at Fletch Photobooth!' },
    { heading: 'Bangers', body: 'Montserrat', notes: 'Bold energy + legible copy', preview: "Let's make some noise tonight!" },
    { heading: 'Great Vibes', body: 'Montserrat', notes: 'Romantic headline with modern body', preview: 'Love is in the air.' }
  ]
};

function normalizeFontName(name) {
  return (name || '').toString().replace(/^['"]|['"]$/g, '').trim();
}

function mergeFontLists(base, extra) {
  const seen = new Set();
  const output = [];
  const add = (font) => {
    if (!font || typeof font !== 'object') return;
    const cleanedName = normalizeFontName(font.name || font.value);
    if (!cleanedName) return;
    const key = cleanedName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const weights = Array.isArray(font.weights)
      ? Array.from(new Set(font.weights.map((w) => Number(w)).filter((w) => Number.isFinite(w)))).sort((a, b) => a - b)
      : [];
    const entry = {
      name: cleanedName
    };
    if (weights.length) entry.weights = weights;
    if (font.ital) entry.ital = true;
    if (font.preview || font.label) entry.preview = font.preview || font.label;
    output.push(entry);
  };
  [...(Array.isArray(base) ? base : []), ...(Array.isArray(extra) ? extra : [])].forEach(add);
  return output;
}

function normalizePairings(pairings) {
  const out = [];
  (Array.isArray(pairings) ? pairings : []).forEach((p) => {
    if (!p || typeof p !== 'object') return;
    const heading = normalizeFontName(p.heading);
    const body = normalizeFontName(p.body);
    if (!heading || !body) return;
    const item = { heading, body };
    if (p.notes) item.notes = p.notes;
    if (p.preview) item.preview = p.preview;
    out.push(item);
  });
  return out.length ? out : DEFAULT_FONTS_PAYLOAD.pairings;
}

function normalizeIncomingFonts(data) {
  if (!data) {
    return {
      available: DEFAULT_FONTS_PAYLOAD.available,
      defaults: DEFAULT_FONTS_PAYLOAD.defaults,
      pairings: DEFAULT_FONTS_PAYLOAD.pairings
    };
  }
  if (Array.isArray(data)) {
    const available = mergeFontLists(DEFAULT_FONTS_PAYLOAD.available, data);
    return {
      available,
      defaults: DEFAULT_FONTS_PAYLOAD.defaults,
      pairings: DEFAULT_FONTS_PAYLOAD.pairings
    };
  }
  if (typeof data === 'object') {
    const available = mergeFontLists(
      DEFAULT_FONTS_PAYLOAD.available,
      Array.isArray(data.available) ? data.available : Array.isArray(data.fonts) ? data.fonts : []
    );
    const defaults = {
      ...DEFAULT_FONTS_PAYLOAD.defaults
    };
    if (data.defaults && typeof data.defaults === 'object') {
      if (data.defaults.heading) defaults.heading = normalizeFontName(data.defaults.heading) || defaults.heading;
      if (data.defaults.body) defaults.body = normalizeFontName(data.defaults.body) || defaults.body;
    }
    return {
      available,
      defaults,
      pairings: normalizePairings(data.pairings)
    };
  }
  return {
    available: DEFAULT_FONTS_PAYLOAD.available,
    defaults: DEFAULT_FONTS_PAYLOAD.defaults,
    pairings: DEFAULT_FONTS_PAYLOAD.pairings
  };
}

export async function onRequestGet({ env }) {
  try {
    const raw = await env.FONTS_KV.get('fonts');
    if (!raw) {
      return new Response(JSON.stringify(DEFAULT_FONTS_PAYLOAD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    try {
      const parsed = JSON.parse(raw);
      const payload = normalizeIncomingFonts(parsed);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (parseErr) {
      console.warn('Failed to parse fonts KV payload, falling back to defaults', parseErr);
      return new Response(JSON.stringify(DEFAULT_FONTS_PAYLOAD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.text();
    if (!body || !body.trim()) {
      await env.FONTS_KV.put('fonts', JSON.stringify(DEFAULT_FONTS_PAYLOAD));
      return new Response(JSON.stringify({ ok: true, note: 'Reset to defaults' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      return new Response('Invalid JSON', { status: 400 });
    }
    const payload = normalizeIncomingFonts(parsed);
    await env.FONTS_KV.put('fonts', JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
