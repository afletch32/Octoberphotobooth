import {
  themes,
  BUILTIN_THEMES,
  BUILTIN_THEME_LOCATIONS,
  DEFAULT_THEME_KEY,
  DEFAULT_EVENT_TITLE_SIZE,
  DEFAULT_WELCOME_TITLE_SIZE,
  setThemes,
} from "./themes.js";
import {
  configureThemeStorage,
  saveThemesToStorage,
  loadThemesFromStorage,
  ensureBuiltinThemes,
  fixBuiltinThemePlacements,
  mergeStoredThemes,
  cloneThemeValue,
  mergePlainObject,
  resetThemesToBuiltins,
  hasCoreBuiltins,
  applyGlobalLogoToAllThemes,
  applyGlobalLogoToTheme,
  getGlobalLogo,
  setGlobalLogoValue,
} from "./theme-storage.js";
import {
  configureUploads,
  uploadAsset,
  normalizeAllThemes,
  normalizeThemeObject,
  normalizeSizeValue,
} from "./uploads.js";
import {
  loadImage,
  orientationFromTemplate,
  setViewOrientation,
  applyPreviewOrientation,
  capturePreviewState,
  restorePreviewState,
  getStripTemplateMetrics,
  detectDoubleColumnSlots,
  getStripTemplatePercents,
} from "./preview.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const swUrl = new URL("sw.js", window.location.href);
      const reg = await navigator.serviceWorker.register(swUrl.href);
      // Nudge the SW to check for updates on load
      try {
        await reg.update();
      } catch (_) {}
      console.log("SW registered:", reg && reg.scope);
    } catch (registrationError) {
      console.warn("SW registration failed:", registrationError);
    }
  });
}

// --- DOM Element Cache ---
const DOM = {
  adminScreen: document.getElementById("adminScreen"),
  boothScreen: document.getElementById("boothScreen"),
  boothHeader: document.getElementById("boothHeader"),
  boothControls: document.getElementById("controls"),
  eventSelect: document.getElementById("eventSelect"),
  allowRetakes: document.getElementById("allowRetakes"),
  analyticsData: document.getElementById("analyticsData"),
  logo: document.getElementById("logo"),
  eventTitle: document.getElementById("eventTitle"),
  options: document.getElementById("options"),
  videoWrap: document.getElementById("videoWrap"),
  videoContainer: document.getElementById("videoContainer"),
  video: document.getElementById("video"),
  liveOverlay: document.getElementById("liveOverlay"),
  zoomControl: document.getElementById("zoomControl"),
  zoomSlider: document.getElementById("zoomSlider"),
  zoomValue: document.getElementById("zoomValue"),
  zoomHint: document.getElementById("zoomHint"),
  captureBtn: document.getElementById("captureBtn"),
  countdownOverlay: document.getElementById("countdownOverlay"),
  flashOverlay: document.getElementById("flashOverlay"),
  finalPreview: document.getElementById("finalPreview"),
  finalPreviewContent: document.getElementById("finalPreviewContent"),
  finalStrip: document.getElementById("finalStrip"),
  qrCodeContainer: document.getElementById("qrCodeContainer"),
  qrCode: document.getElementById("qrCode"),
  lastShot: document.getElementById("lastShot"),
  qrHint: document.getElementById("qrHint"),
  shareStatus: document.getElementById("shareStatus"),
  shareLinkRow: document.getElementById("shareLinkRow"),
  shareLink: document.getElementById("shareLink"),
  emailInput: document.getElementById("emailInput"),
  sendBtn: document.getElementById("sendBtn"),
  retakeBtn: document.getElementById("retakeBtn"),
  closePreviewBtn: document.getElementById("closePreviewBtn"),
  confirmModal: document.getElementById("confirmModal"),
  confirmPreview: document.getElementById("confirmPreview"),
  gallery: document.getElementById("gallery"),
  toast: document.getElementById("toast"),
  welcomeScreen: document.getElementById("welcomeScreen"),
  welcomeImg: document.getElementById("welcomeImg"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  startButton: document.getElementById("startButton"),
  analytics: document.getElementById("analytics"),
  themeEditor: document.getElementById("themeEditor"),
  themeEditorActive: document.getElementById("themeEditorActive"),
  themeEditorEditing: document.getElementById("themeEditorEditing"),
  themeName: document.getElementById("themeName"),
  eventNameInput: document.getElementById("eventNameInput"),
  eventTitleSizeInput: document.getElementById("eventTitleSizeInput"),
  cloudNameInput: document.getElementById("cloudNameInput"),
  cloudPresetInput: document.getElementById("cloudPresetInput"),
  cloudFolderInput: document.getElementById("cloudFolderInput"),
  cloudUseToggle: document.getElementById("cloudUseToggle"),
  emailJsPublic: document.getElementById("emailJsPublic"),
  emailJsService: document.getElementById("emailJsService"),
  emailJsTemplate: document.getElementById("emailJsTemplate"),
  syncNowBtn: document.getElementById("syncNowBtn"),
  syncStatus: document.getElementById("syncStatus"),
  useCloudflareUploads: document.getElementById("useCloudflareUploads"),
  offlineModeToggle: document.getElementById("offlineModeToggle"),
  sendPendingBtn: document.getElementById("sendPendingBtn"),
  cacheAssetsBtn: document.getElementById("cacheAssetsBtn"),
  forceCameraFileToggle: document.getElementById("forceCameraFileToggle"),
  headingFontSelect: document.getElementById("headingFontSelect"),
  bodyFontSelect: document.getElementById("bodyFontSelect"),
  fontPairingSelect: document.getElementById("fontPairingSelect"),
  stylePreview: document.getElementById("stylePreview"),
  stylePreviewHeading: document.getElementById("stylePreviewHeading"),
  stylePreviewSubheading: document.getElementById("stylePreviewSubheading"),
  stylePreviewBody: document.getElementById("stylePreviewBody"),
  stylePreviewButton: document.getElementById("stylePreviewButton"),
  quickPicks: document.getElementById("quickPicks"),
  quickPicksToggle: document.getElementById("qpToggle"),
  addPairingHeading: document.getElementById("addPairingHeading"),
  addPairingBody: document.getElementById("addPairingBody"),
  addPairingNotes: document.getElementById("addPairingNotes"),
  addPairingPreview: document.getElementById("addPairingPreview"),
  addPairingBtn: document.getElementById("addPairingBtn"),
  quickPickForm: document.getElementById("quickPickForm"),
  customPairingsList: document.getElementById("customPairingsList"),
  themeQuickSelect: document.getElementById("themeQuickSelect"),
  themeFontSelect: document.getElementById("themeFontSelect"),
  themeEditorModeSelect: document.getElementById("themeEditorModeSelect"),
  themeCloneSection: document.getElementById("themeCloneSection"),
  themeCloneName: document.getElementById("themeCloneName"),
  cloneThemeBtn: document.getElementById("cloneThemeBtn"),
  addBackgroundBtn: document.getElementById("addBackgroundBtn"),
  addOverlaysBtn: document.getElementById("addOverlaysBtn"),
  addTemplatesBtn: document.getElementById("addTemplatesBtn"),
  addLogoBtn: document.getElementById("addLogoBtn"),
  addFontFamily: document.getElementById("addFontFamily"),
  addFontUrl: document.getElementById("addFontUrl"),
  currentFonts: document.getElementById("currentFonts"),
  themeAccent: document.getElementById("themeAccent"),
  themeAccent2: document.getElementById("themeAccent2"),
  themeBackground: document.getElementById("themeBackground"),
  themeLogo: document.getElementById("themeLogo"),
  themeOverlays: document.getElementById("themeOverlays"),
  themeOverlaysFolderPicker: document.getElementById(
    "themeOverlaysFolderPicker",
  ),
  themeOverlaysFolder: document.getElementById("themeOverlaysFolder"),
  themeTemplates: document.getElementById("themeTemplates"),
  themeTemplatesFolderPicker: document.getElementById(
    "themeTemplatesFolderPicker",
  ),
  themeTemplatesFolder: document.getElementById("themeTemplatesFolder"),
  themeWelcomeTitle: document.getElementById("themeWelcomeTitle"),
  themeWelcomePrompt: document.getElementById("themeWelcomePrompt"),
  welcomeTitleSizeInput: document.getElementById("welcomeTitleSizeInput"),
  summaryBackground: document.getElementById("summaryBackground"),
  summaryLogo: document.getElementById("summaryLogo"),
  summaryOverlays: document.getElementById("summaryOverlays"),
  summaryTemplates: document.getElementById("summaryTemplates"),
  currentBackgrounds: document.getElementById("currentBackgrounds"),
  currentLogo: document.getElementById("currentLogo"),
  currentFont: document.getElementById("currentFont"),
  currentAccents: document.getElementById("currentAccents"),
  currentOverlays: document.getElementById("currentOverlays"),
  currentTemplates: document.getElementById("currentTemplates"),
  createThemeModal: document.getElementById("createThemeModal"),
  createThemeDropZone: document.getElementById("createThemeDropZone"),
  createThemeName: document.getElementById("createThemeName"),
  createThemeSummary: document.getElementById("createThemeSummary"),
  createThemeBrowseBtn: document.getElementById("createThemeBrowseBtn"),
  createThemeCancel: document.getElementById("createThemeCancel"),
  createThemeConfirm: document.getElementById("createThemeConfirm"),
  createThemeFolderInput: document.getElementById("createThemeFolderInput"),
  btnUpdateTheme: document.getElementById("btnUpdateTheme"),
  btnSaveTheme: document.getElementById("btnSaveTheme"),
  importFile: document.getElementById("importFile"),
  importZip: document.getElementById("importZip"),
  deployHookUrl: document.getElementById("deployHookUrl"),
  installBtn: document.getElementById("installBtn"),
};

function setupShareLinkRowVisibilitySync() {
  const row = DOM.shareLinkRow;
  const container = DOM.qrCodeContainer;
  if (!row || !container || typeof window === "undefined") return;
  const revealContainerIfRowVisible = () => {
    if (row.classList.contains("hidden")) return;
    const display = window.getComputedStyle(row).display;
    if (display && display !== "none") {
      container.classList.remove("hidden");
    }
  };
  if (typeof MutationObserver === "function") {
    const observer = new MutationObserver(revealContainerIfRowVisible);
    observer.observe(row, { attributes: true, attributeFilter: ["style", "class"] });
  }
  revealContainerIfRowVisible();
}

setupShareLinkRowVisibilitySync();

function setBoothControlsVisible(show) {
  const hidden = !show;
  if (DOM.options) DOM.options.classList.toggle("hidden", hidden);
  if (DOM.boothHeader) DOM.boothHeader.classList.toggle("hidden", hidden);
  if (DOM.boothControls) DOM.boothControls.classList.toggle("hidden", hidden);
}
// --- State ---
let activeTheme = null; // Default theme
let mode = "photo";
let stream;
let selectedOverlay = null;
let pendingTemplate = null;
let hidePreviewTimer = null;
let allowRetake = true;
let isStartingCamera = false;
let lastCaptureFlow = null; // To store the function for retake
let removedStack = []; // For undo of removed assets in session
let toastTimer = null;
let lastShareUrl = null; // Public share URL served by SW
let demoMode = false; // Allows running from file:// without camera
let captureAspectRatio = null; // Override capture aspect (width/height) when set
let createThemeAssets = null; // Temporary storage for create-from-folder workflow
let activeVideoTrack = null;
const DEFAULT_ZOOM_VALUE = 1;
const FALLBACK_ZOOM_RANGE = { min: 1, max: 2.5, step: 0.05 };
let zoomState = {
  mode: "none",
  min: DEFAULT_ZOOM_VALUE,
  max: DEFAULT_ZOOM_VALUE,
  step: 0.01,
  value: DEFAULT_ZOOM_VALUE,
};
// Cache-busting stamp for this session to avoid stale images during editing
const SESSION_BUST = Date.now();
function withBust(src) {
  try {
    if (!src) return src;
    return src + (src.includes("?") ? "&" : "?") + "v=" + SESSION_BUST;
  } catch (_) {
    return src;
  }
}

function getPreviewContext(overrides = {}) {
  return {
    videoWrap: DOM.videoWrap,
    mode,
    activeTheme,
    pendingTemplate,
    selectedOverlay,
    setCaptureAspect,
    updateCaptureAspect,
    getTemplateList,
    getOverlayList,
    ...overrides,
  };
}

configureUploads({
  getCloudinaryConfig,
  getCurrentEventSlug,
});

configureThemeStorage({
  syncRemote: syncThemesRemote,
  loadRemote: loadThemesRemote,
});

function renderMissingThumbnail(container, src) {
  if (!container) return;
  container.innerHTML = "";
  const placeholder = document.createElement("div");
  placeholder.style.width = "100px";
  placeholder.style.height = "72px";
  placeholder.style.display = "flex";
  placeholder.style.alignItems = "center";
  placeholder.style.justifyContent = "center";
  placeholder.style.color = "#aaa";
  placeholder.style.background = "#151820";
  placeholder.style.borderRadius = "6px";
  placeholder.textContent = "Missing";
  const caption = document.createElement("div");
  caption.className = "asset-badge";
  caption.textContent = (src || "").split("/").pop();
  container.appendChild(placeholder);
  container.appendChild(caption);
}

function createAssetTile(src, options = {}) {
  const item = document.createElement("div");
  item.className = "asset-item";
  const img = document.createElement("img");
  img.src = withBust(src);
  img.onerror = () => renderMissingThumbnail(item, src);
  item.appendChild(img);
  if (options.badge) {
    const badgeEl = document.createElement("div");
    badgeEl.className = "asset-badge";
    badgeEl.textContent = options.badge;
    item.appendChild(badgeEl);
  }
  return item;
}

// --- Idle Timeout ---
let idleTimer;
const IDLE_TIMEOUT_MS = 30000; // 30 seconds

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    hideFinal();
    showWelcome();
  }, IDLE_TIMEOUT_MS);
}

function setupEventSelector() {
  if (!DOM.eventSelect) {
    console.warn("Event select dropdown not found; themes will not switch.");
    return;
  }
  DOM.eventSelect.addEventListener("change", handleEventSelectChange);
}

function handleEventSelectChange(event) {
  const key = event.target.value;
  loadTheme(key);
  highlightThemeQuickSelect(key);
  syncThemeEditorWithActiveTheme();
  if (DOM.eventNameInput) {
    DOM.eventNameInput.value = getStoredEventName(key) || "";
  }
  updateThemeEditorSummary();
}

function setupBoothButtons() {
  const startCameraBtn = document.getElementById("startCameraButton");
  if (startCameraBtn) startCameraBtn.addEventListener("click", startCamera);
  else console.warn("Start Camera button not found in DOM.");

  const startBoothBtn = document.getElementById("startBoothButton");
  if (startBoothBtn) startBoothBtn.addEventListener("click", startBooth);
  else console.warn("Start Booth button not found in DOM.");
}

function setupVideoListeners() {
  if (DOM.video) {
    DOM.video.addEventListener("loadedmetadata", () => {
      updateCaptureAspect();
      applyPreviewOrientation(getPreviewContext());
    });
  }
}

function setupFinalPreviewListeners() {
  if (!DOM.finalPreview || !DOM.finalPreviewContent) return;
  DOM.finalPreview.addEventListener("click", (e) => {
    if (!DOM.finalPreviewContent.contains(e.target)) {
      exitFinalPreview();
    }
  });
  DOM.finalPreviewContent.addEventListener("click", (e) => e.stopPropagation());
}

function setupThemeEditorControls() {
  if (DOM.themeEditorModeSelect)
    DOM.themeEditorModeSelect.addEventListener("change", (e) =>
      setThemeEditorMode(e.target.value),
    );
  if (DOM.themeName)
    DOM.themeName.addEventListener("input", updateThemeEditorSummary);
  if (DOM.themeCloneName)
    DOM.themeCloneName.addEventListener("input", updateThemeEditorSummary);
  if (DOM.createThemeName)
    DOM.createThemeName.addEventListener("input", updateThemeEditorSummary);
  if (DOM.cloneThemeBtn)
    DOM.cloneThemeBtn.addEventListener("click", handleCloneTheme);
  if (DOM.addBackgroundBtn && DOM.themeBackground) {
    DOM.addBackgroundBtn.addEventListener("click", () =>
      DOM.themeBackground.click(),
    );
  }
  if (DOM.addOverlaysBtn && DOM.themeOverlays) {
    DOM.addOverlaysBtn.addEventListener("click", () =>
      DOM.themeOverlays.click(),
    );
  }
  if (DOM.addTemplatesBtn && DOM.themeTemplates) {
    DOM.addTemplatesBtn.addEventListener("click", () =>
      DOM.themeTemplates.click(),
    );
  }
  if (DOM.addLogoBtn && DOM.themeLogo)
    DOM.addLogoBtn.addEventListener("click", () => DOM.themeLogo.click());
  if (DOM.themeBackground)
    DOM.themeBackground.addEventListener("change", () =>
      handleThemeAssetInputChange("background"),
    );
  if (DOM.themeLogo)
    DOM.themeLogo.addEventListener("change", () =>
      handleThemeAssetInputChange("logo"),
    );
  if (DOM.themeOverlays)
    DOM.themeOverlays.addEventListener("change", () =>
      handleThemeAssetInputChange("overlay"),
    );
  if (DOM.themeTemplates)
    DOM.themeTemplates.addEventListener("change", () =>
      handleThemeAssetInputChange("template"),
    );
  if (DOM.themeWelcomeTitle)
    DOM.themeWelcomeTitle.addEventListener(
      "input",
      handleWelcomeTitleInputChange,
    );
  if (DOM.themeWelcomePrompt)
    DOM.themeWelcomePrompt.addEventListener(
      "input",
      handleWelcomePromptInputChange,
    );
  if (DOM.welcomeTitleSizeInput)
    DOM.welcomeTitleSizeInput.addEventListener(
      "input",
      handleWelcomeTitleSizeInput,
    );
  if (DOM.zoomSlider)
    DOM.zoomSlider.addEventListener("input", handleZoomSliderInput);
  if (DOM.eventTitleSizeInput)
    DOM.eventTitleSizeInput.addEventListener(
      "input",
      handleEventTitleSizeInput,
    );
  if (DOM.themeAccent) {
    DOM.themeAccent.addEventListener("input", () =>
      handleAccentInputChange("accent", { save: false }),
    );
    DOM.themeAccent.addEventListener("change", () =>
      handleAccentInputChange("accent"),
    );
  }
  if (DOM.themeAccent2) {
    DOM.themeAccent2.addEventListener("input", () =>
      handleAccentInputChange("accent2", { save: false }),
    );
    DOM.themeAccent2.addEventListener("change", () =>
      handleAccentInputChange("accent2"),
    );
  }
}

function handleEventTitleSizeInput() {
  if (!DOM.eventTitleSizeInput) return;
  const size = normalizeSizeValue(
    DOM.eventTitleSizeInput.value,
    DEFAULT_EVENT_TITLE_SIZE,
  );
  DOM.eventTitleSizeInput.value = formatSizeValue(size);
  document.documentElement.style.setProperty("--event-title-size", `${size}em`);
  if (activeTheme) activeTheme.eventTitleSize = size;
  refreshStylePreviewText();
}

function handleWelcomeTitleSizeInput() {
  if (!DOM.welcomeTitleSizeInput) return;
  const size = normalizeSizeValue(
    DOM.welcomeTitleSizeInput.value,
    DEFAULT_WELCOME_TITLE_SIZE,
  );
  DOM.welcomeTitleSizeInput.value = formatSizeValue(size);
  document.documentElement.style.setProperty(
    "--welcome-title-size",
    `${size}em`,
  );
  if (activeTheme) {
    activeTheme.welcome = activeTheme.welcome || {};
    activeTheme.welcome.titleSize = size;
  }
  refreshStylePreviewText();
}

function handleWelcomeTitleInputChange() {
  const text = valueFromInput(DOM.themeWelcomeTitle);
  if (activeTheme) {
    activeTheme.welcome = activeTheme.welcome || {};
    activeTheme.welcome.title = text;
  }
  if (DOM.welcomeTitle) {
    const fallback = DOM.eventTitle ? DOM.eventTitle.textContent : "";
    DOM.welcomeTitle.textContent = text || fallback || "";
  }
  refreshStylePreviewText();
}

function handleZoomSliderInput(event) {
  if (!event || !event.target) return;
  const value = Number(event.target.value);
  if (!Number.isFinite(value)) return;
  setZoomLevel(value);
}

function handleWelcomePromptInputChange() {
  const prompt = valueFromInput(DOM.themeWelcomePrompt);
  if (activeTheme) {
    activeTheme.welcome = activeTheme.welcome || {};
    activeTheme.welcome.prompt = prompt;
  }
  if (DOM.startButton) DOM.startButton.textContent = prompt || "Touch to start";
  refreshStylePreviewText();
}

function handleAccentInputChange(kind, options = {}) {
  const input = kind === "accent" ? DOM.themeAccent : DOM.themeAccent2;
  if (!input) return;
  const value = input.value || "";
  if (activeTheme) {
    activeTheme[kind] = value;
  }
  const cssVar = kind === "accent" ? "--accent" : "--accent2";
  const fallback = value || (kind === "accent" ? "#3f51b5" : "#ffffff");
  document.documentElement.style.setProperty(cssVar, fallback);
  if (activeTheme) {
    if (options.save !== false) {
      saveThemesToStorage();
      syncThemeEditorSummary();
    }
    renderCurrentAssets(activeTheme);
  }
  refreshStylePreviewText();
}

function handleThemeAssetInputChange(kind) {
  let input = null;
  if (kind === "background") input = DOM.themeBackground;
  else if (kind === "logo") input = DOM.themeLogo;
  else if (kind === "overlay") input = DOM.themeOverlays;
  else if (kind === "template") input = DOM.themeTemplates;
  if (!input || !input.files || input.files.length === 0) return;
  updateSelectedTheme(kind).catch((err) =>
    console.error("Failed to update theme assets:", err),
  );
}

function setupCreateThemeModalControls() {
  if (DOM.createThemeDropZone) {
    DOM.createThemeDropZone.addEventListener(
      "dragover",
      handleCreateThemeDragOver,
    );
    DOM.createThemeDropZone.addEventListener(
      "dragleave",
      handleCreateThemeDragLeave,
    );
    DOM.createThemeDropZone.addEventListener("drop", handleCreateThemeDrop);
    DOM.createThemeDropZone.addEventListener("click", () =>
      DOM.createThemeFolderInput?.click(),
    );
  }
  if (DOM.createThemeBrowseBtn)
    DOM.createThemeBrowseBtn.addEventListener("click", () =>
      DOM.createThemeFolderInput?.click(),
    );
  if (DOM.createThemeFolderInput)
    DOM.createThemeFolderInput.addEventListener("change", (e) => {
      handleCreateThemeFiles(e.target.files);
      e.target.value = "";
    });
  if (DOM.createThemeCancel)
    DOM.createThemeCancel.addEventListener("click", () => {
      hideCreateThemeModal();
      resetCreateThemeModal();
      if (DOM.themeEditorModeSelect) {
        DOM.themeEditorModeSelect.value = "edit";
        setThemeEditorMode("edit");
      }
    });
  if (DOM.createThemeConfirm)
    DOM.createThemeConfirm.addEventListener("click", confirmCreateTheme);
}

function setupOfflineControls() {
  if (DOM.offlineModeToggle) {
    DOM.offlineModeToggle.checked = getOfflinePref();
    DOM.offlineModeToggle.addEventListener("change", () => {
      setOfflinePref(DOM.offlineModeToggle.checked);
      updatePendingUI();
      showToast(
        DOM.offlineModeToggle.checked ? "Offline mode ON" : "Offline mode OFF",
      );
    });
  }
  if (DOM.forceCameraFileToggle) {
    DOM.forceCameraFileToggle.checked =
      localStorage.getItem("forceCameraOnFile") === "true";
    DOM.forceCameraFileToggle.addEventListener("change", () => {
      localStorage.setItem(
        "forceCameraOnFile",
        DOM.forceCameraFileToggle.checked ? "true" : "false",
      );
    });
  }
  window.addEventListener("online", () => updatePendingUI());
  window.addEventListener("offline", () => updatePendingUI());
}

function setupFolderPickers() {
  if (DOM.themeOverlaysFolderPicker)
    DOM.themeOverlaysFolderPicker.addEventListener(
      "change",
      handleOverlayFolderPick,
    );
  if (DOM.themeTemplatesFolderPicker)
    DOM.themeTemplatesFolderPicker.addEventListener(
      "change",
      handleTemplateFolderPick,
    );
}

function setupEventNameInput() {
  if (!DOM.eventNameInput) return;
  DOM.eventNameInput.addEventListener("input", () => {
    const key = DOM.eventSelect && DOM.eventSelect.value;
    if (!key) return;
    saveStoredEventName(key, DOM.eventNameInput.value.trim());
    if (DOM.eventTitle) {
      DOM.eventTitle.textContent =
        DOM.eventNameInput.value.trim() ||
        (activeTheme && activeTheme.welcome && activeTheme.welcome.title) ||
        DOM.eventTitle.textContent;
    }
    refreshStylePreviewText();
  });
}

