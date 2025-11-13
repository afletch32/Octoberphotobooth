import {
  themes,
  BUILTIN_THEMES,
  BUILTIN_THEME_LOCATIONS,
  setThemes,
} from "./themes.js";
import { normalizeAllThemes } from "./uploads.js";

let remoteSync = () => Promise.resolve();
let remoteLoader = () => Promise.resolve();

export function configureThemeStorage({ syncRemote, loadRemote } = {}) {
  if (typeof syncRemote === "function") remoteSync = syncRemote;
  if (typeof loadRemote === "function") remoteLoader = loadRemote;
}

export function cloneThemeValue(val) {
  if (Array.isArray(val)) return val.map(cloneThemeValue);
  if (val && typeof val === "object") {
    const out = {};
    for (const key of Object.keys(val)) {
      out[key] = cloneThemeValue(val[key]);
    }
    return out;
  }
  return val;
}

function addMissingDefaults(target, source) {
  if (!source || typeof source !== "object") return;
  if (!target || typeof target !== "object") return;
  for (const key of Object.keys(source)) {
    const src = source[key];
    const tgt = target ? target[key] : undefined;
    if (Array.isArray(src)) {
      if (!Array.isArray(tgt) || tgt.length === 0) {
        target[key] = src.slice();
      }
    } else if (src && typeof src === "object") {
      if (!tgt || typeof tgt !== "object") {
        target[key] = cloneThemeValue(src);
      } else {
        addMissingDefaults(tgt, src);
      }
    } else {
      const needs =
        tgt === undefined ||
        tgt === null ||
        (typeof tgt === "string" && tgt.trim() === "");
      if (needs) {
        target[key] = src;
      }
    }
  }
}

function pruneMisplacedBuiltinThemes(target) {
  if (!target || typeof target !== "object") return;
  for (const rootKey of Object.keys(target)) {
    const group = target[rootKey];
    if (!group || typeof group !== "object") continue;
    if (BUILTIN_THEMES[rootKey] && BUILTIN_THEMES[rootKey].name) {
      group.name = BUILTIN_THEMES[rootKey].name;
    }
    for (const extraKey of Object.keys(group)) {
      if (!["name", "themes", "holidays"].includes(extraKey)) {
        delete group[extraKey];
      }
    }
    for (const bucket of ["themes", "holidays"]) {
      if (!group[bucket] || typeof group[bucket] !== "object") continue;
      for (const key of Object.keys(group[bucket])) {
        const loc = BUILTIN_THEME_LOCATIONS[key];
        if (loc && (loc.root !== rootKey || loc.bucket !== bucket)) {
          delete group[bucket][key];
        }
      }
    }
  }
}

export function ensureBuiltinThemes() {
  if (!themes || typeof themes !== "object") setThemes({});
  for (const rootKey of Object.keys(BUILTIN_THEMES)) {
    const builtinGroup = BUILTIN_THEMES[rootKey];
    if (!builtinGroup || typeof builtinGroup !== "object") continue;
    if (!themes[rootKey] || typeof themes[rootKey] !== "object") {
      themes[rootKey] = cloneThemeValue(builtinGroup);
      continue;
    }
    const targetGroup = themes[rootKey];
    addMissingDefaults(targetGroup, builtinGroup);
    for (const bucket of ["themes", "holidays"]) {
      if (!builtinGroup[bucket] || typeof builtinGroup[bucket] !== "object")
        continue;
      if (!targetGroup[bucket] || typeof targetGroup[bucket] !== "object") {
        targetGroup[bucket] = {};
      }
      const targetBucket = targetGroup[bucket];
      for (const subKey of Object.keys(builtinGroup[bucket])) {
        const builtinTheme = builtinGroup[bucket][subKey];
        if (!targetBucket[subKey] || typeof targetBucket[subKey] !== "object") {
          targetBucket[subKey] = cloneThemeValue(builtinTheme);
        } else {
          addMissingDefaults(targetBucket[subKey], builtinTheme);
        }
      }
    }
  }
  pruneMisplacedBuiltinThemes(themes);
}

