if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reg;
      try {
        reg = await navigator.serviceWorker.register('/sw.js');
      } catch (_e) {
        // Likely served under a subpath (e.g., VS Code Live Server). Try relative path.
        reg = await navigator.serviceWorker.register('./sw.js');
      }
      // Nudge the SW to check for updates on load
      try { await reg.update(); } catch (_) { }
      console.log('SW registered:', reg && reg.scope);
    } catch (registrationError) {
      console.warn('SW registration failed:', registrationError);
    }
  });
}

let themes = {
  general: {
    name: "🎉 General",
    themes: {
      basic: {
        name: "✨ Basic",
        accent: "#3f51b5",
        accent2: "#ffffff",
        font: "'Comic Neue', cursive",
        background: "assets/general/basic/backgrounds/",
        backgroundFolder: "assets/general/basic/backgrounds/",
        logo: "",
        overlaysFolder: "assets/general/basic/overlays/",
        templatesFolder: "assets/general/basic/templates/",
        welcome: {
          title: "Welcome!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      },
      birthday: {
        name: "🎂 Birthday",
        accent: "pink",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/general/birthday/backgrounds/",
        backgroundFolder: "assets/general/birthday/backgrounds/",
        backgrounds: ["assets/general/birthday/backgrounds/birthday-background-1.png"],
        logo: "",
        overlaysFolder: "assets/general/birthday/overlays/",
        templatesFolder: "assets/general/birthday/templates/",
        welcome: {
          title: "Happy Birthday!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  school: {
    name: "🏫 School",
    themes: {
      hawks: {
        name: "🦅 Hawks",
        accent: "#041E42",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "",
        logo: "",
        overlaysFolder: "assets/Hawks/overlays/",
        templatesFolder: "assets/Hawks/templates/",
        welcome: {
          title: "Go Hawks!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      },
      ane: {
        name: "🏫 ANE",
        accent: "#041E42",
        accent2: "#FFB81C",
        font: "'Comic Neue', cursive",
        backgroundFolder: "assets/school/ANE/backgrounds/",
        logo: "",
        overlaysFolder: "assets/school/ANE/overlays",
        templatesFolder: "assets/school/ANE/templates",
        welcome: {
          title: "ANE",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  fall: {
    name: "🍂 Fall",
    holidays: {
      halloween: {
        name: "🎃 Halloween",
        accent: "orange",
        accent2: "white",
        font: "'Creepster', cursive",
        // Use folder-based background auto-detect (any background.* in this folder)
        backgroundFolder: "assets/holidays/fall/halloween/backgrounds/",
        overlaysFolder: "assets/holidays/fall/halloween/overlays/",
        logo: "",
        templatesFolder: "assets/holidays/fall/halloween/templates/",
        welcome: {
          title: "Happy Halloween!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  winter: {
    name: "❄️ Winter",
    holidays: {
      christmas: {
        name: "🎄 Christmas",
        accent: "#c41e3a",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/holidays/winter/christmas/backgrounds/",
        logo: "",
        overlaysFolder: "assets/holidays/winter/christmas/overlays/",
        templatesFolder: "assets/holidays/winter/christmas/templates/",
        welcome: {
          title: "Merry Christmas!",
          portrait: "assets/holidays/winter/christmas/welcome/welcome-portrait.jpg",
          landscape: "assets/holidays/winter/christmas/welcome/welcome-landscape.jpg",
          prompt: "Touch to start the fun!"
        }
      },
      newyear: {
        name: "🎉 New Year",
        accent: "#FFD700",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/holidays/winter/newyear/backgrounds/fireworks-background.jpg",
        logo: "assets/holidays/winter/newyear/logo/newyear-logo.png",
        overlays: ["assets/holidays/winter/newyear/overlays/newyear-frame-1.png"],
        templates: [{ src: "assets/holidays/winter/newyear/templates/photostrip-1.png", layout: "double_column" }],
        welcome: {
          title: "Happy New Year!",
          portrait: "assets/holidays/winter/newyear/welcome/welcome-portrait.jpg",
          landscape: "assets/holidays/winter/newyear/welcome/welcome-landscape.jpg",
          prompt: "Start the countdown!"
        }
      },
      valentines: {
        name: "💕 Valentine's Day",
        accent: "#ff5e91",
        accent2: "white",
        font: "'Comic Neue', cursive",
        backgroundFolder: "assets/holidays/winter/Valentines/backgrounds/",
        templatesFolder: "assets/holidays/winter/Valentines/templates/",
        welcome: {
          title: "Happy Valentine's Day!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  }
};

themes.spring = {
  name: "🌸 Spring",
  holidays: {
    stpatricksday: {
      name: "🍀 St. Patrick's Day",
      accent: "#0f6d2f",
      accent2: "white",
      font: "'Comic Neue', cursive",
      backgroundFolder: "assets/holidays/spring/st.patricksday/backgrounds/",
      overlaysFolder: "assets/holidays/spring/st.patricksday/overlays/",
      templatesFolder: "assets/holidays/spring/st.patricksday/templates/",
      welcome: {
        title: "Happy St. Patrick's Day!",
        portrait: "",
        landscape: "",
        prompt: "Touch to start"
      }
    }
  }
};

const BUILTIN_THEMES = JSON.parse(JSON.stringify(themes));
const DEFAULT_THEME_KEY = 'general:basic';
const BUILTIN_THEME_LOCATIONS = (() => {
  const map = {};
  for (const rootKey of Object.keys(BUILTIN_THEMES)) {
    const group = BUILTIN_THEMES[rootKey];
    if (!group || typeof group !== 'object') continue;
    for (const bucket of ['themes', 'holidays']) {
      const sub = group[bucket];
      if (!sub || typeof sub !== 'object') continue;
      for (const subKey of Object.keys(sub)) {
        map[subKey] = { root: rootKey, bucket };
      }
    }
  }
  return map;
})();

// --- DOM Element Cache ---
const DOM = {
  adminScreen: document.getElementById('adminScreen'),
  boothScreen: document.getElementById('boothScreen'),
  boothHeader: document.getElementById('boothHeader'),
  boothControls: document.getElementById('controls'),
  eventSelect: document.getElementById('eventSelect'),
  allowRetakes: document.getElementById('allowRetakes'),
  analyticsData: document.getElementById('analyticsData'),
  logo: document.getElementById('logo'),
  eventTitle: document.getElementById('eventTitle'),
  options: document.getElementById('options'),
  videoWrap: document.getElementById('videoWrap'),
  videoContainer: document.getElementById('videoContainer'),
  video: document.getElementById('video'),
  liveOverlay: document.getElementById('liveOverlay'),
  captureBtn: document.getElementById('captureBtn'),
  countdownOverlay: document.getElementById('countdownOverlay'),
  flashOverlay: document.getElementById('flashOverlay'),
  finalPreview: document.getElementById('finalPreview'),
  finalPreviewContent: document.getElementById('finalPreviewContent'),
  finalStrip: document.getElementById('finalStrip'),
  qrCodeContainer: document.getElementById('qrCodeContainer'),
  qrCode: document.getElementById('qrCode'),
  qrHint: document.getElementById('qrHint'),
  shareStatus: document.getElementById('shareStatus'),
  shareLinkRow: document.getElementById('shareLinkRow'),
  shareLink: document.getElementById('shareLink'),
  emailInput: document.getElementById('emailInput'),
  sendBtn: document.getElementById('sendBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  closePreviewBtn: document.getElementById('closePreviewBtn'),
  confirmModal: document.getElementById('confirmModal'),
  confirmPreview: document.getElementById('confirmPreview'),
  gallery: document.getElementById('gallery'),
  toast: document.getElementById('toast'),
  welcomeScreen: document.getElementById('welcomeScreen'),
  welcomeImg: document.getElementById('welcomeImg'),
  welcomeTitle: document.getElementById('welcomeTitle'),
  startButton: document.getElementById('startButton'),
  analytics: document.getElementById('analytics'),
  themeEditor: document.getElementById('themeEditor'),
  themeEditorActive: document.getElementById('themeEditorActive'),
  themeEditorEditing: document.getElementById('themeEditorEditing'),
  themeName: document.getElementById('themeName'),
  eventNameInput: document.getElementById('eventNameInput'),
  cloudNameInput: document.getElementById('cloudNameInput'),
  cloudPresetInput: document.getElementById('cloudPresetInput'),
  cloudFolderInput: document.getElementById('cloudFolderInput'),
  cloudUseToggle: document.getElementById('cloudUseToggle'),
  emailJsPublic: document.getElementById('emailJsPublic'),
  emailJsService: document.getElementById('emailJsService'),
  emailJsTemplate: document.getElementById('emailJsTemplate'),
  syncNowBtn: document.getElementById('syncNowBtn'),
  syncStatus: document.getElementById('syncStatus'),
  useCloudflareUploads: document.getElementById('useCloudflareUploads'),
  offlineModeToggle: document.getElementById('offlineModeToggle'),
  sendPendingBtn: document.getElementById('sendPendingBtn'),
  cacheAssetsBtn: document.getElementById('cacheAssetsBtn'),
  forceCameraFileToggle: document.getElementById('forceCameraFileToggle'),
  themeFontSelect: document.getElementById('themeFontSelect'),
  themeEditorSelect: document.getElementById('themeEditorSelect'),
  addFontFamily: document.getElementById('addFontFamily'),
  addFontUrl: document.getElementById('addFontUrl'),
  currentFonts: document.getElementById('currentFonts'),
  themeAccent: document.getElementById('themeAccent'),
  themeAccent2: document.getElementById('themeAccent2'),
  themeBackground: document.getElementById('themeBackground'),
  themeLogo: document.getElementById('themeLogo'),
  themeOverlays: document.getElementById('themeOverlays'),
  themeOverlaysFolderPicker: document.getElementById('themeOverlaysFolderPicker'),
  themeOverlaysFolder: document.getElementById('themeOverlaysFolder'),
  themeTemplates: document.getElementById('themeTemplates'),
  themeTemplatesFolderPicker: document.getElementById('themeTemplatesFolderPicker'),
  themeTemplatesFolder: document.getElementById('themeTemplatesFolder'),
  themeWelcomeTitle: document.getElementById('themeWelcomeTitle'),
  themeWelcomePrompt: document.getElementById('themeWelcomePrompt'),
  summaryBackground: document.getElementById('summaryBackground'),
  summaryLogo: document.getElementById('summaryLogo'),
  summaryOverlays: document.getElementById('summaryOverlays'),
  summaryTemplates: document.getElementById('summaryTemplates'),
  currentBackgrounds: document.getElementById('currentBackgrounds'),
  currentLogo: document.getElementById('currentLogo'),
  currentFont: document.getElementById('currentFont'),
  currentAccents: document.getElementById('currentAccents'),
  currentOverlays: document.getElementById('currentOverlays'),
  currentTemplates: document.getElementById('currentTemplates'),
  themeModeEdit: document.getElementById('themeModeEdit'),
  themeModeCreate: document.getElementById('themeModeCreate'),
  btnUpdateTheme: document.getElementById('btnUpdateTheme'),
  btnSaveTheme: document.getElementById('btnSaveTheme'),
  importFile: document.getElementById('importFile'),
  importZip: document.getElementById('importZip'),
  deployHookUrl: document.getElementById('deployHookUrl'),
  installBtn: document.getElementById('installBtn'),
};

function setBoothControlsVisible(show) {
  const hidden = !show;
  if (DOM.options) DOM.options.classList.toggle('hidden', hidden);
  if (DOM.boothHeader) DOM.boothHeader.classList.toggle('hidden', hidden);
  if (DOM.boothControls) DOM.boothControls.classList.toggle('hidden', hidden);
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
// Cache-busting stamp for this session to avoid stale images during editing
const SESSION_BUST = Date.now();
const config = {
  defaultTheme: {
    name: "Basic",
    accent: "#d4f2d9",
    accent2: "#ffffff",
    welcomeTitle: "Welcome to Basic Booth",
    welcomePrompt: "Touch to start"
  },
  paths: {
    assets: "./assets",
    overlays: "./assets/overlays",
    templates: "./assets/templates",
    backgrounds: "./assets/backgrounds"
  }
};
function withBust(src) { try { if (!src) return src; return src + (src.includes('?') ? '&' : '?') + 'v=' + SESSION_BUST; } catch (_) { return src; } }

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

function init() {
  if (DOM.eventSelect) {
    DOM.eventSelect.addEventListener('change', (e) => {
      loadTheme(e.target.value);
      if (DOM.themeModeEdit && DOM.themeModeEdit.checked) syncThemeEditorWithActiveTheme();
      if (DOM.eventNameInput) {
        DOM.eventNameInput.value = getStoredEventName(e.target.value) || '';
      }
      updateThemeEditorSummary();
    });
  } else {
    console.warn('Event select dropdown not found; themes will not switch.');
  }

  const startCameraBtn = document.getElementById('startCameraButton');
  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
  } else {
    console.warn('Start Camera button not found in DOM.');
  }

  const startBoothBtn = document.getElementById('startBoothButton');
  if (startBoothBtn) {
    startBoothBtn.addEventListener('click', startBooth);
  } else {
    console.warn('Start Booth button not found in DOM.');
  }
  if (DOM.video) {
    DOM.video.addEventListener('loadedmetadata', updateCaptureAspect);
  }
  if (DOM.finalPreview && DOM.finalPreviewContent) {
    DOM.finalPreview.addEventListener('click', (e) => {
      if (!DOM.finalPreviewContent.contains(e.target)) {
        exitFinalPreview();
      }
    });
    DOM.finalPreviewContent.addEventListener('click', (e) => e.stopPropagation());
  }
  if (DOM.themeModeEdit) DOM.themeModeEdit.addEventListener('change', () => setThemeEditorMode('edit'));
  if (DOM.themeModeCreate) DOM.themeModeCreate.addEventListener('change', () => setThemeEditorMode('create'));
  if (DOM.themeEditorSelect) DOM.themeEditorSelect.addEventListener('change', (e) => {
    // Mirror selection to the main event dropdown
    if (DOM.eventSelect) DOM.eventSelect.value = e.target.value;
    loadTheme(e.target.value);
    updateThemeEditorSummary();
  });
  if (DOM.themeName) DOM.themeName.addEventListener('input', updateThemeEditorSummary);
  // Offline mode toggle
  if (DOM.offlineModeToggle) {
    DOM.offlineModeToggle.checked = getOfflinePref();
    DOM.offlineModeToggle.addEventListener('change', () => {
      setOfflinePref(DOM.offlineModeToggle.checked);
      updatePendingUI();
      showToast(DOM.offlineModeToggle.checked ? 'Offline mode ON' : 'Offline mode OFF');
    });
  }
  // Force camera on file://
  if (DOM.forceCameraFileToggle) {
    DOM.forceCameraFileToggle.checked = (localStorage.getItem('forceCameraOnFile') === 'true');
    DOM.forceCameraFileToggle.addEventListener('change', () => {
      localStorage.setItem('forceCameraOnFile', DOM.forceCameraFileToggle.checked ? 'true' : 'false');
    });
  }
  // Update pending UI on network changes
  window.addEventListener('online', () => { updatePendingUI(); });
  window.addEventListener('offline', () => { updatePendingUI(); });
  if (DOM.themeOverlaysFolderPicker) DOM.themeOverlaysFolderPicker.addEventListener('change', handleOverlayFolderPick);
  if (DOM.themeTemplatesFolderPicker) DOM.themeTemplatesFolderPicker.addEventListener('change', handleTemplateFolderPick);
  // Load Cloudinary settings into the UI
  loadCloudinarySettings();
  if (DOM.eventNameInput) {
    DOM.eventNameInput.addEventListener('input', () => {
      const key = DOM.eventSelect && DOM.eventSelect.value;
      if (!key) return;
      saveStoredEventName(key, DOM.eventNameInput.value.trim());
      if (DOM.eventTitle) DOM.eventTitle.textContent = DOM.eventNameInput.value.trim() || (activeTheme && activeTheme.welcome && activeTheme.welcome.title) || DOM.eventTitle.textContent;
    });
  }
  // Default to Edit mode on load
  setThemeEditorMode('edit');
  // EmailJS
  loadEmailJsSettings();
  // Pending badge
  updatePendingUI();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded event fired.");
  loadThemesFromStorage();
  loadFontsFromStorage();
  loadDeploySettings();
  const initialKey = populateThemeSelector(DEFAULT_THEME_KEY);
  if (initialKey) {
    loadTheme(initialKey);
  }
  goAdmin(); // Start on admin screen
  ['click', 'mousemove', 'keydown', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer));
  resetIdleTimer();
  init();
  setupInstallPrompt();
  ensureRemoteSeed();
  updateThemeEditorSummary();
});

// --- Remote sync (Cloudflare Pages Functions) ---
function canSyncRemote() { return typeof location !== 'undefined' && location.protocol.startsWith('http'); }
async function loadThemesRemote() {
  if (!canSyncRemote()) return;
  try {
    const resp = await fetch('/api/themes', { cache: 'no-store' });
    if (!resp.ok) return;
    const remote = await resp.json();
    const hasKeys = remote && typeof remote === 'object' && Object.keys(remote).length > 0;
    if (!hasKeys) {
      // Do not clobber built-in themes with an empty server payload
      updateSyncStatus('Using built-in themes');
      return;
    }
    // Merge server themes over built-ins/local
    mergeStoredThemes(themes, remote);
    fixBuiltinThemePlacements(themes);
    ensureBuiltinThemes();
    if (!hasCoreBuiltins(themes)) {
      resetThemesToBuiltins('remote themes missing core entries');
    }
    try { normalizeAllThemes(); } catch (_e) { }
    localStorage.setItem('photoboothThemes', JSON.stringify(themes));
    // Refresh UI if already initialized
    const selected = populateThemeSelector(DEFAULT_THEME_KEY);
    if (selected) {
      loadTheme(selected);
    }
    updateSyncStatus('Synced from server');
  } catch (_) { }
}
async function syncThemesRemote() {
  if (!canSyncRemote()) return;
  try {
    await fetch('/api/themes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(themes) });
  } catch (_) { }
}
function mergeFonts(a, b) {
  const out = []; const seen = new Set();
  [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].forEach(f => {
    try { const k = JSON.stringify(f); if (!seen.has(k)) { seen.add(k); out.push(f); } } catch (_) { }
  });
  return out;
}
async function loadFontsRemote() {
  if (!canSyncRemote()) return [];
  try { const r = await fetch('/api/fonts', { cache: 'no-store' }); if (!r.ok) return []; return await r.json(); } catch (_) { return []; }
}
async function syncFontsRemote(fonts) {
  if (!canSyncRemote()) return;
  try { await fetch('/api/fonts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fonts || []) }); } catch (_) { }
}

// --- Manual sync UI ---
function updateSyncStatus(text) { if (DOM.syncStatus) DOM.syncStatus.textContent = text || ''; }
async function syncNow() {
  if (!canSyncRemote()) { alert('Open over HTTPS to sync'); return; }
  try {
    updateSyncStatus('Syncing…');
    // Push current local themes and fonts
    await syncThemesRemote();
    await syncFontsRemote(getStoredFonts());
    // Reload from server to confirm and merge
    await loadThemesRemote();
    const remoteFonts = await loadFontsRemote();
    if (Array.isArray(remoteFonts) && remoteFonts.length) {
      const merged = mergeFonts(getStoredFonts(), remoteFonts);
      localStorage.setItem('photoboothFonts', JSON.stringify(merged));
    }
    updateSyncStatus('Synced ✓');
    showToast('Sync complete');
  } catch (e) {
    console.error('Sync failed', e);
    updateSyncStatus('Sync failed');
    alert('Sync failed. Check network and Cloudflare bindings.');
  }
}

// --- One-time remote seeding ---
async function ensureRemoteSeed() {
  if (!canSyncRemote()) return;
  try {
    if (localStorage.getItem('kvSeeded') === 'true') return;
    const [tRes, fRes] = await Promise.all([
      fetch('/api/themes', { cache: 'no-store' }),
      fetch('/api/fonts', { cache: 'no-store' })
    ]);
    let needSeed = false;
    if (tRes.ok) {
      const t = await tRes.text();
      if (!t || t.trim() === '' || t.trim() === '{}') needSeed = true;
    }
    if (fRes.ok) {
      const f = await fRes.text();
      if (!f || f.trim() === '' || f.trim() === '[]') needSeed = true;
    }
    if (needSeed) {
      await syncThemesRemote();
      await syncFontsRemote(getStoredFonts());
      localStorage.setItem('kvSeeded', 'true');
      updateSyncStatus('Seeded to server');
    }
  } catch (_) { }
}

// --- EmailJS Configuration ---
// Defaults (can be overridden via Admin > Email (EmailJS))
const EMAILJS_SERVICE_ID_DEFAULT = 'service_wf13ozc';
const EMAILJS_TEMPLATE_ID_DEFAULT = 'template_yankxhd';
const EMAILJS_PUBLIC_KEY_DEFAULT = 'pzgt5QUA4x12IOITx';

function getEmailJsConfig() {
  const service = localStorage.getItem('emailJsService') || EMAILJS_SERVICE_ID_DEFAULT;
  const template = localStorage.getItem('emailJsTemplate') || EMAILJS_TEMPLATE_ID_DEFAULT;
  const pub = localStorage.getItem('emailJsPublic') || EMAILJS_PUBLIC_KEY_DEFAULT;
  return { service, template, pub };
}
function loadEmailJsSettings() {
  const cfg = getEmailJsConfig();
  if (DOM.emailJsPublic) DOM.emailJsPublic.value = localStorage.getItem('emailJsPublic') || '';
  if (DOM.emailJsService) DOM.emailJsService.value = localStorage.getItem('emailJsService') || '';
  if (DOM.emailJsTemplate) DOM.emailJsTemplate.value = localStorage.getItem('emailJsTemplate') || '';
  try { emailjs.init({ publicKey: cfg.pub }); } catch (_e) { try { emailjs.init(cfg.pub); } catch (__e) { } }
}
function saveEmailJsSettings() {
  if (DOM.emailJsPublic) localStorage.setItem('emailJsPublic', (DOM.emailJsPublic.value || '').trim());
  if (DOM.emailJsService) localStorage.setItem('emailJsService', (DOM.emailJsService.value || '').trim());
  if (DOM.emailJsTemplate) localStorage.setItem('emailJsTemplate', (DOM.emailJsTemplate.value || '').trim());
  loadEmailJsSettings();
  showToast('Email settings saved');
}
async function sendTestEmail() {
  const cfg = getEmailJsConfig();
  const to = prompt('Send test to (email):');
  if (!to) return;
  const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAtEB6m3W1NoAAAAASUVORK5CYII=';
  const params = { to_email: to, photo_url: tiny, link_url: '', image_data_url: tiny };
  try {
    await emailjs.send(cfg.service, cfg.template, params);
    alert('Test email sent');
  } catch (e) {
    const details = e && (e.text || e.message || e.status || JSON.stringify(e));
    console.error('EmailJS test failed', e);
    alert('Test failed: ' + (details || 'unknown error'));
  }
}

// --- Cloudinary Settings (UI + storage) ---
// Defaults (optional):
const CLOUDINARY_CLOUD_NAME = '';
const CLOUDINARY_UPLOAD_PRESET = '';
const CLOUDINARY_FOLDER_BASE_DEFAULT = 'photobooth/events';

function loadCloudinarySettings() {
  const cloud = localStorage.getItem('cloudinaryCloudName') || CLOUDINARY_CLOUD_NAME;
  const preset = localStorage.getItem('cloudinaryUploadPreset') || CLOUDINARY_UPLOAD_PRESET;
  const folderBase = localStorage.getItem('cloudinaryFolderBase') || CLOUDINARY_FOLDER_BASE_DEFAULT;
  const use = (localStorage.getItem('cloudinaryUse') || '').toString() !== 'false' && Boolean(cloud && preset);
  if (DOM.cloudNameInput) DOM.cloudNameInput.value = cloud || '';
  if (DOM.cloudPresetInput) DOM.cloudPresetInput.value = preset || '';
  if (DOM.cloudFolderInput) DOM.cloudFolderInput.value = folderBase || '';
  if (DOM.cloudUseToggle) DOM.cloudUseToggle.checked = use;
}
function saveCloudinarySettings() {
  const cloud = (DOM.cloudNameInput && DOM.cloudNameInput.value.trim()) || '';
  const preset = (DOM.cloudPresetInput && DOM.cloudPresetInput.value.trim()) || '';
  const folderBase = (DOM.cloudFolderInput && DOM.cloudFolderInput.value.trim()) || '';
  const use = DOM.cloudUseToggle && DOM.cloudUseToggle.checked;
  if (cloud) localStorage.setItem('cloudinaryCloudName', cloud); else localStorage.removeItem('cloudinaryCloudName');
  if (preset) localStorage.setItem('cloudinaryUploadPreset', preset); else localStorage.removeItem('cloudinaryUploadPreset');
  if (folderBase) localStorage.setItem('cloudinaryFolderBase', folderBase); else localStorage.removeItem('cloudinaryFolderBase');
  localStorage.setItem('cloudinaryUse', use ? 'true' : 'false');
  showToast('Cloudinary settings saved');
}
function getCloudinaryConfig() {
  const cloud = localStorage.getItem('cloudinaryCloudName') || CLOUDINARY_CLOUD_NAME;
  const preset = localStorage.getItem('cloudinaryUploadPreset') || CLOUDINARY_UPLOAD_PRESET;
  const folderBase = localStorage.getItem('cloudinaryFolderBase') || CLOUDINARY_FOLDER_BASE_DEFAULT;
  const use = (localStorage.getItem('cloudinaryUse') || '').toString() !== 'false' && Boolean(cloud && preset);
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
  color: '#00ff00', // pure green by default
  tolerance: 12     // 0-255 per channel
};

function populateThemeSelector(preferredKey) {
  console.log("Themes object:", themes);
  const select = DOM.eventSelect;
  select.innerHTML = '';
  for (const themeKey in themes) {
    if (themeKey.startsWith('_')) continue; // skip meta buckets
    const theme = themes[themeKey];
    if (theme.themes || theme.holidays) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = theme.name;
      const subThemes = theme.themes || theme.holidays;
      for (const subThemeKey in subThemes) {
        const loc = BUILTIN_THEME_LOCATIONS[subThemeKey];
        if (loc && (loc.root !== themeKey || loc.bucket !== (theme.themes ? 'themes' : 'holidays'))) {
          continue;
        }
        const subTheme = subThemes[subThemeKey];
        const option = document.createElement('option');
        option.value = `${themeKey}:${subThemeKey}`;
        option.textContent = subTheme.name;
        optgroup.appendChild(option);
      }
      select.appendChild(optgroup);
    } else {
      const option = document.createElement('option');
      option.value = themeKey;
      option.textContent = theme.name;
      select.appendChild(option);
    }
  }
  const resolved = resolvePreferredThemeKey(preferredKey);
  if (resolved && !setEventSelection(resolved) && select.options.length > 0) {
    select.selectedIndex = 0;
  }
  const selectedKey = (DOM.eventSelect && DOM.eventSelect.value) || null;
  // Keep the editor's theme dropdown in sync
  syncEditorThemeDropdown();
  return selectedKey;
}

function showToast(message, duration = 2000) {
  const t = DOM.toast; if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, duration);
}

function syncEditorThemeDropdown() {
  if (!DOM.themeEditorSelect || !DOM.eventSelect) return;
  const src = DOM.eventSelect;
  const dst = DOM.themeEditorSelect;
  dst.innerHTML = '';
  for (const child of src.children) {
    if (child.tagName === 'OPTGROUP') {
      const og = document.createElement('optgroup');
      og.label = child.label;
      for (const opt of child.children) {
        const o = document.createElement('option');
        o.value = opt.value; o.text = opt.text; og.appendChild(o);
      }
      dst.appendChild(og);
    } else if (child.tagName === 'OPTION') {
      const o = document.createElement('option');
      o.value = child.value; o.text = child.text; dst.appendChild(o);
    }
  }
  // Try to mirror current selection
  dst.value = src.value;
  updateThemeEditorSummary();
}

function setEventSelection(key) {
  if (!DOM.eventSelect || !key) return false;
  const options = Array.from(DOM.eventSelect.options || []);
  const match = options.find(opt => opt.value === key);
  if (!match) return false;
  DOM.eventSelect.value = key;
  if (DOM.themeEditorSelect) DOM.themeEditorSelect.value = key;
  return true;
}

function resolvePreferredThemeKey(preferredKey) {
  if (!DOM.eventSelect) return preferredKey || DEFAULT_THEME_KEY || null;
  const options = Array.from(DOM.eventSelect.options || []);
  const hasKey = (key) => !!key && options.some(opt => opt.value === key);
  if (hasKey(preferredKey)) return preferredKey;
  if (hasKey(DEFAULT_THEME_KEY)) return DEFAULT_THEME_KEY;
  const generalOption = options.find(opt => typeof opt.value === 'string' && opt.value.startsWith('general:'));
  if (generalOption) return generalOption.value;
  const generalStandalone = options.find(opt => opt.value === 'general');
  if (generalStandalone) return generalStandalone.value;
  return options.length ? options[0].value : null;
}

function loadTheme(themeKey) {
  console.log("Loading theme:", themeKey);
  if (!themeKey) {
    console.warn('No theme key provided to loadTheme');
    return;
  }
  if (themeKey.includes(':')) {
    const [seasonKey, holidayKey] = themeKey.split(':');
    const season = themes[seasonKey];
    activeTheme = season && ((season.themes && season.themes[holidayKey]) || (season.holidays && season.holidays[holidayKey]));
  } else {
    activeTheme = themes[themeKey];
  }
  if (!activeTheme) {
    console.error('Theme not found for key:', themeKey);
    return;
  }
  // Apply theme visuals
  document.documentElement.style.setProperty('--accent', activeTheme.accent || 'orange');
  document.documentElement.style.setProperty('--accent2', activeTheme.accent2 || 'white');
  document.documentElement.style.setProperty('--font', activeTheme.font || "'Comic Neue', cursive");
  document.body.style.fontFamily = activeTheme.font || 'montserrat, sans-serif';
  // Set immediate background from configured value, then try folder auto-detect asynchronously
  const bgImmediate = getActiveBackground(activeTheme) || '';
  // Only set immediately if it's a concrete file, not a folder path
  if (bgImmediate && !bgImmediate.endsWith('/')) {
    DOM.boothScreen.style.backgroundImage = `url(${bgImmediate})`;
  } else {
    DOM.boothScreen.style.backgroundImage = '';
  }
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.backgroundImage = DOM.boothScreen.style.backgroundImage;
  // Try to resolve a background from a folder if specified
  // Try folder background (single) + list
  resolveBackgroundFromFolder(activeTheme).then((autoBg) => {
    if (autoBg) {
      DOM.boothScreen.style.backgroundImage = `url(${autoBg})`;
      if (DOM.welcomeScreen) DOM.welcomeScreen.style.backgroundImage = DOM.boothScreen.style.backgroundImage;
    }
  }).catch(() => { });
  resolveBackgroundListFromFolder(activeTheme).then((list) => {
    if (Array.isArray(list) && list.length > 0) {
      activeTheme.backgroundsTmp = list;
      const combined = getBackgroundList(activeTheme);
      if (!Array.isArray(activeTheme.backgrounds) || activeTheme.backgrounds.length !== combined.length) {
        activeTheme.backgrounds = combined.slice();
      }
      if (combined.length > 0) {
        if (typeof activeTheme.backgroundIndex !== 'number' || activeTheme.backgroundIndex >= combined.length) {
          activeTheme.backgroundIndex = 0;
        }
        const currentBg = getActiveBackground(activeTheme);
        if (currentBg) {
          DOM.boothScreen.style.backgroundImage = `url(${currentBg})`;
          if (DOM.welcomeScreen) DOM.welcomeScreen.style.backgroundImage = DOM.boothScreen.style.backgroundImage;
        }
      }
      // Update previews/grid if on admin screen
      renderCurrentAssets(activeTheme);
    }
  }).catch(() => { });

  // Load overlays from folder (if configured)
  resolveOverlaysFromFolder(activeTheme).then((list) => {
    if (Array.isArray(list) && list.length) {
      activeTheme.overlaysTmp = list;
      renderCurrentAssets(activeTheme);
      renderOptions();
    } else {
      activeTheme.overlaysTmp = undefined;
    }
  }).catch(() => { activeTheme.overlaysTmp = undefined; });

  // Load templates from folder (if configured)
  resolveTemplatesFromFolder(activeTheme).then((list) => {
    if (Array.isArray(list) && list.length) {
      activeTheme.templatesTmp = list;
      renderCurrentAssets(activeTheme);
      renderOptions();
    } else {
      activeTheme.templatesTmp = undefined;
    }
  }).catch(() => { activeTheme.templatesTmp = undefined; });
  // Event name override
  const currentKey = (DOM.eventSelect && DOM.eventSelect.value) || themeKey;
  const storedName = getStoredEventName(currentKey);
  DOM.eventTitle.textContent = storedName || activeTheme.welcome.title;
  DOM.logo.src = activeTheme.logo;
  // Clear any previous overlay selection when switching themes
  selectedOverlay = null;
  if (DOM.liveOverlay) DOM.liveOverlay.src = '';
  if (DOM.eventTitle) DOM.eventTitle.style.fontFamily = activeTheme.font || "'Comic Neue', cursive";
  if (DOM.welcomeTitle) DOM.welcomeTitle.style.fontFamily = activeTheme.font || "'Comic Neue', cursive";
  // Sync the font select to the primary family
  const fam = primaryFontFamily(activeTheme.font || '');
  if (DOM.themeFontSelect) {
    populateFontSelect(fam);
    // If not present, try to add and re-populate
    if (![...DOM.themeFontSelect.options].some(o => o.value.toLowerCase() === fam.toLowerCase())) {
      ensureFontLoaded(fam, true);
      populateFontSelect(fam);
    }
  }
  // Try to ensure this theme's primary font is loaded
  ensureFontLoadedForFontString(activeTheme.font || "");
  // If the booth is visible or once visible, ensure options reflect the new theme
  if (DOM.options) {
    renderOptions();
  }
  // Sync the Theme Editor with current theme values
  syncThemeEditorWithActiveTheme();
  // Populate event name input for this selection
  if (DOM.eventNameInput) {
    DOM.eventNameInput.value = storedName || '';
  }
}

// Convert any CSS color string to hex (#rrggbb); returns '' on failure
function colorToHex(colorStr) {
  try {
    const el = document.createElement('span');
    el.style.color = colorStr;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color; // e.g., 'rgb(255, 165, 0)'
    document.body.removeChild(el);
    const m = rgb.match(/rgba?\((\d+), ?(\d+), ?(\d+)/);
    if (!m) return '';
    const r = parseInt(m[1]).toString(16).padStart(2, '0');
    const g = parseInt(m[2]).toString(16).padStart(2, '0');
    const b = parseInt(m[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  } catch (_e) { return ''; }
}

function updateThemeEditorSummary() {
  const eventKey = DOM.eventSelect && DOM.eventSelect.value;
  const eventTheme = getThemeByKey(eventKey);
  if (DOM.themeEditorActive) {
    if (eventTheme && eventTheme.name) DOM.themeEditorActive.textContent = eventTheme.name;
    else if (eventKey) DOM.themeEditorActive.textContent = eventKey;
    else DOM.themeEditorActive.textContent = 'None selected';
  }
  if (DOM.themeEditorEditing) {
    let label = 'Editing: ';
    const isCreate = DOM.themeModeCreate && DOM.themeModeCreate.checked;
    if (isCreate) {
      const name = DOM.themeName ? DOM.themeName.value.trim() : '';
      label += name ? `New theme "${name}"` : 'New theme';
    } else {
      const editorKey = DOM.themeEditorSelect && DOM.themeEditorSelect.value;
      if (editorKey) {
        const editorTheme = getThemeByKey(editorKey);
        const draftName = DOM.themeName ? DOM.themeName.value.trim() : '';
        if (draftName) label += draftName;
        else if (editorTheme && editorTheme.name) label += editorTheme.name;
        else label += editorKey;
      } else {
        label += 'Choose a theme';
      }
    }
    DOM.themeEditorEditing.textContent = label;
  }
}

function syncThemeEditorWithActiveTheme() {
  if (!activeTheme) return;
  if (DOM.themeName) DOM.themeName.value = activeTheme.name || '';
  const fam = primaryFontFamily(activeTheme.font || '');
  if (DOM.themeFontSelect) populateFontSelect(fam);
  if (DOM.themeWelcomeTitle) DOM.themeWelcomeTitle.value = (activeTheme.welcome && activeTheme.welcome.title) || '';
  if (DOM.themeWelcomePrompt) DOM.themeWelcomePrompt.value = (activeTheme.welcome && activeTheme.welcome.prompt) || '';
  // Colors: convert to hex if needed for the color input
  const accHex = activeTheme.accent && activeTheme.accent.startsWith('#') ? activeTheme.accent : colorToHex(activeTheme.accent || '');
  const acc2Hex = activeTheme.accent2 && activeTheme.accent2.startsWith('#') ? activeTheme.accent2 : colorToHex(activeTheme.accent2 || '');
  if (accHex) DOM.themeAccent.value = accHex;
  if (acc2Hex) DOM.themeAccent2.value = acc2Hex;
  // Summaries
  if (DOM.summaryBackground) {
    const hasBgList = Array.isArray(activeTheme.backgrounds) && activeTheme.backgrounds.length > 0;
    const hasTmp = Array.isArray(activeTheme.backgroundsTmp) && activeTheme.backgroundsTmp.length > 0;
    const hasBg = !!activeTheme.background || hasBgList || hasTmp;
    DOM.summaryBackground.textContent = hasBg ? 'Current background: set' : 'Current background: none';
  }
  if (DOM.summaryLogo) DOM.summaryLogo.textContent = activeTheme.logo ? 'Current logo: set' : 'Current logo: none';
  if (DOM.summaryOverlays) DOM.summaryOverlays.textContent = `Existing overlays: ${(activeTheme.overlays || []).length}`;
  if (DOM.themeOverlaysFolder) DOM.themeOverlaysFolder.value = activeTheme.overlaysFolder || '';
  if (DOM.summaryTemplates) DOM.summaryTemplates.textContent = `Templates: ${getTemplateList(activeTheme).length}`;
  if (DOM.themeTemplatesFolder) DOM.themeTemplatesFolder.value = activeTheme.templatesFolder || '';
  // Visual previews
  renderCurrentAssets(activeTheme);
  updateThemeEditorSummary();
}

function renderCurrentAssets(theme) {
  // Helpers
  const bgList = getBackgroundList(theme);
  const selectedBg = bgList.length
    ? (typeof theme.backgroundIndex === 'number'
      ? Math.min(Math.max(theme.backgroundIndex, 0), bgList.length - 1)
      : 0)
    : -1;
  const setSingle = (wrap, src, type) => {
    if (!wrap) return;
    wrap.innerHTML = '';
    if (src) {
      const item = document.createElement('div');
      item.className = 'asset-item';
      const img = document.createElement('img');
      img.src = withBust(src);
      img.onerror = () => {
        // Show a placeholder tile instead of hiding
        item.innerHTML = '';
        const ph = document.createElement('div');
        ph.style.width = '100px'; ph.style.height = '72px';
        ph.style.display = 'flex'; ph.style.alignItems = 'center'; ph.style.justifyContent = 'center';
        ph.style.color = '#aaa'; ph.style.background = '#151820'; ph.style.borderRadius = '6px';
        ph.textContent = 'Missing';
        const cap = document.createElement('div'); cap.className = 'asset-badge'; cap.textContent = src.split('/').pop();
        item.appendChild(ph); item.appendChild(cap);
      };
      item.appendChild(img);
      const btn = document.createElement('button');
      btn.className = 'asset-remove';
      btn.textContent = '×';
      btn.title = 'Remove';
      btn.onclick = () => {
        if (!confirm('Remove this ' + type + '?')) return;
        if (type === 'background') removeBackground();
        if (type === 'logo') removeLogo();
      };
      item.appendChild(btn);
      wrap.appendChild(item);
    } else {
      const span = document.createElement('span');
      span.style.color = '#888';
      span.textContent = 'None';
      wrap.appendChild(span);
    }
  };
  const setGrid = (wrap, list, withBadge = false, kind = '', allowReorder = true) => {
    if (!wrap) return;
    wrap.innerHTML = '';
    let shown = 0;
    (list || []).forEach((entry, idx) => {
      const src = typeof entry === 'string' ? entry : entry.src;
      const fromFolder = typeof entry === 'object' && !!entry.__folder;
      const badge = typeof entry === 'object' && entry.layout ? entry.layout : '';
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.draggable = allowReorder && !fromFolder;
      item.dataset.index = idx;
      const img = document.createElement('img');
      img.src = withBust(src);
      img.onerror = () => {
        // Replace with a placeholder tile and keep it visible for management
        item.innerHTML = '';
        const ph = document.createElement('div');
        ph.style.width = '100px'; ph.style.height = '72px';
        ph.style.display = 'flex'; ph.style.alignItems = 'center'; ph.style.justifyContent = 'center';
        ph.style.color = '#aaa'; ph.style.background = '#151820'; ph.style.borderRadius = '6px';
        ph.textContent = 'Missing';
        const cap = document.createElement('div'); cap.className = 'asset-badge'; cap.textContent = src.split('/').pop();
        item.appendChild(ph); item.appendChild(cap);
      };
      item.appendChild(img);
      if (withBadge && badge) {
        const b = document.createElement('div');
        b.className = 'asset-badge';
        b.textContent = badge;
        item.appendChild(b);
      }
      const btn = document.createElement('button');
      btn.className = 'asset-remove';
      btn.textContent = '×';
      btn.title = fromFolder ? 'Hide from this theme' : 'Remove';
      btn.onclick = () => {
        if (!confirm(fromFolder ? 'Hide this item for this theme?' : 'Remove this item?')) return;
        if (kind === 'overlay') {
          if (fromFolder) removeFolderOverlay(src); else removeOverlay(idx);
        } else if (kind === 'template') {
          if (fromFolder) removeFolderTemplate(src); else removeTemplate(idx);
        }
      };
      item.appendChild(btn);
      // Drag & drop reordering
      if (allowReorder && !fromFolder) {
        item.addEventListener('dragstart', (ev) => {
          ev.dataTransfer.setData('text/plain', String(idx));
          ev.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragover', (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
        item.addEventListener('drop', (ev) => {
          ev.preventDefault();
          const from = parseInt(ev.dataTransfer.getData('text/plain'), 10);
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
      const span = document.createElement('span');
      span.style.color = '#888';
      span.textContent = 'None';
      wrap.appendChild(span);
    }
  };
  // Backgrounds grid with selection
  if (DOM.currentBackgrounds) {
    const wrap = DOM.currentBackgrounds;
    wrap.innerHTML = '';
    const markSelected = (idxToMark) => {
      const items = wrap.querySelectorAll('.asset-item');
      items.forEach((node, i) => {
        if (i === idxToMark) node.classList.add('selected');
        else node.classList.remove('selected');
        const btn = node.querySelector('.asset-use');
        if (btn) btn.textContent = (i === idxToMark) ? 'Using' : 'Use';
      });
    };
    if (bgList.length === 0) {
      const span = document.createElement('span'); span.style.color = '#888'; span.textContent = 'None'; wrap.appendChild(span);
    } else {
      bgList.forEach((src, idx) => {
        const item = document.createElement('div'); item.className = 'asset-item';
        if (idx === selectedBg) item.classList.add('selected');
        const img = document.createElement('img'); img.src = withBust(src); img.onerror = () => {
          item.innerHTML = '';
          const ph = document.createElement('div');
          ph.style.width = '100px'; ph.style.height = '72px';
          ph.style.display = 'flex'; ph.style.alignItems = 'center'; ph.style.justifyContent = 'center';
          ph.style.color = '#aaa'; ph.style.background = '#151820'; ph.style.borderRadius = '6px';
          ph.textContent = 'Missing';
          const cap = document.createElement('div'); cap.className = 'asset-badge'; cap.textContent = src.split('/').pop();
          item.appendChild(ph); item.appendChild(cap);
        };
        item.appendChild(img);
        const useBtn = document.createElement('button');
        useBtn.className = 'asset-use';
        useBtn.textContent = (idx === selectedBg) ? 'Using' : 'Use';
        useBtn.style.marginTop = '4px';
        useBtn.onclick = (ev) => {
          ev.preventDefault();
          markSelected(idx);
          setBackgroundIndex(idx);
        };
        img.addEventListener('click', () => {
          markSelected(idx);
          setBackgroundIndex(idx);
        });
        item.appendChild(useBtn);
        const remBtn = document.createElement('button');
        remBtn.className = 'asset-remove'; remBtn.textContent = '×'; remBtn.title = 'Remove';
        remBtn.onclick = () => { if (confirm('Remove this background?')) removeBackgroundAt(idx); };
        item.appendChild(remBtn);
        wrap.appendChild(item);
      });
    }
  }
  setSingle(DOM.currentLogo, theme.logo, 'logo');
  // Font preview
  if (DOM.currentFont) {
    DOM.currentFont.innerHTML = '';
    const fam = primaryFontFamily(theme.font || '') || 'System';
    const box = document.createElement('div');
    box.className = 'font-item';
    const sample = document.createElement('div');
    sample.textContent = 'Aa Bb 123';
    sample.style.fontFamily = theme.font || 'inherit';
    sample.style.fontSize = '1.2em';
    sample.style.padding = '2px 6px';
    const meta = document.createElement('div');
    meta.className = 'font-meta';
    meta.textContent = `Family: ${fam}`;
    box.appendChild(sample);
    box.appendChild(meta);
    DOM.currentFont.appendChild(box);
  }
  // Accent colors
  if (DOM.currentAccents) {
    DOM.currentAccents.innerHTML = '';
    const addColor = (label, color) => {
      const item = document.createElement('div');
      item.className = 'color-item';
      const sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.style.background = color || 'transparent';
      const hex = (color && color.startsWith('#')) ? color : (colorToHex(color || '') || (color || 'none'));
      const text = document.createElement('span');
      text.textContent = `${label}: ${hex}`;
      item.appendChild(sw); item.appendChild(text);
      DOM.currentAccents.appendChild(item);
    };
    if (theme.accent) addColor('Accent', theme.accent);
    if (theme.accent2) addColor('Accent 2', theme.accent2);
    if (!theme.accent && !theme.accent2) {
      const span = document.createElement('span'); span.style.color = '#888'; span.textContent = 'None';
      DOM.currentAccents.appendChild(span);
    }
  }
  setGrid(DOM.currentOverlays, getOverlayList(theme), false, 'overlay', false);
  setGrid(DOM.currentTemplates, getTemplateList(theme), true, 'template', false);
}

function goAdmin() {
  DOM.boothScreen.classList.add('hidden');
  DOM.adminScreen.classList.remove('hidden');
  document.body.classList.add('admin-open');
  document.documentElement.classList.add('admin-open');
}
function setMode(m) {
  mode = m;
  DOM.videoWrap.className = 'view-landscape'; // Default to landscape
  // In photo mode, show capture button; strip mode hides it (auto flow)
  DOM.captureBtn.style.display = (mode === 'photo') ? 'inline-block' : 'none';
  if (mode === 'photo') {
    setCaptureAspect(null);
  }
  // In strip mode, ensure no photo overlay is shown over the template preview
  if (mode === 'strip') {
    selectedOverlay = null;
    if (DOM.liveOverlay) DOM.liveOverlay.src = '';
  }
  renderOptions();
}
function renderOptions() {
  const isPhoto = (mode === 'photo');
  const templates = isPhoto ? [] : getTemplateList(activeTheme);
  const list = isPhoto ? getOverlayList(activeTheme) : templates;
  const container = DOM.options;
  container.innerHTML = '';
  // Add a "No Overlay" option for Photo mode to quickly clear stuck overlays
  if (isPhoto) {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    // Simple placeholder tile
    const blank = document.createElement('canvas'); blank.width = 120; blank.height = 80;
    img.src = blank.toDataURL('image/png');
    wrap.appendChild(img);
    wrap.title = 'No Overlay';
    wrap.onclick = () => {
      selectedOverlay = null;
      if (DOM.liveOverlay) DOM.liveOverlay.src = '';
    };
    container.appendChild(wrap);
  }
  list.forEach((srcOrObj, idx) => {
    const src = (isPhoto
      ? (typeof srcOrObj === 'string' ? srcOrObj : srcOrObj.src)
      : ((srcOrObj && srcOrObj.src) || ''));
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    wrap.appendChild(img);
    img.src = withBust(src);
    img.onerror = () => {
      console.error('Failed to load thumbnail:', src);
      wrap.style.display = 'none'; // Hide instead of remove to prevent breaking layout
    };
    wrap.onclick = async () => {
      container.querySelectorAll('.thumb').forEach(t => t.classList.remove('selected'));
      wrap.classList.add('selected');
      if (isPhoto) {
        selectedOverlay = src;
        DOM.liveOverlay.src = withBust(selectedOverlay);
        setViewOrientation(src);
      } else {
        // open confirm with larger preview
        // Photo strips are assumed to be landscape for preview purposes
        DOM.videoWrap.className = 'view-landscape';
        // Clear any existing overlay so template preview is clean
        selectedOverlay = null;
        if (DOM.liveOverlay) DOM.liveOverlay.src = '';
        const template = templates[idx] || { src, layout: 'double_column' };
        pendingTemplate = template;
        openConfirm(template.src);
      }
    };
    container.appendChild(wrap);
  });
}

async function setViewOrientation(imgSrc) {
  const orientation = await getOrientationFromImage(imgSrc);
  DOM.videoWrap.className = `view-${orientation}`;
  setCaptureAspect(null);
  updateCaptureAspect();
}

function orientationFromTemplate(template) {
  const layout = (template && template.layout ? template.layout : '').toLowerCase();
  if (layout === 'double_column' || layout === 'double-column' || layout === 'vertical') return 'view-portrait';
  return 'view-landscape';
}

function capturePreviewState() {
  return {
    overlaySrc: DOM.liveOverlay ? DOM.liveOverlay.src : '',
    overlayOpacity: DOM.liveOverlay ? DOM.liveOverlay.style.opacity : '',
    overlayDisplay: DOM.liveOverlay ? DOM.liveOverlay.style.display : '',
    videoClass: DOM.videoWrap ? DOM.videoWrap.className : 'view-landscape'
  };
}

function restorePreviewState(state) {
  if (!state) return;
  if (DOM.liveOverlay) {
    DOM.liveOverlay.src = state.overlaySrc || '';
    DOM.liveOverlay.style.opacity = state.overlayOpacity || '';
    DOM.liveOverlay.style.display = state.overlayDisplay || '';
    DOM.liveOverlay.style.filter = '';
  }
  if (DOM.videoWrap) DOM.videoWrap.className = state.videoClass || 'view-landscape';
}

async function getStripTemplateMetrics(template) {
  if (!template || !template.src) return null;
  if (template.__slotMetrics) return template.__slotMetrics;
  const metrics = {};
  const img = await loadImage(template.src);
  const slots = detectDoubleColumnSlots(img, 3);
  if (slots) metrics.slots = slots;
  const headerPct = Math.max(0, Math.min(0.5, toNumber(template && (template.headerPct || template.header_percent), 0.2)));
  const columnPadPct = Math.max(0, Math.min(0.2, toNumber(template && template.columnPadPct, 0.055)));
  const slotSpacingPct = Math.max(0, Math.min(0.2, toNumber(template && template.slotSpacingPct, 0.022)));
  const footerPct = Math.max(0, Math.min(0.3, toNumber(template && template.footerPct, 0.03)));
  metrics.headerPct = headerPct;
  metrics.columnPadPct = columnPadPct;
  metrics.slotSpacingPct = slotSpacingPct;
  metrics.footerPct = footerPct;
  if (slots && slots[0] && slots[0][0]) {
    metrics.aspect = Math.max(0.1, slots[0][0].w / slots[0][0].h);
  } else {
    const cols = 2;
    const columnW = 1 / cols;
    const slotWRel = columnW - columnPadPct * columnW * 2;
    const slotHRel = (1 - headerPct - footerPct - slotSpacingPct * (3 + 1)) / 3;
    metrics.aspect = Math.max(0.1, slotWRel / slotHRel);
  }
  template.__slotMetrics = metrics;
  return metrics;
}

async function prepareStripCapture(template) {
  const state = capturePreviewState();
  if (DOM.liveOverlay) {
    DOM.liveOverlay.src = '';
    DOM.liveOverlay.style.display = 'none';
    DOM.liveOverlay.style.opacity = '0';
  }
  if (DOM.videoWrap) DOM.videoWrap.className = orientationFromTemplate(template);
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
  DOM.confirmModal.style.display = 'flex';
}
function closeConfirm() {
  pendingTemplate = null;
  DOM.confirmModal.style.display = 'none';
}
function confirmTemplate() {
  const t = pendingTemplate;
  pendingTemplate = null;
  DOM.confirmModal.style.display = 'none';
  runStripSequence(t);
}

// Welcome control
function showWelcome() {
  if (!activeTheme) return;
  // Title + prompt
  DOM.welcomeTitle.textContent = (activeTheme.welcome && activeTheme.welcome.title) || (DOM.eventTitle && DOM.eventTitle.textContent) || '';
  DOM.welcomeTitle.style.fontFamily = activeTheme.font || '';
  if (DOM.startButton) DOM.startButton.textContent = (activeTheme.welcome && activeTheme.welcome.prompt) || 'Touch to start';

  // Mirror the booth background on the welcome screen and hide standalone images
  const boothBg = DOM.boothScreen ? DOM.boothScreen.style.backgroundImage : '';
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.backgroundImage = boothBg;
  if (DOM.welcomeImg) {
    DOM.welcomeImg.src = '';
    DOM.welcomeImg.classList.add('hidden');
  }

  const ws = DOM.welcomeScreen;
  if (!ws) return;
  ws.classList.remove('faded');
  if (DOM.startButton) {
    DOM.startButton.onclick = () => hideWelcome();
  } else {
    ws.onclick = () => hideWelcome();
  }
}
function hideWelcome() {
  const ws = DOM.welcomeScreen;
  ws.classList.add('faded');
  // show the video smoothly
  DOM.video.classList.remove('hidden');
  DOM.video.classList.add('active');

  // After the welcome screen is hidden, select the first option if in photo mode.
  // This ensures the UI is visible and ready for interaction.
  if (mode === 'photo') {
    const overlays = getOverlayList(activeTheme);
    if (Array.isArray(overlays) && overlays.length > 0) {
      const firstThumb = DOM.options.querySelector('.thumb');
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
    if (String(location.protocol).startsWith('file') && localStorage.getItem('forceCameraOnFile') !== 'true') {
      isStartingCamera = false;
      const useDemo = confirm('Camera access is not available when opened from a file.\n\nUse Demo Mode instead? (You can still test overlays, templates, and email.)');
      if (useDemo) {
        demoMode = true;
        if (autoStartBooth) startBoothFlow(); else showToast('Demo mode enabled');
      } else {
        alert('To use the camera, open the app over HTTPS (e.g., Cloudflare Pages URL) or a local HTTPS server.');
      }
      return;
    }

    if (stream) {
      // Camera already available; only proceed to booth if requested
      if (autoStartBooth) startBoothFlow();
      showToast('Camera is ready');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        if (DOM.video) DOM.video.srcObject = s;
        showToast('Camera permission granted');
        if (autoStartBooth) startBoothFlow();
      }).catch(err => {
        console.error("Camera Error:", err);
        alert('Could not access the camera. Please ensure it is not in use by another application and that you have granted permission.\n\nError: ' + err.message);
      }).finally(() => {
        isStartingCamera = false;
      });
  } catch (e) { isStartingCamera = false; }
}

function startBooth() {
  // Ensure camera is initialized; auto-enter booth when ready
  startCamera(true);
}

function startBoothFlow() {
  // Theme is now pre-loaded by startCamera()
  allowRetake = DOM.allowRetakes.checked;
  DOM.adminScreen.classList.add('hidden');
  DOM.boothScreen.classList.remove('hidden');
  setBoothControlsVisible(true);
  setCaptureAspect(null);
  showWelcome();
  setMode('photo'); // Default to photo mode on start
}

// Photo mode capture
async function capturePhotoFlow() {
  lastCaptureFlow = capturePhotoFlow; // Store this function for retake
  setBoothControlsVisible(false);
  const photo = await countdownAndSnap();
  const finalUrl = await finalizeToPrint(photo, selectedOverlay);
  showFinal(finalUrl);
  recordAnalytics('photo', selectedOverlay);
  addToGallery(finalUrl);
}
function drawToCanvasFromVideo() {
  const v = DOM.video;
  const c = document.createElement('canvas');
  const isPortrait = DOM.videoWrap.classList.contains('view-portrait');

  // Demo or no camera stream ready: draw a placeholder frame
  if (demoMode || !v || !v.videoWidth || !v.videoHeight) {
    const aspectW = isPortrait ? 9 : 16;
    const aspectH = isPortrait ? 16 : 9;
    const base = 900; // arbitrary size
    c.width = Math.round((base * aspectW) / aspectH);
    c.height = base;
    const ctx = c.getContext('2d');
    // Gradient background placeholder
    const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, '#222'); grad.addColorStop(1, '#555');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.font = '28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Demo Mode', c.width / 2, c.height / 2 - 10);
    ctx.fillText(isPortrait ? '9:16' : '16:9', c.width / 2, c.height / 2 + 26);
    return c;
  }

  const videoW = v.videoWidth;
  const videoH = v.videoHeight;

  if (isPortrait) {
    const targetAspect = (typeof captureAspectRatio === 'number' && captureAspectRatio > 0) ? captureAspectRatio : (9 / 16);
    let sWidth, sHeight, sx, sy;
    sHeight = videoH;
    sWidth = sHeight * targetAspect;
    if (sWidth > videoW) {
      sWidth = videoW;
      sHeight = sWidth / targetAspect;
    }
    sx = (videoW - sWidth) / 2;
    sy = (videoH - sHeight) / 2;

    c.width = sWidth;
    c.height = sHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, sx, sy, sWidth, sHeight, 0, 0, c.width, c.height);
  } else {
    // Crop to strict target aspect for landscape to match preview
    const targetAspect = (typeof captureAspectRatio === 'number' && captureAspectRatio > 0) ? captureAspectRatio : (16 / 9);
    let sWidth, sHeight, sx, sy;
    sWidth = videoW;
    sHeight = sWidth / targetAspect;
    if (sHeight > videoH) {
      sHeight = videoH;
      sWidth = sHeight * targetAspect;
    }
    sx = (videoW - sWidth) / 2;
    sy = (videoH - sHeight) / 2;

    c.width = sWidth;
    c.height = sHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, sx, sy, sWidth, sHeight, 0, 0, c.width, c.height);
  }
  return c;
}
function updateCaptureAspect() {
  if (!DOM.videoContainer) return;
  const isPortrait = DOM.videoWrap.classList.contains('view-portrait');
  let ratio = null;
  if (typeof captureAspectRatio === 'number' && captureAspectRatio > 0) {
    ratio = captureAspectRatio;
  }
  if (isPortrait) {
    const aspect = ratio || (9 / 16);
    DOM.videoContainer.style.aspectRatio = `${aspect} / 1`;
  } else {
    const aspect = ratio || (16 / 9);
    DOM.videoContainer.style.aspectRatio = `${aspect} / 1`;
  }
}

function setCaptureAspect(aspect) {
  if (typeof aspect === 'number' && aspect > 0) {
    captureAspectRatio = aspect;
  } else {
    captureAspectRatio = null;
  }
  updateCaptureAspect();
}
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    try {
      if (location.protocol.startsWith('http')) img.crossOrigin = 'anonymous';
    } catch (_) { }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
async function getOrientationFromImage(imgSrc) {
  const img = await loadImage(imgSrc);
  if (img.naturalHeight > img.naturalWidth) return 'portrait';
  return 'landscape';
}

async function applyOverlay(canvas, overlaySrc) {
  if (!overlaySrc) return canvas;
  try {
    const ov = await loadImage(overlaySrc);
    const ctx = canvas.getContext('2d');
    // Optionally mask spot color to transparency
    const overlayToDraw = SPOT_MASK.enabled ? createMaskedOverlayCanvas(ov, SPOT_MASK.color, SPOT_MASK.tolerance) : ov;
    // Default preview behavior used to be 'cover'; switch to 'contain' for print-safety helpers below
    drawImageCover(ctx, overlayToDraw, 0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.error("Failed to apply overlay:", overlaySrc, e);
  }
  return canvas;
}

// Draw image/canvas into a destination rect using CSS-like object-fit: cover math
function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const iw = img.naturalWidth || img.width; const ih = img.naturalHeight || img.height;
  const scale = Math.max(dw / iw, dh / ih);
  const rw = iw * scale; const rh = ih * scale;
  const rx = dx + (dw - rw) / 2; const ry = dy + (dh - rh) / 2;
  ctx.drawImage(img, rx, ry, rw, rh);
}

// Draw image/canvas into a destination rect preserving aspect without cropping
function drawImageContain(ctx, img, dx, dy, dw, dh) {
  const iw = img.naturalWidth || img.width; const ih = img.naturalHeight || img.height;
  const scale = Math.min(dw / iw, dh / ih);
  const rw = iw * scale; const rh = ih * scale;
  const rx = dx + (dw - rw) / 2; const ry = dy + (dh - rh) / 2;
  ctx.drawImage(img, rx, ry, rw, rh);
}

function toNumber(val, fallback) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function detectDoubleColumnSlots(img, rows) {
  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    const cols = 2;
    const colWidth = w / cols;
    const marginX = Math.max(2, Math.floor(colWidth * 0.08));
    const stepX = Math.max(1, Math.floor(colWidth / 80));
    const alphaThreshold = 32;
    const minSlotHeight = Math.max(10, Math.floor(h * 0.08));
    const expandY = Math.floor(h * 0.005);
    const results = Array.from({ length: cols }, () => []);

    for (let col = 0; col < cols; col++) {
      const xStart = Math.max(0, Math.floor(col * colWidth + marginX));
      const xEnd = Math.min(w - 1, Math.floor((col + 1) * colWidth - marginX));
      let inSlot = false;
      let slotStart = 0;
      for (let y = 0; y < h; y++) {
        let alphaSum = 0;
        let count = 0;
        for (let x = xStart; x <= xEnd; x += stepX) {
          alphaSum += data[(y * w + x) * 4 + 3];
          count++;
        }
        const avgAlpha = alphaSum / (count || 1);
        if (!inSlot && avgAlpha < alphaThreshold) {
          inSlot = true;
          slotStart = y;
        } else if (inSlot && avgAlpha >= alphaThreshold) {
          const slotHeight = y - slotStart;
          if (slotHeight >= minSlotHeight) {
            const y1 = Math.max(0, slotStart - expandY);
            const y2 = Math.min(h, y + expandY);
            results[col].push({
              x: col * colWidth + marginX,
              y: y1,
              w: colWidth - marginX * 2,
              h: Math.max(1, y2 - y1)
            });
          }
          inSlot = false;
        }
      }
      if (inSlot) {
        const slotHeight = h - slotStart;
        if (slotHeight >= minSlotHeight) {
          const y1 = Math.max(0, slotStart - expandY);
          const y2 = h;
          results[col].push({
            x: col * colWidth + marginX,
            y: y1,
            w: colWidth - marginX * 2,
            h: Math.max(1, y2 - y1)
          });
        }
      }
      results[col].sort((a, b) => a.y - b.y);
      if (results[col].length > rows) {
        results[col] = results[col].slice(0, rows);
      }
    }

    if (results.every((arr) => arr.length === rows)) {
      return results;
    }
    return null;
  } catch (e) {
    console.warn('Slot detection failed', e);
    return null;
  }
}

// Convert hex like #rrggbb to {r,g,b}
function hexToRgb(hex) {
  const m = (hex || '').trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function colorClose(r, g, b, target, tol) {
  return Math.abs(r - target.r) <= tol && Math.abs(g - target.g) <= tol && Math.abs(b - target.b) <= tol;
}

// Create a canvas from an image where spot-color pixels become transparent
function createMaskedOverlayCanvas(img, hexColor, tolerance) {
  const rgb = hexToRgb(hexColor);
  const c = document.createElement('canvas');
  const w = c.width = img.naturalWidth || img.width;
  const h = c.height = img.naturalHeight || img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const data = x.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
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
  const lastShotImg = document.getElementById('lastShot');
  const { state: previewState, prevAspect } = await prepareStripCapture(template);
  let previewRestored = false;
  setBoothControlsVisible(false);
  if (lastShotImg) lastShotImg.style.display = 'none';
  for (let i = 0; i < 3; i++) {
    if (lastShotImg) lastShotImg.style.display = 'none';
    const snap = await countdownAndSnap();
    shots.push(snap);
    if (i < 2) {
      try {
        if (lastShotImg) {
          lastShotImg.src = snap.toDataURL('image/png');
          lastShotImg.style.display = 'block';
          await delay(1200);
          lastShotImg.style.display = 'none';
        }
      } catch (_) { }
      const remaining = 3000 - (lastShotImg ? 1200 : 0);
      if (remaining > 0) await delay(remaining);
    }
  }
  try {
    const stripUrl = await composeStrip(template, shots);
    restorePreviewState(previewState); previewRestored = true;
    if (DOM.liveOverlay) DOM.liveOverlay.style.opacity = previewState.overlayOpacity || '';
    showFinal(stripUrl);
    recordAnalytics('strip', template.src);
  } finally {
    if (!previewRestored) restorePreviewState(previewState);
    setCaptureAspect(prevAspect);
  }
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
async function showCountdown(text) {
  const co = DOM.countdownOverlay;
  co.textContent = text;
  co.classList.add('show');
  await delay(800);
  co.classList.remove('show');
  await delay(200);
}
async function countdownAndSnap() {
  for (let n = 3; n > 0; n--) { await showCountdown(n); }
  const shot = drawToCanvasFromVideo();
  triggerFlash();
  return shot;
}

function triggerFlash() {
  const fo = DOM.flashOverlay;
  if (!fo) return;
  // Restart animation by toggling class
  fo.classList.remove('flash');
  // Force reflow to restart the animation reliably
  void fo.offsetWidth;
  fo.classList.add('flash');
  // Clean up after animation ends (fallback timeout as well)
  const cleanup = () => fo.classList.remove('flash');
  fo.addEventListener('animationend', cleanup, { once: true });
  setTimeout(cleanup, 600);
}

// Compose photostrip
async function composeStrip(template, photos) {
  const bg = await loadImage(template.src);
  const isPortrait = (template.layout === 'vertical' || template.layout === 'double_column' || template.layout === 'double-column');
  const targetW = isPortrait ? 1200 : 1800; // 4x6 at 300dpi
  const targetH = isPortrait ? 1800 : 1200;
  const c = document.createElement('canvas');
  c.width = targetW; c.height = targetH;
  const ctx = c.getContext('2d');
  // Fill background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, targetW, targetH);

  if (template.layout === 'double_column' || template.layout === 'double-column') {
    // Two identical 2x6 strips on a 4x6 sheet
    renderDoubleColumn(c, photos, bg, template);
  } else if (template.layout === 'vertical') {
    // Draw template first
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const padding = Math.round(targetH * 0.03);
    const slotH = Math.floor((targetH - padding * 4) / 3);
    const slotW = targetW - padding * 2;
    for (let i = 0; i < 3; i++) {
      const x = padding, y = padding + i * (slotH + padding);
      drawImageContain(ctx, photos[i], x, y, slotW, slotH);
    }
  } else if (template.layout === 'horizontal') {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const padding = Math.round(targetW * 0.03);
    const slotW = Math.floor((targetW - padding * 5) / 4); // 3 slots + one decorative column
    const slotH = targetH - padding * 2;
    for (let i = 0; i < 3; i++) {
      const x = padding + i * (slotW + padding);
      const y = padding;
      drawImageContain(ctx, photos[i], x, y, slotW, slotH);
    }
  } else if (template.layout === 'double_column' || template.layout === 'double-column') {
    // Handled above
  } else if (template.layout === 'spot-mask' || template.layout === 'spotmask') {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    const regions = await detectMaskRegions(bg, SPOT_MASK.color, SPOT_MASK.tolerance);
    const max = Math.min(photos.length, regions.length);
    for (let i = 0; i < max; i++) {
      const r = regions[i]; if (!r) break;
      drawImageContain(ctx, photos[i], r.x, r.y, r.w, r.h);
    }
    const masked = createMaskedOverlayCanvas(bg, SPOT_MASK.color, SPOT_MASK.tolerance);
    drawImageContain(ctx, masked, 0, 0, targetW, targetH);
  } else if (template.layout === 'custom' && template.slots) {
    drawImageContain(ctx, bg, 0, 0, targetW, targetH);
    for (let i = 0; i < Math.min(photos.length, template.slots.length); i++) {
      const s = template.slots[i];
      drawImageContain(ctx, photos[i], s.x, s.y, s.w, s.h);
    }
  }
  return c.toDataURL('image/png');
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
  const ctx = canvas.getContext('2d');
  const cols = 2;   // duplicate columns
  const rows = 3;   // three slots
  // Reserve a header area at the top for graphics/logo on the template
  const headerPct = Math.max(0, Math.min(0.5, toNumber(template && (template.headerPct || template.header_percent), 0.2)));
  const columnPadPct = Math.max(0, Math.min(0.2, toNumber(template && template.columnPadPct, 0.055)));
  const slotSpacingPct = Math.max(0, Math.min(0.2, toNumber(template && template.slotSpacingPct, 0.022)));
  const footerPct = Math.max(0, Math.min(0.3, toNumber(template && template.footerPct, 0.03)));

  const columnW = canvas.width / cols;
  const columnPad = columnPadPct * columnW;
  const slotW = Math.max(1, columnW - columnPad * 2);
  const headerH = headerPct * canvas.height;
  const footerH = footerPct * canvas.height;
  const slotSpacing = slotSpacingPct * canvas.height;
  const usableH = canvas.height - headerH - footerH - slotSpacing * (rows + 1);
  const slotH = Math.max(1, usableH / rows);
  const startY = headerH + slotSpacing;

  const cachedSlots = template && template.__slotMetrics && template.__slotMetrics.slots;
  const detectedSlots = cachedSlots || detectDoubleColumnSlots(overlayImage, rows);
  if (detectedSlots) {
    const scaleX = canvas.width / (overlayImage.naturalWidth || overlayImage.width || 1);
    const scaleY = canvas.height / (overlayImage.naturalHeight || overlayImage.height || 1);
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
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const visited = new Uint8Array(w * h);
  const regions = [];
  const stack = [];
  const idx = (x, y) => (y * w + x);
  const match = (x, y) => {
    const i = idx(x, y) * 4; return colorClose(d[i], d[i + 1], d[i + 2], rgb, tolerance);
  };
  const minArea = Math.max(50, Math.floor((w * h) * 0.001)); // ignore tiny noise
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = idx(x, y);
      if (visited[p]) continue;
      visited[p] = 1;
      if (!match(x, y)) continue;
      // flood fill
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;
      stack.length = 0; stack.push([x, y]);
      while (stack.length) {
        const [sx, sy] = stack.pop();
        const sp = idx(sx, sy);
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        if (visited[sp] && !(sx === x && sy === y)) continue; // allow seed already marked
        if (!visited[sp]) visited[sp] = 1;
        if (!match(sx, sy)) continue;
        area++;
        if (sx < minX) minX = sx; if (sx > maxX) maxX = sx; if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
        // neighbors
        const neigh = [[sx + 1, sy], [sx - 1, sy], [sx, sy + 1], [sx, sy - 1]];
        for (const [nx, ny] of neigh) {
          const np = idx(nx, ny);
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[np]) { visited[np] = 1; stack.push([nx, ny]); }
        }
      }
      if (area >= minArea) {
        regions.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
      }
    }
  }
  // Sort regions top-to-bottom, then left-to-right
  regions.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  return regions;
}

// Final preview
function showFinal(url) {
  clearTimeout(hidePreviewTimer); // Clear any existing timer
  const img = DOM.finalStrip;
  const prevFit = img ? img.style.objectFit : '';
  if (img) img.style.objectFit = 'contain';
  const qrContainer = DOM.qrCodeContainer;
  const qrCanvas = DOM.qrCode;
  const panel = DOM.finalPreview;

  // Reset form from previous use
  DOM.emailInput.value = '';
  const sendBtn = DOM.sendBtn;
  sendBtn.textContent = 'Send';
  sendBtn.disabled = false;

  DOM.retakeBtn.style.display = allowRetake ? 'block' : 'none';
  DOM.retakeBtn.disabled = !lastCaptureFlow;
  if (DOM.closePreviewBtn) DOM.closePreviewBtn.style.display = 'block';

  img.src = url;
  const offline = offlineModeActive();
  // Default: hide QR/link until we have a public URL
  if (qrContainer) qrContainer.classList.add('hidden');
  if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = 'none';
  if (DOM.qrHint) { DOM.qrHint.style.display = 'none'; DOM.qrHint.textContent = ''; }
  if (DOM.shareStatus) { DOM.shareStatus.style.display = 'none'; }
  if (!offline && cloudinaryEnabled()) {
    // Prepare a public Cloudinary link, then show QR when ready
    lastShareUrl = null;
    if (DOM.shareStatus) { DOM.shareStatus.textContent = 'Preparing link…'; DOM.shareStatus.style.display = 'inline-flex'; }
    publishShareImage(url).then((publicUrl) => {
      lastShareUrl = (publicUrl && /^https?:/i.test(publicUrl)) ? publicUrl : null;
      if (lastShareUrl) {
        renderQrCode(qrCanvas, lastShareUrl);
        if (DOM.shareLink) { DOM.shareLink.href = lastShareUrl; DOM.shareLink.textContent = lastShareUrl; }
        if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = 'flex';
        if (qrContainer) qrContainer.classList.remove('hidden');
        if (DOM.shareStatus) { DOM.shareStatus.textContent = 'Link ready'; }
      } else {
        if (DOM.qrHint) { DOM.qrHint.textContent = 'QR disabled: Cloudinary link not available.'; DOM.qrHint.style.display = 'block'; }
        if (DOM.shareStatus) { DOM.shareStatus.textContent = 'Upload failed'; }
      }
    }).catch(() => {
      if (DOM.qrHint) { DOM.qrHint.textContent = 'QR disabled: Cloudinary link not available.'; DOM.qrHint.style.display = 'block'; }
      if (DOM.shareStatus) { DOM.shareStatus.textContent = 'Upload failed'; }
    });
  } else {
    // No internet or Cloudinary disabled
    if (offline && DOM.qrHint) { DOM.qrHint.textContent = 'Offline: QR disabled'; DOM.qrHint.style.display = 'block'; }
    if (!cloudinaryEnabled() && DOM.qrHint) { DOM.qrHint.textContent = 'Enable Cloudinary in Admin to show QR'; DOM.qrHint.style.display = 'block'; }
  }
  panel.classList.add('show');
  resetIdleTimer();
  hidePreviewTimer = setTimeout(hideFinal, 15000);

  if (img) {
    panel.addEventListener('transitionend', function once() {
      img.style.objectFit = prevFit || '';
      panel.removeEventListener('transitionend', once);
    });
  }

  // No local-QR fallback: only show QR when a public link is ready (handled above)
}

function renderQrCode(canvas, text) {
  try {
    QRCode.toCanvas(canvas, text, { width: 200, margin: 1 }, function (error) {
      if (error) console.error(error);
    });
  } catch (e) { console.error(e); }
}

// Build a slug for the current event selection to organize uploads per event
function getCurrentEventSlug() {
  try {
    const val = (DOM.eventSelect && DOM.eventSelect.value) ? DOM.eventSelect.value : '';
    if (!val) return '';
    // value is like "fall:halloween" or "school:hawks"; use it directly
    return String(val).toLowerCase().replace(/[^a-z0-9:_\-]+/g, '-').replace(/:+/g, '-');
  } catch (_) { return ''; }
}

// --- Event name storage helpers ---
function getEventNamesMap() {
  try { return JSON.parse(localStorage.getItem('photoboothEventNames') || '{}'); } catch (_) { return {}; }
}
function getStoredEventName(key) {
  if (!key) return '';
  const map = getEventNamesMap();
  return map[key] || '';
}
function saveStoredEventName(key, name) {
  if (!key) return;
  const map = getEventNamesMap();
  if (name) map[key] = name; else delete map[key];
  localStorage.setItem('photoboothEventNames', JSON.stringify(map));
}

// --- Export current event (settings + theme) ---
function exportCurrentEvent() {
  const key = DOM.eventSelect && DOM.eventSelect.value;
  if (!key || !activeTheme) { alert('Select an event first.'); return; }
  const name = getStoredEventName(key) || (activeTheme.welcome && activeTheme.welcome.title) || key;
  const payload = {
    key,
    name,
    exported_at: new Date().toISOString(),
    theme: activeTheme
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const a = document.createElement('a');
  const slug = (name || key).toLowerCase().replace(/[^a-z0-9\-]+/g, '-');
  a.href = dataStr;
  a.download = `photobooth-event-${slug || 'export'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Event exported');
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
      const evSlug = (typeof getCurrentEventSlug === 'function') ? getCurrentEventSlug() : '';
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = `${evSlug || 'photo'}-${ts}.png`;
      const file = new File([blob], baseName, { type: blob.type || 'image/png' });
      form.append('file', file);
      form.append('upload_preset', cfg.preset);
      // Put each event's images into its own folder
      const base = (cfg.folderBase || 'photobooth/events').replace(/\/$/, '');
      if (evSlug) form.append('folder', `${base}/${evSlug}`);
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: 'POST', body: form });
      const json = await resp.json();
      if (json && json.secure_url) return json.secure_url;
    } catch (e) { console.warn('Cloudinary upload failed', e); }
  }

  // 2) Otherwise try Service Worker (works on same device/origin after SW installs)
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return null;
  try { await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('sw-timeout')), 2000))]); } catch (_e) { }
  const reg = await navigator.serviceWorker.getRegistration();
  const active = reg?.active || navigator.serviceWorker.controller;
  if (!active) return null;
  const buffer = await blob.arrayBuffer();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const channel = new MessageChannel();
  const ack = new Promise((resolve) => { channel.port1.onmessage = (ev) => resolve(ev.data); });
  active.postMessage({ type: 'store-share', id, buffer, mime: blob.type }, [channel.port2]);
  const reply = await ack; // {ok, url}
  if (reply && reply.ok && reply.url) return new URL(reply.url, location.origin).href;
  return null;
}

async function openShareLink() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  if (!url) return;
  try {
    // Ensure the asset is retrievable (esp. right after SW publish) and open a stable blob URL
    const resp = await fetch(url, { cache: 'reload' });
    if (!resp.ok) throw new Error('Link not ready');
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    window.open(objUrl, '_blank', 'noopener');
    // Revoke after some time to avoid leaks
    setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
  } catch (e) {
    // Fallback to opening the original URL
    try { window.open(url, '_blank', 'noopener'); } catch (_) { location.href = url; }
  }
}
async function copyShareLink() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied');
  } catch (e) {
    showToast('Copy failed');
  }
}
async function downloadShareImage() {
  const url = lastShareUrl || (DOM.finalStrip && DOM.finalStrip.src);
  if (!url) return;
  try {
    const resp = await fetch(url, { cache: 'reload' });
    if (!resp.ok) throw new Error('Link not ready');
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = 'photobooth.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 30000);
  } catch (e) {
    // Fallback: open in new tab; user can save manually
    try { window.open(url, '_blank', 'noopener'); } catch (_) { location.href = url; }
  }
}

function hideFinal() {
  DOM.finalPreview.classList.remove('show');
  DOM.qrCodeContainer.classList.add('hidden');
  if (DOM.shareLinkRow) DOM.shareLinkRow.style.display = 'none';
  if (DOM.shareStatus) DOM.shareStatus.style.display = 'none';
  DOM.retakeBtn.style.display = 'none';
  if (DOM.closePreviewBtn) DOM.closePreviewBtn.style.display = 'none';
  lastCaptureFlow = null; // Clear the stored flow
  clearTimeout(hidePreviewTimer);
  setBoothControlsVisible(true);
  resetIdleTimer();
}

function retakePhoto() {
  hideFinal();
  if (typeof lastCaptureFlow === 'function') {
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
  if (DOM.emailInput.value.trim() === '') {
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
      sendBtn.textContent = 'Queued';
      updatePendingUI();
      hidePreviewTimer = setTimeout(hideFinal, 1200);
    } else {
      alert('Could not queue email. Check storage space.');
    }
    return;
  }

  sendBtn.textContent = 'Sending...';
  sendBtn.disabled = true;

  const cfg = getEmailJsConfig();
  const templateParams = {
    to_email: email,
    photo_url: lastShareUrl || imgUrl,
    link_url: lastShareUrl || '',
    image_data_url: imgUrl
  };

  emailjs.send(cfg.service, cfg.template, templateParams)
    .then(function (response) {
      console.log('SUCCESS!', response.status, response.text);
      sendBtn.textContent = 'Sent!';
      hidePreviewTimer = setTimeout(hideFinal, 3000);
    }, function (error) {
      const errMsg = formatEmailError(error);
      console.error('Email send failed:', error);
      sendBtn.textContent = 'Failed!';
      sendBtn.disabled = false;
      alert('Email failed: ' + errMsg);
    });

  recordAnalytics('email', email);
}

function formatEmailError(err) {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err.text) return err.text;
  if (err.message) return err.message;
  if (typeof err.status !== 'undefined') {
    const statusText = err.statusText || err.text || '';
    return `${err.status} ${statusText}`.trim();
  }
  try { return JSON.stringify(err); } catch (_) { return String(err); }
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
    const data = localStorage.getItem('photoboothAnalytics');
    return data ? JSON.parse(data) : defaults;
  } catch (e) {
    return defaults;
  }
}

// --- Offline queue helpers ---
function offlineModeActive() {
  try { if (getOfflinePref()) return true; } catch (_) { }
  try { if (String(location.protocol).startsWith('file')) return true; } catch (_) { }
  return !navigator.onLine ? true : false;
}
function getOfflinePref() { return localStorage.getItem('offlineMode') === 'true'; }
function setOfflinePref(v) { localStorage.setItem('offlineMode', v ? 'true' : 'false'); }
function getPending() { try { return JSON.parse(localStorage.getItem('photoboothPending') || '[]'); } catch (_) { return []; } }
function setPending(arr) { localStorage.setItem('photoboothPending', JSON.stringify(arr || [])); }
function queuePendingEmail(email, dataUrl) {
  try {
    const q = getPending();
    q.push({ id: Date.now().toString(36), email, image: dataUrl, createdAt: new Date().toISOString(), event: DOM.eventSelect && DOM.eventSelect.value });
    setPending(q); return true;
  } catch (e) { return false; }
}
function updatePendingUI() {
  const q = getPending();
  if (DOM.sendPendingBtn) {
    DOM.sendPendingBtn.textContent = `Send Pending (${q.length})`;
    DOM.sendPendingBtn.disabled = (q.length === 0) || !navigator.onLine;
  }
  // Badge on admin button
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.textContent = q.length ? `⚙️ (${q.length})` : '⚙️';
  }
}
async function sendPendingNow() {
  const q = getPending();
  if (!q.length) { showToast('No pending emails'); return; }
  if (!navigator.onLine) { alert('Go online to send'); return; }
  let sent = 0, failed = 0;
  for (const item of q.slice()) {
    try {
      // Try to publish to Cloudinary/SW for a link if available
      let share = null;
      try { share = await publishShareImage(item.image); } catch (_) { }
      const params = {
        to_email: item.email,
        photo_url: share || item.image,
        link_url: share || '',
        image_data_url: item.image
      };
      const cfg = getEmailJsConfig();
      await emailjs.send(cfg.service, cfg.template, params);
      sent++;
      // remove from queue
      const cur = getPending();
      const idx = cur.findIndex(x => x.id === item.id);
      if (idx >= 0) { cur.splice(idx, 1); setPending(cur); }
    } catch (e) { failed++; }
  }
  updatePendingUI();
  showToast(`Pending sent: ${sent}${failed ? `, failed: ${failed}` : ''}`);
}

// Cache active theme assets for offline use (PWA/HTTPS only)
async function makeAvailableOffline() {
  if (!('caches' in window) || !('serviceWorker' in navigator) || !location.protocol.startsWith('http')) {
    alert('Offline caching requires HTTPS and a service worker. Open your Cloudflare URL.');
    return;
  }
  try {
    const urls = new Set();
    const theme = activeTheme || getSelectedThemeTarget();
    if (theme) {
      // Backgrounds
      const bgList = Array.isArray(theme.backgroundsTmp) ? theme.backgroundsTmp : Array.isArray(theme.backgrounds) ? theme.backgrounds : (theme.background ? [theme.background] : []);
      bgList.filter(Boolean).forEach(u => urls.add(u));
      // Logo
      if (theme.logo) urls.add(theme.logo);
      // Overlays
      getOverlayList(theme).forEach(o => { const s = typeof o === 'string' ? o : (o && o.src) || ''; if (s) urls.add(s); });
      // Templates
      getTemplateList(theme).forEach(t => { if (t && t.src) urls.add(t.src); });
    }
    if (urls.size === 0) { showToast('No assets to cache'); return; }
    const cache = await caches.open('pb-offline-assets-v1');
    let ok = 0, fail = 0;
    await Promise.all(Array.from(urls).map(async (u) => {
      try {
        const resp = await fetch(u, { cache: 'reload' });
        if (resp.ok) { await cache.put(new Request(u), resp.clone()); ok++; } else { fail++; }
      } catch (_) { fail++; }
    }));
    showToast(`Cached ${ok} assets${fail ? `, failed ${fail}` : ''}`);
  } catch (e) {
    alert('Cache failed: ' + (e && e.message ? e.message : e));
  }
}

function recordAnalytics(type, value) {
  const data = getAnalytics();
  if (type === 'photo' || type === 'strip') {
    data.total_sessions = (data.total_sessions || 0) + 1;
    data.overlay_usage[value] = (data.overlay_usage[value] || 0) + 1;
  } else if (type === 'email') {
    if (!data.emails.includes(value)) {
      data.emails.push(value);
    }
  }
  localStorage.setItem('photoboothAnalytics', JSON.stringify(data));
}

function displayAnalytics() {
  const data = getAnalytics();
  DOM.analyticsData.textContent = JSON.stringify(data, null, 2);
}

function toggleAnalytics() {
  DOM.analytics.classList.toggle('hidden');
  displayAnalytics();
}

function clearAnalytics() {
  if (confirm('Are you sure you want to delete all analytics data? This cannot be undone.')) {
    localStorage.removeItem('photoboothAnalytics');
    displayAnalytics();
  }
}

// --- Theme Management ---
function saveTheme() {
  const themeName = DOM.themeName.value.trim();
  if (!themeName) {
    alert('Please enter a theme name.');
    return;
  }

  const newTheme = {
    name: themeName,
    accent: DOM.themeAccent.value,
    accent2: DOM.themeAccent2.value,
    font: (function () {
      const fam = (DOM.themeFontSelect && DOM.themeFontSelect.value) ? DOM.themeFontSelect.value : '';
      return fam ? `'${fam}', cursive` : "'Comic Neue', cursive";
    })(),
    background: "",
    logo: "",
    overlays: [],
    templates: [],
    welcome: {
      title: DOM.themeWelcomeTitle.value || "Welcome!",
      portrait: "",
      landscape: "",
      prompt: DOM.themeWelcomePrompt.value || "Touch to start"
    }
  };

  const backgroundFile = DOM.themeBackground.files[0];
  const logoFile = DOM.themeLogo.files[0];
  const overlayFiles = DOM.themeOverlays.files;
  const templateFiles = DOM.themeTemplates.files;
  const templatesFolder = DOM.themeTemplatesFolder && DOM.themeTemplatesFolder.value ? DOM.themeTemplatesFolder.value.trim() : '';
  const overlaysFolder = DOM.themeOverlaysFolder && DOM.themeOverlaysFolder.value ? DOM.themeOverlaysFolder.value.trim() : '';

  const filePromises = [];

  if (backgroundFile) {
    filePromises.push(uploadAsset(backgroundFile, 'backgrounds').then(url => { if (url) newTheme.background = url; }));
  }
  if (logoFile) {
    filePromises.push(uploadAsset(logoFile, 'logo').then(url => { if (url) newTheme.logo = url; }));
  }
  for (const file of overlayFiles) {
    filePromises.push(uploadAsset(file, 'overlays').then(url => { if (url) newTheme.overlays.push(url); }));
  }
  if (overlaysFolder) {
    newTheme.overlaysFolder = overlaysFolder.endsWith('/') ? overlaysFolder : overlaysFolder + '/';
  }
  for (const file of templateFiles) {
    filePromises.push(uploadAsset(file, 'templates').then(url => { if (url) newTheme.templates.push({ src: url, layout: 'double_column' }); }));
  }
  if (templatesFolder) {
    newTheme.templatesFolder = templatesFolder.endsWith('/') ? templatesFolder : templatesFolder + '/';
  }

  Promise.all(filePromises).then(() => {
    // Try to load/record the chosen font so it's available immediately
    ensureFontLoadedForFontString(newTheme.font);
    const newKey = themeName.toLowerCase().replace(/\s/g, '-');
    themes[newKey] = newTheme;
    saveThemesToStorage();
    populateThemeSelector(newKey);
    if (DOM.eventSelect) DOM.eventSelect.value = newKey;
    if (DOM.themeEditorSelect) DOM.themeEditorSelect.value = newKey;
    loadTheme(newKey);
    alert(`Theme '${themeName}' saved!`);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAssetIndex() {
  if (!themes._meta) themes._meta = {};
  if (!themes._meta.assetIndex) themes._meta.assetIndex = {};
  return themes._meta.assetIndex;
}
async function fileSha256Hex(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function extFromName(name, fallback) {
  const m = (name || '').match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : (fallback || 'png');
}
// Upload an asset. If Cloudinary is configured, upload there and return its secure URL.
// Otherwise, fall back to a local data URL.
async function uploadAsset(file, kind) {
  try {
    const index = getAssetIndex();
    const hash = await fileSha256Hex(file);
    if (index[hash]) return index[hash];
    const cfg = getCloudinaryConfig();
    if (cfg.use && cfg.cloud && cfg.preset) {
      const form = new FormData();
      const evSlug = (typeof getCurrentEventSlug === 'function') ? getCurrentEventSlug() : 'event';
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const base = (cfg.folderBase || 'photobooth/events').replace(/\/$/, '');
      const folder = `${base}/${evSlug}/${kind || 'misc'}`;
      const fname = `${kind || 'file'}-${hash}.${extFromName(file && file.name, 'png')}`;
      const wrapped = new File([file], fname, { type: file.type || 'application/octet-stream' });
      form.append('file', wrapped);
      form.append('upload_preset', cfg.preset);
      form.append('folder', folder);
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: 'POST', body: form });
      const json = await resp.json();
      if (json && json.secure_url) { index[hash] = json.secure_url; saveThemesToStorage(); return json.secure_url; }
    }
  } catch (_) { }
  // Fallback to local embedding
  try { return await readFileAsDataURL(file); } catch (_) { return ''; }
}

function saveThemesToStorage() {
  // Normalize to avoid duplicates across overlays/templates, and strip empties
  ensureBuiltinThemes();
  if (!hasCoreBuiltins(themes)) {
    resetThemesToBuiltins('core themes missing before save');
  }
  try { normalizeAllThemes(); } catch (_e) { }
  localStorage.setItem('photoboothThemes', JSON.stringify(themes));
  // Best-effort remote sync
  syncThemesRemote().catch(() => { });
}

function cloneThemeValue(val) {
  if (Array.isArray(val)) return val.map(cloneThemeValue);
  if (val && typeof val === 'object') {
    const out = {};
    for (const key of Object.keys(val)) {
      out[key] = cloneThemeValue(val[key]);
    }
    return out;
  }
  return val;
}

function addMissingDefaults(target, source) {
  if (!source || typeof source !== 'object') return;
  if (!target || typeof target !== 'object') return;
  for (const key of Object.keys(source)) {
    const src = source[key];
    const tgt = target ? target[key] : undefined;
    if (Array.isArray(src)) {
      if (!Array.isArray(tgt) || tgt.length === 0) {
        target[key] = src.slice();
      }
    } else if (src && typeof src === 'object') {
      if (!tgt || typeof tgt !== 'object') {
        target[key] = cloneThemeValue(src);
      } else {
        addMissingDefaults(tgt, src);
      }
    } else {
      const needs = tgt === undefined || tgt === null || (typeof tgt === 'string' && tgt.trim() === '');
      if (needs) {
        target[key] = src;
      }
    }
  }
}

function pruneMisplacedBuiltinThemes(target) {
  if (!target || typeof target !== 'object') return;
  for (const rootKey of Object.keys(target)) {
    const group = target[rootKey];
    if (!group || typeof group !== 'object') continue;
    if (BUILTIN_THEMES[rootKey] && BUILTIN_THEMES[rootKey].name) {
      group.name = BUILTIN_THEMES[rootKey].name;
    }
    for (const extraKey of Object.keys(group)) {
      if (!['name', 'themes', 'holidays'].includes(extraKey)) {
        delete group[extraKey];
      }
    }
    for (const bucket of ['themes', 'holidays']) {
      if (!group[bucket] || typeof group[bucket] !== 'object') continue;
      for (const key of Object.keys(group[bucket])) {
        const loc = BUILTIN_THEME_LOCATIONS[key];
        if (loc && (loc.root !== rootKey || loc.bucket !== bucket)) {
          delete group[bucket][key];
        }
      }
    }
  }
}


function ensureBuiltinThemes() {
  if (!themes || typeof themes !== 'object') themes = {};
  for (const rootKey of Object.keys(BUILTIN_THEMES)) {
    const builtinGroup = BUILTIN_THEMES[rootKey];
    if (!builtinGroup || typeof builtinGroup !== 'object') continue;
    if (!themes[rootKey] || typeof themes[rootKey] !== 'object') {
      themes[rootKey] = cloneThemeValue(builtinGroup);
      continue;
    }
    const targetGroup = themes[rootKey];
    // Ensure optgroup metadata like name exists
    addMissingDefaults(targetGroup, builtinGroup);
    for (const bucket of ['themes', 'holidays']) {
      if (!builtinGroup[bucket] || typeof builtinGroup[bucket] !== 'object') continue;
      if (!targetGroup[bucket] || typeof targetGroup[bucket] !== 'object') {
        targetGroup[bucket] = {};
      }
      const targetBucket = targetGroup[bucket];
      for (const subKey of Object.keys(builtinGroup[bucket])) {
        const builtinTheme = builtinGroup[bucket][subKey];
        if (!targetBucket[subKey] || typeof targetBucket[subKey] !== 'object') {
          targetBucket[subKey] = cloneThemeValue(builtinTheme);
        } else {
          addMissingDefaults(targetBucket[subKey], builtinTheme);
        }
      }
    }
  }
  pruneMisplacedBuiltinThemes(themes);
}

function hasCoreBuiltins(obj) {
  try {
    return !!(obj && obj.general && obj.general.themes && obj.general.themes.birthday && obj.fall && obj.fall.holidays && obj.fall.holidays.halloween);
  } catch (_) { return false; }
}

function resetThemesToBuiltins(reason) {
  console.warn('Resetting themes to built-ins:', reason || 'unknown');
  themes = cloneThemeValue(BUILTIN_THEMES);
  try { localStorage.removeItem('photoboothThemes'); } catch (_) { }
}

function mergePlainObject(baseObj, overrideObj) {
  const baseClone = (baseObj && typeof baseObj === 'object' && !Array.isArray(baseObj))
    ? cloneThemeValue(baseObj)
    : {};
  if (!overrideObj || typeof overrideObj !== 'object' || Array.isArray(overrideObj)) {
    if (Array.isArray(overrideObj)) return overrideObj.slice();
    return baseClone;
  }
  const out = baseClone || {};
  for (const key of Object.keys(overrideObj)) {
    const value = overrideObj[key];
    if (Array.isArray(value)) out[key] = value.slice();
    else if (value && typeof value === 'object') out[key] = mergePlainObject(out[key], value);
    else out[key] = value;
  }
  return out;
}

function applyThemeFallbacks(baseLeaf, merged, storedLeaf) {
  if (!baseLeaf || typeof baseLeaf !== 'object' || !merged || typeof merged !== 'object') return;
  const baseBackgrounds = Array.isArray(baseLeaf.backgrounds) ? baseLeaf.backgrounds.filter(Boolean) : [];
  const mergedBackgrounds = Array.isArray(merged.backgrounds) ? merged.backgrounds.filter(Boolean) : [];
  const baseBackground = (baseLeaf.background || '').trim();
  const mergedBackground = (merged.background || '').trim();
  const storedBackgrounds = storedLeaf && storedLeaf.backgrounds;
  const storedBackground = storedLeaf && storedLeaf.background;
  const storedBackgroundsArr = Array.isArray(storedBackgrounds)
    ? storedBackgrounds.filter(Boolean)
    : [];
  const storedBackgroundStr = (typeof storedBackground === 'string') ? storedBackground.trim() : '';
  const storedAllowsFallback = !storedLeaf
    || (storedBackgroundsArr.length === 0 && !storedBackgroundStr);
  if ((baseBackgrounds.length || baseBackground) && (!mergedBackgrounds.length && !mergedBackground) && storedAllowsFallback) {
    if (baseBackgrounds.length) merged.backgrounds = baseBackgrounds.slice();
    if (baseBackground) merged.background = baseLeaf.background;
    if (typeof baseLeaf.backgroundIndex === 'number') merged.backgroundIndex = baseLeaf.backgroundIndex;
  }
  const storedTemplatesFolder = storedLeaf && typeof storedLeaf.templatesFolder === 'string' && storedLeaf.templatesFolder.trim();
  const storedTemplatesArray = storedLeaf && Array.isArray(storedLeaf.templates);
  if (baseLeaf.templatesFolder && !merged.templatesFolder && !storedTemplatesFolder) merged.templatesFolder = baseLeaf.templatesFolder;
  if (Array.isArray(baseLeaf.templates) && baseLeaf.templates.length && (!Array.isArray(merged.templates) || !merged.templates.length) && !storedTemplatesArray) {
    merged.templates = baseLeaf.templates.map(t => mergePlainObject(t, {}));
  }
  const storedOverlaysFolder = storedLeaf && typeof storedLeaf.overlaysFolder === 'string' && storedLeaf.overlaysFolder.trim();
  const storedOverlaysArray = storedLeaf && Array.isArray(storedLeaf.overlays);
  if (baseLeaf.overlaysFolder && !merged.overlaysFolder && !storedOverlaysFolder) merged.overlaysFolder = baseLeaf.overlaysFolder;
  if (Array.isArray(baseLeaf.overlays) && baseLeaf.overlays.length && (!Array.isArray(merged.overlays) || !merged.overlays.length) && !storedOverlaysArray) {
    merged.overlays = baseLeaf.overlays.slice();
  }
  if (Array.isArray(baseLeaf.overlaysRemoved) && !Array.isArray(merged.overlaysRemoved)) merged.overlaysRemoved = baseLeaf.overlaysRemoved.slice();
  if (Array.isArray(baseLeaf.templatesRemoved) && !Array.isArray(merged.templatesRemoved)) merged.templatesRemoved = baseLeaf.templatesRemoved.slice();
  if (baseLeaf.welcome) merged.welcome = mergePlainObject(baseLeaf.welcome, merged.welcome);
  if (baseLeaf.accent && !merged.accent) merged.accent = baseLeaf.accent;
  if (baseLeaf.accent2 && !merged.accent2) merged.accent2 = baseLeaf.accent2;
  if (baseLeaf.font && !merged.font) merged.font = baseLeaf.font;
}

function mergeThemeLeaf(baseLeaf, storedLeaf) {
  if (storedLeaf === null || storedLeaf === undefined) {
    return cloneThemeValue(baseLeaf);
  }
  if (Array.isArray(storedLeaf)) return storedLeaf.slice();
  if (typeof storedLeaf !== 'object') return storedLeaf;
  const merged = mergePlainObject(baseLeaf, storedLeaf);
  applyThemeFallbacks(baseLeaf, merged, storedLeaf);
  return merged;
}

function fixBuiltinThemePlacements(target) {
  if (!target || typeof target !== 'object') return;
  for (const rootKey of Object.keys(target)) {
    const group = target[rootKey];
    if (!group || typeof group !== 'object') continue;
    for (const bucket of ['themes', 'holidays']) {
      const sub = group[bucket];
      if (!sub || typeof sub !== 'object') continue;
      for (const subKey of Object.keys({ ...sub })) {
        const loc = BUILTIN_THEME_LOCATIONS[subKey];
        if (!loc || (loc.root === rootKey && loc.bucket === bucket)) continue;
        const currentTheme = sub[subKey];
        delete sub[subKey];
        if (!target[loc.root]) target[loc.root] = cloneThemeValue(BUILTIN_THEMES[loc.root] || { name: loc.root });
        if (!target[loc.root][loc.bucket]) target[loc.root][loc.bucket] = {};
        const base = BUILTIN_THEMES[loc.root] && BUILTIN_THEMES[loc.root][loc.bucket]
          ? BUILTIN_THEMES[loc.root][loc.bucket][subKey]
          : null;
        target[loc.root][loc.bucket][subKey] = mergeThemeLeaf(base, currentTheme);
      }
    }
  }
}

function mergeStoredThemes(base, stored) {
  if (!base || typeof base !== 'object' || !stored || typeof stored !== 'object') return;
  for (const key of Object.keys(stored)) {
    const storedGroup = stored[key];
    if (storedGroup && typeof storedGroup === 'object' && !Array.isArray(storedGroup)) {
      const bucketKey = storedGroup.themes ? 'themes' : (storedGroup.holidays ? 'holidays' : null);
      const baseGroup = base[key];
      if (bucketKey) {
        if (!baseGroup || typeof baseGroup !== 'object') {
          base[key] = cloneThemeValue(storedGroup);
          continue;
        }
        if (!baseGroup[bucketKey]) baseGroup[bucketKey] = {};
        const baseBucket = baseGroup[bucketKey];
        const storedBucket = storedGroup[bucketKey] || {};
        for (const subKey of Object.keys(storedBucket)) {
          baseBucket[subKey] = mergeThemeLeaf(baseBucket[subKey], storedBucket[subKey]);
        }
        for (const prop of Object.keys(storedGroup)) {
          if (prop === 'themes' || prop === 'holidays') continue;
          const val = storedGroup[prop];
          if (Array.isArray(val)) baseGroup[prop] = val.slice();
          else if (val && typeof val === 'object') baseGroup[prop] = mergePlainObject(baseGroup[prop], val);
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

function loadThemesFromStorage() {
  if (!hasCoreBuiltins(themes)) {
    resetThemesToBuiltins('missing core themes before storage merge');
  }
  const storedThemes = localStorage.getItem('photoboothThemes');
  if (storedThemes) {
    try {
      const parsed = JSON.parse(storedThemes);
      mergeStoredThemes(themes, parsed);
      fixBuiltinThemePlacements(themes);
      ensureBuiltinThemes();
      try { normalizeAllThemes(); } catch (_e) { }
      if (!hasCoreBuiltins(themes)) {
        resetThemesToBuiltins('stored themes missing core entries');
      }
    } catch (err) {
      console.warn('Failed to parse stored themes', err);
    }
  }
  // Attempt remote load and prefer remote if available
  loadThemesRemote().catch(() => { });
}

// Folder import (device-only) helpers
async function handleOverlayFolderPick(e) {
  const key = getSelectedThemeKey(); const target = getSelectedThemeTarget();
  if (!key || !target) { alert('Select a theme first.'); e.target.value = ''; return; }
  const files = Array.from(e.target.files || []).filter(f => /^image\//i.test(f.type));
  if (!files.length) { e.target.value = ''; return; }
  if (!Array.isArray(target.overlays)) target.overlays = [];
  const promises = files.map(f => uploadAsset(f, 'overlays').then(u => { if (u) target.overlays.push(u); }));
  await Promise.all(promises);
  try { normalizeThemeObject(target); } catch (_e) { }
  saveThemesToStorage();
  loadTheme(key);
  syncThemeEditorWithActiveTheme();
  showToast(`Imported ${files.length} overlays`);
  e.target.value = '';
}

async function handleTemplateFolderPick(e) {
  const key = getSelectedThemeKey(); const target = getSelectedThemeTarget();
  if (!key || !target) { alert('Select a theme first.'); e.target.value = ''; return; }
  const files = Array.from(e.target.files || []).filter(f => /^image\//i.test(f.type));
  if (!files.length) { e.target.value = ''; return; }
  if (!Array.isArray(target.templates)) target.templates = [];
  const promises = files.map(f => uploadAsset(f, 'templates').then(u => { if (u) target.templates.push({ src: u, layout: 'double_column' }); }));
  await Promise.all(promises);
  try { normalizeThemeObject(target); } catch (_e) { }
  saveThemesToStorage();
  loadTheme(key);
  syncThemeEditorWithActiveTheme();
  showToast(`Imported ${files.length} templates`);
  e.target.value = '';
}

// --- Font Management ---
function getStoredFonts() {
  try {
    const raw = localStorage.getItem('photoboothFonts');
    const local = raw ? JSON.parse(raw) : [];
    // Fire-and-forget remote merge
    loadFontsRemote().then(remote => {
      if (Array.isArray(remote) && remote.length) {
        const merged = mergeFonts(local, remote);
        localStorage.setItem('photoboothFonts', JSON.stringify(merged));
      }
    }).catch(() => { });
    return local;
  } catch (e) { return []; }
}
function saveStoredFonts(fonts) {
  localStorage.setItem('photoboothFonts', JSON.stringify(fonts));
  syncFontsRemote(fonts).catch(() => { });
}
function slugifyFontName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function primaryFontFamily(fontStr) {
  if (!fontStr) return '';
  const m = fontStr.match(/'([^']+)'/);
  if (m) return m[1];
  return fontStr.split(',')[0].trim();
}
function ensureFontLoadedForFontString(fontStr) {
  const fam = primaryFontFamily(fontStr);
  if (fam) ensureFontLoaded(fam, true);
}
function ensureFontLoaded(family, storeIfNew = false) {
  const fam = family.replace(/^['"]|['"]$/g, '').trim();
  if (!fam) return;
  const id = 'gf-' + slugifyFontName(fam);
  if (!document.getElementById(id)) {
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}&display=swap`;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);
  }
  if (storeIfNew) {
    const fonts = getStoredFonts();
    if (!fonts.find(f => f.type === 'family' && f.value.toLowerCase() === fam.toLowerCase())) {
      fonts.push({ type: 'family', value: fam });
      saveStoredFonts(fonts);
      updateFontSuggestions();
      renderCurrentFonts();
    }
  }
}
function addFontByFamily() {
  const fam = (DOM.addFontFamily.value || '').replace(/^['"]|['"]$/g, '').trim();
  if (!fam) { alert('Enter a font family name.'); return; }
  ensureFontLoaded(fam, true);
  alert(`Added Google Font: ${fam}`);
}
function addFontByUrl() {
  const url = (DOM.addFontUrl.value || '').trim();
  if (!url) { alert('Paste a Google Fonts CSS URL.'); return; }
  try { new URL(url); } catch (e) { alert('Invalid URL.'); return; }
  const id = 'gf-url-' + btoa(url).replace(/=/g, '');
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = url;
    document.head.appendChild(link);
  }
  const fonts = getStoredFonts();
  if (!fonts.find(f => f.type === 'url' && f.value === url)) {
    // Try to extract family from URL for suggestions
    let famLabel = '';
    try {
      const u = new URL(url);
      const fam = u.searchParams.get('family');
      famLabel = fam ? fam.split(':')[0].replace(/\+/g, ' ') : '';
    } catch (_e) { }
    fonts.push({ type: 'url', value: url, label: famLabel });
    saveStoredFonts(fonts);
  }
  updateFontSuggestions();
  renderCurrentFonts();
  alert('Font URL added.');
}
function updateFontSuggestions() {
  const dl = document.getElementById('fontSuggestions');
  if (!dl) return;
  // Keep the first few defaults, then add new ones
  dl.innerHTML = '';
  const defaults = ["'Comic Neue', cursive", "'Creepster', cursive", 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'];
  defaults.forEach(v => { const o = document.createElement('option'); o.value = v; dl.appendChild(o); });
  const fonts = getStoredFonts();
  fonts.forEach(f => {
    const fam = f.type === 'family' ? f.value : (f.label || '').trim();
    if (fam) { const o = document.createElement('option'); o.value = `'${fam}', cursive`; dl.appendChild(o); }
  });
}
function renderCurrentFonts() {
  if (!DOM.currentFonts) return;
  const fonts = getStoredFonts();
  if (fonts.length === 0) { DOM.currentFonts.textContent = 'No added fonts yet.'; return; }
  const parts = fonts.map(f => f.type === 'family' ? f.value : (f.label || 'Custom URL'));
  DOM.currentFonts.textContent = `Available fonts: ${parts.join(', ')}`;
}
function loadFontsFromStorage() {
  const fonts = getStoredFonts();
  fonts.forEach(f => {
    if (f.type === 'family') ensureFontLoaded(f.value, false);
    if (f.type === 'url') {
      const id = 'gf-url-' + btoa(f.value).replace(/=/g, '');
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id; link.rel = 'stylesheet'; link.href = f.value;
        document.head.appendChild(link);
      }
    }
  });
  updateFontSuggestions();
  renderCurrentFonts();
  populateFontSelect(primaryFontFamily(activeTheme && activeTheme.font || ''));
}

function setThemeEditorMode(mode) {
  const isCreate = mode === 'create' || (DOM.themeModeCreate && DOM.themeModeCreate.checked);
  // Toggle buttons
  if (DOM.btnUpdateTheme) DOM.btnUpdateTheme.style.display = isCreate ? 'none' : 'inline-block';
  if (DOM.btnSaveTheme) DOM.btnSaveTheme.style.display = isCreate ? 'inline-block' : 'none';
  // Toggle existing-theme dropdown
  const row = document.getElementById('editorSelectRow');
  if (row) row.style.display = isCreate ? 'none' : 'flex';
  // Prepare fields
  if (isCreate) {
    // Clear inputs for new theme
    if (DOM.themeName) DOM.themeName.value = '';
    if (DOM.themeWelcomeTitle) DOM.themeWelcomeTitle.value = '';
    if (DOM.themeWelcomePrompt) DOM.themeWelcomePrompt.value = '';
    if (DOM.themeBackground) DOM.themeBackground.value = '';
    if (DOM.themeLogo) DOM.themeLogo.value = '';
    if (DOM.themeOverlays) DOM.themeOverlays.value = '';
    if (DOM.themeTemplates) DOM.themeTemplates.value = '';
    if (DOM.summaryBackground) DOM.summaryBackground.textContent = '';
    if (DOM.summaryLogo) DOM.summaryLogo.textContent = '';
    if (DOM.summaryOverlays) DOM.summaryOverlays.textContent = '';
    if (DOM.summaryTemplates) DOM.summaryTemplates.textContent = '';
    // Reset colors and font select
    if (DOM.themeAccent) DOM.themeAccent.value = '#ff0000';
    if (DOM.themeAccent2) DOM.themeAccent2.value = '#ffffff';
    populateFontSelect('Comic Neue');
  } else {
    // Editing existing: ensure dropdown is in sync and fields reflect the active theme
    syncEditorThemeDropdown();
    if (DOM.themeEditorSelect && DOM.eventSelect) DOM.themeEditorSelect.value = DOM.eventSelect.value;
    syncThemeEditorWithActiveTheme();
  }
  updateThemeEditorSummary();
}

function populateFontSelect(preselectFamily = '') {
  const sel = DOM.themeFontSelect;
  if (!sel) return;
  const defaults = ["Comic Neue", "Creepster", "system-ui"];
  const set = new Set(defaults);
  const stored = getStoredFonts();
  stored.forEach(f => {
    if (f.type === 'family') set.add(f.value);
    if (f.type === 'url' && f.label) set.add(f.label);
  });
  const families = Array.from(set);
  sel.innerHTML = '';
  families.forEach(f => {
    const o = document.createElement('option');
    o.value = f; o.textContent = f;
    sel.appendChild(o);
  });
  if (preselectFamily) {
    const idx = families.findIndex(x => x.toLowerCase() === preselectFamily.toLowerCase());
    if (idx >= 0) sel.selectedIndex = idx; else sel.selectedIndex = 0;
  } else {
    sel.selectedIndex = 0;
  }
}

// --- Editing Existing Themes ---
function getSelectedThemeKey() {
  // Prefer the Theme Editor selection if present; fallback to main event select
  const editorKey = (DOM.themeEditorSelect && DOM.themeEditorSelect.value) ? DOM.themeEditorSelect.value : '';
  const key = editorKey || DOM.eventSelect.value;
  return key;
}
function getSelectedThemeTarget() {
  const key = getSelectedThemeKey();
  if (!key) return null;
  if (key.includes(':')) {
    const [rootKey, subKey] = key.split(':');
    const root = themes[rootKey];
    if (!root) return null;
    if (root.themes && root.themes[subKey]) return root.themes[subKey];
    if (root.holidays && root.holidays[subKey]) return root.holidays[subKey];
    return null;
  }
  return themes[key] || null;
}

async function updateSelectedTheme() {
  const key = getSelectedThemeKey();
  const target = getSelectedThemeTarget();
  if (!key || !target) { alert('Select a theme first.'); return; }

  target.name = DOM.themeName.value || target.name;
  target.accent = DOM.themeAccent.value || target.accent;
  target.accent2 = DOM.themeAccent2.value || target.accent2;
  // Update font if a selection exists (avoid undefined access)
  if (DOM.themeFontSelect && DOM.themeFontSelect.value) {
    const fam = DOM.themeFontSelect.value.trim();
    if (fam) target.font = `'${fam}', cursive`;
  }
  target.welcome = target.welcome || {};
  target.welcome.title = DOM.themeWelcomeTitle.value || target.welcome.title || '';
  target.welcome.prompt = DOM.themeWelcomePrompt.value || target.welcome.prompt || '';

  const backgroundFile = DOM.themeBackground.files[0];
  const logoFile = DOM.themeLogo.files[0];
  const overlayFiles = DOM.themeOverlays.files;
  const templateFiles = DOM.themeTemplates.files;
  const templatesFolder = DOM.themeTemplatesFolder && DOM.themeTemplatesFolder.value ? DOM.themeTemplatesFolder.value.trim() : '';
  const overlaysFolder = DOM.themeOverlaysFolder && DOM.themeOverlaysFolder.value ? DOM.themeOverlaysFolder.value.trim() : '';

  const filePromises = [];
  if (backgroundFile) filePromises.push(uploadAsset(backgroundFile, 'backgrounds').then(url => {
    if (!url) return;
    if (Array.isArray(target.backgrounds)) target.backgrounds.push(url);
    else if (target.background) { target.backgrounds = [target.background, url]; delete target.backgroundIndex; }
    else target.background = url;
  }));
  if (logoFile) filePromises.push(uploadAsset(logoFile, 'logo').then(url => { if (url) target.logo = url; }));
  if (overlayFiles && overlayFiles.length > 0) {
    if (!Array.isArray(target.overlays)) target.overlays = [];
    for (const f of overlayFiles) filePromises.push(uploadAsset(f, 'overlays').then(url => { if (url) target.overlays.push(url); }));
  }
  // Store folder path if provided
  if (typeof overlaysFolder === 'string') {
    const cleaned = overlaysFolder ? (overlaysFolder.endsWith('/') ? overlaysFolder : overlaysFolder + '/') : '';
    if (cleaned) target.overlaysFolder = cleaned; else delete target.overlaysFolder;
  }
  if (templateFiles && templateFiles.length > 0) {
    if (!Array.isArray(target.templates)) target.templates = [];
    for (const f of templateFiles) filePromises.push(uploadAsset(f, 'templates').then(url => { if (url) target.templates.push({ src: url, layout: 'double_column' }); }));
  }
  // Store templates folder path if provided
  if (typeof templatesFolder === 'string') {
    const cleaned = templatesFolder ? (templatesFolder.endsWith('/') ? templatesFolder : templatesFolder + '/') : '';
    if (cleaned) target.templatesFolder = cleaned; else delete target.templatesFolder;
  }

  await Promise.all(filePromises);
  // Dedupe and strip empty items before persisting
  try { normalizeThemeObject(target); } catch (_e) { }
  saveThemesToStorage();

  // Keep selections in sync and rebuild options
  populateThemeSelector(key);
  if (DOM.eventSelect) DOM.eventSelect.value = key;
  if (DOM.themeEditorSelect) DOM.themeEditorSelect.value = key;

  // Refresh UI and options
  loadTheme(key);

  // Clear file inputs and refresh summaries
  if (DOM.themeBackground) DOM.themeBackground.value = '';
  if (DOM.themeLogo) DOM.themeLogo.value = '';
  if (DOM.themeOverlays) DOM.themeOverlays.value = '';
  if (DOM.themeTemplates) DOM.themeTemplates.value = '';
  syncThemeEditorWithActiveTheme();
  showToast('Theme updated');
}

// --- De-duplication helpers ---
function arrayUniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const s = (v || '').toString().trim();
    if (!s) continue;
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}
function arrayUniqueTemplates(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const t of arr) {
    if (!t || !t.src) continue;
    const s = t.src.toString().trim();
    if (!s) continue;
    if (!seen.has(s)) { seen.add(s); out.push({ src: s, layout: t.layout || 'double_column', slots: t.slots }); }
  }
  return out;
}
function normalizeThemeObject(t) {
  if (!t || typeof t !== 'object') return;
  if (Array.isArray(t.overlays)) t.overlays = arrayUniqueStrings(t.overlays);
  if (Array.isArray(t.templates)) t.templates = arrayUniqueTemplates(t.templates);
  // Background normalization: ensure index in range
  const list = Array.isArray(t.backgrounds) ? t.backgrounds.filter(Boolean) : (t.background ? [t.background] : []);
  if (Array.isArray(t.backgrounds)) {
    t.backgrounds = arrayUniqueStrings(list);
    if (typeof t.backgroundIndex === 'number') {
      t.backgroundIndex = Math.min(Math.max(t.backgroundIndex, 0), Math.max(t.backgrounds.length - 1, 0));
    }
  } else if (t.background && typeof t.background === 'string' && !t.background.trim()) {
    t.background = '';
  }
}
function normalizeAllThemes() {
  const keys = Object.keys(themes || {});
  for (const k of keys) {
    const group = themes[k];
    if (!group || typeof group !== 'object') continue;
    if (group.themes || group.holidays) {
      const dict = group.themes || group.holidays;
      for (const sk in dict) normalizeThemeObject(dict[sk]);
    } else {
      normalizeThemeObject(group);
    }
  }
}

// Update only the font for the currently selected theme and persist to storage
function updateCurrentThemeFont() {
  const key = DOM.eventSelect.value;
  const selectedFamily = DOM.themeFontSelect && DOM.themeFontSelect.value ? DOM.themeFontSelect.value.trim() : '';
  if (!key) { alert('Please select a theme first.'); return; }
  if (!selectedFamily) { alert('Please choose a font family.'); return; }
  let target = null;
  if (key.includes(':')) {
    const [rootKey, subKey] = key.split(':');
    const root = themes[rootKey];
    if (!root) { alert('Invalid theme selection.'); return; }
    if (root.themes && root.themes[subKey]) target = root.themes[subKey];
    else if (root.holidays && root.holidays[subKey]) target = root.holidays[subKey];
  } else {
    target = themes[key];
  }
  if (!target) { alert('Theme not found.'); return; }
  // Compose a font string using the primary family from the select
  const fam = selectedFamily;
  target.font = `'${fam}', cursive`;
  saveThemesToStorage();
  // Load and remember the font so it appears immediately and later
  ensureFontLoaded(fam, true);
  loadTheme(key);
  showToast('Font updated');
}

// --- Remove asset handlers ---
function removeBackground() {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (!list.length) return;
  if (!Array.isArray(t.backgrounds)) t.backgrounds = list.slice();
  const idx = (typeof t.backgroundIndex === 'number') ? Math.min(Math.max(t.backgroundIndex, 0), t.backgrounds.length - 1) : 0;
  if (t.backgrounds[idx]) pushRemoved(key, 'background', t.backgrounds[idx], idx);
  t.backgrounds.splice(idx, 1);
  if (t.backgrounds.length === 0) { t.background = ""; delete t.backgrounds; delete t.backgroundIndex; }
  else {
    t.backgroundIndex = Math.min(idx, t.backgrounds.length - 1);
    t.background = t.backgrounds[t.backgroundIndex] || '';
  }
  saveThemesToStorage(); loadTheme(key);
  showToast('Background removed');
}
function removeBackgroundAt(index) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (index < 0 || index >= list.length) return;
  if (!Array.isArray(t.backgrounds)) t.backgrounds = list.slice();
  if (t.backgrounds[index]) pushRemoved(key, 'background', t.backgrounds[index], index);
  t.backgrounds.splice(index, 1);
  if (t.backgrounds.length === 0) {
    t.background = ""; delete t.backgrounds; delete t.backgroundIndex;
  } else {
    if (typeof t.backgroundIndex !== 'number') t.backgroundIndex = 0;
    if (index <= t.backgroundIndex) t.backgroundIndex = Math.max(0, t.backgroundIndex - 1);
    t.background = t.backgrounds[t.backgroundIndex] || '';
  }
  saveThemesToStorage(); loadTheme(key);
}
function setBackgroundIndex(index) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return;
  const list = getBackgroundList(t);
  if (index < 0 || index >= list.length) return;
  t.backgrounds = list.slice();
  t.background = t.backgrounds[index] || '';
  t.backgroundIndex = index;
  saveThemesToStorage(); loadTheme(key); showToast('Background selected');
}
function removeLogo() {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return; if (t.logo) pushRemoved(key, 'logo', t.logo, 0); t.logo = ""; saveThemesToStorage(); loadTheme(key);
  showToast('Logo removed');
}
function removeOverlay(index) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t || !Array.isArray(t.overlays)) return; const removed = t.overlays.splice(index, 1)[0]; pushRemoved(key, 'overlay', removed, index); saveThemesToStorage(); loadTheme(key);
  showToast('Overlay removed');
}
function removeTemplate(index) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t || !Array.isArray(t.templates)) return; const removed = t.templates.splice(index, 1)[0]; pushRemoved(key, 'template', removed, index); saveThemesToStorage(); loadTheme(key);
  showToast('Template removed');
}

// Hide a folder-based overlay/template by adding it to a per-theme blocklist
function removeFolderOverlay(src) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return; if (!Array.isArray(t.overlaysRemoved)) t.overlaysRemoved = [];
  if (!t.overlaysRemoved.includes(src)) t.overlaysRemoved.push(src);
  pushRemoved(key, 'overlay-removed', src, -1);
  saveThemesToStorage(); loadTheme(key);
  showToast('Overlay hidden');
}
function removeFolderTemplate(src) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return; if (!Array.isArray(t.templatesRemoved)) t.templatesRemoved = [];
  if (!t.templatesRemoved.includes(src)) t.templatesRemoved.push(src);
  pushRemoved(key, 'template-removed', src, -1);
  saveThemesToStorage(); loadTheme(key);
  showToast('Template hidden');
}

function reorderAssets(kind, from, to) {
  const key = DOM.eventSelect.value; const t = getSelectedThemeTarget();
  if (!t) return;
  const arr = kind === 'overlay' ? t.overlays : t.templates;
  if (!Array.isArray(arr)) return;
  const len = arr.length; if (from < 0 || from >= len || to < 0 || to >= len) return;
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  saveThemesToStorage();
  loadTheme(key);
  showToast('Order updated');
}

function pushRemoved(key, kind, item, index) {
  removedStack.push({ key, kind, item, index });
  updateUndoUI();
}
function updateUndoUI() {
  const btn = document.getElementById('undoBtn');
  const count = document.getElementById('undoCount');
  if (btn) btn.disabled = removedStack.length === 0;
  if (count) count.textContent = removedStack.length ? `(${removedStack.length})` : '';
}
function getThemeByKey(key) {
  if (!key) return null;
  if (key.includes(':')) {
    const [rootKey, subKey] = key.split(':');
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
  const t = getThemeByKey(last.key);
  if (!t) { updateUndoUI(); return; }
  if (last.kind === 'background') t.background = last.item;
  else if (last.kind === 'logo') t.logo = last.item;
  else if (last.kind === 'overlay') {
    if (!Array.isArray(t.overlays)) t.overlays = [];
    const pos = Math.min(last.index, t.overlays.length);
    t.overlays.splice(pos, 0, last.item);
  } else if (last.kind === 'template') {
    if (!Array.isArray(t.templates)) t.templates = [];
    const pos = Math.min(last.index, t.templates.length);
    t.templates.splice(pos, 0, last.item);
  } else if (last.kind === 'overlay-removed') {
    if (Array.isArray(t.overlaysRemoved)) t.overlaysRemoved = t.overlaysRemoved.filter(s => s !== last.item);
  } else if (last.kind === 'template-removed') {
    if (Array.isArray(t.templatesRemoved)) t.templatesRemoved = t.templatesRemoved.filter(s => s !== last.item);
  }
  saveThemesToStorage();
  if (DOM.eventSelect && DOM.eventSelect.value === last.key) {
    loadTheme(last.key);
  }
  updateUndoUI();
  showToast('Restored');
}

function getBackgroundList(theme) {
  if (!theme || typeof theme !== 'object') return [];
  const explicit = Array.isArray(theme.backgrounds) ? theme.backgrounds.filter(Boolean) : [];
  const folder = Array.isArray(theme.backgroundsTmp) ? theme.backgroundsTmp.filter(Boolean) : [];
  if (explicit.length || folder.length) {
    const seen = new Set();
    const combined = [];
    for (const src of [...folder, ...explicit]) {
      const key = (src || '').toString();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      combined.push(src);
    }
    return combined;
  }
  const single = (typeof theme.background === 'string' && theme.background.trim()) ? [theme.background] : [];
  return single;
}

function getActiveBackground(theme) {
  const list = getBackgroundList(theme);
  if (list.length === 0) return '';
  const idx = (typeof theme.backgroundIndex === 'number') ? Math.min(Math.max(theme.backgroundIndex, 0), list.length - 1) : 0;
  return list[idx];
}

function ensureFolderPath(path) {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : trimmed + '/';
}

function resolveBackgroundFolderPath(theme) {
  if (!theme || typeof theme !== 'object') return '';
  const current = getActiveBackground(theme) || '';
  if (current && current.endsWith('/')) return ensureFolderPath(current);
  if (current) {
    const idx = current.lastIndexOf('/');
    if (idx >= 0) return ensureFolderPath(current.slice(0, idx + 1));
  }
  const backgroundProp = (typeof theme.background === 'string') ? theme.background.trim() : '';
  if (backgroundProp) {
    if (backgroundProp.endsWith('/')) return ensureFolderPath(backgroundProp);
    const idx = backgroundProp.lastIndexOf('/');
    if (idx >= 0) return ensureFolderPath(backgroundProp.slice(0, idx + 1));
  }
  const folderProp = (typeof theme.backgroundFolder === 'string') ? theme.backgroundFolder.trim() : '';
  if (folderProp) return ensureFolderPath(folderProp);
  return '';
}

// If a theme points its background at a folder (ends with '/'),
// pick the first existing image named one of: background.(png|jpg|jpeg|webp) or bg.(...)
async function resolveBackgroundFromFolder(theme) {
  try {
    const path = resolveBackgroundFolderPath(theme);
    if (!path || !path.endsWith('/')) return '';
    const names = ['background', 'bg', 'backdrop', 'wallpaper'];
    const exts = ['png', 'jpg', 'jpeg', 'webp'];
    const isFileProto = String(location.protocol).startsWith('file');
    for (const n of names) {
      for (const e of exts) {
        const url = path + n + '.' + e;
        try {
          if (isFileProto) {
            // Probe with Image() under file:// since fetch may be blocked
            await probeImage(url);
            return url;
          } else {
            const resp = await fetch(url, { cache: 'reload' });
            if (resp && resp.ok) return url;
          }
        } catch (_) { /* try next */ }
      }
    }
    return '';
  } catch (_) { return ''; }
}

// Try to load a list of backgrounds from a folder via backgrounds.json.
// backgrounds.json format: ["file1.jpg", "file2.png", ...] or [{"src":"file1.jpg"}, ...]
async function resolveBackgroundListFromFolder(theme) {
  try {
    const path = resolveBackgroundFolderPath(theme);
    if (!path || !path.endsWith('/')) return [];
    // Only try fetching manifest under http(s). Browsers restrict file:// fetch.
    if (!String(location.protocol).startsWith('http')) return [];
    const manifestUrl = path + 'backgrounds.json';
    const resp = await fetch(manifestUrl, { cache: 'reload' });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === 'string') out.push(path + it);
        else if (it && typeof it === 'object' && typeof it.src === 'string') out.push(path + it.src);
      }
    }
    return out;
  } catch (_) { return []; }
}

function probeImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => reject(new Error('not-found'));
    img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
  });
}

// Load overlays from a folder using overlays.json manifest (HTTP/HTTPS only)
async function resolveOverlaysFromFolder(theme) {
  try {
    const folder = (theme && typeof theme.overlaysFolder === 'string') ? theme.overlaysFolder : '';
    if (!folder || !folder.endsWith('/')) return [];
    if (!String(location.protocol).startsWith('http')) return [];
    const url = folder + 'overlays.json';
    const resp = await fetch(url, { cache: 'reload' });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === 'string') out.push(folder + it);
        else if (it && typeof it === 'object' && typeof it.src === 'string') out.push(folder + it.src);
      }
    }
    return out;
  } catch (_) { return []; }
}

// Load templates from a folder using templates.json manifest (HTTP/HTTPS only)
async function resolveTemplatesFromFolder(theme) {
  try {
    const folder = (theme && typeof theme.templatesFolder === 'string') ? theme.templatesFolder : '';
    if (!folder || !folder.endsWith('/')) return [];
    if (!String(location.protocol).startsWith('http')) return [];
    const url = folder + 'templates.json';
    const resp = await fetch(url, { cache: 'reload' });
    if (!resp.ok) return [];
    const json = await resp.json();
    const out = [];
    if (Array.isArray(json)) {
      for (const it of json) {
        if (typeof it === 'string') out.push({ src: folder + it, layout: 'double_column' });
        else if (it && typeof it === 'object' && typeof it.src === 'string') out.push({ src: folder + it.src, layout: it.layout || 'double_column', slots: it.slots });
      }
    }
    return out;
  } catch (_) { return []; }
}

function exportThemes() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(themes));
  const downloadAnchorNode = document.createElement('a');
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
      themes = { ...themes, ...importedThemes };
      saveThemesToStorage();
      const current = DOM.eventSelect && DOM.eventSelect.value;
      populateThemeSelector(current || DEFAULT_THEME_KEY);
      alert('Themes imported successfully!');
    } catch (e) {
      alert('Error importing themes: ' + e.message);
    }
  };
  reader.readAsText(file);
}