function init() {
  setupEventSelector();
  setupBoothButtons();
  setupVideoListeners();
  setupFinalPreviewListeners();
  setupThemeEditorControls();
  setupCreateThemeModalControls();
  setupOfflineControls();
  setupFolderPickers();
  setupCustomPairingControls();
  setupEventNameInput();
  loadCloudinarySettings();
  setThemeEditorMode(
    DOM.themeEditorModeSelect ? DOM.themeEditorModeSelect.value : "edit",
  );
  loadEmailJsSettings();
  updatePendingUI();
  applyPreviewOrientation(getPreviewContext());
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded event fired.");
  loadThemesFromStorage();
  loadFontsFromStorage();
  loadDeploySettings();
  try {
    await setupFontPicker();
  } catch (e) {
    console.warn("Font picker setup failed", e);
  }
  const initialKey = populateThemeSelector(DEFAULT_THEME_KEY);
  if (initialKey) {
    loadTheme(initialKey);
  }
  goAdmin(); // Start on admin screen
  ["click", "mousemove", "keydown", "touchstart"].forEach((evt) =>
    document.addEventListener(evt, resetIdleTimer),
  );
  resetIdleTimer();
  init();
  if (DOM.headingFontSelect && DOM.bodyFontSelect) {
    setupDualFontPicker({
      headingSelect: DOM.headingFontSelect,
      bodySelect: DOM.bodyFontSelect,
      pairingSelect: DOM.fontPairingSelect,
      fontsEndpoint: canSyncRemote() ? "/api/fonts" : "",
    }).catch((err) =>
      console.warn("Dual font picker failed to initialize", err),
    );
  }
  setupInstallPrompt();
  ensureRemoteSeed();
  updateThemeEditorSummary();
});

// --- Remote sync (Cloudflare Pages Functions) ---
// Allow syncing on Pages, Workers, GitHub Pages, and local hosts
const REMOTE_SYNC_ALLOWLIST = [
  /\.pages\.dev$/i,
  /\.workers\.dev$/i,
  /\.github\.io$/i,
  /localhost$/,
  /^127\.0\.0\.1$/,
];
const REMOTE_SYNC_BLOCKLIST = [/staging-only\.fletchphoto\.internal$/i];

function resolveRemoteSyncOverride() {
  try {
    if (typeof window !== "undefined") {
      if (typeof window.PHOTOBOOTH_REMOTE_SYNC === "boolean")
        return window.PHOTOBOOTH_REMOTE_SYNC;
      const stored = localStorage.getItem("photoboothRemoteSync");
      if (stored === "true") return true;
      if (stored === "false") return false;
    }
  } catch (_) {}
  return null;
}

function hostMatches(list, host) {
  if (!Array.isArray(list) || !host) return false;
  return list.some((rule) => {
    if (typeof rule === "string") return host === rule;
    if (rule && typeof rule.test === "function") return rule.test(host);
    return false;
  });
}

function canSyncRemote() {
  if (typeof location === "undefined") return false;
  const protocol = (location && location.protocol) || "";
  if (!protocol.startsWith("http")) return false;
  const override = resolveRemoteSyncOverride();
  if (override !== null) return override;
  const host =
    (location && location.hostname && location.hostname.toLowerCase()) || "";
  if (!host) return false;
  if (hostMatches(REMOTE_SYNC_BLOCKLIST, host)) return false;
  return hostMatches(REMOTE_SYNC_ALLOWLIST, host);
}
async function loadThemesRemote() {
  if (!canSyncRemote()) return;
  try {
    const resp = await fetch("/api/themes", { cache: "no-store" });
    if (!resp.ok) return;
    const remote = await resp.json();
    const hasKeys =
      remote && typeof remote === "object" && Object.keys(remote).length > 0;
    if (!hasKeys) {
      // Do not clobber built-in themes with an empty server payload
      updateSyncStatus("Using built-in themes");
      return;
    }
    // Merge server themes over built-ins/local
    mergeStoredThemes(themes, remote);
    fixBuiltinThemePlacements(themes);
    ensureBuiltinThemes();
    if (!hasCoreBuiltins(themes)) {
      resetThemesToBuiltins("remote themes missing core entries");
    }
    try {
      normalizeAllThemes();
    } catch (_e) {}
    const globalLogo = getGlobalLogo();
    if (globalLogo !== null) applyGlobalLogoToAllThemes(globalLogo);
    localStorage.setItem("photoboothThemes", JSON.stringify(themes));
    // Refresh UI if already initialized
    const selected = populateThemeSelector(DEFAULT_THEME_KEY);
    if (selected) {
      loadTheme(selected);
    }
    updateSyncStatus("Synced from server");
  } catch (_) {}
}
async function syncThemesRemote() {
  if (!canSyncRemote()) return;
  try {
    await fetch("/api/themes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(themes),
    });
  } catch (_) {}
}
function mergeFonts(a, b) {
  const out = [];
  const seen = new Set();
  [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].forEach(
    (f) => {
      try {
        const k = JSON.stringify(f);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(f);
        }
      } catch (_) {}
    },
  );
  return out;
}
async function loadFontsRemote() {
  if (!canSyncRemote()) return [];
  try {
    const r = await fetch("/api/fonts", { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    if (Array.isArray(data)) return data;
    const normalized = normalizeFontsPayload(data);
    if (normalized && Array.isArray(normalized.available)) {
      return normalized.available.map((font) => ({
        type: "family",
        value: font.name,
        weights: font.weights,
      }));
    }
    return [];
  } catch (_) {
    return [];
  }
}
async function syncFontsRemote(fonts) {
  if (!canSyncRemote()) return;
  try {
    await fetch("/api/fonts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fonts || []),
    });
  } catch (_) {}
}

// --- Manual sync UI ---
function updateSyncStatus(text) {
  if (DOM.syncStatus) DOM.syncStatus.textContent = text || "";
}
async function syncNow() {
  if (!canSyncRemote()) {
    alert("Open over HTTPS to sync");
    return;
  }
  try {
    updateSyncStatus("Syncing…");
    // Push current local themes and fonts
    await syncThemesRemote();
    await syncFontsRemote(getStoredFonts());
    // Reload from server to confirm and merge
    await loadThemesRemote();
    const remoteFonts = await loadFontsRemote();
    if (Array.isArray(remoteFonts) && remoteFonts.length) {
      const merged = mergeFonts(getStoredFonts(), remoteFonts);
      localStorage.setItem("photoboothFonts", JSON.stringify(merged));
    }
    updateSyncStatus("Synced ✓");
    showToast("Sync complete");
  } catch (e) {
    console.error("Sync failed", e);
    updateSyncStatus("Sync failed");
    alert("Sync failed. Check network and Cloudflare bindings.");
  }
}

// --- One-time remote seeding ---
async function ensureRemoteSeed() {
  if (!canSyncRemote()) return;
  try {
    if (localStorage.getItem("kvSeeded") === "true") return;
    const [tRes, fRes] = await Promise.all([
      fetch("/api/themes", { cache: "no-store" }),
      fetch("/api/fonts", { cache: "no-store" }),
    ]);
    let needSeed = false;
    if (tRes.ok) {
      const t = await tRes.text();
      if (!t || t.trim() === "" || t.trim() === "{}") needSeed = true;
    }
    if (fRes.ok) {
      const f = await fRes.text();
      if (!f || f.trim() === "" || f.trim() === "[]") needSeed = true;
    }
    if (needSeed) {
      await syncThemesRemote();
      await syncFontsRemote(getStoredFonts());
      localStorage.setItem("kvSeeded", "true");
      updateSyncStatus("Seeded to server");
    }
  } catch (_) {}
}

// --- EmailJS Configuration ---
// Defaults (can be overridden via Admin > Email (EmailJS))
const EMAILJS_SERVICE_ID_DEFAULT = "service_wf13ozc";
const EMAILJS_TEMPLATE_ID_DEFAULT = "template_yankxhd";
const EMAILJS_PUBLIC_KEY_DEFAULT = "pzgt5QUA4x12IOITx";

function getEmailJsConfig() {
  const service =
    localStorage.getItem("emailJsService") || EMAILJS_SERVICE_ID_DEFAULT;
  const template =
    localStorage.getItem("emailJsTemplate") || EMAILJS_TEMPLATE_ID_DEFAULT;
  const pub =
    localStorage.getItem("emailJsPublic") || EMAILJS_PUBLIC_KEY_DEFAULT;
  return { service, template, pub };
}
function loadEmailJsSettings() {
  const cfg = getEmailJsConfig();
  if (DOM.emailJsPublic)
    DOM.emailJsPublic.value = localStorage.getItem("emailJsPublic") || "";
  if (DOM.emailJsService)
    DOM.emailJsService.value = localStorage.getItem("emailJsService") || "";
  if (DOM.emailJsTemplate)
    DOM.emailJsTemplate.value = localStorage.getItem("emailJsTemplate") || "";
  try {
    emailjs.init({ publicKey: cfg.pub });
  } catch (_e) {
    try {
      emailjs.init(cfg.pub);
    } catch (__e) {}
  }
}
function saveEmailJsSettings() {
  if (DOM.emailJsPublic)
    localStorage.setItem(
      "emailJsPublic",
      (DOM.emailJsPublic.value || "").trim(),
    );
  if (DOM.emailJsService)
    localStorage.setItem(
      "emailJsService",
      (DOM.emailJsService.value || "").trim(),
    );
  if (DOM.emailJsTemplate)
    localStorage.setItem(
      "emailJsTemplate",
      (DOM.emailJsTemplate.value || "").trim(),
    );
  loadEmailJsSettings();
  showToast("Email settings saved");
}
async function sendTestEmail() {
  const cfg = getEmailJsConfig();
  const to = prompt("Send test to (email):");
  if (!to) return;
  const tiny =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAtEB6m3W1NoAAAAASUVORK5CYII=";
  const params = {
    to_email: to,
    photo_url: tiny,
    link_url: "",
    image_data_url: tiny,
  };
  try {
    await emailjs.send(cfg.service, cfg.template, params);
    alert("Test email sent");
  } catch (e) {
    const details = e && (e.text || e.message || e.status || JSON.stringify(e));
    console.error("EmailJS test failed", e);
    alert("Test failed: " + (details || "unknown error"));
  }
}

// --- Cloudinary Settings (UI + storage) ---
// Defaults (optional):
const CLOUDINARY_CLOUD_NAME = "afletch32";
const CLOUDINARY_UPLOAD_PRESET = "photobooth_unsigned";
const CLOUDINARY_FOLDER_BASE_DEFAULT = "photobooth/events";

function loadCloudinarySettings() {
  const cloud =
    localStorage.getItem("cloudinaryCloudName") || CLOUDINARY_CLOUD_NAME;
  const preset =
    localStorage.getItem("cloudinaryUploadPreset") || CLOUDINARY_UPLOAD_PRESET;
  const folderBase =
    localStorage.getItem("cloudinaryFolderBase") ||
    CLOUDINARY_FOLDER_BASE_DEFAULT;
  const use =
    (localStorage.getItem("cloudinaryUse") || "").toString() !== "false" &&
    Boolean(cloud && preset);
  if (DOM.cloudNameInput) DOM.cloudNameInput.value = cloud || "";
  if (DOM.cloudPresetInput) DOM.cloudPresetInput.value = preset || "";
  if (DOM.cloudFolderInput) DOM.cloudFolderInput.value = folderBase || "";
  if (DOM.cloudUseToggle) DOM.cloudUseToggle.checked = use;
}
function saveCloudinarySettings() {
  const cloud = (DOM.cloudNameInput && DOM.cloudNameInput.value.trim()) || "";
  const preset =
    (DOM.cloudPresetInput && DOM.cloudPresetInput.value.trim()) || "";
  const folderBase =
    (DOM.cloudFolderInput && DOM.cloudFolderInput.value.trim()) || "";
  const use = DOM.cloudUseToggle && DOM.cloudUseToggle.checked;
  if (cloud) localStorage.setItem("cloudinaryCloudName", cloud);
  else localStorage.removeItem("cloudinaryCloudName");
  if (preset) localStorage.setItem("cloudinaryUploadPreset", preset);
  else localStorage.removeItem("cloudinaryUploadPreset");
  if (folderBase) localStorage.setItem("cloudinaryFolderBase", folderBase);
  else localStorage.removeItem("cloudinaryFolderBase");
  localStorage.setItem("cloudinaryUse", use ? "true" : "false");
  showToast("Cloudinary settings saved");
}
function getCloudinaryConfig() {
  const cloud =
    localStorage.getItem("cloudinaryCloudName") || CLOUDINARY_CLOUD_NAME;
  const preset =
    localStorage.getItem("cloudinaryUploadPreset") || CLOUDINARY_UPLOAD_PRESET;
  const folderBase =
    localStorage.getItem("cloudinaryFolderBase") ||
    CLOUDINARY_FOLDER_BASE_DEFAULT;
  const use =
    (localStorage.getItem("cloudinaryUse") || "").toString() !== "false" &&
    Boolean(cloud && preset);
  return { cloud, preset, folderBase, use };
}
function cloudinaryEnabled() {
  const cfg = getCloudinaryConfig();
  return cfg.use;
}

// --- Overlay Spot-Color Mask (optional) ---
// If enabled, any pixel in an overlay matching `SPOT_MASK.color` within `tolerance`
// becomes transparent. Useful to design overlays with colored "holes" for photos.
const SPOT_MASK = {
  enabled: true,
  color: "#00ff00", // pure green by default
  tolerance: 12, // 0-255 per channel
};

function populateThemeSelector(preferredKey, attempt = 0) {
  console.log("Themes object:", themes);
  const select = DOM.eventSelect;
  if (!select) return null;
  select.innerHTML = "";
  let optionCount = 0;
  for (const themeKey in themes) {
    if (themeKey.startsWith("_")) continue; // skip meta buckets
    const theme = themes[themeKey];
    if (theme.themes || theme.holidays) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = theme.name;
      const subThemes = theme.themes || theme.holidays;
      for (const subThemeKey in subThemes) {
        const loc = BUILTIN_THEME_LOCATIONS[subThemeKey];
        if (
          loc &&
          (loc.root !== themeKey ||
            loc.bucket !== (theme.themes ? "themes" : "holidays"))
        ) {
          continue;
        }
        const subTheme = subThemes[subThemeKey];
        const option = document.createElement("option");
        option.value = `${themeKey}:${subThemeKey}`;
        option.textContent = subTheme.name;
        optgroup.appendChild(option);
        optionCount += 1;
      }
      select.appendChild(optgroup);
    } else {
      const option = document.createElement("option");
      option.value = themeKey;
      option.textContent = theme.name;
      select.appendChild(option);
      optionCount += 1;
    }
  }
  if (optionCount === 0) {
    renderThemeQuickSelect(select);
    if (attempt === 0) {
      resetThemesToBuiltins("no selectable themes for dropdown");
      ensureBuiltinThemes();
      try {
        normalizeAllThemes();
      } catch (_e) {}
      return populateThemeSelector(preferredKey, attempt + 1);
    }
    highlightThemeQuickSelect(null);
    updateThemeEditorSummary();
    return null;
  }
  renderThemeQuickSelect(select);
  const resolved = resolvePreferredThemeKey(preferredKey);
  if (resolved && !setEventSelection(resolved) && select.options.length > 0) {
    select.selectedIndex = 0;
  }
  const selectedKey = (DOM.eventSelect && DOM.eventSelect.value) || null;
  highlightThemeQuickSelect(selectedKey);
  updateThemeEditorSummary();
  return selectedKey;
}

function renderThemeQuickSelect(selectEl = DOM.eventSelect) {
  const container = DOM.themeQuickSelect;
  if (!container || !selectEl) return;
  container.innerHTML = "";
  const options = Array.from(selectEl.options || []).filter(
    (opt) => opt && opt.value,
  );
  if (!options.length) {
    container.classList.add("hidden");
    return;
  }
  container.classList.remove("hidden");
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-quick-btn";
    btn.textContent = opt.textContent || opt.value;
    btn.dataset.value = opt.value;
    btn.addEventListener("click", () => {
      if (selectEl.value !== opt.value) {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        highlightThemeQuickSelect(opt.value);
      }
    });
    container.appendChild(btn);
  });
  highlightThemeQuickSelect(selectEl.value);
}

function highlightThemeQuickSelect(value) {
  const container = DOM.themeQuickSelect;
  if (!container) return;
  Array.from(container.querySelectorAll(".theme-quick-btn")).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}

function showToast(message, duration = 2000) {
  const t = DOM.toast;
  if (!t) return;
  t.textContent = message;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, duration);
}

function setEventSelection(key) {
  if (!DOM.eventSelect || !key) return false;
  const options = Array.from(DOM.eventSelect.options || []);
  const match = options.find((opt) => opt.value === key);
  if (!match) return false;
  DOM.eventSelect.value = key;
  highlightThemeQuickSelect(key);
  updateThemeEditorSummary();
  return true;
}

function resolvePreferredThemeKey(preferredKey) {
  if (!DOM.eventSelect) return preferredKey || DEFAULT_THEME_KEY || null;
  const options = Array.from(DOM.eventSelect.options || []);
  const hasKey = (key) => !!key && options.some((opt) => opt.value === key);
  if (hasKey(preferredKey)) return preferredKey;
  if (hasKey(DEFAULT_THEME_KEY)) return DEFAULT_THEME_KEY;
  const generalOption = options.find(
    (opt) => typeof opt.value === "string" && opt.value.startsWith("general:"),
  );
  if (generalOption) return generalOption.value;
  const generalStandalone = options.find((opt) => opt.value === "general");
  if (generalStandalone) return generalStandalone.value;
  return options.length ? options[0].value : null;
}

function resolveThemeByKey(themeKey) {
  if (!themeKey) return null;
  if (themeKey.includes(":")) {
    const [rootKey, leafKey] = themeKey.split(":");
    const root = themes[rootKey];
    if (!root) return null;
    if (root.themes && root.themes[leafKey]) return root.themes[leafKey];
    if (root.holidays && root.holidays[leafKey]) return root.holidays[leafKey];
    return null;
  }
  return themes[themeKey] || null;
}

function resolveThemeStorage(key) {
  if (!key) return { parent: themes, bucket: null, root: null };
  if (!key.includes(":")) {
    return { parent: themes, bucket: null, root: key };
  }
  const [rootKey, leafKey] = key.split(":");
  const parent = themes[rootKey];
  if (!parent || typeof parent !== "object") {
    return { parent: themes, bucket: null, root: rootKey };
  }
  if (parent.themes && parent.themes[leafKey]) {
    return { parent, bucket: "themes", root: rootKey };
  }
  if (parent.holidays && parent.holidays[leafKey]) {
    return { parent, bucket: "holidays", root: rootKey };
  }
  return { parent: themes, bucket: null, root: rootKey };
}

function applyThemeFontStyles(theme) {
  const headingCss =
    (theme && (theme.fontHeading || theme.font)) || "'Comic Neue', cursive";
  const bodyCss =
    (theme && (theme.fontBody || theme.font)) || "'Comic Neue', cursive";
  document.documentElement.style.setProperty("--font-heading", headingCss);
  document.documentElement.style.setProperty("--font-body", bodyCss);
  document.documentElement.style.setProperty("--font", bodyCss);
  document.documentElement.style.setProperty(
    "--countdown-font",
    headingCss || bodyCss || "'Comic Neue', cursive",
  );
  document.body.style.fontFamily = bodyCss || "montserrat, sans-serif";
  if (DOM.eventTitle) DOM.eventTitle.style.fontFamily = headingCss || bodyCss;
  if (DOM.welcomeTitle)
    DOM.welcomeTitle.style.fontFamily = headingCss || bodyCss;
  ensureFontLoadedForFontString(headingCss);
  ensureFontLoadedForFontString(bodyCss);
  refreshStylePreviewText();
}

function applyHeadingSizes(theme) {
  const eventSize = normalizeSizeValue(
    theme && theme.eventTitleSize,
    DEFAULT_EVENT_TITLE_SIZE,
  );
  const welcomeSize = normalizeSizeValue(
    theme && theme.welcome && theme.welcome.titleSize,
    DEFAULT_WELCOME_TITLE_SIZE,
  );
  document.documentElement.style.setProperty(
    "--event-title-size",
    `${eventSize}em`,
  );
  document.documentElement.style.setProperty(
    "--welcome-title-size",
    `${welcomeSize}em`,
  );
  if (DOM.eventTitleSizeInput)
    DOM.eventTitleSizeInput.value = formatSizeValue(eventSize);
  if (DOM.welcomeTitleSizeInput)
    DOM.welcomeTitleSizeInput.value = formatSizeValue(welcomeSize);
  refreshStylePreviewText();
}

function applyThemeBasics(theme) {
  document.documentElement.style.setProperty(
    "--accent",
    theme.accent || "orange",
  );
  document.documentElement.style.setProperty(
    "--accent2",
    theme.accent2 || "white",
  );
  applyThemeFontStyles(theme);
  applyHeadingSizes(theme);
  applyThemeBackground(theme);
}

function refreshFontSelectForTheme(theme) {
  setupFontPicker()
    .then(() => {
      refreshFontPickerUI(theme || activeTheme || {});
    })
    .catch(() => {});
}

function refreshBackgroundFromFolder(theme) {
  resolveBackgroundFromFolder(theme)
    .then((autoBg) => {
      if (!autoBg) return;
      DOM.boothScreen.style.backgroundImage = `url(${autoBg})`;
      if (DOM.welcomeScreen)
        DOM.welcomeScreen.style.backgroundImage =
          DOM.boothScreen.style.backgroundImage;
    })
    .catch(() => {
      /* ignore */
    });
}

function refreshBackgroundList(theme) {
  resolveBackgroundListFromFolder(theme)
    .then((list) => {
      if (!Array.isArray(list) || !list.length) return;
      theme.backgroundsTmp = list;
      const combined = getBackgroundList(theme);
      if (
        !Array.isArray(theme.backgrounds) ||
        theme.backgrounds.length !== combined.length
      ) {
        theme.backgrounds = combined.slice();
      }
      if (combined.length > 0) {
        if (
          typeof theme.backgroundIndex !== "number" ||
          theme.backgroundIndex >= combined.length
        ) {
          theme.backgroundIndex = 0;
        }
        const currentBg = getActiveBackground(theme);
        if (currentBg) {
          DOM.boothScreen.style.backgroundImage = `url(${currentBg})`;
          if (DOM.welcomeScreen)
            DOM.welcomeScreen.style.backgroundImage =
              DOM.boothScreen.style.backgroundImage;
        }
      }
      renderCurrentAssets(theme);
    })
    .catch(() => {
      /* ignore */
    });
}

function refreshOverlaysFromFolder(theme) {
  resolveOverlaysFromFolder(theme)
    .then((list) => {
      if (Array.isArray(list) && list.length) {
        theme.overlaysTmp = list;
        renderCurrentAssets(theme);
        renderOptions();
      } else {
        theme.overlaysTmp = undefined;
      }
    })
    .catch(() => {
      theme.overlaysTmp = undefined;
    });
}

function refreshTemplatesFromFolder(theme) {
  resolveTemplatesFromFolder(theme)
    .then((list) => {
      if (Array.isArray(list) && list.length) {
        theme.templatesTmp = list;
        renderCurrentAssets(theme);
        renderOptions();
      } else {
        theme.templatesTmp = undefined;
      }
    })
    .catch(() => {
      theme.templatesTmp = undefined;
    });
}

function syncAdminUiWithTheme(themeKey, theme) {
  const currentKey =
    themeKey || (DOM.eventSelect && DOM.eventSelect.value) || "";
  const storedName = getStoredEventName(currentKey);
  if (DOM.eventTitle)
    DOM.eventTitle.textContent =
      storedName || (theme.welcome && theme.welcome.title) || "";
  if (DOM.logo) {
    if (theme.logo) {
      DOM.logo.src = theme.logo;
      DOM.logo.classList.remove("hidden");
    } else {
      DOM.logo.src = "";
      DOM.logo.classList.add("hidden");
    }
  }
  selectedOverlay = null;
  if (DOM.liveOverlay) DOM.liveOverlay.src = "";
  refreshFontSelectForTheme(theme);
  if (DOM.options) renderOptions();
  syncThemeEditorWithActiveTheme();
  if (DOM.eventNameInput) DOM.eventNameInput.value = storedName || "";
}

function loadTheme(themeKey) {
  console.log("Loading theme:", themeKey);
  if (!themeKey) {
    console.warn("No theme key provided to loadTheme");
    return;
  }
  const theme = resolveThemeByKey(themeKey);
  if (!theme) {
    console.warn("Theme not found for key:", themeKey);
    return;
  }
  highlightThemeQuickSelect(themeKey);
  activeTheme = theme;
  const globalLogo = getGlobalLogo();
  if (globalLogo !== null) applyGlobalLogoToTheme(activeTheme, globalLogo);

  applyThemeBasics(theme);
  refreshBackgroundFromFolder(theme);
  refreshBackgroundList(theme);
  refreshOverlaysFromFolder(theme);
  refreshTemplatesFromFolder(theme);
  syncAdminUiWithTheme(themeKey, theme);
  if (DOM.boothScreen && !DOM.boothScreen.classList.contains("hidden")) {
    showWelcome();
  }
}

