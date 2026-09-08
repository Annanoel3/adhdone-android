/**
 * Open a place in the phone's maps app.
 *
 * In the Android WebView, window.open() spawns an empty inner webview (the
 * "white screen"), so on device we hand a geo: intent to native instead —
 * the same NotifyBridge path the SMS hand-off uses. On the web we just open
 * Google Maps in a new tab.
 */
export function openMapsApp(query) {
  const q = (query || '').trim();
  if (!q) return;

  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const bridge = window.Capacitor?.Plugins?.NotifyBridge;

  if (bridge?.openExternal) {
    bridge.openExternal({ url: `geo:0,0?q=${encodeURIComponent(q)}` })
      .catch(() => bridge.openExternal({ url: webUrl }).catch(() => {}));
    return;
  }

  window.open(webUrl, '_blank', 'noopener');
}