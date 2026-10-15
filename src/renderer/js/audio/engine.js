// engine.js — web audio setup: one audio context + one master volume knob + the buffer cache
// knows how to make noise, knows NOTHING about settings or the UI
import { SYNTHS } from './synth.js';
import { applyQuality } from './effects.js';

const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null, master = null, volume = 0.6;

const buffers = new Map(); // id -> decoded AudioBuffer, cached so playback is instant
const active = new Map();  // id -> currently playing source (so long sounds don't stack into a mess)

export function ensureAudio() {
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume(); // browsers love putting audio to sleep, wake it up
  return ctx;
}

// the master volume node, for other stuff (the DJ decks) to plug into
export function getOutput() {
  ensureAudio();
  return master;
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.value = v;
}

// ---- buffer cache ----
export const decode = (data) => ensureAudio().decodeAudioData(data);
export const getBuffer = (id) => buffers.get(id);
export const setBuffer = (id, buf) => buffers.set(id, buf);
export const deleteBuffer = (id) => buffers.delete(id);
export const loadedCount = () => buffers.size;

export async function loadUrl(id, url) {
  try {
    const r = await fetch(url);
    buffers.set(id, await decode(await r.arrayBuffer()));
  } catch (e) {
    console.log('couldnt load', id, e.message); // L but we keep going
  }
}

// where a sound goes before the master knob: straight there, or thru a stereo panner first
function output(pan) {
  if (!pan) return master;
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  p.connect(master);
  return p;
}

// play a sound with a given config { start, end, pitch, quality }
//   pan    -1 (left ear) .. 1 (right ear)
//   detune extra semitones on top of the saved pitch (humanize uses this)
export function play(id, cfg, { cutPrevious = false, pan = 0, detune = 0 } = {}) {
  if (!ctx) return;
  // 12 semitones = 1 octave, music theory moment
  const rate = Math.pow(2, ((cfg.pitch || 0) + detune) / 12);
  if (SYNTHS[id]) return SYNTHS[id](ctx, output(pan), rate);
  const buf = buffers.get(id);
  if (!buf) return; // not loaded, no sound, move on

  if (cutPrevious && active.has(id)) { try { active.get(id).stop(); } catch {} }

  const start = Math.min(cfg.start || 0, buf.duration - 0.01);
  const end = cfg.end == null ? buf.duration : Math.min(cfg.end, buf.duration);
  const len = Math.max(0.02, end - start);

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  applyQuality(ctx, src, cfg.quality).connect(output(pan));

  // sound plays `len` seconds of source audio, which is shorter/longer when pitched
  src.start(0, start, len);
  active.set(id, src);
  src.onended = () => { if (active.get(id) === src) active.delete(id); };
}