// Convert any CSS color string to hex (#rrggbb); returns '' on failure
function colorToHex(colorStr) {
  try {
    const el = document.createElement("span");
    el.style.color = colorStr;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color; // e.g., 'rgb(255, 165, 0)'
    document.body.removeChild(el);
    const m = rgb.match(/rgba?\((\d+), ?(\d+), ?(\d+)/);
    if (!m) return "";
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  } catch (_e) {
    return "";
  }
}

function updateThemeEditorSummary() {
  const eventKey = DOM.eventSelect && DOM.eventSelect.value;
  const eventTheme = getThemeByKey(eventKey);
  if (DOM.themeEditorActive) {
    DOM.themeEditorActive.textContent = describeActiveTheme(
      eventTheme,
      eventKey,
    );
  }
  if (DOM.themeEditorEditing) {
    DOM.themeEditorEditing.textContent = describeEditingState();
  }
}

function describeActiveTheme(theme, key) {
  if (theme && theme.name) return theme.name;
  if (key) return key;
  return "None selected";
}

function describeEditingState() {
  const mode = DOM.themeEditorModeSelect
    ? DOM.themeEditorModeSelect.value
    : "edit";
  if (mode === "create") {
    const name =
      valueFromInput(DOM.createThemeName) || valueFromInput(DOM.themeName);
    return name ? `Creating: \"${name}\"` : "Creating: New theme";
  }
  if (mode === "clone") {
    const cloneName = valueFromInput(DOM.themeCloneName);
    const baseName =
      (activeTheme && activeTheme.name) ||
      (DOM.eventSelect && DOM.eventSelect.value) ||
      "theme";
    return cloneName ? `Cloning to \"${cloneName}\"` : `Cloning ${baseName}`;
  }
  const currentKey = DOM.eventSelect && DOM.eventSelect.value;
  const currentTheme = getThemeByKey(currentKey);
  const displayName =
    valueFromInput(DOM.themeName) ||
    (currentTheme && currentTheme.name) ||
    currentKey ||
    "Choose a theme";
  return `Editing: ${displayName}`;
}

function syncThemeEditorWithActiveTheme() {
  if (!activeTheme) return;
  applyThemeEditorBasics(activeTheme);
  applyThemeEditorColors(activeTheme);
  updateThemeEditorSummaries(activeTheme);
  renderCurrentAssets(activeTheme);
  updateThemeEditorSummary();
}

function applyThemeEditorBasics(theme) {
  if (DOM.themeName) DOM.themeName.value = theme.name || "";
  setupFontPicker()
    .then(() => {
      refreshFontPickerUI(theme || {});
    })
    .catch(() => {});
  if (DOM.themeWelcomeTitle)
    DOM.themeWelcomeTitle.value = (theme.welcome && theme.welcome.title) || "";
  if (DOM.themeWelcomePrompt)
    DOM.themeWelcomePrompt.value =
      (theme.welcome && theme.welcome.prompt) || "";
  if (DOM.themeOverlaysFolder)
    DOM.themeOverlaysFolder.value = theme.overlaysFolder || "";
  if (DOM.themeTemplatesFolder)
    DOM.themeTemplatesFolder.value = theme.templatesFolder || "";
  const eventSize = normalizeSizeValue(
    theme.eventTitleSize,
    DEFAULT_EVENT_TITLE_SIZE,
  );
  const welcomeSize = normalizeSizeValue(
    theme.welcome && theme.welcome.titleSize,
    DEFAULT_WELCOME_TITLE_SIZE,
  );
  document.documentElement.style.setProperty(
    "--event-title-size",
    `${eventSize}em`,
  );
  document.documentElement.style.setProperty(
    "--welcome-title-size",
    `${welcomeSize}em`,
  );
  if (DOM.eventTitleSizeInput)
    DOM.eventTitleSizeInput.value = formatSizeValue(eventSize);
  if (DOM.welcomeTitleSizeInput)
    DOM.welcomeTitleSizeInput.value = formatSizeValue(welcomeSize);
  refreshStylePreviewText();
}

function applyThemeEditorColors(theme) {
  const primary =
    theme.accent && theme.accent.startsWith("#")
      ? theme.accent
      : colorToHex(theme.accent || "");
  const secondary =
    theme.accent2 && theme.accent2.startsWith("#")
      ? theme.accent2
      : colorToHex(theme.accent2 || "");
  if (primary && DOM.themeAccent) DOM.themeAccent.value = primary;
  if (secondary && DOM.themeAccent2) DOM.themeAccent2.value = secondary;
}

function updateThemeEditorSummaries(theme) {
  if (DOM.summaryBackground) {
    const hasExplicit =
      Array.isArray(theme.backgrounds) && theme.backgrounds.length > 0;
    const hasTemp =
      Array.isArray(theme.backgroundsTmp) && theme.backgroundsTmp.length > 0;
    const hasAny = !!theme.background || hasExplicit || hasTemp;
    DOM.summaryBackground.textContent = hasAny
      ? "Current background: set"
      : "Current background: none";
  }
  if (DOM.summaryLogo)
    DOM.summaryLogo.textContent = theme.logo
      ? "Current logo: set"
      : "Current logo: none";
  if (DOM.summaryOverlays)
    DOM.summaryOverlays.textContent = `Existing overlays: ${
      (theme.overlays || []).length
    }`;
  if (DOM.summaryTemplates)
    DOM.summaryTemplates.textContent = `Templates: ${
      getTemplateList(theme).length
    }`;
}

function renderCurrentAssets(theme) {
  // Helpers
  const bgList = getBackgroundList(theme);
  const selectedBg = bgList.length
    ? typeof theme.backgroundIndex === "number"
      ? Math.min(Math.max(theme.backgroundIndex, 0), bgList.length - 1)
      : 0
    : -1;
  const setSingle = (wrap, src, type) => {
    if (!wrap) return;
    wrap.innerHTML = "";
    if (src) {
      const item = createAssetTile(src);
      const btn = document.createElement("button");
      btn.className = "asset-remove";
      btn.textContent = "×";
      btn.title = "Remove";
      btn.onclick = () => {
        if (!confirm("Remove this " + type + "?")) return;
        if (type === "background") removeBackground();
        if (type === "logo") removeLogo();
      };
      item.appendChild(btn);
      wrap.appendChild(item);
    } else {
      const span = document.createElement("span");
      span.style.color = "#888";
      span.textContent = "None";
      wrap.appendChild(span);
    }
  };
  const setGrid = (
    wrap,
    list,
    withBadge = false,
    kind = "",
    allowReorder = true,
  ) => {
    if (!wrap) return;
    wrap.innerHTML = "";
    let shown = 0;
    (list || []).forEach((entry, idx) => {
      const src = typeof entry === "string" ? entry : entry.src;
      const fromFolder = typeof entry === "object" && !!entry.__folder;
      const badge =
        withBadge && typeof entry === "object" && entry.layout
          ? entry.layout
          : null;
      const item = createAssetTile(src, { badge });
      item.draggable = allowReorder && !fromFolder;
      item.dataset.index = idx;
      const btn = document.createElement("button");
      btn.className = "asset-remove";
      btn.textContent = "×";
      btn.title = fromFolder ? "Hide from this theme" : "Remove";
      btn.onclick = () => {
        if (
          !confirm(
            fromFolder ? "Hide this item for this theme?" : "Remove this item?",
          )
        )
          return;
        if (kind === "overlay") {
          if (fromFolder) removeFolderOverlay(src);
          else removeOverlay(idx);
        } else if (kind === "template") {
          if (fromFolder) removeFolderTemplate(src);
          else removeTemplate(idx);
        }
      };
      item.appendChild(btn);
      // Drag & drop reordering
      if (allowReorder && !fromFolder) {
        item.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/plain", String(idx));
          ev.dataTransfer.effectAllowed = "move";
        });
        item.addEventListener("dragover", (ev) => {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = "move";
        });
        item.addEventListener("drop", (ev) => {
          ev.preventDefault();
          const from = parseInt(ev.dataTransfer.getData("text/plain"), 10);
          const to = parseInt(item.dataset.index, 10);
          if (!Number.isNaN(from) && !Number.isNaN(to) && from !== to) {
            reorderAssets(kind, from, to);
          }
        });
      }
      wrap.appendChild(item);
      shown++;
    });
    if ((list || []).length === 0 || shown === 0) {
      const span = document.createElement("span");
      span.style.color = "#888";
      span.textContent = "None";
      wrap.appendChild(span);
    }
  };
  // Backgrounds grid with selection
  if (DOM.currentBackgrounds) {
    const wrap = DOM.currentBackgrounds;
    wrap.innerHTML = "";
    const markSelected = (idxToMark) => {
      const items = wrap.querySelectorAll(".asset-item");
      items.forEach((node, i) => {
        if (i === idxToMark) node.classList.add("selected");
        else node.classList.remove("selected");
        const btn = node.querySelector(".asset-use");
        if (btn) btn.textContent = i === idxToMark ? "Using" : "Use";
      });
    };
    if (bgList.length === 0) {
      const span = document.createElement("span");
      span.style.color = "#888";
      span.textContent = "None";
      wrap.appendChild(span);
    } else {
      bgList.forEach((src, idx) => {
        const item = document.createElement("div");
        item.className = "asset-item";
        if (idx === selectedBg) item.classList.add("selected");
        const img = document.createElement("img");
        img.src = withBust(src);
        img.onerror = () => renderMissingThumbnail(item, src);
        item.appendChild(img);
        const useBtn = document.createElement("button");
        useBtn.className = "asset-use";
        useBtn.textContent = idx === selectedBg ? "Using" : "Use";
        useBtn.style.marginTop = "4px";
        useBtn.onclick = (ev) => {
          ev.preventDefault();
          markSelected(idx);
          setBackgroundIndex(idx);
        };
        img.addEventListener("click", () => {
          markSelected(idx);
          setBackgroundIndex(idx);
        });
        item.appendChild(useBtn);
        const remBtn = document.createElement("button");
        remBtn.className = "asset-remove";
        remBtn.textContent = "×";
        remBtn.title = "Remove";
        remBtn.onclick = () => {
          if (confirm("Remove this background?")) removeBackgroundAt(idx);
        };
        item.appendChild(remBtn);
        wrap.appendChild(item);
      });
    }
  }
  setSingle(DOM.currentLogo, theme.logo, "logo");
  // Font preview
  if (DOM.currentFont) {
    DOM.currentFont.innerHTML = "";
    const entries = [
      { label: "Heading", font: theme.fontHeading || theme.font },
      { label: "Body", font: theme.fontBody || theme.font },
    ];
    let rendered = 0;
    entries.forEach((entry) => {
      const fam = primaryFontFamily(entry.font || "");
      if (!entry.font && !fam) return;
      const box = document.createElement("div");
      box.className = "font-item";
      const sample = document.createElement("div");
      sample.textContent = "Aa Bb 123";
      sample.style.fontFamily = entry.font || "inherit";
      sample.style.fontSize = "1.2em";
      sample.style.padding = "2px 6px";
      const meta = document.createElement("div");
      meta.className = "font-meta";
      meta.textContent = `${entry.label}: ${fam || "System"}`;
      box.appendChild(sample);
      box.appendChild(meta);
      DOM.currentFont.appendChild(box);
      rendered++;
    });
    if (!rendered) {
      const span = document.createElement("span");
      span.style.color = "#888";
      span.textContent = "None";
      DOM.currentFont.appendChild(span);
    }
  }
  // Accent colors
  if (DOM.currentAccents) {
    DOM.currentAccents.innerHTML = "";
    const addColor = (label, color) => {
      const item = document.createElement("div");
      item.className = "color-item";
      const sw = document.createElement("div");
      sw.className = "color-swatch";
      sw.style.background = color || "transparent";
      const hex =
        color && color.startsWith("#")
          ? color
          : colorToHex(color || "") || color || "none";
      const text = document.createElement("span");
      text.textContent = `${label}: ${hex}`;
      item.appendChild(sw);
      item.appendChild(text);
      item.classList.add("clickable");
      item.title = "Click to adjust color";
      item.addEventListener("click", () => {
        const input = label.toLowerCase().includes("2")
          ? DOM.themeAccent2
          : DOM.themeAccent;
        if (input) {
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        }
      });
      DOM.currentAccents.appendChild(item);
    };
    if (theme.accent) addColor("Accent", theme.accent);
    if (theme.accent2) addColor("Accent 2", theme.accent2);
    if (!theme.accent && !theme.accent2) {
      const span = document.createElement("span");
      span.style.color = "#888";
      span.textContent = "None";
      DOM.currentAccents.appendChild(span);
    }
  }
  setGrid(DOM.currentOverlays, getOverlayList(theme), false, "overlay", false);
  setGrid(
    DOM.currentTemplates,
    getTemplateList(theme),
    true,
    "template",
    false,
  );
}

function setAdminMode(isOpen) {
  const open = !!isOpen;
  document.body.classList.toggle("admin-open", open);
  document.documentElement.classList.toggle("admin-open", open);
}
function goAdmin() {
  hideFinal();
  if (DOM.welcomeScreen) DOM.welcomeScreen.classList.add("faded");
  DOM.boothScreen.classList.add("hidden");
  DOM.adminScreen.classList.remove("hidden");
  setAdminMode(true);
  setBoothControlsVisible(true);
}
function applyThemeBackground(theme) {
  if (!theme) return;
  const bg = getActiveBackground(theme) || "";
  if (bg && !bg.endsWith("/")) {
    DOM.boothScreen.style.backgroundImage = `url(${bg})`;
  } else {
    DOM.boothScreen.style.backgroundImage = "";
  }
  if (DOM.welcomeScreen)
    DOM.welcomeScreen.style.backgroundImage =
      DOM.boothScreen.style.backgroundImage;
}
function setMode(m) {
  mode = m;
  DOM.videoWrap.className = "view-landscape"; // Default to landscape
  // In photo mode, show capture button; strip mode hides it (auto flow)
  DOM.captureBtn.style.display = mode === "photo" ? "inline-block" : "none";
  if (mode === "photo") {
    setCaptureAspect(null);
  }
  // In strip mode, ensure no photo overlay is shown over the template preview
  if (mode === "strip") {
    selectedOverlay = null;
    if (DOM.liveOverlay) DOM.liveOverlay.src = "";
  }
  renderOptions();
}
function renderOptions() {
  const isPhoto = mode === "photo";
  const templates = isPhoto ? [] : getTemplateList(activeTheme);
  const list = isPhoto ? getOverlayList(activeTheme) : templates;
  const container = DOM.options;
  container.innerHTML = "";
  // Add a "No Overlay" option for Photo mode to quickly clear stuck overlays
  if (isPhoto) {
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    const img = document.createElement("img");
    // Simple placeholder tile
    const blank = document.createElement("canvas");
    blank.width = 120;
    blank.height = 80;
    img.src = blank.toDataURL("image/png");
    wrap.appendChild(img);
    wrap.title = "No Overlay";
    wrap.onclick = () => {
      container
        .querySelectorAll(".thumb")
        .forEach((t) => t.classList.remove("selected"));
      wrap.classList.add("selected");
      selectedOverlay = null;
      if (DOM.liveOverlay) DOM.liveOverlay.src = "";
    };
    container.appendChild(wrap);
  }
  list.forEach((srcOrObj, idx) => {
    const src = isPhoto
      ? typeof srcOrObj === "string"
        ? srcOrObj
        : srcOrObj.src
      : (srcOrObj && srcOrObj.src) || "";
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    const img = document.createElement("img");
    wrap.appendChild(img);
    img.src = withBust(src);
    img.onerror = () => {
      console.error("Failed to load thumbnail:", src);
      wrap.style.display = "none"; // Hide instead of remove to prevent breaking layout
    };
    wrap.onclick = async () => {
      container
        .querySelectorAll(".thumb")
        .forEach((t) => t.classList.remove("selected"));
      wrap.classList.add("selected");
      if (isPhoto) {
        selectedOverlay = src;
        DOM.liveOverlay.src = withBust(selectedOverlay);
        setViewOrientation(src, getPreviewContext());
      } else {
        // open confirm with larger preview
        // Photo strips are assumed to be landscape for preview purposes
        DOM.videoWrap.className = "view-landscape";
        // Clear any existing overlay so template preview is clean
        selectedOverlay = null;
        if (DOM.liveOverlay) DOM.liveOverlay.src = "";
        const template = templates[idx] || { src, layout: "double_column" };
        pendingTemplate = template;
        openConfirm(template.src);
      }
    };
    container.appendChild(wrap);
  });
}

async function prepareStripCapture(template) {
  const state = capturePreviewState({
    liveOverlay: DOM.liveOverlay,
    videoWrap: DOM.videoWrap,
  });
  if (DOM.liveOverlay) {
    DOM.liveOverlay.src = "";
    DOM.liveOverlay.style.display = "none";
    DOM.liveOverlay.style.opacity = "0";
  }
  if (DOM.videoWrap)
    DOM.videoWrap.className = orientationFromTemplate(template);
  const prevAspect = captureAspectRatio;
  try {
    const metrics = await getStripTemplateMetrics(template);
    if (metrics && metrics.aspect) {
      setCaptureAspect(metrics.aspect);
    } else {
      setCaptureAspect(null);
    }
  } catch (_) {
    setCaptureAspect(null);
  }
  return { state, prevAspect };
}

function openConfirm(previewSrc) {
  DOM.confirmPreview.src = previewSrc;
  DOM.confirmModal.style.display = "flex";
}
function closeConfirm() {
  pendingTemplate = null;
  DOM.confirmModal.style.display = "none";
}
function confirmTemplate() {
  const t = pendingTemplate;
  pendingTemplate = null;
  DOM.confirmModal.style.display = "none";
  runStripSequence(t);
}

// Welcome control
function showWelcome() {
  const theme = activeTheme || {};
  const welcome = theme.welcome || {};
  const fallbackTitle =
    (DOM.eventTitle && DOM.eventTitle.textContent) || welcome.title || "Welcome!";
  if (DOM.welcomeTitle) {
    DOM.welcomeTitle.textContent = welcome.title || fallbackTitle;
    DOM.welcomeTitle.style.fontFamily =
      theme.fontHeading || theme.fontBody || theme.font || "";
  }
  if (DOM.startButton)
    DOM.startButton.textContent = welcome.prompt || "Touch to start";

  // Mirror the booth background behind the welcome overlay and hide image slot
  const boothBg = DOM.boothScreen ? DOM.boothScreen.style.backgroundImage : "";
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.backgroundImage = boothBg;
  if (DOM.welcomeImg) {
    DOM.welcomeImg.src = "";
    DOM.welcomeImg.classList.add("hidden");
  }

  const ws = DOM.welcomeScreen;
  if (!ws) return;
  ws.classList.remove("faded");
  const dismiss = () => hideWelcome();
  if (DOM.startButton) {
    DOM.startButton.onclick = dismiss;
  } else {
    ws.onclick = dismiss;
  }
}
function hideWelcome() {
  const ws = DOM.welcomeScreen;
  if (!ws) return;
  ws.classList.add("faded");

  // Ensure the live video element is available before toggling visibility.
  const videoEl = DOM.video || document.getElementById("video");
  if (videoEl) {
    DOM.video = videoEl;
    videoEl.classList.remove("hidden");
    videoEl.classList.add("active");
  const ws = DOM.welcomeScreen || document.getElementById("welcomeScreen");
  if (!ws) return;
  DOM.welcomeScreen = ws;
  setBoothControlsVisible(true);
  if (DOM.boothScreen) DOM.boothScreen.classList.remove("hidden");
  if (DOM.adminScreen) DOM.adminScreen.classList.add("hidden");
  setAdminMode(false);
  ws.classList.add("faded");
  // show the video smoothly
  let video = DOM.video || document.getElementById("video");
  if (video) {
    DOM.video = video;
    video.classList.remove("hidden");
    video.classList.add("active");
  }

  // After the welcome screen is hidden, select the first option if in photo mode.
  // This ensures the UI is visible and ready for interaction.
  if (mode === "photo") {
    const overlays = getOverlayList(activeTheme);
    if (Array.isArray(overlays) && overlays.length > 0) {
      const optionsContainer = DOM.options || document.getElementById("options");
      if (optionsContainer) {
        DOM.options = optionsContainer;
        const firstThumb = optionsContainer.querySelector(".thumb");
        if (firstThumb) firstThumb.click();
      }
      let options = DOM.options || document.getElementById("options");
      if (options) DOM.options = options;
      const firstThumb = options && options.querySelector(".thumb");
      if (firstThumb) firstThumb.click();
    }
  }
  resetIdleTimer(); // Start the idle timer now that the booth is active.
}

// Camera
async function startCamera(autoStartBooth = false) {
  if (isStartingCamera) return;
  isStartingCamera = true;

  try {
    // Load the theme first to ensure all assets and settings are ready.
    loadTheme(DOM.eventSelect.value);

    // If running from file://, most browsers block camera. Offer Demo Mode unless forced.
    if (
      String(location.protocol).startsWith("file") &&
      localStorage.getItem("forceCameraOnFile") !== "true"
    ) {
      isStartingCamera = false;
      const useDemo = confirm(
        "Camera access is not available when opened from a file.\n\nUse Demo Mode instead? (You can still test overlays, templates, and email.)",
      );
      if (useDemo) {
        demoMode = true;
        if (autoStartBooth) startBoothFlow();
        else showToast("Demo mode enabled");
      } else {
        alert(
          "To use the camera, open the app over HTTPS (e.g., Cloudflare Pages URL) or a local HTTPS server.",
        );
      }
      return;
    }

    if (stream) {
      // Camera already available; only proceed to booth if requested
      setupZoomControls(stream);
      refreshVideoTransform();
      if (autoStartBooth) startBoothFlow();
      showToast("Camera is ready");
      isStartingCamera = false;
      return;
    }

    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      isStartingCamera = false;
      const httpsHint =
        location && !String(location.protocol).startsWith("https")
          ? "\n\nTip: Open the app over HTTPS (GitHub Pages or Cloudflare Pages) to enable the camera."
          : "";
      const useDemo = confirm(
        `Camera access is not supported in this browser or environment.${httpsHint}\n\nUse Demo Mode instead?`,
      );
      if (useDemo) {
        demoMode = true;
        if (autoStartBooth) startBoothFlow();
        else showToast("Demo mode enabled");
      } else {
        alert(
          "To use the camera, switch to a supported browser over HTTPS or connect a camera device.",
        );
      }
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        if (DOM.video) {
          DOM.video.srcObject = s;
          refreshVideoTransform();
        }
        setupZoomControls(stream);
        showToast("Camera permission granted");
        if (autoStartBooth) startBoothFlow();
      })
      .catch((err) => {
        console.error("Camera Error:", err);
        const detail = err && err.message ? err.message : "Unknown error";
        const useDemo = confirm(
          "Could not access the camera. Please ensure it is not in use by another application and that you have granted permission.\n\n" +
            `Error: ${detail}\n\nEnable Demo Mode instead?`,
        );
        if (useDemo) {
          demoMode = true;
          if (autoStartBooth) startBoothFlow();
          else showToast("Demo mode enabled");
        } else {
          alert(
            "Could not access the camera. Please ensure it is not in use by another application and that you have granted permission.\n\n" +
              `Error: ${detail}`,
          );
        }
      })
      .finally(() => {
        isStartingCamera = false;
      });
  } catch (e) {
    isStartingCamera = false;
  }
}

function startBooth() {
  // Ensure camera is initialized; auto-enter booth when ready
  startCamera(true);
}

function startBoothFlow() {
  // Theme is now pre-loaded by startCamera()
  allowRetake = DOM.allowRetakes ? DOM.allowRetakes.checked : true;
  if (DOM.adminScreen) DOM.adminScreen.classList.add("hidden");
  if (DOM.boothScreen) DOM.boothScreen.classList.remove("hidden");
  setAdminMode(false);
  setBoothControlsVisible(true);
  setCaptureAspect(null);
  showWelcome();
  setMode("photo"); // Default to photo mode on start
}

const startCameraFlow = (...args) => startCamera(...args);
const startBoothFromAdmin = (...args) => startBooth(...args);

