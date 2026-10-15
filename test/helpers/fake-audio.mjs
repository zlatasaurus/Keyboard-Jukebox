// fake web audio + fake tracks, so DJ deck logic can be tested in node (no speakers needed)

export const SR = 44100;

// four-on-the-floor: 55Hz kick on every beat, hat on the off-beat, a bit of noise underneath
export function fakeTrack(bpm, { seconds = 30, offset = 0.2 } = {}) {
  const out = new Float32Array(SR * seconds);
  const beat = 60 / bpm;
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < out.length; i++) out[i] = rand() * 0.02;
  for (let t = offset; t < seconds; t += beat) {
    const start = Math.round(t * SR);
    for (let i = 0; i < SR * 0.15 && start + i < out.length; i++) {
      out[start + i] += Math.sin((2 * Math.PI * 55 * i) / SR) * Math.exp(-i / (SR * 0.04)) * 0.9;
    }
    const hat = Math.round((t + beat / 2) * SR);
    for (let i = 0; i < SR * 0.03 && hat + i < out.length; i++) out[hat + i] += rand() * 0.3 * Math.exp(-i / (SR * 0.008));
  }
  return out;
}

// looks enough like an AudioBuffer for the deck
export function fakeBuffer(data, sampleRate = SR) {
  return { duration: data.length / sampleRate, length: data.length, sampleRate, numberOfChannels: 1, getChannelData: () => data };
}

const param = (value = 0) => ({
  value,
  setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {},
});
const node = (extra = {}) => ({ connect() {}, disconnect() {}, ...extra });

// time only moves when the test says so: ctx.currentTime += 2
export function fakeContext() {
  const ctx = {
    currentTime: 0,
    sources: [],
    createGain: () => node({ gain: param(1) }),
    createBiquadFilter: () => node({ type: '', frequency: param(), Q: param(), gain: param() }),
    createDelay: () => node({ delayTime: param() }),
    createBuffer: (ch, length, sampleRate) => {
      const data = Array.from({ length: ch }, () => new Float32Array(length));
      return { duration: length / sampleRate, length, sampleRate, numberOfChannels: ch, getChannelData: (c) => data[c] };
    },
    createBufferSource() {
      const src = node({ playbackRate: param(1), loop: false, loopStart: 0, loopEnd: 0, started: null, stopped: false,
        start(when, offset) { this.started = offset; }, stop() { this.stopped = true; } });
      ctx.sources.push(src);
      return src;
    },
  };
  return ctx;
}