export function hasCoreBuiltins(obj) {
  try {
    return !!(
      obj &&
      obj.general &&
      obj.general.themes &&
      obj.general.themes.birthday &&
      obj.fall &&
      obj.fall.holidays &&
      obj.fall.holidays.halloween
    );
  } catch (_) {
    return false;
  }
}

export function resetThemesToBuiltins(reason) {
  console.warn("Resetting themes to built-ins:", reason || "unknown");
  setThemes(cloneThemeValue(BUILTIN_THEMES));
  try {
    localStorage.removeItem("photoboothThemes");
  } catch (_) {}
}

export function mergePlainObject(baseObj, overrideObj) {
  const baseClone =
    baseObj && typeof baseObj === "object" && !Array.isArray(baseObj)
      ? cloneThemeValue(baseObj)
      : {};
  if (
    !overrideObj ||
    typeof overrideObj !== "object" ||
    Array.isArray(overrideObj)
  ) {
    if (Array.isArray(overrideObj)) return overrideObj.slice();
    return baseClone;
  }
  const out = baseClone || {};
  for (const key of Object.keys(overrideObj)) {
    const value = overrideObj[key];
    if (Array.isArray(value)) out[key] = value.slice();
    else if (value && typeof value === "object")
      out[key] = mergePlainObject(out[key], value);
    else out[key] = value;
  }
  return out;
}

const stringOrEmpty = (val) => (typeof val === "string" ? val.trim() : "");
const arrayFromMaybeList = (list) =>
  Array.isArray(list) ? list.filter(Boolean) : [];

function applyBackgroundFallback(baseLeaf, merged, storedLeaf) {
  const baseList = arrayFromMaybeList(baseLeaf.backgrounds);
  const baseSingle = stringOrEmpty(baseLeaf.background);
  const mergedList = arrayFromMaybeList(merged.backgrounds);
  const mergedSingle = stringOrEmpty(merged.background);
  const storedList = arrayFromMaybeList(storedLeaf && storedLeaf.backgrounds);
  const storedSingle = stringOrEmpty(storedLeaf && storedLeaf.background);
  const storedAllowsFallback =
    !storedLeaf || (!storedList.length && !storedSingle);

  if (!storedAllowsFallback) return;
  if (!baseList.length && !baseSingle) return;
  if (mergedList.length || mergedSingle) return;

  if (baseList.length) merged.backgrounds = baseList.slice();
  if (baseSingle) merged.background = baseLeaf.background;
  if (typeof baseLeaf.backgroundIndex === "number") {
    merged.backgroundIndex = baseLeaf.backgroundIndex;
  }
}

function applyTemplatesFallback(baseLeaf, merged, storedLeaf) {
  const storedFolder = stringOrEmpty(storedLeaf && storedLeaf.templatesFolder);
  const storedArrayExists = Array.isArray(storedLeaf && storedLeaf.templates);
  if (baseLeaf.templatesFolder && !merged.templatesFolder && !storedFolder) {
    merged.templatesFolder = baseLeaf.templatesFolder;
  }
  const baseTemplates = Array.isArray(baseLeaf.templates)
    ? baseLeaf.templates
    : null;
  const mergedTemplates = Array.isArray(merged.templates)
    ? merged.templates
    : null;
  if (
    baseTemplates &&
    baseTemplates.length &&
    (!mergedTemplates || mergedTemplates.length === 0) &&
    !storedArrayExists
  ) {
    merged.templates = baseTemplates.map((tpl) => mergePlainObject(tpl, {}));
  }
}

function applyOverlaysFallback(baseLeaf, merged, storedLeaf) {
  const storedFolder = stringOrEmpty(storedLeaf && storedLeaf.overlaysFolder);
  const storedArrayExists = Array.isArray(storedLeaf && storedLeaf.overlays);
  if (baseLeaf.overlaysFolder && !merged.overlaysFolder && !storedFolder) {
    merged.overlaysFolder = baseLeaf.overlaysFolder;
  }
  const baseOverlays = Array.isArray(baseLeaf.overlays)
    ? baseLeaf.overlays
    : null;
  const mergedOverlays = Array.isArray(merged.overlays)
    ? merged.overlays
    : null;
  if (
    baseOverlays &&
    baseOverlays.length &&
    (!mergedOverlays || mergedOverlays.length === 0) &&
    !storedArrayExists
  ) {
    merged.overlays = baseOverlays.slice();
  }
}

