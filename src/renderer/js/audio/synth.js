// synth.js — tiny synth helpers (only the "Mechanical" default uses these)

function tone(ctx, out, { type = 'sine', freq = 440, end = null, dur = 0.1, vol = 0.5 }) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (end) o.frequency.exponentialRampToValueAtTime(end, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(ctx, out, { dur = 0.05, vol = 0.5, freq = 2000 }) {
  const t = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; // pure static, no thoughts
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t);
}

// id -> fn(ctx, out, rate). sounds that get made from scratch instead of loaded from a file
// rate = pitch multiplier (1 = normal) so pitch + humanize work on synths too
export const SYNTHS = {
  mechanical(ctx, out, rate = 1) {
    noise(ctx, out, { dur: .04, vol: .7, freq: 1500 * rate });
    tone(ctx, out, { type: 'square', freq: 180 * rate, end: 80 * rate, dur: .05, vol: .25 });
  },

  // BWAP BWAP BWAAAAP. three detuned saws stacked into a chord, thru a lowpass so it doesnt shred ears
  airhorn(ctx, out) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    lp.connect(out);
    let t = ctx.currentTime + 0.01;
    for (const dur of [0.16, 0.16, 0.6]) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.015);
      g.gain.setValueAtTime(0.18, t + dur - 0.04);
      g.gain.linearRampToValueAtTime(0, t + dur);
      g.connect(lp);
      for (const f of [415, 523, 622]) {
        for (const detune of [-8, 8]) {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, t);
          o.frequency.linearRampToValueAtTime(f * 0.97, t + dur); // lil droop at the end, very air-horny
          o.detune.value = detune;
          o.connect(g); o.start(t); o.stop(t + dur + 0.02);
        }
      }
      t += dur + 0.07;
    }
  },
};