function setupZoomControls(camStream) {
  const slider = DOM.zoomSlider;
  const control = DOM.zoomControl;
  if (!slider || !control) return;
  control.classList.remove("hidden");
  if (!camStream || typeof camStream.getVideoTracks !== "function") {
    slider.disabled = true;
    if (DOM.zoomHint) DOM.zoomHint.textContent = "Camera not ready";
    return;
  }
  const tracks = camStream.getVideoTracks();
  activeVideoTrack = tracks && tracks[0] ? tracks[0] : null;
  if (!activeVideoTrack) {
    slider.disabled = true;
    if (DOM.zoomHint) DOM.zoomHint.textContent = "Camera not ready";
    return;
  }
  slider.disabled = false;
  const capabilities = getTrackCapabilities(activeVideoTrack);
  const zoomCaps = capabilities && capabilities.zoom;
  const hasHardwareZoom =
    zoomCaps &&
    Number.isFinite(zoomCaps.max) &&
    Number.isFinite(zoomCaps.min) &&
    zoomCaps.max > zoomCaps.min;
  if (!hasHardwareZoom) {
    const preserved =
      zoomState.mode === "digital"
        ? clamp(zoomState.value, FALLBACK_ZOOM_RANGE.min, FALLBACK_ZOOM_RANGE.max)
        : DEFAULT_ZOOM_VALUE;
    switchToDigitalZoom(preserved);
    return;
  }
  const min = Math.max(1, Number(zoomCaps.min) || 1);
  const max = Math.max(min, Number(zoomCaps.max) || min);
  const step = Math.max(
    0.01,
    Number(zoomCaps.step) || (max - min) / 100 || 0.01,
  );
  const settings =
    typeof activeVideoTrack.getSettings === "function"
      ? activeVideoTrack.getSettings()
      : {};
  const preferred =
    zoomState.mode === "hardware" ? clamp(zoomState.value, min, max) : null;
  const startingZoom = clamp(
    Number(settings && settings.zoom) || preferred || min,
    min,
    max,
  );
  zoomState = {
    mode: "hardware",
    min,
    max,
    step,
    value: startingZoom,
  };
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = startingZoom;
  if (DOM.zoomHint) DOM.zoomHint.textContent = "Using optical zoom";
  updateZoomValueReadout(startingZoom);
  refreshVideoTransform();
}

function setZoomLevel(value) {
  const slider = DOM.zoomSlider;
  if (!slider) return;
  if (zoomState.mode === "none") {
    switchToDigitalZoom(value || DEFAULT_ZOOM_VALUE);
    return;
  }
  const min =
    typeof zoomState.min === "number" ? zoomState.min : FALLBACK_ZOOM_RANGE.min;
  const max =
    typeof zoomState.max === "number" && zoomState.max >= min
      ? zoomState.max
      : Math.max(min, FALLBACK_ZOOM_RANGE.max);
  const clamped = clamp(Number(value), min, max);
  zoomState.value = clamped;
  slider.value = clamped;
  updateZoomValueReadout(clamped);
  if (zoomState.mode === "hardware") {
    applyHardwareZoom(clamped);
  } else {
    refreshVideoTransform();
  }
}

async function applyHardwareZoom(value) {
  if (!activeVideoTrack) {
    switchToDigitalZoom(value);
    return;
  }
  const attempts = [{ advanced: [{ zoom: value }] }, { zoom: value }];
  let lastError = null;
  for (const constraint of attempts) {
    try {
      await activeVideoTrack.applyConstraints(constraint);
      refreshVideoTransform();
      return;
    } catch (err) {
      lastError = err;
    }
  }
  console.warn("Hardware zoom unavailable, falling back to digital zoom", lastError);
  switchToDigitalZoom(value);
}

function switchToDigitalZoom(preferredValue = DEFAULT_ZOOM_VALUE) {
  const slider = DOM.zoomSlider;
  if (!slider) return;
  const value = clamp(
    Number(preferredValue),
    FALLBACK_ZOOM_RANGE.min,
    FALLBACK_ZOOM_RANGE.max,
  );
  zoomState = {
    mode: "digital",
    min: FALLBACK_ZOOM_RANGE.min,
    max: FALLBACK_ZOOM_RANGE.max,
    step: FALLBACK_ZOOM_RANGE.step,
    value,
  };
  slider.min = zoomState.min;
  slider.max = zoomState.max;
  slider.step = zoomState.step;
  slider.value = value;
  slider.disabled = false;
  if (DOM.zoomControl) DOM.zoomControl.classList.remove("hidden");
  if (DOM.zoomHint)
    DOM.zoomHint.textContent = "Digital zoom (crops both preview and capture)";
  updateZoomValueReadout(value);
  refreshVideoTransform();
}

function updateZoomValueReadout(value) {
  if (!DOM.zoomValue) return;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    DOM.zoomValue.textContent = "1x";
    return;
  }
  const formatted = num.toFixed(2).replace(/\.?0+$/, "");
  DOM.zoomValue.textContent = `${formatted}x`;
}

function refreshVideoTransform() {
  if (!DOM.video) return;
  const factor = getDigitalZoomFactor();
  const scalePart = factor > 1 ? ` scale(${factor})` : "";
  const transform = `scaleX(-1)${scalePart}`;
  DOM.video.style.transform = transform;
  DOM.video.style.webkitTransform = transform;
}

function getDigitalZoomFactor() {
  if (zoomState.mode !== "digital") return 1;
  const value = Number(zoomState.value);
  return Number.isFinite(value) && value > 1 ? value : 1;
}

function applyDigitalZoomCrop(sx, sy, sWidth, sHeight) {
  const factor = getDigitalZoomFactor();
  if (factor <= 1) return { sx, sy, sWidth, sHeight };
  const zoomedWidth = sWidth / factor;
  const zoomedHeight = sHeight / factor;
  return {
    sx: sx + (sWidth - zoomedWidth) / 2,
    sy: sy + (sHeight - zoomedHeight) / 2,
    sWidth: zoomedWidth,
    sHeight: zoomedHeight,
  };
}

function getTrackCapabilities(track) {
  if (!track || typeof track.getCapabilities !== "function") return null;
  try {
    return track.getCapabilities();
  } catch (err) {
    console.warn("Unable to read media track capabilities", err);
    return null;
  }
}

// Photo mode capture
async function capturePhotoFlow() {
  lastCaptureFlow = capturePhotoFlow; // Store this function for retake
  setBoothControlsVisible(false);
  const photo = await countdownAndSnap();
  const finalUrl = await finalizeToPrint(photo, selectedOverlay);
  showFinal(finalUrl);
  recordAnalytics("photo", selectedOverlay);
  addToGallery(finalUrl);
}
function drawToCanvasFromVideo() {
  const v = DOM.video;
  const c = document.createElement("canvas");
  const isPortrait = DOM.videoWrap.classList.contains("view-portrait");

  // Demo or no camera stream ready: draw a placeholder frame
  if (demoMode || !v || !v.videoWidth || !v.videoHeight) {
    const aspectW = isPortrait ? 9 : 16;
    const aspectH = isPortrait ? 16 : 9;
    const base = 900; // arbitrary size
    c.width = Math.round((base * aspectW) / aspectH);
    c.height = base;
    const ctx = c.getContext("2d");
    // Gradient background placeholder
    const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, "#222");
    grad.addColorStop(1, "#555");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#fff";
    ctx.font = "28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Demo Mode", c.width / 2, c.height / 2 - 10);
    ctx.fillText(isPortrait ? "9:16" : "16:9", c.width / 2, c.height / 2 + 26);
    return c;
  }

  const videoW = v.videoWidth;
  const videoH = v.videoHeight;

  if (isPortrait) {
    const targetAspect =
      typeof captureAspectRatio === "number" && captureAspectRatio > 0
        ? captureAspectRatio
        : 9 / 16;
    let sWidth, sHeight, sx, sy;
    sHeight = videoH;
    sWidth = sHeight * targetAspect;
    if (sWidth > videoW) {
      sWidth = videoW;
      sHeight = sWidth / targetAspect;
    }
    sx = (videoW - sWidth) / 2;
    sy = (videoH - sHeight) / 2;
    const portraitCrop = applyDigitalZoomCrop(sx, sy, sWidth, sHeight);
    sx = portraitCrop.sx;
    sy = portraitCrop.sy;
    sWidth = portraitCrop.sWidth;
    sHeight = portraitCrop.sHeight;

    c.width = sWidth;
    c.height = sHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, sx, sy, sWidth, sHeight, 0, 0, c.width, c.height);
  } else {
    // Crop to strict target aspect for landscape to match preview
    const targetAspect =
      typeof captureAspectRatio === "number" && captureAspectRatio > 0
        ? captureAspectRatio
        : 16 / 9;
    let sWidth, sHeight, sx, sy;
    sWidth = videoW;
    sHeight = sWidth / targetAspect;
    if (sHeight > videoH) {
      sHeight = videoH;
      sWidth = sHeight * targetAspect;
    }
    sx = (videoW - sWidth) / 2;
    sy = (videoH - sHeight) / 2;
    const landscapeCrop = applyDigitalZoomCrop(sx, sy, sWidth, sHeight);
    sx = landscapeCrop.sx;
    sy = landscapeCrop.sy;
    sWidth = landscapeCrop.sWidth;
    sHeight = landscapeCrop.sHeight;

    c.width = sWidth;
    c.height = sHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, sx, sy, sWidth, sHeight, 0, 0, c.width, c.height);
  }
  return c;
}
function updateCaptureAspect() {
  if (!DOM.videoContainer) return;
  const isPortrait = DOM.videoWrap.classList.contains("view-portrait");
  let ratio = null;
  if (typeof captureAspectRatio === "number" && captureAspectRatio > 0) {
    ratio = captureAspectRatio;
  }
  if (isPortrait) {
    const aspect = ratio || 9 / 16;
    DOM.videoContainer.style.aspectRatio = `${aspect} / 1`;
  } else {
    const aspect = ratio || 16 / 9;
    DOM.videoContainer.style.aspectRatio = `${aspect} / 1`;
  }
}

function setCaptureAspect(aspect) {
  if (typeof aspect === "number" && aspect > 0) {
    captureAspectRatio = aspect;
  } else {
    captureAspectRatio = null;
  }
  updateCaptureAspect();
}
async function applyOverlay(canvas, overlaySrc) {
  if (!overlaySrc) return canvas;
  try {
    const ov = await loadImage(overlaySrc);
    const ctx = canvas.getContext("2d");
    // Optionally mask spot color to transparency
    const overlayToDraw = SPOT_MASK.enabled
      ? createMaskedOverlayCanvas(ov, SPOT_MASK.color, SPOT_MASK.tolerance)
      : ov;
    // Default preview behavior used to be 'cover'; switch to 'contain' for print-safety helpers below
    drawImageCover(ctx, overlayToDraw, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.error("Failed to apply overlay:", overlaySrc, e);
  }
  return canvas;
}

// Draw image/canvas into a destination rect using CSS-like object-fit: cover math
function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(dw / iw, dh / ih);
  const rw = iw * scale;
  const rh = ih * scale;
  const rx = dx + (dw - rw) / 2;
  const ry = dy + (dh - rh) / 2;
  ctx.drawImage(img, rx, ry, rw, rh);
}

// Draw image/canvas into a destination rect preserving aspect without cropping
function drawImageContain(ctx, img, dx, dy, dw, dh) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(dw / iw, dh / ih);
  const rw = iw * scale;
  const rh = ih * scale;
  const rx = dx + (dw - rw) / 2;
  const ry = dy + (dh - rh) / 2;
  ctx.drawImage(img, rx, ry, rw, rh);
}

function clamp(val, min, max) {
  if (!Number.isFinite(val)) return min;
  return Math.min(Math.max(val, min), max);
}

function formatSizeValue(num) {
  if (!Number.isFinite(num) || num <= 0) return "";
  const trimmed = num.toFixed(2).replace(/\.?0+$/, "");
  return trimmed;
}

// Convert hex like #rrggbb to {r,g,b}
function hexToRgb(hex) {
  const m = (hex || "").trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function colorClose(r, g, b, target, tol) {
  return (
    Math.abs(r - target.r) <= tol &&
    Math.abs(g - target.g) <= tol &&
    Math.abs(b - target.b) <= tol
  );
}

// Create a canvas from an image where spot-color pixels become transparent
function createMaskedOverlayCanvas(img, hexColor, tolerance) {
  const rgb = hexToRgb(hexColor);
  const c = document.createElement("canvas");
  const w = (c.width = img.naturalWidth || img.width);
  const h = (c.height = img.naturalHeight || img.height);
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const data = x.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    if (colorClose(r, g, b, rgb, tolerance)) d[i + 3] = 0; // make transparent
  }
  x.putImageData(data, 0, 0);
  return c;
}

// Strip mode auto flow
async function runStripSequence(template) {
  lastCaptureFlow = () => runStripSequence(template); // Store this function for retake
  // 3 photos automatically with pauses
  const shots = [];
  const lastShotImg = document.getElementById("lastShot");
  const { state: previewState, prevAspect } =
    await prepareStripCapture(template);
  let previewRestored = false;
  setBoothControlsVisible(false);
  if (lastShotImg) lastShotImg.style.display = "none";
  for (let i = 0; i < 3; i++) {
    if (lastShotImg) lastShotImg.style.display = "none";
    const snap = await countdownAndSnap();
    shots.push(snap);
    if (i < 2) {
      try {
        if (lastShotImg) {
          lastShotImg.src = snap.toDataURL("image/png");
          lastShotImg.style.display = "block";
          await delay(1200);
          lastShotImg.style.display = "none";
        }
      } catch (_) {}
      const remaining = 3000 - (lastShotImg ? 1200 : 0);
      if (remaining > 0) await delay(remaining);
    }
  }
  try {
    const stripUrl = await composeStrip(template, shots);
    restorePreviewState(previewState, {
      liveOverlay: DOM.liveOverlay,
      videoWrap: DOM.videoWrap,
    });
    previewRestored = true;
    if (DOM.liveOverlay)
      DOM.liveOverlay.style.opacity = previewState.overlayOpacity || "";
    showFinal(stripUrl);
    recordAnalytics("strip", template.src);
  } finally {
    if (!previewRestored)
      restorePreviewState(previewState, {
        liveOverlay: DOM.liveOverlay,
        videoWrap: DOM.videoWrap,
      });
    setCaptureAspect(prevAspect);
  }
}
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function showCountdown(text) {
  const co = DOM.countdownOverlay;
  co.textContent = text;
  co.classList.add("show");
  await delay(800);
  co.classList.remove("show");
  await delay(200);
}
async function countdownAndSnap() {
  for (let n = 3; n > 0; n--) {
    await showCountdown(n);
  }
  const shot = drawToCanvasFromVideo();
  triggerFlash();
  return shot;
}

function triggerFlash() {
  const fo = DOM.flashOverlay;
  if (!fo) return;
  // Restart animation by toggling class
  fo.classList.remove("flash");
  // Force reflow to restart the animation reliably
  void fo.offsetWidth;
  fo.classList.add("flash");
  // Clean up after animation ends (fallback timeout as well)
  const cleanup = () => fo.classList.remove("flash");
  fo.addEventListener("animationend", cleanup, { once: true });
  setTimeout(cleanup, 600);
}

// Compose photostrip
async function composeStrip(template, photos) {
  const bg = await loadImage(template.src);
  const isPortrait =
    template.layout === "vertical" ||
    template.layout === "double_column" ||
    template.layout === "double-column";
  const targetW = isPortrait ? 1200 : 1800; // 4x6 at 300dpi
  const targetH = isPortrait ? 1800 : 1200;
  const c = document.createElement("canvas");
  c.width = targetW;
  c.height = targetH;
  const ctx = c.getContext("2d");
  // Fill background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, targetW, targetH);

  if (
    template.layout === "double_column" ||
    template.layout === "double-column"
  ) {
    // Two identical 2x6 strips on a 4x6 sheet
    renderDoubleColumn(c, photos, bg, template);
  } else if (template.layout === "vertical") {
    // Draw template first
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const padding = Math.round(targetH * 0.03);
    const slotH = Math.floor((targetH - padding * 4) / 3);
    const slotW = targetW - padding * 2;
    for (let i = 0; i < 3; i++) {
      const x = padding,
        y = padding + i * (slotH + padding);
      drawImageContain(ctx, photos[i], x, y, slotW, slotH);
    }
  } else if (template.layout === "horizontal") {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const padding = Math.round(targetW * 0.03);
    const slotW = Math.floor((targetW - padding * 5) / 4); // 3 slots + one decorative column
    const slotH = targetH - padding * 2;
    for (let i = 0; i < 3; i++) {
      const x = padding + i * (slotW + padding);
      const y = padding;
      drawImageContain(ctx, photos[i], x, y, slotW, slotH);
    }
  } else if (
    template.layout === "double_column" ||
    template.layout === "double-column"
  ) {
    // Handled above
  } else if (
    template.layout === "spot-mask" ||
    template.layout === "spotmask"
  ) {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const regions = await detectMaskRegions(
      bg,
      SPOT_MASK.color,
      SPOT_MASK.tolerance,
    );
    const max = Math.min(photos.length, regions.length);
    for (let i = 0; i < max; i++) {
      const r = regions[i];
      if (!r) break;
      drawImageContain(ctx, photos[i], r.x, r.y, r.w, r.h);
    }
    const masked = createMaskedOverlayCanvas(
      bg,
      SPOT_MASK.color,
      SPOT_MASK.tolerance,
    );
    drawImageContain(ctx, masked, 0, 0, targetW, targetH);
  } else if (template.layout === "custom" && template.slots) {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    for (let i = 0; i < Math.min(photos.length, template.slots.length); i++) {
      const s = template.slots[i];
      drawImageContain(ctx, photos[i], s.x, s.y, s.w, s.h);
    }
  }
  return c.toDataURL("image/png");
}

// Compose a single photo into a print-safe 4x6 canvas without cropping
async function finalizeToPrint(photoCanvas, overlaySrc) {
  const isPortrait =
    DOM.videoWrap && DOM.videoWrap.classList.contains("view-portrait");
  const targetW = isPortrait ? 1200 : 1800;
  const targetH = isPortrait ? 1800 : 1200;
  const c = document.createElement("canvas");
  c.width = targetW;
  c.height = targetH;
  const ctx = c.getContext("2d");
  // Background fill
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, targetW, targetH);
  // Place captured photo with contain (no crop)
  drawImageContain(ctx, photoCanvas, 0, 0, targetW, targetH);
  // Optional overlay scaled without cropping
  if (overlaySrc) {
    try {
      const ov = await loadImage(overlaySrc);
      const overlayToDraw =
        SPOT_MASK && SPOT_MASK.enabled
          ? createMaskedOverlayCanvas(ov, SPOT_MASK.color, SPOT_MASK.tolerance)
          : ov;
      drawImageContain(ctx, overlayToDraw, 0, 0, targetW, targetH);
    } catch (e) {
      console.error("Print overlay load failed", e);
    }
  }
  return c.toDataURL("image/png");
}

/**
 * Render 3 photos into a duplicated 2-column strip behind a 3-slot overlay.
 * End result = two identical columns of 3 photos each.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {(HTMLImageElement|HTMLCanvasElement)[]} photos - exactly 3 captured photos
 * @param {HTMLImageElement} overlayImage - PNG with 3 transparent slots in one column
 */
function renderDoubleColumn(canvas, photos, overlayImage, template) {
  const ctx = canvas.getContext("2d");
  const cols = 2; // duplicate columns
  const rows = 3; // three slots
  // Reserve header/footer/spacing using shared template metrics helpers
  const { headerPct, columnPadPct, slotSpacingPct, footerPct } =
    getStripTemplatePercents(template);

  const columnW = canvas.width / cols;
  const columnPad = columnPadPct * columnW;
  const slotW = Math.max(1, columnW - columnPad * 2);
  const headerH = headerPct * canvas.height;
  const footerH = footerPct * canvas.height;
  const slotSpacing = slotSpacingPct * canvas.height;
  const usableH = canvas.height - headerH - footerH - slotSpacing * (rows + 1);
  const slotH = Math.max(1, usableH / rows);
  const startY = headerH + slotSpacing;

  const cachedSlots =
    template && template.__slotMetrics && template.__slotMetrics.slots;
  const detectedSlots =
    cachedSlots || detectDoubleColumnSlots(overlayImage, rows);
  if (detectedSlots) {
    const scaleX =
      canvas.width / (overlayImage.naturalWidth || overlayImage.width || 1);
    const scaleY =
      canvas.height / (overlayImage.naturalHeight || overlayImage.height || 1);
    for (let row = 0; row < rows; row++) {
      const photo = photos[row];
      if (!photo) continue;
      for (let col = 0; col < cols; col++) {
        const slot = detectedSlots[col] && detectedSlots[col][row];
        if (!slot) continue;
        const x = slot.x * scaleX;
        const y = slot.y * scaleY;
        const w = slot.w * scaleX;
        const h = slot.h * scaleY;
        drawImageContain(ctx, photo, x, y, w, h);
      }
    }
  } else {
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const photo = photos[row]; // place same row photo into both columns
        if (!photo) continue;
        const x = Math.round(col * columnW + columnPad);
        const y = Math.round(startY + row * (slotH + slotSpacing));
        drawImageContain(ctx, photo, x, y, slotW, slotH);
      }
    }
  }

  // 2) Draw the full 4x6 double-strip overlay last so its frames sit on top
  drawImageContain(ctx, overlayImage, 0, 0, canvas.width, canvas.height);
}

// Detect contiguous regions matching the mask color; returns array of {x,y,w,h} in image coords
async function detectMaskRegions(img, hexColor, tolerance) {
  const rgb = hexToRgb(hexColor);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const visited = new Uint8Array(w * h);
  const regions = [];
  const stack = [];
  const idx = (x, y) => y * w + x;
  const match = (x, y) => {
    const i = idx(x, y) * 4;
    return colorClose(d[i], d[i + 1], d[i + 2], rgb, tolerance);
  };
  const minArea = Math.max(50, Math.floor(w * h * 0.001)); // ignore tiny noise
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = idx(x, y);
      if (visited[p]) continue;
      visited[p] = 1;
      if (!match(x, y)) continue;
      // flood fill
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y,
        area = 0;
      stack.length = 0;
      stack.push([x, y]);
      while (stack.length) {
        const [sx, sy] = stack.pop();
        const sp = idx(sx, sy);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        if (visited[sp] && !(sx === x && sy === y)) continue; // allow seed already marked
        if (!visited[sp]) visited[sp] = 1;
        if (!match(sx, sy)) continue;
        area++;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
        // neighbors
        const neigh = [
          [sx + 1, sy],
          [sx - 1, sy],
          [sx, sy + 1],
          [sx, sy - 1],
        ];
        for (const [nx, ny] of neigh) {
          const np = idx(nx, ny);
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[np]) {
            visited[np] = 1;
            stack.push([nx, ny]);
          }
        }
      }
      if (area >= minArea) {
        regions.push({
          x: minX,
          y: minY,
          w: maxX - minX + 1,
          h: maxY - minY + 1,
        });
      }
    }
  }
  // Sort regions top-to-bottom, then left-to-right
  regions.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  return regions;
}

// Final preview
function showFinal(url) {
  clearTimeout(hidePreviewTimer); // Clear any existing timer
  const img = DOM.finalStrip;
  const prevFit = img ? img.style.objectFit : "";
  if (img) img.style.objectFit = "contain";
  const qrContainer = DOM.qrCodeContainer;
  const qrCanvas = DOM.qrCode;
  const panel = DOM.finalPreview;

  if (panel) panel.classList.remove("qr-ready");
  // Reset form from previous use
  DOM.emailInput.value = "";
  const sendBtn = DOM.sendBtn;
  sendBtn.textContent = "Send";
  sendBtn.disabled = false;

  DOM.retakeBtn.style.display = allowRetake ? "block" : "none";
  DOM.retakeBtn.disabled = !lastCaptureFlow;
  if (DOM.closePreviewBtn) DOM.closePreviewBtn.style.display = "block";

  img.src = url;
  const offline = offlineModeActive();
  // Default: hide QR/link until we have a public URL
  if (qrContainer) qrContainer.classList.add("hidden");
  if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = "none";
  if (DOM.qrHint) {
    DOM.qrHint.style.display = "none";
    DOM.qrHint.textContent = "";
  }
  if (DOM.shareStatus) {
    DOM.shareStatus.style.display = "none";
  }
  if (!offline && cloudinaryEnabled()) {
    // Prepare a public Cloudinary link, then show QR when ready
    lastShareUrl = null;
    if (DOM.shareStatus) {
      DOM.shareStatus.textContent = "Preparing link…";
      DOM.shareStatus.style.display = "inline-flex";
    }
    publishShareImage(url)
      .then((publicUrl) => {
        lastShareUrl =
          publicUrl && /^https?:/i.test(publicUrl) ? publicUrl : null;
        if (lastShareUrl) {
          renderQrCode(qrCanvas, lastShareUrl);
          if (DOM.shareLink) {
            DOM.shareLink.href = lastShareUrl;
            DOM.shareLink.textContent = lastShareUrl;
          }
          if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = "flex";
          if (qrContainer) qrContainer.classList.remove("hidden");
          if (panel) panel.classList.add("qr-ready");
          if (DOM.shareStatus) {
            DOM.shareStatus.textContent = "Link ready";
          }
        } else {
          if (DOM.qrHint) {
            DOM.qrHint.textContent =
              "QR disabled: Cloudinary link not available.";
            DOM.qrHint.style.display = "block";
          }
          if (DOM.shareStatus) {
            DOM.shareStatus.textContent = "Upload failed";
          }
        }
      })
      .catch(() => {
        if (DOM.qrHint) {
          DOM.qrHint.textContent =
            "QR disabled: Cloudinary link not available.";
          DOM.qrHint.style.display = "block";
        }
        if (DOM.shareStatus) {
          DOM.shareStatus.textContent = "Upload failed";
        }
      });
  } else {
    // No internet or Cloudinary disabled
    if (offline && DOM.qrHint) {
      DOM.qrHint.textContent = "Offline: QR disabled";
      DOM.qrHint.style.display = "block";
    }
    if (!cloudinaryEnabled() && DOM.qrHint) {
      DOM.qrHint.textContent = "Enable Cloudinary in Admin to show QR";
      DOM.qrHint.style.display = "block";
    }
  }
  panel.classList.add("show");
  resetIdleTimer();
  hidePreviewTimer = setTimeout(hideFinal, 15000);

  if (img) {
    panel.addEventListener("transitionend", function once() {
      img.style.objectFit = prevFit || "";
      panel.removeEventListener("transitionend", once);
    });
  }

  // No local-QR fallback: only show QR when a public link is ready (handled above)
}

