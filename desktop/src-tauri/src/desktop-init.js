// Injected by the Tauri shell (src/lib.rs) into the main frame before the game
// loads. Plain ES2019, no imports: it must work without the web bundle.
(function () {
  if (window.__BEOMTADEW_DESKTOP_KEYS__) return;
  window.__BEOMTADEW_DESKTOP_KEYS__ = true;

  function tauri() {
    return window.__TAURI__ || null;
  }

  // F11 toggles fullscreen (browsers do this natively; a webview does not).
  window.addEventListener(
    'keydown',
    function (event) {
      if (event.key !== 'F11' || event.repeat) return;
      const api = tauri();
      if (!api || !api.window) return;
      event.preventDefault();
      const current = api.window.getCurrentWindow();
      current
        .isFullscreen()
        .then(function (on) {
          return current.setFullscreen(!on);
        })
        .catch(function () {});
    },
    true,
  );

  // target="_blank" / cross-origin links (credits, asset licences) would
  // otherwise do nothing or replace the game inside the webview.
  document.addEventListener(
    'click',
    function (event) {
      const start = event.target;
      const link = start && start.closest ? start.closest('a[href]') : null;
      if (!link || link.hasAttribute('download')) return;
      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (url.origin === location.origin) return;
      const api = tauri();
      if (!api || !api.opener) return;
      event.preventDefault();
      api.opener.openUrl(url.href).catch(function () {});
    },
    true,
  );
})();
