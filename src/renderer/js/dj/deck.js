// deck.js — one turntable. plays a decoded track thru a 3-band EQ + fader, does cue / loops /
// hotcue / sync / brake / spinback. vinyl style: speeding up = pitch goes up too, like real decks
import { transportPosition, rampDistance, beatPhase, phaseNudge } from './transport.js';
import { detectBpm, computePeaks } from './analysis.js';

const BRAKE_TIME = 1.2; // seconds for the record to grind to a halt
const SPIN_TIME = 0.8;  // seconds of rewinding drama
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class Deck {
  constructor(ctx, { out, fxIn }) {
    this.ctx = ctx;

    // signal chain: track -> low -> mid -> high -> fader -> crossfader -> out
    //                                                  crossfader -> echo send -> fx bus
    const eq = (type, freq) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; return f; };
    this.eq = { low: eq('lowshelf', 250), mid: eq('peaking', 1000), high: eq('highshelf', 4000) };
    this.eq.mid.Q.value = 0.7;
    this.fader = ctx.createGain(); this.fader.gain.value = 0.9;
    this.xfade = ctx.createGain();
    this.send = ctx.createGain(); this.send.gain.value = 0;
    this.eq.low.connect(this.eq.mid); this.eq.mid.connect(this.eq.high); this.eq.high.connect(this.fader);
    this.fader.connect(this.xfade); this.xfade.connect(out);
    this.xfade.connect(this.send); this.send.connect(fxIn);

    this.buffer = null; this.reversed = null; this.title = '';
    this.beat = null; this.peaks = null;
    this.src = null; this.playing = false; this.rate = 1;
    this.anchorPos = 0; this.anchorTime = 0; // where we were + when, so we can do the math later
    this.cuePoint = 0; this.hotcue = null; this.loop = null; this.fxOn = false;
    this.ramp = null; this.previewing = false;
  }

  get duration() { return this.buffer ? this.buffer.duration : 0; }
  get bpm() { return this.beat ? this.beat.bpm : null; }               // the track's own tempo
  get liveBpm() { return this.bpm ? this.bpm * this.rate : null; }     // what it's playing at rn

  loadBuffer(buffer, title) {
    this._cancelRamp(); this._stopSource();
    const channels = [];
    for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) channels.push(buffer.getChannelData(c));
    this.buffer = buffer; this.reversed = null; this.title = title;
    this.peaks = computePeaks(channels, 1000);
    this.beat = detectBpm(channels, buffer.sampleRate);
    this.playing = false; this.anchorPos = 0; this.cuePoint = 0; this.hotcue = null; this.loop = null;
  }

  position() {
    if (this.ramp) {
      const { pos0, t0, T, r0, r1, dir } = this.ramp;
      return clamp(pos0 + dir * rampDistance(r0, r1, T, this.ctx.currentTime - t0), 0, this.duration);
    }
    if (!this.playing) return this.anchorPos;
    return Math.min(this.duration, transportPosition({
      anchorPos: this.anchorPos, elapsed: this.ctx.currentTime - this.anchorTime, rate: this.rate, loop: this.loop,
    }));
  }

  // ---- low level: web audio sources are single-use, so every play/seek makes a fresh one ----
  _startSource(pos) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = this.rate;
    if (this.loop) { src.loop = true; src.loopStart = this.loop.start; src.loopEnd = this.loop.end; }
    src.connect(this.eq.low);
    src.start(0, pos);
    this.src = src; this.anchorPos = pos; this.anchorTime = this.ctx.currentTime;
    // track ran out by itself -> park at the end
    src.onended = () => { if (this.src === src) { this.src = null; this.playing = false; this.anchorPos = this.duration; } };
  }
  _stopSource() {
    if (!this.src) return;
    this.src.onended = null;
    try { this.src.stop(); } catch {}
    this.src.disconnect();
    this.src = null;
  }
  // stop a brake / spinback halfway, leave the deck paused right where it is
  _cancelRamp() {
    if (!this.ramp) return;
    const pos = this.position();
    clearTimeout(this.ramp.timer);
    this.ramp = null; this._stopSource(); this.playing = false; this.anchorPos = pos;
  }
  _endRamp(resume) {
    const pos = this.position();
    this.ramp = null; this._stopSource(); this.playing = false; this.anchorPos = pos;
    if (resume) this.play();
  }
  // re-pin the anchor to "now" before changing speed/loops so the playhead math stays right
  _reanchor() {
    if (this.playing) { this.anchorPos = this.position(); this.anchorTime = this.ctx.currentTime; }
  }

  // ---- transport ----
  play() {
    if (!this.buffer) return;
    this._cancelRamp();
    if (this.playing) return;
    if (this.anchorPos >= this.duration - 0.01) this.anchorPos = 0; // ran off the end? start over
    this._startSource(this.anchorPos);
    this.playing = true;
  }
  pause() {
    this._cancelRamp();
    if (!this.playing) return;
    this.anchorPos = this.position(); this._stopSource(); this.playing = false;
  }
  togglePlay() { this.playing && !this.ramp ? this.pause() : this.play(); }

  seek(pos) {
    if (!this.buffer) return;
    this._cancelRamp();
    pos = clamp(pos, 0, this.duration);
    if (this.loop && (pos < this.loop.start || pos >= this.loop.end)) this.loop = null; // jumped out of the loop
    if (this.playing) { this._stopSource(); this._startSource(pos); } else this.anchorPos = pos;
  }

  setRate(rate) {
    if (this.ramp) return; // dont touch the speed mid-skid
    this._reanchor();
    this.rate = rate;
    if (this.src) this.src.playbackRate.value = rate;
  }

  // ---- cue: CDJ style. playing -> snap back to cue + stop. stopped -> drop the cue here ----
  cueTap() {
    if (!this.buffer) return;
    if (this.playing && !this.ramp) { this.pause(); this.seek(this.cuePoint); } else { this.pause(); this.cuePoint = this.position(); }
  }
  // the on-screen button supports holding: hold on the cue point = preview, let go = back to cue
  cuePress() {
    if (!this.buffer) return;
    if (this.playing && !this.ramp) { this.pause(); this.seek(this.cuePoint); return; }
    this.pause();
    if (Math.abs(this.position() - this.cuePoint) < 0.05) { this.previewing = true; this.play(); }
    else this.cuePoint = this.position();
  }
  cueRelease() {
    if (!this.previewing) return;
    this.previewing = false; this.pause(); this.seek(this.cuePoint);
  }

  // first press sets hotcue 1, after that it jumps there and plays
  hotcueGo() {
    if (!this.buffer) return;
    if (this.hotcue == null) { this.hotcue = this.position(); return; }
    this.seek(this.hotcue); this.play();
  }

  // beat-snapped loop: starts on the beat ur currently in, so it doesnt sound like a skipping cd
  toggleLoop(beats = 4) {
    if (!this.buffer || this.ramp) return;
    this._reanchor();
    if (this.loop) {
      this.loop = null;
    } else {
      if (!this.bpm) return; // no tempo = no idea how long a beat is
      const beat = 60 / this.bpm, pos = this.position();
      const start = Math.max(0, this.beat.offset + Math.floor((pos - this.beat.offset) / beat) * beat);
      if (start + beats * beat > this.duration) return;
      this.loop = { start, end: start + beats * beat };
    }
    if (this.src) {
      this.src.loop = !!this.loop;
      if (this.loop) { this.src.loopStart = this.loop.start; this.src.loopEnd = this.loop.end; }
    }
  }

  // match the other deck's tempo, and if both are playing, line the kicks up too
  syncTo(other) {
    if (!this.bpm || !other.bpm || this.ramp) return;
    this.setRate(other.liveBpm / this.bpm);
    if (this.playing && other.playing) {
      const mine = beatPhase(this.position(), this.bpm, this.beat.offset);
      const theirs = beatPhase(other.position(), other.bpm, other.beat.offset);
      this.seek(this.position() + phaseNudge(mine, theirs) * (60 / this.bpm));
    }
  }

  // ---- tricks ----
  brake() {
    if (!this.playing || this.ramp) return;
    const pos0 = this.position(), t0 = this.ctx.currentTime;
    this.loop = null; this.src.loop = false;
    const r = this.src.playbackRate;
    r.cancelScheduledValues(t0); r.setValueAtTime(this.rate, t0); r.linearRampToValueAtTime(0.001, t0 + BRAKE_TIME);
    this.ramp = { pos0, t0, T: BRAKE_TIME, r0: this.rate, r1: 0, dir: 1, timer: setTimeout(() => this._endRamp(false), BRAKE_TIME * 1000) };
  }

  // plays the track backwards real quick (web audio can't do negative speed, so we keep a flipped copy)
  spinback() {
    if (!this.playing || this.ramp) return;
    const pos0 = this.position(), t0 = this.ctx.currentTime;
    this.loop = null; this._stopSource();
    const src = this.ctx.createBufferSource();
    src.buffer = this._reversed();
    src.playbackRate.setValueAtTime(2.5, t0); src.playbackRate.linearRampToValueAtTime(0.3, t0 + SPIN_TIME);
    src.connect(this.eq.low);
    src.start(0, Math.max(0, this.duration - pos0));
    this.src = src;
    this.ramp = { pos0, t0, T: SPIN_TIME, r0: 2.5, r1: 0.3, dir: -1, timer: setTimeout(() => this._endRamp(true), SPIN_TIME * 1000) };
  }
  _reversed() {
    if (!this.reversed) {
      const b = this.buffer, r = this.ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (let c = 0; c < b.numberOfChannels; c++) {
        const from = b.getChannelData(c), to = r.getChannelData(c), n = from.length;
        for (let i = 0; i < n; i++) to[i] = from[n - 1 - i];
      }
      this.reversed = r;
    }
    return this.reversed;
  }

  // ---- knobs ----
  toggleFx() {
    this.fxOn = !this.fxOn;
    this.send.gain.setTargetAtTime(this.fxOn ? 0.7 : 0, this.ctx.currentTime, 0.02);
  }
  setVolume(v) { this.fader.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01); }
  setEq(band, db) { this.eq[band].gain.setTargetAtTime(db, this.ctx.currentTime, 0.01); } // -24 = kill, +6 = boost
}
