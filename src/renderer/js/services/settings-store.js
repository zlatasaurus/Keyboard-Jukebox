// settings-store.js — saved so ur tweaks survive closing the app (localStorage, same keys as always)
const KEYS = {
  cfgs: 'jukebox-cfgs', typing: 'jukebox-typing', volume: 'jukebox-vol',
  stereo: 'jukebox-stereo', humanize: 'jukebox-humanize',
  djMode: 'jukebox-dj', djTarget: 'jukebox-dj-target', midiOut: 'jukebox-midi-out',
  view: 'jukebox-view',
};
export const SAVED_FIELDS = ['cfgs', 'currentTyping', 'volume', 'stereo', 'humanize', 'djMode', 'djTarget', 'midiOut', 'view'];

const get = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const num = (key, out, field) => { const v = get(key); if (v !== null && !isNaN(+v)) out[field] = +v; };
// only take a saved string if its one we still recognize
const oneOf = (key, out, field, allowed) => { const v = get(key); if (allowed.includes(v)) out[field] = v; };

export function loadSettings() {
  const out = {};
  try { out.cfgs = JSON.parse(get(KEYS.cfgs)) || {}; } catch { out.cfgs = {}; }
  const t = get(KEYS.typing); if (t) out.currentTyping = t;
  num(KEYS.volume, out, 'volume');
  num(KEYS.stereo, out, 'stereo');
  num(KEYS.humanize, out, 'humanize');
  out.djMode = get(KEYS.djMode) === '1';
  oneOf(KEYS.djTarget, out, 'djTarget', ['builtin', 'mixxx']);
  out.midiOut = get(KEYS.midiOut) || '';
  oneOf(KEYS.view, out, 'view', ['jukebox', 'dj']);
  return out;
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEYS.cfgs, JSON.stringify(s.cfgs));
    localStorage.setItem(KEYS.typing, s.currentTyping);
    localStorage.setItem(KEYS.volume, String(s.volume));
    localStorage.setItem(KEYS.stereo, String(s.stereo));
    localStorage.setItem(KEYS.humanize, String(s.humanize));
    localStorage.setItem(KEYS.djMode, s.djMode ? '1' : '0');
    localStorage.setItem(KEYS.djTarget, s.djTarget);
    localStorage.setItem(KEYS.midiOut, s.midiOut);
    localStorage.setItem(KEYS.view, s.view);
  } catch {}
}