// --- Deploy Hook (Git-connected projects) ---
function loadDeploySettings() {
  if (DOM.deployHookUrl) DOM.deployHookUrl.value = localStorage.getItem('deployHookUrl') || '';
}

// --- Rebuild manifests helper (local)
function rebuildManifestsUI() {
  const cmd = 'npm run update-manifests';
  try { navigator.clipboard.writeText(cmd); } catch (_) { }
  alert('To rebuild overlays/templates/backgrounds manifests, run:\n\n' + cmd + '\n\nThen deploy: npm run deploy or use Deploy Now (Git hooks).');
}
function saveDeploySettings() {
  if (DOM.deployHookUrl) localStorage.setItem('deployHookUrl', (DOM.deployHookUrl.value || '').trim());
  showToast('Deploy hook saved');
}
async function triggerDeployHook() {
  try {
    const url = (DOM.deployHookUrl && DOM.deployHookUrl.value || '').trim() || localStorage.getItem('deployHookUrl') || '';
    if (!url) { alert('Set Deploy Hook URL first.'); return; }
    const r = await fetch(url, { method: 'POST' });
    if (r.ok) showToast('Deploy triggered'); else showToast('Deploy failed: ' + r.status);
  } catch (e) { showToast('Deploy error: ' + (e && e.message ? e.message : e)); }
}

