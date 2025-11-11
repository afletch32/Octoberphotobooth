export function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

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

registerServiceWorker();
