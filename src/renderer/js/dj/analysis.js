// analysis.js — figures out a track's BPM + where the beats land, and squishes it into a waveform.
// pure math on raw samples, no audio context needed (so node can test it)

// how "punchy" each lil slice of the track is. kicks = big spikes. we lowpass first so the
// kick drum does the talking instead of hi-hats
export function onsetEnvelope(channels, sampleRate, fps = 200) {
  const hop = Math.round(sampleRate / fps);
  const len = channels[0].length, n = Math.floor(len / hop);
  const a = 1 - Math.exp((-2 * Math.PI * 200) / sampleRate); // one-pole lowpass ~200Hz
  const env = new Float32Array(n);
  let lp = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    let e = 0;
    for (let j = i * hop, end = j + hop; j < end; j++) {
      let s = channels[0][j];
      if (channels[1]) s = (s + channels[1][j]) * 0.5;
      lp += a * (s - lp);
      e += lp * lp;
    }
    e = Math.sqrt(e / hop);
    env[i] = Math.max(0, e - prev); // only care when it gets LOUDER (that's a hit)
    prev = e;
  }
  return { env, fps: sampleRate / hop };
}

// returns { bpm, offset } (offset = seconds to the first beat), or null if its silence
export function detectBpm(channels, sampleRate, { min = 85, max = 175 } = {}) {
  const { env, fps } = onsetEnvelope(channels, sampleRate);
  const n = env.length;
  const minLag = Math.floor((60 * fps) / max), maxLag = Math.ceil((60 * fps) / min);
  if (n < maxLag * 4) return null; // too short to tell

  // autocorrelation: "if i shift the track by X, how much does it line up with itself"
  const score = new Float64Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let i = lag; i < n; i++) s += env[i] * env[i - lag];
    score[lag] = s / (n - lag);
  }
  let best = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) if (score[lag] > score[best]) best = lag;
  if (!(score[best] > 0)) return null;

  // parabola thru the 3 best points = sub-frame accuracy, way better than whole frames
  const l = score[best - 1], c = score[best], r = score[best + 1];
  const denom = l - 2 * c + r;
  const shift = denom ? Math.max(-0.5, Math.min(0.5, (0.5 * (l - r)) / denom)) : 0;
  const period = best + shift;

  let bpm = (60 * fps) / period;
  bpm = Math.abs(bpm - Math.round(bpm)) < 0.15 ? Math.round(bpm) : Math.round(bpm * 10) / 10;

  // phase: slide a comb of beats across one period, keep wherever it hits the most kicks
  let bestPhase = 0, bestHits = -1;
  for (let ph = 0; ph < period; ph++) {
    let hits = 0;
    for (let t = ph; t < n; t += period) hits += env[Math.round(t)] || 0;
    if (hits > bestHits) { bestHits = hits; bestPhase = ph; }
  }
  return { bpm, offset: bestPhase / fps };
}

// loudest sample per bucket, 0..1. this is what gets drawn as the waveform
export function computePeaks(channels, buckets = 1000) {
  const len = channels[0].length, size = Math.max(1, Math.floor(len / buckets));
  const peaks = new Float32Array(buckets);
  let top = 0;
  for (let b = 0; b < buckets; b++) {
    let m = 0;
    for (let i = b * size, end = Math.min(len, i + size); i < end; i += 4) { // every 4th sample is plenty for pixels
      for (const ch of channels) { const v = Math.abs(ch[i]); if (v > m) m = v; }
    }
    peaks[b] = m;
    if (m > top) top = m;
  }
  if (top > 0) for (let b = 0; b < buckets; b++) peaks[b] /= top; // quiet tracks still fill the box
  return peaks;
}
