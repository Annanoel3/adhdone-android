import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Receives an IMAGE shared into the app natively (share sheet → screenshot,
// flyer, saved photo) via ShareBridge, reads it into a sentence with
// readImageCapture, then hands that sentence to Add Task — exactly the same
// destination as shared text. So a shared screenshot and a typed sentence walk
// the identical parser/scheduler path; nothing here decides dates or reminders.
//
// Native contract: { base64, mimeType }. A content:// URI can't be read from the
// WebView, so the bytes come across the bridge already encoded.
//
// Module-level so it survives remounts (every navigation remounts the layout).
// Without it, the pending image would be re-fetched after we navigate and read a
// second time — a duplicate task plus a wasted AI call.
let lastDelivered = { key: '', at: 0 };

function base64ToFile(base64, mimeType) {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const bytes = atob(clean);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
  return new File([buf], `shared-capture.${ext}`, { type: mimeType || 'image/jpeg' });
}

export default function SharedImageReceiver() {
  const navigate = useNavigate();

  useEffect(() => {
    const bridge = window.Capacitor?.Plugins?.ShareBridge;
    if (!bridge) return;

    const deliver = async (payload) => {
      const base64 = payload?.base64;
      if (!base64) return;

      // Dedupe on a cheap fingerprint of the bytes rather than the whole string.
      const key = `${base64.length}:${base64.slice(0, 64)}`;
      const now = Date.now();
      if (lastDelivered.key === key && now - lastDelivered.at < 60000) return;
      lastDelivered = { key, at: now };

      try {
        const file = base64ToFile(base64, payload.mimeType);
        const upload = await base44.integrations.Core.UploadFile({ file });
        if (!upload?.file_url) return;

        const res = await base44.functions.invoke('readImageCapture', { file_url: upload.file_url });
        const text = res?.data?.text;
        // No readable task in the image (a selfie, a meme) — drop it silently
        // rather than dumping a junk task on the user.
        if (!text) return;

        navigate('/AddTask', { state: { sharedText: text, sharedAt: Date.now() } });
      } catch (err) {
        console.error('Shared image capture failed:', err);
      }
    };

    // Cold start: shared before the web app was ready.
    bridge.getPendingSharedImage?.().then((res) => deliver(res)).catch(() => {});

    // Warm start: app already running when the share arrived.
    let handle;
    const sub = bridge.addListener?.('sharedImage', (e) => deliver(e));
    if (sub && typeof sub.then === 'function') sub.then((h) => { handle = h; });
    else handle = sub;

    return () => { handle?.remove?.(); };
  }, [navigate]);

  return null;
}