function applyArrayFallback(baseLeaf, merged, prop) {
  if (Array.isArray(baseLeaf[prop]) && !Array.isArray(merged[prop])) {
    merged[prop] = baseLeaf[prop].slice();
  }
}

function mergeWelcomeAndMeta(baseLeaf, merged) {
  if (baseLeaf.welcome)
    merged.welcome = mergePlainObject(baseLeaf.welcome, merged.welcome);
  if (baseLeaf.accent && !merged.accent) merged.accent = baseLeaf.accent;
  if (baseLeaf.accent2 && !merged.accent2) merged.accent2 = baseLeaf.accent2;
  if (baseLeaf.font && !merged.font) merged.font = baseLeaf.font;
  if (baseLeaf.fontHeading && !merged.fontHeading)
    merged.fontHeading = baseLeaf.fontHeading;
  if (baseLeaf.fontBody && !merged.fontBody)
    merged.fontBody = baseLeaf.fontBody;
}

function applyThemeFallbacks(baseLeaf, merged, storedLeaf) {
  if (
    !baseLeaf ||
    typeof baseLeaf !== "object" ||
    !merged ||
    typeof merged !== "object"
  )
    return;
  applyBackgroundFallback(baseLeaf, merged, storedLeaf);
  applyTemplatesFallback(baseLeaf, merged, storedLeaf);
  applyOverlaysFallback(baseLeaf, merged, storedLeaf);
  applyArrayFallback(baseLeaf, merged, "overlaysRemoved");
  applyArrayFallback(baseLeaf, merged, "templatesRemoved");
  mergeWelcomeAndMeta(baseLeaf, merged);
}

function mergeThemeLeaf(baseLeaf, storedLeaf) {
  if (storedLeaf === null || storedLeaf === undefined) {
    return cloneThemeValue(baseLeaf);
  }
  if (Array.isArray(storedLeaf)) return storedLeaf.slice();
  if (typeof storedLeaf !== "object") return storedLeaf;
  const merged = mergePlainObject(baseLeaf, storedLeaf);
  applyThemeFallbacks(baseLeaf, merged, storedLeaf);
  return merged;
}

export function fixBuiltinThemePlacements(target) {
  if (!target || typeof target !== "object") return;
  for (const rootKey of Object.keys(target)) {
    const group = target[rootKey];
    if (!group || typeof group !== "object") continue;
    for (const bucket of ["themes", "holidays"]) {
      const sub = group[bucket];
      if (!sub || typeof sub !== "object") continue;
      for (const subKey of Object.keys({ ...sub })) {
        const loc = BUILTIN_THEME_LOCATIONS[subKey];
        if (!loc || (loc.root === rootKey && loc.bucket === bucket)) continue;
        const currentTheme = sub[subKey];
        delete sub[subKey];
        if (!target[loc.root])
          target[loc.root] = cloneThemeValue(
            BUILTIN_THEMES[loc.root] || { name: loc.root },
          );
        if (!target[loc.root][loc.bucket]) target[loc.root][loc.bucket] = {};
        const base =
          BUILTIN_THEMES[loc.root] && BUILTIN_THEMES[loc.root][loc.bucket]
            ? BUILTIN_THEMES[loc.root][loc.bucket][subKey]
            : null;
        target[loc.root][loc.bucket][subKey] = mergeThemeLeaf(
          base,
          currentTheme,
        );
      }
    }
  }
}