function renderQrCode(canvas, text) {
  try {
    QRCode.toCanvas(canvas, text, { width: 200, margin: 1 }, function (error) {
      if (error) console.error(error);
    });
  } catch (e) {
    console.error(e);
  }
}

// Build a slug for the current event selection to organize uploads per event
function getCurrentEventSlug() {
  try {
    const val =
      DOM.eventSelect && DOM.eventSelect.value ? DOM.eventSelect.value : "";
    if (!val) return "";
    // value is like "fall:halloween" or "school:hawks"; use it directly
    return String(val)
      .toLowerCase()
      .replace(/[^a-z0-9:_\-]+/g, "-")
      .replace(/:+/g, "-");
  } catch (_) {
    return "";
  }
}

// --- Event name storage helpers ---
function getEventNamesMap() {
  try {
    return JSON.parse(localStorage.getItem("photoboothEventNames") || "{}");
  } catch (_) {
    return {};
  }
}
function getStoredEventName(key) {
  if (!key) return "";
  const map = getEventNamesMap();
  return map[key] || "";
}
function saveStoredEventName(key, name) {
  if (!key) return;
  const map = getEventNamesMap();
  if (name) map[key] = name;
  else delete map[key];
  localStorage.setItem("photoboothEventNames", JSON.stringify(map));
}

// --- Export current event (settings + theme) ---
function exportCurrentEvent() {
  const key = DOM.eventSelect && DOM.eventSelect.value;
  if (!key || !activeTheme) {
    alert("Select an event first.");
    return;
  }
  const name =
    getStoredEventName(key) ||
    (activeTheme.welcome && activeTheme.welcome.title) ||
    key;
  const payload = {
    key,
    name,
    exported_at: new Date().toISOString(),
    theme: activeTheme,
  };
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(payload, null, 2));
  const a = document.createElement("a");
  const slug = (name || key).toLowerCase().replace(/[^a-z0-9\-]+/g, "-");
  a.href = dataStr;
  a.download = `photobooth-event-${slug || "export"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Event exported");
}

async function publishShareImage(dataUrl) {
  // Convert data URL to Blob once
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  // 1) Prefer Cloudinary if configured (cross-device HTTPS link)
  const cfg = getCloudinaryConfig();
  if (cfg.use && cfg.cloud && cfg.preset) {
    try {
      const form = new FormData();
      // Provide a meaningful filename so Cloudinary can use it as the base public_id
      const evSlug =
        typeof getCurrentEventSlug === "function" ? getCurrentEventSlug() : "";
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const baseName = `${evSlug || "photo"}-${ts}.png`;
      const file = new File([blob], baseName, {
        type: blob.type || "image/png",
      });
      form.append("file", file);
      form.append("upload_preset", cfg.preset);
      // Put each event's images into its own folder
      const base = (cfg.folderBase || "photobooth/events").replace(/\/$/, "");
      if (evSlug) form.append("folder", `${base}/${evSlug}`);
      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`,
        { method: "POST", body: form },
      );
      const json = await resp.json();
      if (json && json.secure_url) return json.secure_url;
    } catch (e) {
      console.warn("Cloudinary upload failed", e);
    }
  }

  // 2) Otherwise try Service Worker (works on same device/origin after SW installs)
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http"))
    return null;
  try {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("sw-timeout")), 2000),
      ),
    ]);
  } catch (_e) {}
  const reg = await navigator.serviceWorker.getRegistration();
  const active = reg?.active || navigator.serviceWorker.controller;
  if (!active) return null;
  const buffer = await blob.arrayBuffer();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const channel = new MessageChannel();
  const ack = new Promise((resolve) => {
    channel.port1.onmessage = (ev) => resolve(ev.data);
  });
  active.postMessage({ type: "store-share", id, buffer, mime: blob.type }, [
    channel.port2,
  ]);
  const reply = await ack; // {ok, url}
  if (reply && reply.ok && reply.url)
    return new URL(reply.url, location.origin).href;
  return null;
}

async function openShareLink() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  if (!url) return;
  try {
    // Ensure the asset is retrievable (esp. right after SW publish) and open a stable blob URL
    const resp = await fetch(url, { cache: "reload" });
    if (!resp.ok) throw new Error("Link not ready");
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    window.open(objUrl, "_blank", "noopener");
    // Revoke after some time to avoid leaks
    setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
  } catch (e) {
    // Fallback to opening the original URL
    try {
      window.open(url, "_blank", "noopener");
    } catch (_) {
      location.href = url;
    }
  }
}
async function copyShareLink() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  } catch (e) {
    showToast("Copy failed");
  }
}
async function downloadShareImage() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  if (!url) return;
  try {
    const resp = await fetch(url, { cache: "reload" });
    if (!resp.ok) throw new Error("Link not ready");
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = "photobooth.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
  } catch (e) {
    // Fallback: open in new tab; user can save manually
    try {
      window.open(url, "_blank", "noopener");
    } catch (_) {
      location.href = url;
    }
  }
}

function hideFinal() {
  DOM.finalPreview.classList.remove("show");
  DOM.finalPreview.classList.remove("qr-ready");
  DOM.qrCodeContainer.classList.add("hidden");
  if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = "none";
  if (DOM.shareStatus) DOM.shareStatus.style.display = "none";
  DOM.retakeBtn.style.display = "none";
  if (DOM.closePreviewBtn) DOM.closePreviewBtn.style.display = "none";
  lastCaptureFlow = null; // Clear the stored flow
  clearTimeout(hidePreviewTimer);
  setBoothControlsVisible(true);
  resetIdleTimer();
}

function retakePhoto() {
  hideFinal();
  if (typeof lastCaptureFlow === "function") {
    setTimeout(lastCaptureFlow, 500); // Give a small delay for the UI to hide
  }
}
function exitFinalPreview() {
  hideFinal();
}
function addToGallery(url) {
  const img = new Image();
  img.src = url;
  DOM.gallery.appendChild(img);
}

function cancelHideTimer() {
  clearTimeout(hidePreviewTimer);
  resetIdleTimer(); // Still reset the main idle timer
}

function startHideTimerIfIdle() {
  // If email input is empty, restart the hide timer
  if (DOM.emailInput.value.trim() === "") {
    cancelHideTimer();
    hidePreviewTimer = setTimeout(hideFinal, 4000);
  }
}

function sendEmail(event) {
  event.preventDefault();
  cancelHideTimer();
  const email = DOM.emailInput.value;
  const sendBtn = DOM.sendBtn;
  const imgUrl = DOM.finalStrip && DOM.finalStrip.src;
  const offline = offlineModeActive();

  if (offline) {
    // Queue locally for later sending
    const ok = queuePendingEmail(email, imgUrl);
    if (ok) {
      sendBtn.textContent = "Queued";
      updatePendingUI();
      hidePreviewTimer = setTimeout(hideFinal, 1200);
    } else {
      alert("Could not queue email. Check storage space.");
    }
    return;
  }

  sendBtn.textContent = "Sending...";
  sendBtn.disabled = true;

  const cfg = getEmailJsConfig();
  const templateParams = {
    to_email: email,
    photo_url: lastShareUrl || imgUrl,
    link_url: lastShareUrl || "",
    image_data_url: imgUrl,
  };

  emailjs.send(cfg.service, cfg.template, templateParams).then(
    function (response) {
      console.log("SUCCESS!", response.status, response.text);
      sendBtn.textContent = "Sent!";
      hidePreviewTimer = setTimeout(hideFinal, 3000);
    },
    function (error) {
      const errMsg = formatEmailError(error);
      console.error("Email send failed:", error);
      sendBtn.textContent = "Failed!";
      sendBtn.disabled = false;
      alert("Email failed: " + errMsg);
    },
  );

  recordAnalytics("email", email);
}

function formatEmailError(err) {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.text) return err.text;
  if (err.message) return err.message;
  if (typeof err.status !== "undefined") {
    const statusText = err.statusText || err.text || "";
    return `${err.status} ${statusText}`.trim();
  }
  try {
    return JSON.stringify(err);
  } catch (_) {
    return String(err);
  }
}

function appendEmailText(text) {
  const emailInput = DOM.emailInput;
  emailInput.value += text;
  emailInput.focus(); // Keep the input focused for a smooth flow
}

// --- Analytics ---
function getAnalytics() {
  const defaults = { total_sessions: 0, overlay_usage: {}, emails: [] };
  try {
    const data = localStorage.getItem("photoboothAnalytics");
    return data ? JSON.parse(data) : defaults;
  } catch (e) {
    return defaults;
  }
}

// --- Offline queue helpers ---
function offlineModeActive() {
  try {
    if (getOfflinePref()) return true;
  } catch (_) {}
  try {
    if (String(location.protocol).startsWith("file")) return true;
  } catch (_) {}
  return !navigator.onLine ? true : false;
}
function getOfflinePref() {
  return localStorage.getItem("offlineMode") === "true";
}
function setOfflinePref(v) {
  localStorage.setItem("offlineMode", v ? "true" : "false");
}
function getPending() {
  try {
    return JSON.parse(localStorage.getItem("photoboothPending") || "[]");
  } catch (_) {
    return [];
  }
}
function setPending(arr) {
  localStorage.setItem("photoboothPending", JSON.stringify(arr || []));
}
function queuePendingEmail(email, dataUrl) {
  try {
    const q = getPending();
    q.push({
      id: Date.now().toString(36),
      email,
      image: dataUrl,
      createdAt: new Date().toISOString(),
      event: DOM.eventSelect && DOM.eventSelect.value,
    });
    setPending(q);
    return true;
  } catch (e) {
    return false;
  }
}
function updatePendingUI() {
  const q = getPending();
  if (DOM.sendPendingBtn) {
    DOM.sendPendingBtn.textContent = `Send Pending (${q.length})`;
    DOM.sendPendingBtn.disabled = q.length === 0 || !navigator.onLine;
  }
  // Badge on admin button
  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    adminBtn.textContent = q.length ? `⚙️ (${q.length})` : "⚙️";
  }
}
async function sendPendingNow() {
  const q = getPending();
  if (!q.length) {
    showToast("No pending emails");
    return;
  }
  if (!navigator.onLine) {
    alert("Go online to send");
    return;
  }
  let sent = 0,
    failed = 0;
  for (const item of q.slice()) {
    try {
      // Try to publish to Cloudinary/SW for a link if available
      let share = null;
      try {
        share = await publishShareImage(item.image);
      } catch (_) {}
      const params = {
        to_email: item.email,
        photo_url: share || item.image,
        link_url: share || "",
        image_data_url: item.image,
      };
      const cfg = getEmailJsConfig();
      await emailjs.send(cfg.service, cfg.template, params);
      sent++;
      // remove from queue
      const cur = getPending();
      const idx = cur.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        cur.splice(idx, 1);
        setPending(cur);
      }
    } catch (e) {
      failed++;
    }
  }
  updatePendingUI();
  showToast(`Pending sent: ${sent}${failed ? `, failed: ${failed}` : ""}`);
}

// Cache active theme assets for offline use (PWA/HTTPS only)
async function makeAvailableOffline() {
  if (
    !("caches" in window) ||
    !("serviceWorker" in navigator) ||
    !location.protocol.startsWith("http")
  ) {
    alert(
      "Offline caching requires HTTPS and a service worker. Open your Cloudflare URL.",
    );
    return;
  }
  try {
    const urls = new Set();
    const theme = activeTheme || getSelectedThemeTarget();
    if (theme) {
      // Backgrounds
      const bgList = Array.isArray(theme.backgroundsTmp)
        ? theme.backgroundsTmp
        : Array.isArray(theme.backgrounds)
          ? theme.backgrounds
          : theme.background
            ? [theme.background]
            : [];
      bgList.filter(Boolean).forEach((u) => urls.add(u));
      // Logo
      if (theme.logo) urls.add(theme.logo);
      // Overlays
      getOverlayList(theme).forEach((o) => {
        const s = typeof o === "string" ? o : (o && o.src) || "";
        if (s) urls.add(s);
      });
      // Templates
      getTemplateList(theme).forEach((t) => {
        if (t && t.src) urls.add(t.src);
      });
    }
    if (urls.size === 0) {
      showToast("No assets to cache");
      return;
    }
    const cache = await caches.open("pb-offline-assets-v1");
    let ok = 0,
      fail = 0;
    await Promise.all(
      Array.from(urls).map(async (u) => {
        try {
          const resp = await fetch(u, { cache: "reload" });
          if (resp.ok) {
            await cache.put(new Request(u), resp.clone());
            ok++;
          } else {
            fail++;
          }
        } catch (_) {
          fail++;
        }
      }),
    );
    showToast(`Cached ${ok} assets${fail ? `, failed ${fail}` : ""}`);
  } catch (e) {
    alert("Cache failed: " + (e && e.message ? e.message : e));
  }
}

function recordAnalytics(type, value) {
  const data = getAnalytics();
  if (type === "photo" || type === "strip") {
    data.total_sessions = (data.total_sessions || 0) + 1;
    data.overlay_usage[value] = (data.overlay_usage[value] || 0) + 1;
  } else if (type === "email") {
    if (!data.emails.includes(value)) {
      data.emails.push(value);
    }
  }
  localStorage.setItem("photoboothAnalytics", JSON.stringify(data));
}

function displayAnalytics() {
  const data = getAnalytics();
  DOM.analyticsData.textContent = JSON.stringify(data, null, 2);
}

function toggleAnalytics() {
  DOM.analytics.classList.toggle("hidden");
  displayAnalytics();
}

function clearAnalytics() {
  if (
    confirm(
      "Are you sure you want to delete all analytics data? This cannot be undone.",
    )
  ) {
    localStorage.removeItem("photoboothAnalytics");
    displayAnalytics();
  }
}

// --- Theme Management ---
function saveTheme() {
  if (!DOM.themeName) {
    alert("Theme creation is disabled in the simplified editor layout.");
    return;
  }
  const themeName = DOM.themeName.value.trim();
  if (!themeName) {
    alert("Please enter a theme name.");
    return;
  }

  const pickerSelection = getFontPickerSelection();
  const headingFamily = pickerSelection.heading || "Comic Neue";
  const bodyFamily = pickerSelection.body || headingFamily || "Comic Neue";
  const headingCss = composeFontString(headingFamily);
  const bodyCss = composeFontString(bodyFamily);

  const newTheme = {
    name: themeName,
    accent: DOM.themeAccent.value,
    accent2: DOM.themeAccent2.value,
    fontHeading: headingCss,
    fontBody: bodyCss,
    font: bodyCss,
    background: "",
    logo: "",
    overlays: [],
    templates: [],
    welcome: {
      title: DOM.themeWelcomeTitle.value || "Welcome!",
      portrait: "",
      landscape: "",
      prompt: DOM.themeWelcomePrompt.value || "Touch to start",
    },
  };

  ensureFontLoaded(headingFamily, true);
  ensureFontLoaded(bodyFamily, true);

  const backgroundFile = DOM.themeBackground.files[0];
  const logoFile = DOM.themeLogo.files[0];
  const overlayFiles = DOM.themeOverlays.files;
  const templateFiles = DOM.themeTemplates.files;
  const templatesFolder =
    DOM.themeTemplatesFolder && DOM.themeTemplatesFolder.value
      ? DOM.themeTemplatesFolder.value.trim()
      : "";
  const overlaysFolder =
    DOM.themeOverlaysFolder && DOM.themeOverlaysFolder.value
      ? DOM.themeOverlaysFolder.value.trim()
      : "";

  const filePromises = [];

  if (backgroundFile) {
    filePromises.push(
      uploadAsset(backgroundFile, "backgrounds").then((url) => {
        if (url) newTheme.background = url;
      }),
    );
  }
  if (logoFile) {
    filePromises.push(
      uploadAsset(logoFile, "logo").then((url) => {
        if (url) newTheme.logo = url;
      }),
    );
  }
  for (const file of overlayFiles) {
    filePromises.push(
      uploadAsset(file, "overlays").then((url) => {
        if (url) newTheme.overlays.push(url);
      }),
    );
  }
  if (overlaysFolder) {
    newTheme.overlaysFolder = overlaysFolder.endsWith("/")
      ? overlaysFolder
      : overlaysFolder + "/";
  }
  for (const file of templateFiles) {
    filePromises.push(
      uploadAsset(file, "templates").then((url) => {
        if (url) newTheme.templates.push({ src: url, layout: "double_column" });
      }),
    );
  }
  if (templatesFolder) {
    newTheme.templatesFolder = templatesFolder.endsWith("/")
      ? templatesFolder
      : templatesFolder + "/";
  }

  Promise.all(filePromises).then(() => {
    // Try to load/record the chosen fonts so they're available immediately
    ensureFontLoadedForFontString(newTheme.fontHeading);
    ensureFontLoadedForFontString(newTheme.fontBody);
    const newKey = themeName.toLowerCase().replace(/\s/g, "-");
    themes[newKey] = newTheme;
    saveThemesToStorage();
    populateThemeSelector(newKey);
    setEventSelection(newKey);
    loadTheme(newKey);
    if (DOM.themeEditorModeSelect) {
      DOM.themeEditorModeSelect.value = "edit";
      setThemeEditorMode("edit");
    } else {
      setThemeEditorMode("edit");
    }
    alert(`Theme '${themeName}' saved!`);
  });
}

// Upload an asset. If Cloudinary is configured, upload there and return its secure URL.
// Otherwise, fall back to a local data URL.
// Folder import (device-only) helpers
async function handleOverlayFolderPick(e) {
  const key = getSelectedThemeKey();
  const target = getSelectedThemeTarget();
  if (!key || !target) {
    alert("Select a theme first.");
    e.target.value = "";
    return;
  }
  const files = Array.from(e.target.files || []).filter((f) =>
    /^image\//i.test(f.type),
  );
  if (!files.length) {
    e.target.value = "";
    return;
  }
  if (!Array.isArray(target.overlays)) target.overlays = [];
  const promises = files.map((f) =>
    uploadAsset(f, "overlays").then((u) => {
      if (u) target.overlays.push(u);
    }),
  );
  await Promise.all(promises);
  try {
    normalizeThemeObject(target);
  } catch (_e) {}
  saveThemesToStorage();
  loadTheme(key);
  syncThemeEditorWithActiveTheme();
  showToast(`Imported ${files.length} overlays`);
  e.target.value = "";
}

async function handleTemplateFolderPick(e) {
  const key = getSelectedThemeKey();
  const target = getSelectedThemeTarget();
  if (!key || !target) {
    alert("Select a theme first.");
    e.target.value = "";
    return;
  }
  const files = Array.from(e.target.files || []).filter((f) =>
    /^image\//i.test(f.type),
  );
  if (!files.length) {
    e.target.value = "";
    return;
  }
  if (!Array.isArray(target.templates)) target.templates = [];
  const promises = files.map((f) =>
    uploadAsset(f, "templates").then((u) => {
      if (u) target.templates.push({ src: u, layout: "double_column" });
    }),
  );
  await Promise.all(promises);
  try {
    normalizeThemeObject(target);
  } catch (_e) {}
  saveThemesToStorage();
  loadTheme(key);
  syncThemeEditorWithActiveTheme();
  showToast(`Imported ${files.length} templates`);
  e.target.value = "";
}

// --- Font Management ---
const FONT_FALLBACK_STACK =
  "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
const DEFAULT_FONT_PREVIEW = "Welcome to Fletch Photobooth";
let fontCatalog = { available: [], defaults: {}, pairings: [] };
const CUSTOM_PAIRINGS_STORAGE_KEY = "photoboothCustomPairings";
let baseFontPairings = [];
let customFontPairings = [];
let fontPickerInitialized = false;
let fontPickerSetupPromise = null;
let ignoreFontPickerEvents = false;
let quickPicksExpanded = false;

function normalizePairingField(value) {
  return (value || "").toString().trim();
}

function normalizePairingDef(def) {
  if (!def) return null;
  const heading = normalizePairingField(def.heading);
  const body = normalizePairingField(def.body);
  if (!heading || !body) return null;
  const normalized = { heading, body };
  const notes = normalizePairingField(def.notes);
  if (notes) normalized.notes = notes;
  const preview = normalizePairingField(def.preview);
  if (preview) normalized.preview = preview;
  return normalized;
}

function pairingKey(def) {
  return `${normalizePairingField(
    def.heading,
  ).toLowerCase()}::${normalizePairingField(def.body).toLowerCase()}`;
}

function loadCustomFontPairings() {
  if (customFontPairings.length) return customFontPairings.slice();
  try {
    const raw = JSON.parse(
      localStorage.getItem(CUSTOM_PAIRINGS_STORAGE_KEY) || "[]",
    );
    if (Array.isArray(raw)) {
      customFontPairings = raw.map(normalizePairingDef).filter(Boolean);
    } else {
      customFontPairings = [];
    }
  } catch (_) {
    customFontPairings = [];
  }
  return customFontPairings.slice();
}

function saveCustomFontPairings(list) {
  customFontPairings = Array.isArray(list)
    ? list.map(normalizePairingDef).filter(Boolean)
    : [];
  try {
    localStorage.setItem(
      CUSTOM_PAIRINGS_STORAGE_KEY,
      JSON.stringify(customFontPairings),
    );
  } catch (_) {}
}

function mergeCustomPairingsIntoCatalog() {
  const base = Array.isArray(baseFontPairings) ? baseFontPairings.slice() : [];
  const extras = loadCustomFontPairings();
  const seen = new Set();
  const merged = [];
  base.forEach((pair) => {
    const normalized = normalizePairingDef(pair);
    if (!normalized) return;
    const key = pairingKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ ...normalized, isCustom: false });
  });
  extras.forEach((pair) => {
    const normalized = normalizePairingDef(pair);
    if (!normalized) return;
    const key = pairingKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ ...normalized, isCustom: true });
  });
  fontCatalog.pairings = merged;
}

function renderCustomPairingsList() {
  const wrap = DOM.customPairingsList;
  if (!wrap) return;
  const extras = loadCustomFontPairings();
  wrap.innerHTML = "";
  if (!extras.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "custom-pairings-empty";
    placeholder.textContent = "No custom quick picks yet.";
    wrap.appendChild(placeholder);
    return;
  }
  extras.forEach((pair) => {
    const item = document.createElement("div");
    item.className = "custom-pairing-row";
    const label = document.createElement("div");
    label.className = "custom-pairing-label";
    const heading = normalizePairingField(pair.heading);
    const body = normalizePairingField(pair.body);
    const notes = normalizePairingField(pair.notes);
    label.textContent = notes
      ? `${heading} + ${body} — ${notes}`
      : `${heading} + ${body}`;
    const actions = document.createElement("div");
    actions.className = "custom-pairing-actions";
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.textContent = "Apply";
    applyBtn.addEventListener("click", () => {
      const previewText =
        normalizePairingField(pair.preview) || findPairingPreview(pair);
      applyFontSelection(heading, body, {
        keepPairing: true,
        headingPreviewText: previewText,
        bodyPreviewText: getFontPreviewText(body),
      });
      showToast("Pairing applied");
    });
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "link-button";
    removeBtn.textContent = "Remove";
    removeBtn.dataset.removePairing = pairingKey(pair);
    actions.appendChild(applyBtn);
    actions.appendChild(removeBtn);
    item.appendChild(label);
    item.appendChild(actions);
    wrap.appendChild(item);
  });
}

