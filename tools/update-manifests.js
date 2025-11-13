#!/usr/bin/env node
// Rebuild overlays.json, templates.json, backgrounds.json by scanning asset folders.
// Usage:
//   node tools/update-manifests.js               # scan repo under ./assets
//   node tools/update-manifests.js assets/Hawks  # scan a subfolder only

const fsp = require("fs/promises");
const path = require("path");

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJSON(p) {
  try {
    const txt = await fsp.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function isImage(file) {
  return IMG_EXT.has(path.extname(file).toLowerCase());
}

async function listImages(dir) {
  const names = await fsp.readdir(dir);
  const out = [];
  for (const n of names) {
    const p = path.join(dir, n);
    const st = await fsp.stat(p);
    if (st.isFile() && isImage(n)) out.push(n);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

async function writeJSON(p, data) {
  const txt = JSON.stringify(data, null, 2) + "\n";
  await fsp.writeFile(p, txt, "utf8");
}

async function mergeBySrc(existing, files, makeObj) {
  const bySrc = new Map();
  const out = [];
  if (Array.isArray(existing)) {
    for (const it of existing) {
      const key = typeof it === "string" ? it : it && it.src;
      if (key) bySrc.set(key, it);
    }
  }
  for (const file of files) {
    const prior = bySrc.get(file);
    if (prior) out.push(prior);
    else out.push(makeObj(file));
  }
  return out;
}

async function processDir(dir) {
  const base = path.basename(dir).toLowerCase();
  if (!["overlays", "templates", "backgrounds"].includes(base)) return null;
  const files = await listImages(dir);
  if (files.length === 0) return null;
  if (base === "overlays") {
    const manifestPath = path.join(dir, "overlays.json");
    const existing = await readJSON(manifestPath);
    const merged = await mergeBySrc(existing, files, (f) => f);
    await writeJSON(manifestPath, merged);
    return { dir, type: "overlays", count: merged.length };
  }
  if (base === "templates") {
    const manifestPath = path.join(dir, "templates.json");
    const existing = await readJSON(manifestPath);
    const merged = await mergeBySrc(existing, files, (f) => ({
      src: f,
      layout: "double_column",
    }));
    await writeJSON(manifestPath, merged);
    return { dir, type: "templates", count: merged.length };
  }
  if (base === "backgrounds") {
    const manifestPath = path.join(dir, "backgrounds.json");
    // backgrounds use simple string list
    await writeJSON(manifestPath, files);
    return { dir, type: "backgrounds", count: files.length };
  }
}

async function walk(root, onDir) {
  const stack = [root];
  const results = [];
  while (stack.length) {
    const cur = stack.pop();
    let dirents;
    try {
      dirents = await fsp.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const de of dirents) {
      const p = path.join(cur, de.name);
      if (de.isDirectory()) {
        const r = await onDir(p);
        if (r) results.push(r);
        stack.push(p);
      }
    }
  }
  return results;
}

async function updateManifests(rootDir) {
  const root = rootDir ? path.resolve(rootDir) : path.resolve("assets");
  if (!(await exists(root))) {
    const err = new Error(`Not found: ${root}`);
    err.code = "ENOENT";
    err.path = root;
    throw err;
  }
  const results = await walk(root, processDir);
  return { root, results };
}

async function runCli(argv = process.argv.slice(2)) {
  try {
    const { root, results } = await updateManifests(argv[0]);
    if (!results.length) {
      console.log("No manifest folders found under", root);
      return results;
    }
    for (const r of results) {
      console.log(`Updated ${r.type}: ${r.dir} (${r.count} items)`);
    }
    return results;
  } catch (err) {
    if (err && err.code === "ENOENT" && err.path) {
      console.error(`Not found: ${err.path}`);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
    return null;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  updateManifests,
  runCli,
};
