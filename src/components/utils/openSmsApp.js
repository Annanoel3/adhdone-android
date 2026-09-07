/**
 * Hand a message off to the phone's native messaging app.
 *
 * On device we fire the sms: intent from native (NotifyBridge.openExternal).
 * The old approach — clicking a hidden <a href="sms:..."> — works in a desktop
 * browser but Android does not reliably route script-initiated navigations to
 * non-http schemes, so on a phone the tap silently did nothing.
 */
export function openSmsApp(phone, message) {
  const body = encodeURIComponent(message || '');
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  const url = cleanPhone ? `sms:${cleanPhone}?body=${body}` : `sms:?body=${body}`;

  const bridge = window.Capacitor?.Plugins?.NotifyBridge;
  if (bridge?.openExternal) {
    bridge.openExternal({ url }).catch(() => {
      window.location.href = url;
    });
    return;
  }

  try {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  } catch (e) {
    window.location.href = url;
  }
}