function handleAddQuickPickPairing() {
  if (!DOM.addPairingHeading || !DOM.addPairingBody) return;
  const heading = normalizePairingField(DOM.addPairingHeading.value);
  const body = normalizePairingField(DOM.addPairingBody.value);
  if (!heading || !body) {
    alert("Enter both a heading and body font.");
    return;
  }
  const notes = normalizePairingField(
    DOM.addPairingNotes && DOM.addPairingNotes.value,
  );
  const preview = normalizePairingField(
    DOM.addPairingPreview && DOM.addPairingPreview.value,
  );
  const candidate = normalizePairingDef({ heading, body, notes, preview });
  if (!candidate) return;
  const current = loadCustomFontPairings();
  const key = pairingKey(candidate);
  if (current.some((pair) => pairingKey(pair) === key)) {
    alert("That pairing already exists.");
    return;
  }
  current.push(candidate);
  saveCustomFontPairings(current);
  ensureFontLoaded(candidate.heading, true);
  ensureFontLoaded(candidate.body, true);
  mergeCustomPairingsIntoCatalog();
  renderQuickPickButtons();
  renderCustomPairingsList();
  applyFontSelection(candidate.heading, candidate.body, {
    keepPairing: true,
    headingPreviewText: preview || findPairingPreview(candidate),
    bodyPreviewText: getFontPreviewText(candidate.body),
  });
  DOM.addPairingHeading.value = "";
  DOM.addPairingBody.value = "";
  if (DOM.addPairingNotes) DOM.addPairingNotes.value = "";
  if (DOM.addPairingPreview) DOM.addPairingPreview.value = "";
  showToast("Quick pick added");
}

function handleRemoveQuickPickPairing(key) {
  if (!key) return;
  const current = loadCustomFontPairings();
  const filtered = current.filter((pair) => pairingKey(pair) !== key);
  saveCustomFontPairings(filtered);
  mergeCustomPairingsIntoCatalog();
  renderQuickPickButtons();
  renderCustomPairingsList();
  showToast("Quick pick removed");
}

function setupCustomPairingControls() {
  if (DOM.quickPickForm) {
    DOM.quickPickForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleAddQuickPickPairing();
    });
  } else if (DOM.addPairingBtn) {
    DOM.addPairingBtn.addEventListener("click", handleAddQuickPickPairing);
  }
  if (DOM.customPairingsList) {
    DOM.customPairingsList.addEventListener("click", (event) => {
      const target =
        event.target instanceof HTMLElement
          ? event.target.closest("[data-remove-pairing]")
          : null;
      if (!target) return;
      const key = target.getAttribute("data-remove-pairing");
      if (key) handleRemoveQuickPickPairing(key);
    });
  }
  renderCustomPairingsList();
}

function getStoredFonts() {
  try {
    const raw = localStorage.getItem("photoboothFonts");
    const local = raw ? JSON.parse(raw) : [];
    // Fire-and-forget remote merge so new fonts sync to other devices
    loadFontsRemote()
      .then((remote) => {
        if (Array.isArray(remote) && remote.length) {
          const merged = mergeFonts(local, remote);
          localStorage.setItem("photoboothFonts", JSON.stringify(merged));
        }
      })
      .catch(() => {});
    return local;
  } catch (e) {
    return [];
  }
}

function saveStoredFonts(fonts) {
  localStorage.setItem("photoboothFonts", JSON.stringify(fonts));
  syncFontsRemote(fonts).catch(() => {});
  queueFontPickerRefresh({ preserveSelection: true });
}

function queueFontPickerRefresh(options = {}) {
  if (!fontPickerInitialized) return;
  reloadFontPickerOptions(options).catch(() => {});
}

function slugifyFontName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function composeFontString(family) {
  if (!family) return "";
  return `'${family}', ${FONT_FALLBACK_STACK}`;
}

function primaryFontFamily(fontStr) {
  if (!fontStr) return "";
  const m = fontStr.match(/'([^']+)'/);
  if (m) return m[1];
  return fontStr.split(",")[0].trim();
}

function ensureFontLoadedForFontString(fontStr) {
  const fam = primaryFontFamily(fontStr);
  if (fam) ensureFontLoaded(fam, true);
}

function ensureFontLoaded(family, storeIfNew = false) {
  const fam = (family || "").replace(/^['"]|['"]$/g, "").trim();
  if (!fam) return;
  const id = "gf-" + slugifyFontName(fam);
  if (!document.getElementById(id)) {
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      fam,
    ).replace(/%20/g, "+")}&display=swap`;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  if (storeIfNew) {
    const fonts = getStoredFonts();
    if (
      !fonts.find(
        (f) =>
          f.type === "family" && f.value.toLowerCase() === fam.toLowerCase(),
      )
    ) {
      fonts.push({ type: "family", value: fam });
      saveStoredFonts(fonts);
      updateFontSuggestions();
      renderCurrentFonts();
    }
  }
}

function addFontByFamily() {
  const fam = ((DOM.addFontFamily && DOM.addFontFamily.value) || "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
  if (!fam) {
    alert("Enter a font family name.");
    return;
  }
  ensureFontLoaded(fam, true);
  alert(`Added Google Font: ${fam}`);
}

function addFontByUrl() {
  const url = ((DOM.addFontUrl && DOM.addFontUrl.value) || "").trim();
  if (!url) {
    alert("Paste a Google Fonts CSS URL.");
    return;
  }
  try {
    new URL(url);
  } catch (e) {
    alert("Invalid URL.");
    return;
  }
  const id = "gf-url-" + btoa(url).replace(/=/g, "");
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }
  const fonts = getStoredFonts();
  if (!fonts.find((f) => f.type === "url" && f.value === url)) {
    let famLabel = "";
    try {
      const u = new URL(url);
      const fam = u.searchParams.get("family");
      famLabel = fam ? fam.split(":")[0].replace(/\+/g, " ") : "";
    } catch (_e) {}
    fonts.push({ type: "url", value: url, label: famLabel });
    saveStoredFonts(fonts);
  }
  updateFontSuggestions();
  renderCurrentFonts();
  alert("Font URL added.");
}

function updateFontSuggestions() {
  const dl = document.getElementById("fontSuggestions");
  if (!dl) return;
  dl.innerHTML = "";
  const suggestions = new Set([
    "Comic Neue",
    "Creepster",
    "Inter",
    "Montserrat",
  ]);
  const fonts = getStoredFonts();
  fonts.forEach((f) => {
    const fam = f.type === "family" ? f.value : (f.label || "").trim();
    if (fam) suggestions.add(fam);
  });
  if (Array.isArray(fontCatalog.available)) {
    fontCatalog.available.forEach((font) => {
      if (font && font.name) suggestions.add(font.name);
    });
  }
  Array.from(suggestions)
    .sort((a, b) => a.localeCompare(b))
    .forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      dl.appendChild(opt);
    });
}

function renderCurrentFonts() {
  if (!DOM.currentFonts) return;
  const fonts = getStoredFonts();
  if (fonts.length === 0) {
    DOM.currentFonts.textContent = "No added fonts yet.";
    return;
  }
  const parts = fonts.map((f) =>
    f.type === "family" ? f.value : f.label || "Custom URL",
  );
  DOM.currentFonts.textContent = `Available fonts: ${parts.join(", ")}`;
}

function loadFontsFromStorage() {
  const fonts = getStoredFonts();
  fonts.forEach((f) => {
    if (f.type === "family") ensureFontLoaded(f.value, false);
    if (f.type === "url") {
      const id = "gf-url-" + btoa(f.value).replace(/=/g, "");
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = f.value;
        document.head.appendChild(link);
      }
    }
  });
  updateFontSuggestions();
  renderCurrentFonts();
  if (fontPickerInitialized) {
    queueFontPickerRefresh({ preserveSelection: true });
  }
}

function injectStylesheetOnce(href) {
  if (!href) return;
  const existing = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]'),
  );
  if (existing.some((l) => l instanceof HTMLLinkElement && l.href === href))
    return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function getFontPreviewText(name) {
  if (!name) return DEFAULT_FONT_PREVIEW;
  const match = (
    Array.isArray(fontCatalog.available) ? fontCatalog.available : []
  ).find((f) => f && f.name && f.name.toLowerCase() === name.toLowerCase());
  return (match && match.preview) || DEFAULT_FONT_PREVIEW;
}

function getFontPreviewFamily(name) {
  return getFontPreviewText(name);
}

function findPairingPreview(pairing, fonts = fontCatalog.available) {
  if (!pairing) return DEFAULT_FONT_PREVIEW;
  if (pairing.preview) return pairing.preview;
  const heading = pairing.heading;
  if (heading && Array.isArray(fonts)) {
    const normalized = normalizeFontFamilyName(heading);
    const match = fonts.find(
      (font) =>
        font && normalizeFontFamilyName(font.name || font.value) === normalized,
    );
    if (match && match.preview) return match.preview;
  }
  return getFontPreviewText(heading);
}

function populateFontPickerOptions(fonts) {
  const list = Array.isArray(fonts) ? fonts : [];
  const selects = [DOM.headingFontSelect, DOM.bodyFontSelect];
  selects.forEach((sel) => {
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = "";
    list.forEach((font) => {
      if (!font || !font.name) return;
      const opt = document.createElement("option");
      opt.value = font.name;
      opt.textContent = font.name;
      opt.style.fontFamily = composeFontString(font.name);
      sel.appendChild(opt);
    });
    if (current) {
      ensureOptionExists(sel, current);
      sel.value = current;
    }
  });
}

function ensureOptionExists(select, family) {
  if (!select || !family) return;
  const exists = Array.from(select.options).some(
    (opt) => opt.value.toLowerCase() === family.toLowerCase(),
  );
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = family;
    opt.textContent = family;
    opt.style.fontFamily = composeFontString(family);
    select.appendChild(opt);
  }
}

function getFontPickerSelection() {
  return {
    heading: DOM.headingFontSelect ? DOM.headingFontSelect.value : "",
    body: DOM.bodyFontSelect ? DOM.bodyFontSelect.value : "",
  };
}

function updateFontPreviewElements(heading, body, options = {}) {
  refreshStylePreviewText({
    headingPreviewText:
      options.headingPreviewText || getFontPreviewText(heading),
    bodyPreviewText: options.bodyPreviewText || getFontPreviewText(body),
  });
}

function refreshStylePreviewText(options = {}) {
  const heading = (DOM.headingFontSelect && DOM.headingFontSelect.value) || "";
  const body = (DOM.bodyFontSelect && DOM.bodyFontSelect.value) || heading;
  const headingText =
    valueFromInput(DOM.themeWelcomeTitle) ||
    options.headingPreviewText ||
    getFontPreviewText(heading);
  const bodyText = options.bodyPreviewText || getFontPreviewText(body);
  const eventName =
    valueFromInput(DOM.eventNameInput) || getFontPreviewText(heading || body);
  const prompt = valueFromInput(DOM.themeWelcomePrompt) || "Touch to start";
  if (DOM.stylePreviewHeading)
    DOM.stylePreviewHeading.textContent =
      headingText || "Welcome to the photobooth!";
  if (DOM.stylePreviewSubheading)
    DOM.stylePreviewSubheading.textContent = eventName || "Event Title";
  if (DOM.stylePreviewBody)
    DOM.stylePreviewBody.textContent = bodyText || DEFAULT_FONT_PREVIEW;
  if (DOM.stylePreviewButton) DOM.stylePreviewButton.textContent = prompt;
}

function setFontPickerSelection(heading, body, options = {}) {
  ignoreFontPickerEvents = true;
  if (DOM.headingFontSelect && heading) {
    ensureOptionExists(DOM.headingFontSelect, heading);
    DOM.headingFontSelect.value = heading;
  }
  if (DOM.bodyFontSelect && body) {
    ensureOptionExists(DOM.bodyFontSelect, body);
    DOM.bodyFontSelect.value = body;
  }
  ignoreFontPickerEvents = false;
  updateFontPreviewElements(heading, body, options);
  if (!options.keepPairing && DOM.fontPairingSelect) {
    DOM.fontPairingSelect.value = "";
  }
}

function applyFontsToActiveTheme(headingName, bodyName, options = {}) {
  const target = getSelectedThemeTarget();
  if (!target) return;
  const heading =
    headingName || primaryFontFamily(target.fontHeading || target.font || "");
  const body =
    bodyName || primaryFontFamily(target.fontBody || target.font || "");
  if (heading) ensureFontLoaded(heading, false);
  if (body) ensureFontLoaded(body, false);
  if (heading) target.fontHeading = composeFontString(heading);
  else delete target.fontHeading;
  if (body) target.fontBody = composeFontString(body);
  else delete target.fontBody;
  target.font = composeFontString(body || heading || "Comic Neue");
  if (activeTheme === target) {
    applyThemeFontStyles(target);
    renderCurrentAssets(target);
  }
  saveThemesToStorage();
  if (!options.quiet) showToast("Fonts updated");
  syncThemeEditorSummary();
}

function applyFontSelection(heading, body, options = {}) {
  if (!heading && !body) return;
  setFontPickerSelection(heading, body, options);
  applyFontsToActiveTheme(heading, body, options);
}

function refreshFontPickerUI(theme, options = {}) {
  const defaults = fontCatalog.defaults || {};
  const fallback =
    fontCatalog.available && fontCatalog.available.length
      ? fontCatalog.available[0].name
      : "";
  const heading =
    options.heading ||
    primaryFontFamily((theme && (theme.fontHeading || theme.font)) || "") ||
    defaults.heading ||
    fallback ||
    "";
  const body =
    options.body ||
    primaryFontFamily((theme && (theme.fontBody || theme.font)) || "") ||
    defaults.body ||
    heading ||
    fallback ||
    "";
  setFontPickerSelection(heading, body, { keepPairing: true });
}

function updateQuickPickExpansion() {
  const wrap = DOM.fontQuickPicks;
  if (!wrap) return;
  wrap.classList.toggle("expanded", quickPicksExpanded);
  if (DOM.fontQuickPicksToggle) {
    DOM.fontQuickPicksToggle.textContent = quickPicksExpanded
      ? "show less"
      : "show all";
  }
}

function toggleQuickPicks() {
  quickPicksExpanded = !quickPicksExpanded;
  updateQuickPickExpansion();
}

function renderQuickPickButtons() {
  const wrap = DOM.fontQuickPicks;
  if (!wrap) return;
  wrap.innerHTML = "";
  const pairings = Array.isArray(fontCatalog.pairings)
    ? fontCatalog.pairings.slice()
    : [];
  if (DOM.fontQuickPicksToggle) {
    DOM.fontQuickPicksToggle.style.display = pairings.length
      ? "inline"
      : "none";
  }
  if (!pairings.length) {
    const note = document.createElement("div");
    note.style.fontSize = "0.9em";
    note.style.opacity = "0.7";
    note.textContent = "No quick picks configured yet.";
    wrap.appendChild(note);
    return;
  }
  const seasonalWords = [
    "Christmas",
    "Holiday",
    "Spooky",
    "Valentine",
    "Easter",
    "New Year",
  ];
  pairings.sort((a, b) => {
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    const aSeason =
      a.preview && seasonalWords.some((w) => a.preview.includes(w));
    const bSeason =
      b.preview && seasonalWords.some((w) => b.preview.includes(w));
    if (aSeason === bSeason) return 0;
    return aSeason ? -1 : 1;
  });
  pairings.forEach((pair) => {
    const heading = pair.heading;
    const body = pair.body;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `quick-pick-card${
      pair.isCustom ? " quick-pick-card-custom" : ""
    }`;
    const previewText = findPairingPreview(pair);
    card.innerHTML = `
      <div class="quick-pick-label${
        pair.isCustom ? " quick-pick-label-custom" : ""
      }">${pair.isCustom ? "Custom quick pick" : "Quick pick"}</div>
      <div class="quick-pick-title">${heading} + ${body}${
        pair.notes ? ` — ${pair.notes}` : ""
      }</div>
      <div class="quick-pick-preview" style="font-family: ${composeFontString(
        heading,
      )};">${previewText}</div>
    `;
    card.addEventListener("click", () => {
      applyFontSelection(heading, body, {
        keepPairing: true,
        headingPreviewText: previewText,
        bodyPreviewText: getFontPreviewText(body),
      });
    });
    wrap.appendChild(card);
  });
  updateQuickPickExpansion();
}

async function reloadFontPickerOptions(options = {}) {
  if (!DOM.headingFontSelect || !DOM.bodyFontSelect) return;
  const preserveSelection = !!options.preserveSelection;
  const previous = preserveSelection ? getFontPickerSelection() : null;
  let base = { available: [], defaults: {}, pairings: [] };
  const manifestCandidates = ["fonts.json", "./fonts.json", "/fonts.json"];
  for (const candidate of manifestCandidates) {
    try {
      const res = await fetch(candidate, { cache: "no-store" });
      if (res && res.ok) {
        base = await res.json();
        break;
      }
    } catch (e) {
      console.warn("Failed to load fonts manifest from", candidate, e);
    }
  }
  const stored = getStoredFonts();
  const extras = stored
    .filter((f) => f && f.type === "family" && f.value)
    .map((f) => ({
      name: f.value,
      weights: [400],
      ital: false,
      preview: DEFAULT_FONT_PREVIEW,
    }));
  const merged = [];
  const seen = new Set();
  [...(Array.isArray(base.available) ? base.available : []), ...extras].forEach(
    (font) => {
      if (!font || !font.name) return;
      const key = font.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        name: font.name,
        weights:
          Array.isArray(font.weights) && font.weights.length
            ? font.weights
            : [400],
        ital: !!font.ital,
        preview: font.preview || DEFAULT_FONT_PREVIEW,
      });
    },
  );
  fontCatalog = {
    available: merged,
    defaults: base.defaults || {},
    pairings: Array.isArray(base.pairings) ? base.pairings.slice() : [],
  };
  baseFontPairings = Array.isArray(fontCatalog.pairings)
    ? fontCatalog.pairings.slice()
    : [];
  mergeCustomPairingsIntoCatalog();
  const href = buildGoogleFontsURL(fontCatalog.available);
  if (href) injectStylesheetOnce(href);
  populateFontPickerOptions(fontCatalog.available);
  renderQuickPickButtons();
  renderCustomPairingsList();
  if (previous && previous.heading)
    ensureOptionExists(DOM.headingFontSelect, previous.heading);
  if (previous && previous.body)
    ensureOptionExists(DOM.bodyFontSelect, previous.body);
  const targetTheme = activeTheme || getSelectedThemeTarget();
  if (previous && preserveSelection) {
    setFontPickerSelection(previous.heading, previous.body, {
      keepPairing: true,
    });
  } else {
    refreshFontPickerUI(targetTheme, { quiet: true });
  }
}

function attachFontPickerListeners() {
  if (DOM.headingFontSelect) {
    DOM.headingFontSelect.addEventListener("change", () => {
      if (ignoreFontPickerEvents) return;
      const heading = DOM.headingFontSelect.value;
      const body =
        DOM.bodyFontSelect && DOM.bodyFontSelect.value
          ? DOM.bodyFontSelect.value
          : heading;
      applyFontSelection(heading, body, { keepPairing: false });
    });
  }
  if (DOM.bodyFontSelect) {
    DOM.bodyFontSelect.addEventListener("change", () => {
      if (ignoreFontPickerEvents) return;
      const body = DOM.bodyFontSelect.value;
      const heading =
        DOM.headingFontSelect && DOM.headingFontSelect.value
          ? DOM.headingFontSelect.value
          : body;
      applyFontSelection(heading, body, { keepPairing: false });
    });
  }
  if (DOM.fontPairingSelect) {
    DOM.fontPairingSelect.addEventListener("change", () => {
      if (ignoreFontPickerEvents) return;
      const value = DOM.fontPairingSelect.value;
      if (!value) return;
      const [heading, body] = value.split("|");
      const pairing = (fontCatalog.pairings || []).find(
        (p) => p.heading === heading && p.body === body,
      );
      applyFontSelection(heading, body, {
        keepPairing: true,
        headingPreviewText: findPairingPreview(pairing),
        bodyPreviewText: getFontPreviewText(body),
      });
    });
  }
  if (DOM.fontQuickPicksToggle) {
    DOM.fontQuickPicksToggle.addEventListener("click", toggleQuickPicks);
  }
}

async function setupFontPicker() {
  if (!DOM.headingFontSelect || !DOM.bodyFontSelect) return;
  if (!fontPickerSetupPromise) {
    fontPickerSetupPromise = (async () => {
      attachFontPickerListeners();
      await reloadFontPickerOptions({ preserveSelection: false });
      fontPickerInitialized = true;
    })();
  } else if (fontPickerInitialized) {
    await reloadFontPickerOptions({ preserveSelection: true });
  }
  return fontPickerSetupPromise;
}

function populateFontSelect(preselectFamily = "") {
  setupFontPicker()
    .then(() => {
      const theme = activeTheme || getSelectedThemeTarget() || {};
      if (preselectFamily) {
        refreshFontPickerUI(theme, {
          heading: preselectFamily,
          body: preselectFamily,
        });
      } else {
        refreshFontPickerUI(theme, {});
      }
    })
    .catch(() => {});
}

function setThemeEditorMode(mode) {
  const resolved =
    mode ||
    (DOM.themeEditorModeSelect ? DOM.themeEditorModeSelect.value : "edit");
  if (DOM.themeEditorModeSelect) DOM.themeEditorModeSelect.value = resolved;
  const isCreate = resolved === "create";
  const isClone = resolved === "clone";

  if (DOM.btnUpdateTheme)
    DOM.btnUpdateTheme.style.display = isCreate ? "none" : "inline-block";
  if (DOM.btnSaveTheme)
    DOM.btnSaveTheme.style.display = isCreate ? "inline-block" : "none";
  if (DOM.themeCloneSection)
    DOM.themeCloneSection.classList.toggle("hidden", !isClone);
  if (
    isClone &&
    DOM.themeCloneName &&
    !valueFromInput(DOM.themeCloneName) &&
    activeTheme &&
    activeTheme.name
  ) {
    DOM.themeCloneName.value = `${activeTheme.name} Copy`;
  }
  if (!isClone && DOM.themeCloneName) DOM.themeCloneName.value = "";

  if (isCreate) {
    resetCreateThemeModal();
    showCreateThemeModal();
    if (DOM.themeName) DOM.themeName.value = "";
    if (DOM.themeWelcomeTitle) DOM.themeWelcomeTitle.value = "";
    if (DOM.themeWelcomePrompt) DOM.themeWelcomePrompt.value = "";
    clearThemeFileInputs();
    if (DOM.summaryBackground) DOM.summaryBackground.textContent = "";
    if (DOM.summaryLogo) DOM.summaryLogo.textContent = "";
    if (DOM.summaryOverlays) DOM.summaryOverlays.textContent = "";
    if (DOM.summaryTemplates) DOM.summaryTemplates.textContent = "";
    if (DOM.themeAccent) DOM.themeAccent.value = "#ff0000";
    if (DOM.themeAccent2) DOM.themeAccent2.value = "#ffffff";
    setupFontPicker()
      .then(() => {
        const defaults =
          fontCatalog && fontCatalog.defaults ? fontCatalog.defaults : {};
        const heading = defaults.heading || "Montserrat";
        const body = defaults.body || "Inter";
        refreshFontPickerUI({}, { heading, body });
      })
      .catch(() => {});
  } else {
    hideCreateThemeModal();
    resetCreateThemeModal();
    syncThemeEditorWithActiveTheme();
  }
  updateThemeEditorSummary();
}

const DEFAULT_FONTS_PAYLOAD = {
  available: [
    {
      name: "Comic Neue",
      weights: [400, 700],
      preview: "Welcome to the celebration!",
    },
    { name: "Creepster", weights: [400], preview: "Spooky season starts now!" },
    {
      name: "Nosifer",
      weights: [400],
      preview: "Dripping thrills at Fletch Photobooth!",
    },
    {
      name: "Montserrat",
      weights: [400, 600, 700],
      preview: "Modern, clean, and easy to read.",
    },
    {
      name: "Inter",
      weights: [400, 600, 700],
      preview: "Friendly and versatile for body copy.",
    },
    {
      name: "Source Sans 3",
      weights: [400, 600],
      preview: "Reliable for long-form event details.",
    },
    {
      name: "Playfair Display",
      weights: [400, 600],
      preview: "Elegant serif headlines for upscale events.",
    },
    {
      name: "Raleway",
      weights: [400, 600],
      preview: "Sophisticated sans with personality.",
    },
    {
      name: "Lora",
      weights: [400, 600],
      preview: "Warm serif that stays readable.",
    },
    {
      name: "Oswald",
      weights: [400, 600],
      preview: "Tall, bold titles that grab attention.",
    },
    {
      name: "Poppins",
      weights: [400, 600],
      preview: "Rounded geometric for friendly events.",
    },
    {
      name: "Lato",
      weights: [400, 700],
      preview: "Balanced body font for signage.",
    },
    {
      name: "Bangers",
      weights: [400],
      preview: "Let's make some noise tonight!",
    },
    { name: "Great Vibes", weights: [400], preview: "Love is in the air." },
    {
      name: "Dancing Script",
      weights: [400, 700],
      preview: "Handwritten flair for celebrations.",
    },
    {
      name: "Mountains of Christmas",
      weights: [400, 700],
      preview: "Merry Christmas from Fletch Photobooth 🎄",
    },
    {
      name: "Roboto",
      weights: [400, 500, 700],
      preview: "Ultra clear and neutral.",
    },
    {
      name: "Open Sans",
      weights: [400, 600, 700],
      preview: "Highly legible on dark UIs.",
    },
    {
      name: "Abril Fatface",
      weights: [400],
      preview: "Glam display for chic events.",
    },
    {
      name: "Crimson Text",
      weights: [400, 600, 700],
      preview: "Classic bookish elegance.",
    },
    {
      name: "Work Sans",
      weights: [400, 600, 700],
      preview: "Modern, friendly workhorse.",
    },
    {
      name: "Sniglet",
      weights: [400, 800],
      preview: "Round and playful for kids.",
    },
    {
      name: "Cabin",
      weights: [400, 600, 700],
      preview: "Warm, readable companion.",
    },
  ],
  defaults: {
    heading: "Comic Neue",
    body: "Montserrat",
  },
  pairings: [
    {
      heading: "Montserrat",
      body: "Inter",
      notes: "Modern Minimalist",
      preview: "Modern & clean for any celebration.",
    },
    {
      heading: "Roboto",
      body: "Open Sans",
      notes: "Ultra Readable",
      preview: "Crystal-clear on dark backgrounds.",
    },
    {
      heading: "Raleway",
      body: "Open Sans",
      notes: "Minimal Harmony",
      preview: "Sleek look for promos & tech.",
    },
    {
      heading: "Playfair Display",
      body: "Source Sans 3",
      notes: "Timeless Elegance (Weddings/Formal)",
      preview: "A timeless moment captured by Fletch Photo.",
    },
    {
      heading: "Great Vibes",
      body: "Montserrat",
      notes: "Romantic Flow (Valentine’s/Weddings)",
      preview: "Love is in the air at Fletch Photo.",
    },
    {
      heading: "Abril Fatface",
      body: "Lato",
      notes: "Chic Impact (Gala/NYE)",
      preview: "Ring in the New Year with style ✨",
    },
    {
      heading: "Great Vibes",
      body: "Lora",
      notes: "Romantic Elegance (Weddings)",
      preview: "Happily ever after starts here.",
    },
    {
      heading: "Oswald",
      body: "Inter",
      notes: "Grad Glory (Graduation)",
      preview: "Congrats, Grad! 🎓",
    },
    {
      heading: "Dancing Script",
      body: "Poppins",
      notes: "Joyful Moments (Birthdays/Family)",
      preview: "Happy Birthday from Fletch Photobooth!",
    },
    {
      heading: "Bangers",
      body: "Montserrat",
      notes: "Comic Energy (Kids/Spirit)",
      preview: "Let’s make some noise tonight!",
    },
    {
      heading: "Sniglet",
      body: "Cabin",
      notes: "Playtime Fun (Kids)",
      preview: "Let’s celebrate with Fletch Photobooth!",
    },
    {
      heading: "Oswald",
      body: "Montserrat",
      notes: "Bold Statement (Sports/Birthdays)",
      preview: "Big energy for team spirit.",
    },
    {
      heading: "Poppins",
      body: "Lato",
      notes: "Friendly Geometric (Elementary)",
      preview: "Family Fun Night with Fletch Photo!",
    },
    {
      heading: "Creepster",
      body: "Inter",
      notes: "Spooky Season (Halloween)",
      preview: "Spooky season starts now!",
    },
    {
      heading: "Mountains of Christmas",
      body: "Inter",
      notes: "Festive Cheer (Christmas)",
      preview: "Merry Christmas from Fletch Photobooth 🎄",
    },
    {
      heading: "Raleway",
      body: "Lora",
      notes: "Warm Whispers (Thanksgiving/Fall)",
      preview: "Give thanks with Fletch Photobooth.",
    },
  ],
};

function normalizeFontFamilyName(name) {
  return (name || "")
    .toString()
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function dedupeFontDefs(fonts) {
  const seen = new Set();
  const out = [];
  (Array.isArray(fonts) ? fonts : []).forEach((font) => {
    if (!font || typeof font !== "object") return;
    const cleanName = normalizeFontFamilyName(font.name || font.value);
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const weights = Array.isArray(font.weights)
      ? font.weights.filter((w) => Number.isFinite(w)).map((w) => Number(w))
      : [];
    out.push({
      name: cleanName,
      weights: weights.length ? weights : undefined,
      ital: Boolean(font.ital),
      preview: font.preview || font.label || "",
    });
  });
  return out;
}

function normalizeFontsPayload(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const converted = raw
      .filter(
        (item) => item && typeof item === "object" && item.type === "family",
      )
      .map((item) => ({
        name: normalizeFontFamilyName(item.value),
        weights: item.weights,
        preview: item.label || "",
      }))
      .filter((item) => item.name);
    return {
      available: dedupeFontDefs([
        ...DEFAULT_FONTS_PAYLOAD.available,
        ...converted,
      ]),
      defaults: { ...DEFAULT_FONTS_PAYLOAD.defaults },
      pairings: [...DEFAULT_FONTS_PAYLOAD.pairings],
    };
  }
  if (typeof raw === "object") {
    const available =
      Array.isArray(raw.available) && raw.available.length
        ? dedupeFontDefs(raw.available)
        : dedupeFontDefs(DEFAULT_FONTS_PAYLOAD.available);
    const defaults = {
      ...DEFAULT_FONTS_PAYLOAD.defaults,
      ...(raw.defaults && typeof raw.defaults === "object" ? raw.defaults : {}),
    };
    const pairings =
      Array.isArray(raw.pairings) && raw.pairings.length
        ? raw.pairings
        : DEFAULT_FONTS_PAYLOAD.pairings;
    return { available, defaults, pairings };
  }
  return null;
}

function buildGoogleFontsURL(fonts) {
  // Local font files are bundled under /fonts and referenced via fonts.css,
  // so there is no need to hit Google Fonts at runtime. Keeping this helper
  // returning an empty string prevents unnecessary network requests while
  // still allowing callers to guard on a falsy value.
  void fonts;
  return "";
}

function setHeadingFont(family) {
  const clean =
    normalizeFontFamilyName(family) ||
    normalizeFontFamilyName(DEFAULT_FONTS_PAYLOAD.defaults.heading);
  const stack = `'${clean}', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  document.documentElement.style.setProperty("--font-heading", stack);
  localStorage.setItem("font.heading", clean);
}