export function mergeStoredThemes(base, stored) {
  if (
    !base ||
    typeof base !== "object" ||
    !stored ||
    typeof stored !== "object"
  )
    return;
  for (const key of Object.keys(stored)) {
    const storedGroup = stored[key];
    if (
      storedGroup &&
      typeof storedGroup === "object" &&
      !Array.isArray(storedGroup)
    ) {
      const bucketKey = storedGroup.themes
        ? "themes"
        : storedGroup.holidays
          ? "holidays"
          : null;
      const baseGroup = base[key];
      if (bucketKey) {
        if (!baseGroup || typeof baseGroup !== "object") {
          base[key] = cloneThemeValue(storedGroup);
          continue;
        }
        if (!baseGroup[bucketKey]) baseGroup[bucketKey] = {};
        const baseBucket = baseGroup[bucketKey];
        const storedBucket = storedGroup[bucketKey] || {};
        for (const subKey of Object.keys(storedBucket)) {
          baseBucket[subKey] = mergeThemeLeaf(
            baseBucket[subKey],
            storedBucket[subKey],
          );
        }
        for (const prop of Object.keys(storedGroup)) {
          if (prop === "themes" || prop === "holidays") continue;
          const val = storedGroup[prop];
          if (Array.isArray(val)) baseGroup[prop] = val.slice();
          else if (val && typeof val === "object")
            baseGroup[prop] = mergePlainObject(baseGroup[prop], val);
          else baseGroup[prop] = val;
        }
      } else {
        base[key] = mergeThemeLeaf(baseGroup, storedGroup);
      }
    } else {
      base[key] = cloneThemeValue(storedGroup);
    }
  }
}

export function saveThemesToStorage() {
  ensureBuiltinThemes();
  if (!hasCoreBuiltins(themes)) {
    resetThemesToBuiltins("core themes missing before save");
  }
  try {
    normalizeAllThemes();
  } catch (_e) {}
  localStorage.setItem("photoboothThemes", JSON.stringify(themes));
  remoteSync().catch(() => {});
}

export function loadThemesFromStorage(options = {}) {
  if (!hasCoreBuiltins(themes)) {
    resetThemesToBuiltins("missing core themes before storage merge");
  }
  const storedThemes = localStorage.getItem("photoboothThemes");
  if (storedThemes) {
    try {
      const parsed = JSON.parse(storedThemes);
      mergeStoredThemes(themes, parsed);
      fixBuiltinThemePlacements(themes);
      ensureBuiltinThemes();
      try {
        normalizeAllThemes();
      } catch (_e) {}
      if (!hasCoreBuiltins(themes)) {
        resetThemesToBuiltins("stored themes missing core entries");
      }
    } catch (err) {
      console.warn("Failed to parse stored themes", err);
    }
  }
  const globalLogo = getGlobalLogo();
  if (globalLogo !== null) applyGlobalLogoToAllThemes(globalLogo);
  const loader = options.loadRemote || remoteLoader;
  if (typeof loader === "function") loader().catch(() => {});
}

const GLOBAL_LOGO_STORAGE_KEY = "photoboothGlobalLogo";

export function forEachThemeEntry(callback) {
  if (!themes || typeof themes !== "object" || typeof callback !== "function")
    return;
  const visit = (collection, prefix = "") => {
    if (!collection || typeof collection !== "object") return;
    for (const key of Object.keys(collection)) {
      if (key === "_meta") continue;
      const value = collection[key];
      if (!value || typeof value !== "object") continue;
      const nextKey = prefix ? `${prefix}:${key}` : key;
      if (value.themes || value.holidays) {
        if (value.themes) visit(value.themes, nextKey);
        if (value.holidays) visit(value.holidays, nextKey);
      } else {
        callback(value, nextKey);
      }
    }
  };
  visit(themes);
}

export function applyGlobalLogoToTheme(theme, logo) {
  if (!theme || typeof theme !== "object") return;
  if (typeof logo !== "string") return;
  theme.logo = logo;
}

export function applyGlobalLogoToAllThemes(logo) {
  if (typeof logo !== "string") return;
  forEachThemeEntry((theme) => applyGlobalLogoToTheme(theme, logo));
}

export function getGlobalLogo() {
  try {
    const value = localStorage.getItem(GLOBAL_LOGO_STORAGE_KEY);
    return value === null ? null : value;
  } catch (_) {
    return null;
  }
}

export function setGlobalLogoValue(logo) {
  const value = typeof logo === "string" ? logo : "";
  try {
    if (value) localStorage.setItem(GLOBAL_LOGO_STORAGE_KEY, value);
    else localStorage.removeItem(GLOBAL_LOGO_STORAGE_KEY);
  } catch (_) {}
}
