// A timer alert that KEEPS GOING until the user actually does something.
// A single chime is the easiest thing in the world to miss, so the chosen sound
// loops and the phone re-buzzes on a repeating pattern. Any tap/keypress stops
// it, as does an explicit stopAlertLoop() from the popup's buttons.
//
// Vibration uses the browser vibrate API, which works inside the Android app
// (and does nothing on iOS/desktop). It buzzes even when the phone's ringer is
// on vibrate; it cannot override a full "Do Not Disturb"/silent state — that
// part would need native code.

import { COMPLETION_SOUNDS } from './completionSounds';

const BUZZ_PATTERN = [400, 200, 400, 700];
const BUZZ_EVERY_MS = 1800;
// Safety net: never buzz forever if the user walked away from the phone.
const MAX_MS = 2 * 60 * 1000;

let audio = null;
let buzzId = null;
let maxId = null;
let detach = null;

export function stopAlertLoop() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  if (buzzId) { clearInterval(buzzId); buzzId = null; }
  if (maxId) { clearTimeout(maxId); maxId = null; }
  try { navigator.vibrate?.(0); } catch {}
  if (detach) { detach(); detach = null; }
}

export function startAlertLoop(soundKey, urlOverride) {
  stopAlertLoop();

  const url = urlOverride || (COMPLETION_SOUNDS[soundKey] || COMPLETION_SOUNDS.joyful_melody).url;
  audio = new Audio(url);
  audio.loop = true;
  audio.play().catch(() => {});

  const buzz = () => { try { navigator.vibrate?.(BUZZ_PATTERN); } catch {} };
  buzz();
  buzzId = setInterval(buzz, BUZZ_EVERY_MS);
  maxId = setTimeout(stopAlertLoop, MAX_MS);

  const onAction = () => stopAlertLoop();
  window.addEventListener('pointerdown', onAction, true);
  window.addEventListener('keydown', onAction, true);
  detach = () => {
    window.removeEventListener('pointerdown', onAction, true);
    window.removeEventListener('keydown', onAction, true);
  };
}