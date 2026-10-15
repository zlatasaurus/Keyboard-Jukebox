// deck + mixer + controller logic, against a fake audio context where we control the clock
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Deck } from '../src/renderer/js/dj/deck.js';
import { createMixer } from '../src/renderer/js/dj/mixer.js';
import { createDjController } from '../src/renderer/js/dj/controller.js';
import { transportPosition, rampDistance, beatPhase } from '../src/renderer/js/dj/transport.js';
import { DJ_COMMANDS } from '../src/renderer/js/config/dj-commands.js';
import { fakeContext, fakeBuffer, fakeTrack } from './helpers/fake-audio.mjs';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

function loadedDeck(bpm = 120) {
  const ctx = fakeContext();
  const deck = new Deck(ctx, { out: {}, fxIn: {} });
  deck.loadBuffer(fakeBuffer(fakeTrack(bpm)), 'test');
  return { ctx, deck };
}

test('transport math: plain, sped up, and wrapping inside a loop', () => {
  assert.equal(transportPosition({ anchorPos: 10, elapsed: 2, rate: 1 }), 12);
  near(transportPosition({ anchorPos: 10, elapsed: 2, rate: 1.1 }), 12.2);
  near(transportPosition({ anchorPos: 10, elapsed: 3, rate: 1, loop: { start: 10, end: 12 } }), 11);
  assert.equal(rampDistance(1, 0, 1, 1), 0.5); // braking from 1x to 0 over 1s covers half a second of track
});

test('play / pause tracks the playhead', () => {
  const { ctx, deck } = loadedDeck();
  deck.play(); ctx.currentTime = 3;
  near(deck.position(), 3);
  deck.pause(); ctx.currentTime = 10;
  near(deck.position(), 3); // paused = frozen
});

test('tempo change keeps the playhead honest', () => {
  const { ctx, deck } = loadedDeck();
  deck.play(); ctx.currentTime = 2;
  deck.setRate(1.5); ctx.currentTime = 4;
  near(deck.position(), 2 + 2 * 1.5);
});

test('loop snaps to the beat and wraps', () => {
  const { ctx, deck } = loadedDeck(120); // 0.5s beats, first kick at 0.2s
  deck.play(); ctx.currentTime = 1.0;
  deck.toggleLoop(4);
  near(deck.loop.start, 0.7, 0.02); // the beat we were in started at 0.7s
  near(deck.loop.end - deck.loop.start, 2);
  ctx.currentTime = 4; // 3s later, 1s past the loop end -> wrapped around
  assert.ok(deck.position() >= deck.loop.start && deck.position() < deck.loop.end);
  assert.ok(ctx.sources.at(-1).loop);
});

test('sync matches tempo and lines up the beats', () => {
  const ctx = fakeContext();
  const a = new Deck(ctx, { out: {}, fxIn: {} }), b = new Deck(ctx, { out: {}, fxIn: {} });
  a.loadBuffer(fakeBuffer(fakeTrack(128)), 'a');
  b.loadBuffer(fakeBuffer(fakeTrack(120)), 'b');
  a.play(); b.play(); b.seek(1.37); // b is somewhere random mid-beat
  ctx.currentTime = 2;
  b.syncTo(a);
  near(b.liveBpm, 128, 0.2);
  const pa = beatPhase(a.position(), a.bpm, a.beat.offset), pb = beatPhase(b.position(), b.bpm, b.beat.offset);
  near(Math.min(Math.abs(pa - pb), 1 - Math.abs(pa - pb)), 0, 0.05);
});

test('cue: stopped sets it, playing snaps back to it', () => {
  const { ctx, deck } = loadedDeck();
  deck.seek(5); deck.cueTap();
  assert.equal(deck.cuePoint, 5);
  deck.play(); ctx.currentTime = 3;
  deck.cueTap();
  assert.equal(deck.playing, false);
  assert.equal(deck.position(), 5);
});

test('hotcue: first press sets, second jumps + plays', () => {
  const { deck } = loadedDeck();
  deck.seek(8); deck.hotcueGo();
  assert.equal(deck.hotcue, 8);
  deck.seek(1); deck.hotcueGo();
  assert.equal(deck.playing, true);
  assert.equal(deck.position(), 8);
});

test('brake slides to a stop', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { ctx, deck } = loadedDeck();
  deck.play(); ctx.currentTime = 2;
  deck.brake();
  ctx.currentTime = 2 + 1.2; t.mock.timers.tick(1200);
  assert.equal(deck.playing, false);
  near(deck.position(), 2 + 0.6, 0.02); // 1.2s ramp from 1x to 0 = 0.6s of track
});

test('spinback rewinds then keeps playing', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { ctx, deck } = loadedDeck();
  deck.play(); ctx.currentTime = 10;
  deck.spinback();
  ctx.currentTime = 10.8; t.mock.timers.tick(800);
  assert.equal(deck.playing, true);
  near(deck.position(), 10 - rampDistance(2.5, 0.3, 0.8, 0.8), 0.02);
});

test('controller handles every DJ command + targets the right deck', () => {
  const mixer = createMixer(fakeContext(), {});
  const c = createDjController(mixer);
  assert.deepEqual([...c.commands].sort(), DJ_COMMANDS.map(d => d.id).sort());

  mixer.decks.forEach((d, i) => d.loadBuffer(fakeBuffer(fakeTrack(124)), 'd' + i));
  c.run('deck2'); c.run('play');
  assert.equal(mixer.decks[1].playing, true);
  assert.equal(mixer.decks[0].playing, false);
  c.run('fade'); assert.equal(mixer.crossfader, 1);
  c.run('deck1'); c.run('fade'); assert.equal(mixer.crossfader, -1);
  c.run('fx'); assert.equal(mixer.decks[0].fxOn, true);
});
