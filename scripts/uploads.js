import {
  themes,
  DEFAULT_EVENT_TITLE_SIZE,
  DEFAULT_WELCOME_TITLE_SIZE,
} from "./themes.js";

let cloudinaryConfigProvider = () => ({ use: false });
let currentEventSlugProvider = () => "event";

export function configureUploads({ getCloudinaryConfig, getCurrentEventSlug } = {}) {
  if (typeof getCloudinaryConfig === "function") {
    cloudinaryConfigProvider = getCloudinaryConfig;
  }
  if (typeof getCurrentEventSlug === "function") {
    currentEventSlugProvider = getCurrentEventSlug;
  }
}

export function getAssetIndex() {
  if (!themes._meta) themes._meta = {};
  if (!themes._meta.assetIndex) themes._meta.assetIndex = {};
  return themes._meta.assetIndex;
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileSha256Hex(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function extFromName(name, fallback) {
  const m = (name || "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback || "png";
}

export async function uploadAsset(file, kind) {
  try {
    const index = getAssetIndex();
    const hash = await fileSha256Hex(file);
    if (index[hash]) return index[hash];
    const cfg = cloudinaryConfigProvider() || {};
    if (cfg.use && cfg.cloud && cfg.preset) {
      const form = new FormData();
      const evSlug = currentEventSlugProvider();
      const base = (cfg.folderBase || "photobooth/events").replace(/\/$/, "");
      const folder = `${base}/${evSlug}/${kind || "misc"}`;
      const fname = `${kind || "file"}-${hash}.${extFromName(
        file && file.name,
        "png",
      )}`;
      const wrapped = new File([file], fname, {
        type: file.type || "application/octet-stream",
      });
      form.append("file", wrapped);
      form.append("upload_preset", cfg.preset);
      form.append("folder", folder);
      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`,
        { method: "POST", body: form },
      );
      const json = await resp.json();
      if (json && json.secure_url) {
        index[hash] = json.secure_url;
        return json.secure_url;
      }
    }
  } catch (_) {}
  try {
    return await readFileAsDataURL(file);
  } catch (_) {
    return "";
  }
}

export function arrayUniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const s = (v || "").toString().trim();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export function arrayUniqueTemplates(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const t of arr) {
    if (!t || !t.src) continue;
    const s = t.src.toString().trim();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push({ src: s, layout: t.layout || "double_column", slots: t.slots });
    }
  }
  return out;
}

export function normalizeSizeValue(raw, fallback) {
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (cleaned) raw = Number(cleaned);
    else raw = NaN;
  }
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export function normalizeThemeObject(t) {
  if (!t || typeof t !== "object") return;
  if (Array.isArray(t.overlays)) t.overlays = arrayUniqueStrings(t.overlays);
  if (Array.isArray(t.templates)) t.templates = arrayUniqueTemplates(t.templates);
  const list = Array.isArray(t.backgrounds)
    ? t.backgrounds.filter(Boolean)
    : t.background
      ? [t.background]
      : [];
  if (Array.isArray(t.backgrounds)) {
    t.backgrounds = arrayUniqueStrings(list);
    if (typeof t.backgroundIndex === "number") {
      t.backgroundIndex = Math.min(
        Math.max(t.backgroundIndex, 0),
        Math.max(t.backgrounds.length - 1, 0),
      );
    }
  } else if (t.background && typeof t.background === "string" && !t.background.trim()) {
    t.background = "";
  }
  const baseFont = typeof t.font === "string" && t.font.trim() ? t.font : "";
  if ((!t.fontHeading || !t.fontHeading.trim()) && baseFont) t.fontHeading = baseFont;
  if ((!t.fontBody || !t.fontBody.trim()) && baseFont) t.fontBody = baseFont;
  if (!t.fontHeading && t.fontBody) t.fontHeading = t.fontBody;
  if (!t.fontBody && t.fontHeading) t.fontBody = t.fontHeading;
  if (!t.font || !t.font.trim())
    t.font = t.fontBody || t.fontHeading || "'Comic Neue', cursive";
  t.eventTitleSize = normalizeSizeValue(t.eventTitleSize, DEFAULT_EVENT_TITLE_SIZE);
  if (!t.welcome || typeof t.welcome !== "object") t.welcome = {};
  t.welcome.title = typeof t.welcome.title === "string" ? t.welcome.title : "";
  t.welcome.prompt = typeof t.welcome.prompt === "string" ? t.welcome.prompt : "";
  t.welcome.titleSize = normalizeSizeValue(
    t.welcome.titleSize,
    DEFAULT_WELCOME_TITLE_SIZE,
  );
}

export function normalizeAllThemes() {
  const keys = Object.keys(themes || {});
  for (const k of keys) {
    const group = themes[k];
    if (!group || typeof group !== "object") continue;
    if (group.themes || group.holidays) {
      const dict = group.themes || group.holidays;
      for (const sk in dict) normalizeThemeObject(dict[sk]);
    } else {
      normalizeThemeObject(group);
    }
  }
}