function setBodyFont(family) {
  const clean =
    normalizeFontFamilyName(family) ||
    normalizeFontFamilyName(DEFAULT_FONTS_PAYLOAD.defaults.body);
  const stack = `'${clean}', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  document.documentElement.style.setProperty("--font-body", stack);
  document.documentElement.style.setProperty("--font", stack);
  localStorage.setItem("font.body", clean);
}

function findFontPreview(fonts, name) {
  const clean = normalizeFontFamilyName(name);
  const match = (Array.isArray(fonts) ? fonts : []).find(
    (f) => normalizeFontFamilyName(f.name) === clean,
  );
  return match && match.preview ? match.preview : DEFAULT_FONT_PREVIEW;
}

function renderQuickPicks(args) {
  const { container, pairings, fonts, apply } = args;
  container.innerHTML = "";
  const priorityOrder = [
    "Halloween",
    "Christmas",
    "New Year",
    "Fall",
    "Thanksgiving",
    "Valentine",
    "Graduation",
  ];
  const seasonalWords = priorityOrder.map((word) => word.toLowerCase());
  const sortKey = (pair) => {
    if (!pair || !pair.notes) return Number.MAX_SAFE_INTEGER;
    const note = pair.notes.toLowerCase();
    const idx = seasonalWords.findIndex((word) => note.includes(word));
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  const sorted = [...pairings].sort((a, b) => {
    const aKey = sortKey(a);
    const bKey = sortKey(b);
    if (aKey === bKey)
      return ((a && a.heading) || "").localeCompare((b && b.heading) || "");
    return aKey - bKey;
  });
  sorted.forEach((pairing) => {
    if (!pairing || !pairing.heading || !pairing.body) return;
    const headingPreview =
      pairing.preview ||
      findFontPreview(fonts, pairing.heading) ||
      DEFAULT_FONT_PREVIEW;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quick-pick-card";
    card.innerHTML = `
      <div class="quick-pick-label">Quick Pick</div>
      <div class="quick-pick-fonts"><span class="quick-pick-heading">${
        pairing.heading
      }</span> + ${pairing.body}</div>
      <div class="quick-pick-preview" style="font-family: '${
        pairing.heading
      }', system-ui, sans-serif;">${headingPreview}</div>
      ${
        pairing.notes
          ? `<div class="quick-pick-notes">${pairing.notes}</div>`
          : ""
      }
    `;
    card.addEventListener("click", () =>
      apply(pairing.heading, pairing.body, headingPreview),
    );
    container.appendChild(card);
  });
}

async function setupDualFontPicker(opts) {
  if (!opts || !opts.headingSelect || !opts.bodySelect) return;
  const endpointRaw =
    typeof opts.fontsEndpoint === "string"
      ? opts.fontsEndpoint.trim()
      : "/api/fonts";
  const endpoint = endpointRaw.length ? endpointRaw : null;
  let payload = null;
  if (endpoint) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        payload = normalizeFontsPayload(data);
      }
    } catch (e) {
      console.warn("Failed to fetch fonts payload", e);
    }
  }
  const effective =
    payload ||
    normalizeFontsPayload(DEFAULT_FONTS_PAYLOAD) ||
    DEFAULT_FONTS_PAYLOAD;
  const fonts = dedupeFontDefs(effective.available);
  const pairings = Array.isArray(effective.pairings) ? effective.pairings : [];
  if (!fonts.length) return;
  const href = buildGoogleFontsURL(fonts);
  injectStylesheetOnce(href);

  const populate = (sel) => {
    if (!sel) return;
    sel.innerHTML = "";
    fonts.forEach((font) => {
      const opt = document.createElement("option");
      opt.value = font.name;
      opt.textContent = font.name;
      opt.style.fontFamily = `'${font.name}', system-ui, sans-serif`;
      sel.appendChild(opt);
    });
  };

  populate(opts.headingSelect);
  populate(opts.bodySelect);

  const storedHeading = normalizeFontFamilyName(
    localStorage.getItem("font.heading"),
  );
  const storedBody = normalizeFontFamilyName(localStorage.getItem("font.body"));
  const defaultHeading =
    storedHeading ||
    normalizeFontFamilyName(effective.defaults && effective.defaults.heading) ||
    fonts[0].name;
  const defaultBody =
    storedBody ||
    normalizeFontFamilyName(effective.defaults && effective.defaults.body) ||
    fonts[0].name;

  setHeadingFont(defaultHeading);
  setBodyFont(defaultBody);

  if (opts.headingSelect) opts.headingSelect.value = defaultHeading;
  if (opts.bodySelect) opts.bodySelect.value = defaultBody;
  refreshStylePreviewText();

  if (opts.headingSelect) {
    opts.headingSelect.addEventListener("change", () => {
      const val = opts.headingSelect.value;
      setHeadingFont(val);
      if (opts.pairingSelect) opts.pairingSelect.value = "";
      refreshStylePreviewText();
    });
  }

  if (opts.bodySelect) {
    opts.bodySelect.addEventListener("change", () => {
      const val = opts.bodySelect.value;
      setBodyFont(val);
      if (opts.pairingSelect) opts.pairingSelect.value = "";
      refreshStylePreviewText();
    });
  }

  if (opts.pairingSelect) {
    const sel = opts.pairingSelect;
    sel.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Choose a pairing --";
    sel.appendChild(placeholder);
    pairings.forEach((pairing) => {
      if (!pairing || !pairing.heading || !pairing.body) return;
      const opt = document.createElement("option");
      opt.value = `${pairing.heading}|${pairing.body}`;
      opt.textContent = pairing.notes
        ? `${pairing.heading} + ${pairing.body} - ${pairing.notes}`
        : `${pairing.heading} + ${pairing.body}`;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      if (!sel.value) return;
      const [h, b] = sel.value.split("|");
      const pairing = pairings.find((p) => p.heading === h && p.body === b);
      if (opts.headingSelect) opts.headingSelect.value = h;
      if (opts.bodySelect) opts.bodySelect.value = b;
      setHeadingFont(h);
      setBodyFont(b);
      const headingPreviewText = findPairingPreview(pairing, fonts);
      refreshStylePreviewText({
        headingPreviewText,
        bodyPreviewText: findFontPreview(fonts, b),
      });
    });
  }

  const qpEl = document.getElementById("quickPicks");
  const qpToggle = document.getElementById("qpToggle");
  const applyBoth = (h, b, previewText) => {
    if (opts.headingSelect) opts.headingSelect.value = h;
    if (opts.bodySelect) opts.bodySelect.value = b;
    setHeadingFont(h);
    setBodyFont(b);
    const bodyPreviewText = findFontPreview(fonts, b);
    if (opts.pairingSelect) opts.pairingSelect.value = "";
    refreshStylePreviewText({
      headingPreviewText: previewText || findFontPreview(fonts, h),
      bodyPreviewText: bodyPreviewText,
    });
  };

  if (qpEl && pairings.length) {
    renderQuickPicks({ container: qpEl, pairings, fonts, apply: applyBoth });
    let expanded = false;
    const updateGrid = () => {
      qpEl.style.maxHeight = expanded ? "" : "220px";
      qpEl.style.overflow = expanded ? "visible" : "hidden";
      if (qpToggle) qpToggle.textContent = expanded ? "show less" : "show all";
    };
    updateGrid();
    if (qpToggle) {
      qpToggle.style.display = "inline-block";
      qpToggle.addEventListener("click", () => {
        expanded = !expanded;
        updateGrid();
      });
    }
  } else if (qpToggle) {
    qpToggle.style.display = "none";
  }

  refreshStylePreviewText();
}

// --- Editing Existing Themes ---
function getSelectedThemeKey() {
  const eventKey = DOM.eventSelect && DOM.eventSelect.value;
  return eventKey || "";
}
function getSelectedThemeTarget() {
  const key = getSelectedThemeKey();
  if (!key) return null;
  if (key.includes(":")) {
    const [rootKey, subKey] = key.split(":");
    const root = themes[rootKey];
    if (!root) return null;
    if (root.themes && root.themes[subKey]) return root.themes[subKey];
    if (root.holidays && root.holidays[subKey]) return root.holidays[subKey];
    return null;
  }
  return themes[key] || null;
}

async function updateSelectedTheme(reason = "") {
  const key = getSelectedThemeKey();
  const target = getSelectedThemeTarget();
  if (!key || !target) {
    alert("Select a theme first.");
    clearThemeFileInputs();
    return;
  }

  applyThemeBasicsFromEditor(target);
  const folders = readThemeFolderInputs();
  let assetChanges = null;
  try {
    assetChanges = await uploadThemeAssetsFromEditor(target);
  } catch (err) {
    console.error("Failed to upload theme assets", err);
    clearThemeFileInputs();
    alert("Could not update the theme. Check the console for details.");
    return;
  }
  if (assetChanges && assetChanges.logoUrl) {
    setGlobalLogo(assetChanges.logoUrl, { quiet: true, skipSave: true });
  } else {
    const currentGlobalLogo = getGlobalLogo();
    if (currentGlobalLogo !== null)
      applyGlobalLogoToTheme(target, currentGlobalLogo);
  }
  applyThemeFolderSettings(target, folders);

  try {
    normalizeThemeObject(target);
  } catch (_e) {}
  saveThemesToStorage();

  populateThemeSelector(key);
  setEventSelection(key);
  loadTheme(key);
  clearThemeFileInputs();
  syncThemeEditorWithActiveTheme();
  showToast(describeThemeUpdate(assetChanges, reason));
}

function describeThemeUpdate(changes, reason) {
  if (!changes) return "Theme updated";
  const parts = [];
  if (changes.backgroundsAdded) {
    parts.push(
      `Added ${changes.backgroundsAdded} background${
        changes.backgroundsAdded === 1 ? "" : "s"
      }`,
    );
  }
  if (changes.overlaysAdded) {
    parts.push(
      `Added ${changes.overlaysAdded} overlay${
        changes.overlaysAdded === 1 ? "" : "s"
      }`,
    );
  }
  if (changes.templatesAdded) {
    parts.push(
      `Added ${changes.templatesAdded} template${
        changes.templatesAdded === 1 ? "" : "s"
      }`,
    );
  }
  if (changes.logoUrl) {
    parts.push("Logo applied to all themes");
  }
  if (parts.length) return parts.join(" • ");
  if (reason === "logo") return "Logo unchanged";
  return "Theme updated";
}

function valueFromInput(node) {
  return node && typeof node.value === "string" ? node.value.trim() : "";
}

function slugifyThemeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function ensureCreateThemeAssets() {
  if (!createThemeAssets) {
    createThemeAssets = {
      backgrounds: [],
      overlays: [],
      templates: [],
      logos: [],
    };
  }
  return createThemeAssets;
}

function resetCreateThemeAssets() {
  createThemeAssets = {
    backgrounds: [],
    overlays: [],
    templates: [],
    logos: [],
  };
}

function resetCreateThemeModal() {
  resetCreateThemeAssets();
  if (DOM.createThemeName) DOM.createThemeName.value = "";
  if (DOM.createThemeSummary)
    DOM.createThemeSummary.textContent = "Drop a theme folder to begin.";
  if (DOM.createThemeDropZone)
    DOM.createThemeDropZone.classList.remove("dragover");
  updateThemeEditorSummary();
}

function showCreateThemeModal() {
  if (DOM.createThemeModal) DOM.createThemeModal.classList.add("show");
  updateCreateThemeSummary();
  if (DOM.createThemeName) DOM.createThemeName.focus();
}

function hideCreateThemeModal() {
  if (DOM.createThemeModal) DOM.createThemeModal.classList.remove("show");
}

function updateCreateThemeSummary() {
  const summary = DOM.createThemeSummary;
  if (!summary) return;
  if (!createThemeAssets) {
    summary.textContent = "Drop a theme folder to begin.";
    updateThemeEditorSummary();
    return;
  }
  const parts = [];
  const {
    backgrounds = [],
    overlays = [],
    templates = [],
    logos = [],
  } = createThemeAssets;
  if (backgrounds.length)
    parts.push(
      `${backgrounds.length} background${backgrounds.length === 1 ? "" : "s"}`,
    );
  if (overlays.length)
    parts.push(`${overlays.length} overlay${overlays.length === 1 ? "" : "s"}`);
  if (templates.length)
    parts.push(
      `${templates.length} template${templates.length === 1 ? "" : "s"}`,
    );
  if (logos.length)
    parts.push(`${logos.length} logo${logos.length === 1 ? "" : "s"}`);
  summary.textContent = parts.length
    ? `Assets ready: ${parts.join(", ")}`
    : "No assets detected yet.";
  updateThemeEditorSummary();
}

function handleCreateThemeDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  if (DOM.createThemeDropZone)
    DOM.createThemeDropZone.classList.add("dragover");
}

function handleCreateThemeDragLeave(event) {
  event.preventDefault();
  if (DOM.createThemeDropZone)
    DOM.createThemeDropZone.classList.remove("dragover");
}

async function handleCreateThemeDrop(event) {
  event.preventDefault();
  if (DOM.createThemeDropZone)
    DOM.createThemeDropZone.classList.remove("dragover");
  const files = await extractFilesFromDataTransfer(event.dataTransfer);
  if (files.length) {
    handleCreateThemeFiles(files);
  }
}

function handleCreateThemeFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  resetCreateThemeAssets();
  const assets = ensureCreateThemeAssets();
  files.forEach((file) => {
    const category = categorizeThemeAsset(file);
    if (!category) return;
    assets[category].push(file);
  });
  updateCreateThemeSummary();
}

function categorizeThemeAsset(file) {
  const rel = (
    file.webkitRelativePath ||
    file._relativePath ||
    file.name ||
    ""
  ).toLowerCase();
  if (rel.includes("overlay")) return "overlays";
  if (rel.includes("template")) return "templates";
  if (rel.includes("background")) return "backgrounds";
  if (rel.includes("logo")) return "logos";
  return null;
}

async function extractFilesFromDataTransfer(dataTransfer) {
  const files = [];
  if (!dataTransfer) return files;
  if (dataTransfer.items && dataTransfer.items.length) {
    const items = Array.from(dataTransfer.items).filter(
      (item) => item.kind === "file",
    );
    const nested = await Promise.all(
      items.map(async (item) => {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          return traverseFileEntry(entry).catch(() => []);
        }
        const file = item.getAsFile();
        return file ? [file] : [];
      }),
    );
    nested.forEach((list) => files.push(...list));
  } else if (dataTransfer.files && dataTransfer.files.length) {
    files.push(...Array.from(dataTransfer.files));
  }
  return files;
}

function readAllDirectoryEntries(reader) {
  return new Promise((resolve) => {
    const entries = [];
    const readEntries = () => {
      reader.readEntries(
        (batch) => {
          if (!batch.length) {
            resolve(entries);
          } else {
            entries.push(...batch);
            readEntries();
          }
        },
        () => resolve(entries),
      );
    };
    readEntries();
  });
}

async function traverseFileEntry(entry, path = "") {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) =>
      entry.file(resolve, reject),
    ).catch(() => null);
    if (!file) return [];
    file._relativePath = path + entry.name;
    return [file];
  }
  if (entry.isDirectory) {
    const entries = await readAllDirectoryEntries(entry.createReader());
    const nested = await Promise.all(
      entries.map((ent) => traverseFileEntry(ent, path + entry.name + "/")),
    );
    return nested.flat();
  }
  return [];
}

async function confirmCreateTheme() {
  const name =
    valueFromInput(DOM.createThemeName) || valueFromInput(DOM.themeName);
  const slug = slugifyThemeName(name);
  if (!slug) {
    alert("Enter a valid name for the new theme.");
    return;
  }
  if (themes[slug]) {
    alert("A theme with that name already exists.");
    return;
  }
  const assets = ensureCreateThemeAssets();
  const hasAny =
    assets.backgrounds.length +
      assets.overlays.length +
      assets.templates.length +
      assets.logos.length >
    0;
  if (!hasAny) {
    const proceed = confirm("No assets were detected. Create an empty theme?");
    if (!proceed) return;
  }
  const baseTheme = cloneThemeValue(BUILTIN_THEMES.general.themes.basic || {});
  const newTheme = mergePlainObject(baseTheme, {});
  newTheme.name = name;
  newTheme.background = "";
  newTheme.backgrounds = [];
  newTheme.overlays = [];
  newTheme.templates = [];
  newTheme.logo = "";
  newTheme.overlaysFolder = "";
  newTheme.templatesFolder = "";
  newTheme.welcome = mergePlainObject(
    baseTheme.welcome || {},
    newTheme.welcome || {},
  );
  newTheme.welcome.title = newTheme.welcome.title || name;

  const tasks = [];
  const existingGlobalLogo = getGlobalLogo();
  assets.backgrounds.forEach((file, index) => {
    tasks.push(
      uploadAsset(file, "backgrounds").then((url) => {
        if (!url) return;
        ensureArray(newTheme, "backgrounds");
        newTheme.backgrounds.push(url);
        if (!newTheme.background) newTheme.background = url;
      }),
    );
  });
  assets.overlays.forEach((file) => {
    tasks.push(
      uploadAsset(file, "overlays").then((url) => {
        if (!url) return;
        ensureArray(newTheme, "overlays");
        newTheme.overlays.push(url);
      }),
    );
  });
  assets.templates.forEach((file) => {
    tasks.push(
      uploadAsset(file, "templates").then((url) => {
        if (!url) return;
        ensureArray(newTheme, "templates");
        newTheme.templates.push({ src: url, layout: "double_column" });
      }),
    );
  });
  if (assets.logos.length) {
    const logoFile = assets.logos[0];
    tasks.push(
      uploadAsset(logoFile, "logo").then((url) => {
        if (url) newTheme.logo = url;
      }),
    );
  }

  try {
    await Promise.all(tasks);
    themes[slug] = newTheme;
    if (newTheme.logo) {
      setGlobalLogo(newTheme.logo, { quiet: true, skipSave: true });
    } else if (existingGlobalLogo) {
      newTheme.logo = existingGlobalLogo;
    }
    saveThemesToStorage();
    populateThemeSelector(slug);
    setEventSelection(slug);
    loadTheme(slug);
    if (DOM.themeName) DOM.themeName.value = newTheme.name;
    if (DOM.themeEditorModeSelect) DOM.themeEditorModeSelect.value = "edit";
    setThemeEditorMode("edit");
    hideCreateThemeModal();
    resetCreateThemeModal();
    showToast(`Theme "${name}" created`);
  } catch (err) {
    console.error("Failed to create theme", err);
    alert("Could not create theme. See console for details.");
  }
}

function handleCloneTheme() {
  if (!activeTheme) {
    alert("Select a theme to clone first.");
    return;
  }
  const name = valueFromInput(DOM.themeCloneName);
  const slug = slugifyThemeName(name);
  if (!slug) {
    alert("Enter a name for the cloned theme.");
    return;
  }
  const currentKey = DOM.eventSelect && DOM.eventSelect.value;
  const location = resolveThemeStorage(currentKey);
  const cloned = cloneThemeValue(activeTheme);
  cloned.name = name;
  cloned.welcome = mergePlainObject(
    activeTheme.welcome || {},
    cloned.welcome || {},
  );
  if (cloned.welcome) cloned.welcome.title = cloned.welcome.title || name;

  let newKey = slug;
  if (
    location.bucket &&
    location.parent &&
    typeof location.parent === "object"
  ) {
    if (!location.parent[location.bucket])
      location.parent[location.bucket] = {};
    if (location.parent[location.bucket][slug]) {
      alert("A theme with that name already exists in this category.");
      return;
    }
    location.parent[location.bucket][slug] = cloned;
    newKey = `${location.root}:${slug}`;
  } else {
    if (themes[slug]) {
      alert("A theme with that name already exists.");
      return;
    }
    themes[slug] = cloned;
  }

  saveThemesToStorage();
  populateThemeSelector(newKey);
  setEventSelection(newKey);
  loadTheme(newKey);
  if (DOM.themeCloneName) DOM.themeCloneName.value = "";
  if (DOM.themeEditorModeSelect) DOM.themeEditorModeSelect.value = "edit";
  setThemeEditorMode("edit");
  showToast(`Cloned theme as "${name}"`);
}

function applyThemeBasicsFromEditor(target) {
  target.name = valueFromInput(DOM.themeName) || target.name;
  target.accent = valueFromInput(DOM.themeAccent) || target.accent;
  target.accent2 = valueFromInput(DOM.themeAccent2) || target.accent2;
  const picker = getFontPickerSelection();
  if (picker.heading) {
    target.fontHeading = composeFontString(picker.heading);
    ensureFontLoaded(picker.heading, false);
  }
  if (picker.body) {
    target.fontBody = composeFontString(picker.body);
    ensureFontLoaded(picker.body, false);
  }
  target.font = composeFontString(
    picker.body ||
      picker.heading ||
      primaryFontFamily(target.font || "") ||
      "Comic Neue",
  );
  target.welcome = target.welcome || {};
  target.welcome.title = valueFromInput(DOM.themeWelcomeTitle);
  target.welcome.prompt = valueFromInput(DOM.themeWelcomePrompt);
  const eventSize = normalizeSizeValue(
    DOM.eventTitleSizeInput ? DOM.eventTitleSizeInput.value : "",
    normalizeSizeValue(target.eventTitleSize, DEFAULT_EVENT_TITLE_SIZE),
  );
  target.eventTitleSize = eventSize;
  if (DOM.eventTitleSizeInput)
    DOM.eventTitleSizeInput.value = formatSizeValue(eventSize);
  const welcomeSize = normalizeSizeValue(
    DOM.welcomeTitleSizeInput ? DOM.welcomeTitleSizeInput.value : "",
    normalizeSizeValue(target.welcome.titleSize, DEFAULT_WELCOME_TITLE_SIZE),
  );
  target.welcome.titleSize = welcomeSize;
  if (DOM.welcomeTitleSizeInput)
    DOM.welcomeTitleSizeInput.value = formatSizeValue(welcomeSize);
}

function normalizeFolderInput(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : trimmed + "/";
}

function readThemeFolderInputs() {
  return {
    overlays: DOM.themeOverlaysFolder
      ? normalizeFolderInput(valueFromInput(DOM.themeOverlaysFolder))
      : null,
    templates: DOM.themeTemplatesFolder
      ? normalizeFolderInput(valueFromInput(DOM.themeTemplatesFolder))
      : null,
  };
}

function applyThemeFolderSettings(target, folders) {
  if (typeof folders.overlays !== "undefined" && folders.overlays !== null) {
    if (folders.overlays) target.overlaysFolder = folders.overlays;
    else delete target.overlaysFolder;
  }
  if (typeof folders.templates !== "undefined" && folders.templates !== null) {
    if (folders.templates) target.templatesFolder = folders.templates;
    else delete target.templatesFolder;
  }
}

function ensureArray(target, prop) {
  if (!Array.isArray(target[prop])) target[prop] = [];
}

async function uploadThemeAssetsFromEditor(target) {
  const tasks = [];
  let backgroundsAdded = 0;
  let overlaysAdded = 0;
  let templatesAdded = 0;
  let logoUrl = "";

  const backgroundFile =
    DOM.themeBackground && DOM.themeBackground.files
      ? DOM.themeBackground.files[0]
      : null;
  if (backgroundFile) {
    tasks.push(
      uploadAsset(backgroundFile, "backgrounds").then((url) => {
        if (!url) return;
        if (Array.isArray(target.backgrounds)) target.backgrounds.push(url);
        else if (target.background) {
          target.backgrounds = [target.background, url];
          delete target.backgroundIndex;
        } else target.background = url;
        backgroundsAdded += 1;
      }),
    );
  }

  const logoFile =
    DOM.themeLogo && DOM.themeLogo.files ? DOM.themeLogo.files[0] : null;
  if (logoFile) {
    tasks.push(
      uploadAsset(logoFile, "logo").then((url) => {
        if (!url) return;
        target.logo = url;
        logoUrl = url;
      }),
    );
  }

  const overlayFiles =
    DOM.themeOverlays && DOM.themeOverlays.files
      ? Array.from(DOM.themeOverlays.files)
      : [];
  if (overlayFiles.length) {
    ensureArray(target, "overlays");
    overlayFiles.forEach((file) => {
      tasks.push(
        uploadAsset(file, "overlays").then((url) => {
          if (!url) return;
          target.overlays.push(url);
          overlaysAdded += 1;
        }),
      );
    });
  }

  const templateFiles =
    DOM.themeTemplates && DOM.themeTemplates.files
      ? Array.from(DOM.themeTemplates.files)
      : [];
  if (templateFiles.length) {
    ensureArray(target, "templates");
    templateFiles.forEach((file) => {
      tasks.push(
        uploadAsset(file, "templates").then((url) => {
          if (!url) return;
          target.templates.push({ src: url, layout: "double_column" });
          templatesAdded += 1;
        }),
      );
    });
  }

  await Promise.all(tasks);
  return { backgroundsAdded, overlaysAdded, templatesAdded, logoUrl };
}

function clearThemeFileInputs() {
  if (DOM.themeBackground) DOM.themeBackground.value = "";
  if (DOM.themeLogo) DOM.themeLogo.value = "";
  if (DOM.themeOverlays) DOM.themeOverlays.value = "";
  if (DOM.themeTemplates) DOM.themeTemplates.value = "";
}

function setGlobalLogo(logo, options = {}) {
  const value = typeof logo === "string" ? logo : "";
  setGlobalLogoValue(value);
  applyGlobalLogoToAllThemes(value);
  if (activeTheme) {
    applyGlobalLogoToTheme(activeTheme, value);
    renderCurrentAssets(activeTheme);
  }
  if (DOM.logo) DOM.logo.src = value || "";
  if (!options.skipSave) saveThemesToStorage();
  if (!options.quiet)
    showToast(
      value ? "Logo applied to all themes" : "Logo cleared for all themes",
    );
}

// Update only the font for the currently selected theme and persist to storage
function updateCurrentThemeFont() {
  const selection = getFontPickerSelection();
  if (!selection.heading && !selection.body) {
    alert("Choose heading and body fonts first.");
    return;
  }
  applyFontSelection(
    selection.heading || selection.body,
    selection.body || selection.heading,
    { keepPairing: true },
  );
}

// --- Remove asset handlers ---
function removeBackground() {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (!list.length) return;
  if (!Array.isArray(t.backgrounds)) t.backgrounds = list.slice();
  const idx =
    typeof t.backgroundIndex === "number"
      ? Math.min(Math.max(t.backgroundIndex, 0), t.backgrounds.length - 1)
      : 0;
  if (t.backgrounds[idx])
    pushRemoved(key, "background", t.backgrounds[idx], idx);
  t.backgrounds.splice(idx, 1);
  if (t.backgrounds.length === 0) {
    t.background = "";
    delete t.backgrounds;
    delete t.backgroundIndex;
  } else {
    t.backgroundIndex = Math.min(idx, t.backgrounds.length - 1);
    t.background = t.backgrounds[t.backgroundIndex] || "";
  }
  saveThemesToStorage();
  loadTheme(key);
  showToast("Background removed");
}
function removeBackgroundAt(index) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (index < 0 || index >= list.length) return;
  if (!Array.isArray(t.backgrounds)) t.backgrounds = list.slice();
  if (t.backgrounds[index])
    pushRemoved(key, "background", t.backgrounds[index], index);
  t.backgrounds.splice(index, 1);
  if (t.backgrounds.length === 0) {
    t.background = "";
    delete t.backgrounds;
    delete t.backgroundIndex;
  } else {
    if (typeof t.backgroundIndex !== "number") t.backgroundIndex = 0;
    if (index <= t.backgroundIndex)
      t.backgroundIndex = Math.max(0, t.backgroundIndex - 1);
    t.background = t.backgrounds[t.backgroundIndex] || "";
  }
  saveThemesToStorage();
  loadTheme(key);
}
function setBackgroundIndex(index) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (index < 0 || index >= list.length) return;
  t.backgrounds = list.slice();
  t.background = t.backgrounds[index] || "";
  t.backgroundIndex = index;
  // Refresh live booth background immediately when editing the active theme
  if (activeTheme === t) {
    applyThemeBackground(t);
    renderCurrentAssets(t);
  }
  saveThemesToStorage();
  showToast("Background selected");
}
function removeLogo() {
  const key = DOM.eventSelect && DOM.eventSelect.value;
  if (!key) {
    alert("Select a theme first.");
    return;
  }
  const currentLogo = getGlobalLogo();
  if (!currentLogo) {
    showToast("No shared logo to remove");
    return;
  }
  pushRemoved(key, "logo", currentLogo, 0);
  setGlobalLogo("", { quiet: true, skipSave: true });
  saveThemesToStorage();
  loadTheme(key);
  showToast("Logo removed from all themes");
}
function removeOverlay(index) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t || !Array.isArray(t.overlays)) return;
  const removed = t.overlays.splice(index, 1)[0];
  pushRemoved(key, "overlay", removed, index);
  saveThemesToStorage();
  loadTheme(key);
  showToast("Overlay removed");
}
function removeTemplate(index) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t || !Array.isArray(t.templates)) return;
  const removed = t.templates.splice(index, 1)[0];
  pushRemoved(key, "template", removed, index);
  saveThemesToStorage();
  loadTheme(key);
  showToast("Template removed");
}

// Hide a folder-based overlay/template by adding it to a per-theme blocklist
function removeFolderOverlay(src) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  if (!Array.isArray(t.overlaysRemoved)) t.overlaysRemoved = [];
  if (!t.overlaysRemoved.includes(src)) t.overlaysRemoved.push(src);
  pushRemoved(key, "overlay-removed", src, -1);
  saveThemesToStorage();
  loadTheme(key);
  showToast("Overlay hidden");
}
function removeFolderTemplate(src) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  if (!Array.isArray(t.templatesRemoved)) t.templatesRemoved = [];
  if (!t.templatesRemoved.includes(src)) t.templatesRemoved.push(src);
  pushRemoved(key, "template-removed", src, -1);
  saveThemesToStorage();
  loadTheme(key);
  showToast("Template hidden");
}

function reorderAssets(kind, from, to) {
  const key = DOM.eventSelect.value;
  const t = getSelectedThemeTarget();
  if (!t) return;
  const arr = kind === "overlay" ? t.overlays : t.templates;
  if (!Array.isArray(arr)) return;
  const len = arr.length;
  if (from < 0 || from >= len || to < 0 || to >= len) return;
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  saveThemesToStorage();
  loadTheme(key);
  showToast("Order updated");
}

function pushRemoved(key, kind, item, index) {
  removedStack.push({ key, kind, item, index });
  updateUndoUI();
}
function updateUndoUI() {
  const btn = document.getElementById("undoBtn");
  const count = document.getElementById("undoCount");
  if (btn) btn.disabled = removedStack.length === 0;
  if (count)
    count.textContent = removedStack.length ? `(${removedStack.length})` : "";
}
function getThemeByKey(key) {
  if (!key) return null;
  if (key.includes(":")) {
    const [rootKey, subKey] = key.split(":");
    const root = themes[rootKey];
    if (!root) return null;
    if (root.themes && root.themes[subKey]) return root.themes[subKey];
    if (root.holidays && root.holidays[subKey]) return root.holidays[subKey];
    return null;
  }
  return themes[key] || null;
}
function undoLastRemoval() {
  const last = removedStack.pop();
  if (!last) return;
  if (last.kind === "logo") {
    setGlobalLogo(last.item || "", { quiet: true, skipSave: true });
  }
  const t = getThemeByKey(last.key);
  if (!t && last.kind !== "logo") {
    updateUndoUI();
    return;
  }
  if (last.kind === "background" && t) t.background = last.item;
  else if (last.kind === "overlay") {
    if (!Array.isArray(t.overlays)) t.overlays = [];
    const pos = Math.min(last.index, t.overlays.length);
    t.overlays.splice(pos, 0, last.item);
  } else if (last.kind === "template") {
    if (!Array.isArray(t.templates)) t.templates = [];
    const pos = Math.min(last.index, t.templates.length);
    t.templates.splice(pos, 0, last.item);
  } else if (last.kind === "overlay-removed") {
    if (Array.isArray(t.overlaysRemoved))
      t.overlaysRemoved = t.overlaysRemoved.filter((s) => s !== last.item);
  } else if (last.kind === "template-removed") {
    if (Array.isArray(t.templatesRemoved))
      t.templatesRemoved = t.templatesRemoved.filter((s) => s !== last.item);
  }
  saveThemesToStorage();
  if (DOM.eventSelect && DOM.eventSelect.value === last.key) {
    loadTheme(last.key);
  }
  updateUndoUI();
  showToast("Restored");
}

function getBackgroundList(theme) {
  if (!theme || typeof theme !== "object") return [];
  const explicit = Array.isArray(theme.backgrounds)
    ? theme.backgrounds.filter(Boolean)
    : [];
  const folder = Array.isArray(theme.backgroundsTmp)
    ? theme.backgroundsTmp.filter(Boolean)
    : [];
  if (explicit.length || folder.length) {
    const seen = new Set();
    const combined = [];
    for (const src of [...folder, ...explicit]) {
      const key = (src || "").toString();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      combined.push(src);
    }
    return combined;
  }
  const single =
    typeof theme.background === "string" && theme.background.trim()
      ? [theme.background]
      : [];
  return single;
}

function getActiveBackground(theme) {
  const list = getBackgroundList(theme);
  if (list.length === 0) return "";
  const idx =
    typeof theme.backgroundIndex === "number"
      ? Math.min(Math.max(theme.backgroundIndex, 0), list.length - 1)
      : 0;
  return list[idx];
}

function ensureFolderPath(path) {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : trimmed + "/";
}

function resolveBackgroundFolderPath(theme) {
  if (!theme || typeof theme !== "object") return "";
  const current = getActiveBackground(theme) || "";
  if (current && current.endsWith("/")) return ensureFolderPath(current);
  if (current) {
    const idx = current.lastIndexOf("/");
    if (idx >= 0) return ensureFolderPath(current.slice(0, idx + 1));
  }
  const backgroundProp =
    typeof theme.background === "string" ? theme.background.trim() : "";
  if (backgroundProp) {
    if (backgroundProp.endsWith("/")) return ensureFolderPath(backgroundProp);
    const idx = backgroundProp.lastIndexOf("/");
    if (idx >= 0) return ensureFolderPath(backgroundProp.slice(0, idx + 1));
  }
  const folderProp =
    typeof theme.backgroundFolder === "string"
      ? theme.backgroundFolder.trim()
      : "";
  if (folderProp) return ensureFolderPath(folderProp);
  return "";
}

// If a theme points its background at a folder (ends with '/'),
// pick the first existing image named one of: background.(png|jpg|jpeg|webp) or bg.(...)
async function resolveBackgroundFromFolder(theme) {
  try {
    const path = resolveBackgroundFolderPath(theme);
    if (!path || !path.endsWith("/")) return "";
    const cached = Array.isArray(theme && theme.backgroundsTmp)
      ? theme.backgroundsTmp.filter(Boolean)
      : [];
    if (cached.length) return cached[0];
    const manifestList = await resolveBackgroundListFromFolder(theme);
    if (Array.isArray(manifestList) && manifestList.length) {
      if (theme && typeof theme === "object")
        theme.backgroundsTmp = manifestList.slice();
      return manifestList[0];
    }
    const names = ["background", "bg", "backdrop", "wallpaper"];
    const exts = ["png", "jpg", "jpeg", "webp"];
    const isFileProto = String(location.protocol).startsWith("file");
    for (const n of names) {
      for (const e of exts) {
        const url = path + n + "." + e;
        try {
          if (isFileProto) {
            // Probe with Image() under file:// since fetch may be blocked
            await probeImage(url);
            return url;
          } else {
            const resp = await fetch(url, { cache: "reload" });
            if (resp && resp.ok) return url;
          }
        } catch (_) {
          /* try next */
        }
      }
    }
    return "";
  } catch (_) {
    return "";
  }
}

// Try to load a list of backgrounds from a folder via backgrounds.json.
// backgrounds.json format: ["file1.jpg", "file2.png", ...] or [{"src":"file1.jpg"}, ...]
async function resolveBackgroundListFromFolder(theme) {
  try {
    const path = resolveBackgroundFolderPath(theme);
    if (!path || !path.endsWith("/")) return [];
    const cached = Array.isArray(theme && theme.backgroundsTmp)
      ? theme.backgroundsTmp.filter(Boolean)
      : [];
    if (cached.length) return cached.slice();
    // Only try fetching manifest under http(s). Browsers restrict file:// fetch.
    if (!String(location.protocol).startsWith("http")) return [];
    const manifestUrl = path + "backgrounds.json";
    const resp = await fetch(manifestUrl, { cache: "reload" });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === "string") out.push(path + it);
        else if (it && typeof it === "object" && typeof it.src === "string")
          out.push(path + it.src);
      }
    }
    if (theme && typeof theme === "object") theme.backgroundsTmp = out.slice();
    return out;
  } catch (_) {
    return [];
  }
}

function probeImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => reject(new Error("not-found"));
    img.src = url + (url.includes("?") ? "&" : "?") + "v=" + Date.now();
  });
}

// Load overlays from a folder using overlays.json manifest (HTTP/HTTPS only)
async function resolveOverlaysFromFolder(theme) {
  try {
    const folder =
      theme && typeof theme.overlaysFolder === "string"
        ? theme.overlaysFolder
        : "";
    if (!folder || !folder.endsWith("/")) return [];
    if (!String(location.protocol).startsWith("http")) return [];
    const url = folder + "overlays.json";
    const resp = await fetch(url, { cache: "reload" });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === "string") out.push(folder + it);
        else if (it && typeof it === "object" && typeof it.src === "string")
          out.push(folder + it.src);
      }
    }
    return out;
  } catch (_) {
    return [];
  }
}

// Load templates from a folder using templates.json manifest (HTTP/HTTPS only)
async function resolveTemplatesFromFolder(theme) {
  try {
    const folder =
      theme && typeof theme.templatesFolder === "string"
        ? theme.templatesFolder
        : "";
    if (!folder || !folder.endsWith("/")) return [];
    if (!String(location.protocol).startsWith("http")) return [];
    const url = folder + "templates.json";
    const resp = await fetch(url, { cache: "reload" });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === "string")
          out.push({ src: folder + it, layout: "double_column" });
        else if (it && typeof it === "object" && typeof it.src === "string")
          out.push({
            src: folder + it.src,
            layout: it.layout || "double_column",
            slots: it.slots,
          });
      }
    }
    return out;
  } catch (_) {
    return [];
  }
}

function exportThemes() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(themes));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "photobooth-themes.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importThemes() {
  DOM.importFile.click();
}

function handleImport() {
  const file = DOM.importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedThemes = JSON.parse(event.target.result);
      setThemes({ ...themes, ...importedThemes });
      saveThemesToStorage();
      const current = DOM.eventSelect && DOM.eventSelect.value;
      populateThemeSelector(current || DEFAULT_THEME_KEY);
      alert("Themes imported successfully!");
    } catch (e) {
      alert("Error importing themes: " + e.message);
    }
  };
  reader.readAsText(file);
}

// --- Deploy Hook (Git-connected projects) ---
function loadDeploySettings() {
  if (DOM.deployHookUrl)
    DOM.deployHookUrl.value = localStorage.getItem("deployHookUrl") || "";
}

// --- Rebuild manifests helper (local)
function rebuildManifestsUI() {
  const cmd = "npm run update-manifests";
  try {
    navigator.clipboard.writeText(cmd);
  } catch (_) {}
  alert(
    "To rebuild overlays/templates/backgrounds manifests, run:\n\n" +
      cmd +
      "\n\nThen deploy: npm run deploy or use Deploy Now (Git hooks).",
  );
}
function saveDeploySettings() {
  if (DOM.deployHookUrl)
    localStorage.setItem(
      "deployHookUrl",
      (DOM.deployHookUrl.value || "").trim(),
    );
  showToast("Deploy hook saved");
}
async function triggerDeployHook() {
  try {
    const url =
      ((DOM.deployHookUrl && DOM.deployHookUrl.value) || "").trim() ||
      localStorage.getItem("deployHookUrl") ||
      "";
    if (!url) {
      alert("Set Deploy Hook URL first.");
      return;
    }
    const r = await fetch(url, { method: "POST" });
    if (r.ok) showToast("Deploy triggered");
    else showToast("Deploy failed: " + r.status);
  } catch (e) {
    showToast("Deploy error: " + (e && e.message ? e.message : e));
  }
}

function copyText(s) {
  try {
    navigator.clipboard.writeText(s);
    showToast("Copied");
  } catch (_) {
    alert("Copy: " + s);
  }
}
function copyBuildCmd() {
  copyText("npm ci && node tools/update-manifests.js && echo skip");
}
function copyShipCmd() {
  copyText("npm run ship");
}

// Helpers to derive overlay/template lists from theme + folder manifests
function getOverlayList(theme) {
  if (!theme || typeof theme !== "object") return [];
  const removed = new Set(
    Array.isArray(theme.overlaysRemoved) ? theme.overlaysRemoved : [],
  );
  const folderArr = Array.isArray(theme.overlaysTmp)
    ? theme.overlaysTmp
        .filter((u) => !removed.has(u))
        .map((u) => ({ src: u, __folder: true }))
    : [];
  const localArr = Array.isArray(theme.overlays)
    ? theme.overlays.map((u) => (typeof u === "string" ? { src: u } : u))
    : [];
  const seen = new Set();
  const out = [];
  for (const o of [...folderArr, ...localArr]) {
    const k = (o && o.src ? o.src : "").toString().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(o);
  }
  return out;
}

function getTemplateList(theme) {
  if (!theme || typeof theme !== "object") return [];
  const removed = new Set(
    Array.isArray(theme.templatesRemoved) ? theme.templatesRemoved : [],
  );
  const folderArr = Array.isArray(theme.templatesTmp)
    ? theme.templatesTmp
        .filter((t) => t && t.src && !removed.has(t.src))
        .map((t) => ({
          src: t.src,
          layout: t.layout || "double_column",
          slots: t.slots,
          __folder: true,
        }))
    : [];
  const localArr = Array.isArray(theme.templates)
    ? theme.templates.map((t) => ({
        src: t.src,
        layout: t.layout || "double_column",
        slots: t.slots,
      }))
    : [];
  const seen = new Set();
  const out = [];
  for (const t of [...folderArr, ...localArr]) {
    const k = (t && t.src ? t.src : "").toString().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

// --- PWA Install Button ---
function setupInstallPrompt() {
  let deferredPrompt = null;
  const btn = DOM.installBtn;
  if (btn) btn.classList.add("hidden");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove("hidden");
  });
  if (btn)
    btn.onclick = async () => {
      if (!deferredPrompt) {
        // iOS Safari has no beforeinstallprompt; show a hint
        alert("On iPhone/iPad: tap Share → Add to Home Screen");
        return;
      }
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch (_) {}
      deferredPrompt = null;
      btn.classList.add("hidden");
    };
}

Object.assign(window, {
  addFontByFamily,
  addFontByUrl,
  appendEmailText,
  cancelHideTimer,
  capturePhotoFlow,
  clearAnalytics,
  closeConfirm,
  confirmTemplate,
  copyBuildCmd,
  copyShareLink,
  copyShipCmd,
  downloadShareImage,
  exitFinalPreview,
  exportCurrentEvent,
  exportThemes,
  goAdmin,
  startBooth: startBoothFromAdmin,
  startCamera: startCameraFlow,
  importThemes,
  handleImport,
  makeAvailableOffline,
  openShareLink,
  rebuildManifestsUI,
  retakePhoto,
  saveCloudinarySettings,
  saveDeploySettings,
  saveEmailJsSettings,
  saveTheme,
  sendEmail,
  sendPendingNow,
  sendTestEmail,
  setMode,
  syncNow,
  toggleAnalytics,
  triggerDeployHook,
  undoLastRemoval,
  updateCurrentThemeFont,
  updateSelectedTheme,
});
