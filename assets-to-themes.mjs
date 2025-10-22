import fs from "node:fs";
import path from "node:path";

// ------------------------
// CONFIG
// ------------------------
const ASSETS_DIR = "assets";              // your current assets tree
const THEMES_PUBLIC_ROOT = "public/themes"; // where static files should live
const OUTPUT_JSON = "themes.from_assets.cleaned.json"; // KV-ready JSON
const OUTPUT_MANIFEST = "themes_from_assets_manifest.csv";
const FORCE_GENERAL_ROOT = true; // keep "general" as the top when found

// ------------------------
// Helpers
// ------------------------
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const isImage = (f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f);
const safe = (s) => (s || "").toString().trim().replace(/[^a-zA-Z0-9_.-]/g, "_");

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) out.push(path.join(dir, entry.name));
  }
  return out;
}

// Copy file from src to dst if not exists or different size
function copyFileSmart(src, dst) {
  ensureDir(path.dirname(dst));
  try {
    const need = !fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size;
    if (need) fs.copyFileSync(src, dst);
  } catch {
    fs.copyFileSync(src, dst);
  }
}

// Build a stable public URL from a destination path inside THEMES_PUBLIC_ROOT
function toPublicUrl(absDst) {
  const rel = path.relative("public", absDst).split(path.sep).join("/");
  return "/" + rel; // => /themes/...
}

// Derive a theme ID and layout from folder names
// Expecting assets/(general/)?<category>/<themeName>/{backgrounds,overlays,templates}
function deriveThemeInfo(absThemeDir) {
  const rel = path.relative(ASSETS_DIR, absThemeDir).split(path.sep); // e.g., ["general","birthday","sam"]
  // Find "general" prefix if present
  let idx = 0;
  if (rel[0] && rel[0].toLowerCase() === "general") idx = 1;

  const category = safe(rel[idx] || "misc");
  const themeName = safe(rel[idx + 1] || category);
  const themeId = `${category}-${themeName}`; // e.g., birthday-sam

  // destination base dir under public/themes
  const destBase = FORCE_GENERAL_ROOT
    ? path.join(THEMES_PUBLIC_ROOT, "general", category, themeName)
    : path.join(THEMES_PUBLIC_ROOT, category, themeName);

  return { themeId, category, themeName, destBase };
}

// ------------------------
// MAIN
// ------------------------
function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`[ERROR] "${ASSETS_DIR}" not found. Run this from your project root.`);
    process.exit(1);
  }
  ensureDir(THEMES_PUBLIC_ROOT);

  // Find candidate theme folders: any folder that contains backgrounds/overlays/templates
  const themes = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const hasAny = ["backgrounds", "overlays", "templates"].some((d) =>
          fs.existsSync(path.join(p, d))
        );
        if (hasAny) themes.push(p);
        walk(p);
      }
    }
  };
  walk(ASSETS_DIR);

  const manifestRows = [
    ["theme_id", "category", "theme_name", "field", "src", "dest", "public_url", "bytes"],
  ];
  const results = [];

  for (const themeDir of themes) {
    const { themeId, category, themeName, destBase } = deriveThemeInfo(themeDir);

    const bgDir = path.join(themeDir, "backgrounds");
    const ovDir = path.join(themeDir, "overlays");
    const tpDir = path.join(themeDir, "templates");

    const backgrounds = listFiles(bgDir).filter(isImage);
    const overlays = listFiles(ovDir).filter(isImage);
    const templates = listFiles(tpDir).filter(isImage);

    // Copy files & collect URLs
    const copyAndMap = (files, subfolder, fieldLabel) => {
      const urls = [];
      for (const src of files) {
        const fileName = path.basename(src);
        const dst = path.join(destBase, subfolder, fileName);
        copyFileSmart(src, dst);
        const url = toPublicUrl(dst);
        urls.push(url);
        const bytes = fs.existsSync(dst) ? fs.statSync(dst).size : 0;
        manifestRows.push([themeId, category, themeName, fieldLabel, src, dst, url, bytes]);
      }
      return urls;
    };

    const bgUrls = copyAndMap(backgrounds, "backgrounds", "backgrounds");
    const ovUrls = copyAndMap(overlays, "overlays", "overlays");
    const tpUrls = copyAndMap(templates, "templates", "templates");

    // Choose primary (first) for compact fields
    const themeObj = {
      id: themeId,
      name: themeName.replace(/_/g, " "),
      category,
      background: bgUrls[0] || undefined,
      overlay: ovUrls[0] || undefined,
      template: tpUrls[0] || undefined,
      // full lists
      backgrounds: bgUrls,
      overlays: ovUrls,
      templates: tpUrls,
    };

    results.push(themeObj);
  }

  // Write outputs
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2), "utf8");

  const csv = manifestRows.map((r) => r.map((v) => String(v ?? "").replaceAll('"','""')).join(",")).join("\n");
  fs.writeFileSync(OUTPUT_MANIFEST, csv, "utf8");

  console.log(`[OK] Themes generated: ${results.length}`);
  console.log(`[OK] JSON: ${OUTPUT_JSON}`);
  console.log(`[OK] Manifest: ${OUTPUT_MANIFEST}`);
  console.log(`[OK] Assets copied under: ${THEMES_PUBLIC_ROOT}/`);
}

main();
