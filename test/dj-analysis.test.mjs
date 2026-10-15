// BPM detection + waveform peaks, tested on fake "tracks" we synthesize right here
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectBpm, computePeaks } from '../src/renderer/js/dj/analysis.js';
import { beatPhase } from '../src/renderer/js/dj/transport.js';
import { SR, fakeTrack } from './helpers/fake-audio.mjs';


for (const bpm of [90, 124, 128, 140, 174]) {
  test(`detects ${bpm} BPM and lands on the beat`, () => {
    const r = detectBpm([fakeTrack(bpm)], SR);
    assert.ok(r, 'got a result');
    assert.ok(Math.abs(r.bpm - bpm) <= 1, `got ${r.bpm}`);
    // the detected first beat should line up with the real kicks (within ~3% of a beat)
    const phase = beatPhase(0.2, bpm, r.offset);
    assert.ok(Math.min(phase, 1 - phase) < 0.03, `phase off by ${phase}`);
  });
}

test('silence = no bpm', () => {
  assert.equal(detectBpm([new Float32Array(SR * 10)], SR), null);
});

test('peaks are normalized to 0..1', () => {
  const peaks = computePeaks([fakeTrack(128, { seconds: 5 })], 200);
  assert.equal(peaks.length, 200);
  assert.equal(Math.max(...peaks), 1);
  assert.ok(Math.min(...peaks) >= 0);
});