function copyText(s) { try { navigator.clipboard.writeText(s); showToast('Copied'); } catch (_) { alert('Copy: ' + s); } }
function copyBuildCmd() { copyText('npm ci && node tools/update-manifests.js && echo skip'); }
function copyShipCmd() { copyText('npm run ship'); }

// Helpers to derive overlay/template lists from theme + folder manifests
function getOverlayList(theme) {
  if (!theme || typeof theme !== 'object') return [];
  const removed = new Set(Array.isArray(theme.overlaysRemoved) ? theme.overlaysRemoved : []);
  const folderArr = Array.isArray(theme.overlaysTmp)
    ? theme.overlaysTmp.filter(u => !removed.has(u)).map(u => ({ src: u, __folder: true }))
    : [];
  const localArr = Array.isArray(theme.overlays)
    ? theme.overlays.map(u => (typeof u === 'string' ? { src: u } : u))
    : [];
  const seen = new Set();
  const out = [];
  for (const o of [...folderArr, ...localArr]) {
    const k = (o && o.src ? o.src : '').toString().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(o);
  }
  return out;
}

function getTemplateList(theme) {
  if (!theme || typeof theme !== 'object') return [];
  const removed = new Set(Array.isArray(theme.templatesRemoved) ? theme.templatesRemoved : []);
  const folderArr = Array.isArray(theme.templatesTmp)
    ? theme.templatesTmp.filter(t => t && t.src && !removed.has(t.src)).map(t => ({ src: t.src, layout: t.layout || 'double_column', slots: t.slots, __folder: true }))
    : [];
  const localArr = Array.isArray(theme.templates)
    ? theme.templates.map(t => ({ src: t.src, layout: t.layout || 'double_column', slots: t.slots }))
    : [];
  const seen = new Set();
  const out = [];
  for (const t of [...folderArr, ...localArr]) {
    const k = (t && t.src ? t.src : '').toString().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(t);
  }
  return out;
}

// --- PWA Install Button ---
function setupInstallPrompt() {
  let deferredPrompt = null;
  const btn = DOM.installBtn;
  if (btn) btn.classList.add('hidden');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btn) btn.classList.remove('hidden');
  });
  if (btn) btn.onclick = async () => {
    if (!deferredPrompt) {
      // iOS Safari has no beforeinstallprompt; show a hint
      alert('On iPhone/iPad: tap Share → Add to Home Screen');
      return;
    }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) { }
    deferredPrompt = null;
    btn.classList.add('hidden');
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
  updateSelectedTheme
});
