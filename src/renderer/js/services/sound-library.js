// sound-library.js — the plug between the sound list, the audio engine, the upload db and the state
import * as audio from '../audio/engine.js';
import * as uploads from './uploads-db.js';
import { TYPING_SOUNDS, TRIGGERS, DEFAULT_TYPING, soundUrl } from '../config/sounds.js';
import { state, setState, setCfg, cfgOf } from '../state.js';

export const typingSounds = () => [...TYPING_SOUNDS, ...state.custom];
export const isUpload = (id) => state.custom.some(s => s.id === id);
export const triggerLabel = (t) => `${t.hint}: ${t.label}`;
export function labelOf(id) {
  const t = TRIGGERS.find(s => s.id === id);
  return t ? triggerLabel(t) : typingSounds().find(s => s.id === id)?.label || id;
}

// play any sound by id using its saved tweaks (or overrides, for live preview)
export function playSound(id, { override = null, ...opts } = {}) {
  audio.play(id, override || cfgOf(id), opts);
}

// boot: pull saved uploads back out of the db + load every built-in file in parallel
export async function loadAll() {
  const custom = [];
  try {
    for (const rec of await uploads.getAll()) {
      custom.push({ id: rec.id, label: rec.label });
      try { audio.setBuffer(rec.id, await audio.decode(rec.data.slice(0))); } catch {}
    }
  } catch {}
  setState({ custom });

  const ids = [...TYPING_SOUNDS.filter(s => !s.synth), ...TRIGGERS].map(s => s.id);
  await Promise.all(ids.map(id => audio.loadUrl(id, soundUrl(id))));
  console.log(`loaded ${audio.loadedCount()} sounds`);

  if (!typingSounds().some(s => s.id === state.currentTyping)) setState({ currentTyping: DEFAULT_TYPING });
}

// upload ur own sound. throws if the file isn't real audio
export async function addUpload(file) {
  const data = await file.arrayBuffer();
  const buf = await audio.decode(data.slice(0)); // decode once just to make sure its legit audio
  const id = 'custom-' + Date.now();
  const label = file.name.replace(/\.[^.]+$/, '').slice(0, 24);
  await uploads.put({ id, label, data });
  audio.setBuffer(id, buf);
  setState({ custom: [...state.custom, { id, label }], currentTyping: id });
  return { id, label };
}

export async function removeUpload(id) {
  await uploads.remove(id);
  audio.deleteBuffer(id);
  setCfg(id, null);
  setState({
    custom: state.custom.filter(s => s.id !== id),
    ...(state.currentTyping === id ? { currentTyping: DEFAULT_TYPING } : {}),
  });
}
