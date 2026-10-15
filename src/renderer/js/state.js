// state.js — the one source of truth for the page. UI bits subscribe and redraw when stuff changes
import { DEFAULT_TYPING } from './config/sounds.js';

export const DEFAULT_CFG = { start: 0, end: null, pitch: 0, quality: 'high' }; // end:null = play to the end

export const state = {
  currentTyping: DEFAULT_TYPING,
  volume: 0.6,
  stereo: 0.6,   // 0 = everything dead center, 1 = Q in ur left ear, P in ur right
  humanize: 30,  // max random pitch wobble per key, in cents (100 = 1 semitone)
  enabled: true,
  djMode: false,       // keys + words also fire DJ commands
  djTarget: 'builtin', // where those go: 'builtin' (Keyboard Jukebox DJ) or 'mixxx' (MIDI)
  midiOut: '',         // name of the MIDI port we send to
  view: 'jukebox',     // which program is on screen: 'jukebox' or 'dj'
  custom: [], // uploads: [{id, label}]
  cfgs: {},   // id -> per-sound tweaks
};

const subs = new Set();

// patch the state, then tell everyone what changed so they only redraw what they care about
export function setState(patch) {
  Object.assign(state, patch);
  for (const fn of subs) fn(state, patch);
}
export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export const cfgOf = (id) => ({ ...DEFAULT_CFG, ...(state.cfgs[id] || {}) });
export function setCfg(id, cfg) {
  const cfgs = { ...state.cfgs };
  if (cfg) cfgs[id] = cfg; else delete cfgs[id];
  setState({ cfgs });
}
