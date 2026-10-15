// DJ mode: the app config, the generated xml and the Mixxx script all have to agree
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { DJ_COMMANDS } from '../src/renderer/js/config/dj-commands.js';
import { createTriggerEngine } from '../src/renderer/js/core/triggers.js';
import { buildMappingXml, MAPPING_FILE } from '../tools/build-mixxx-mapping.mjs';

const SCRIPT = readFileSync(new URL('../integrations/mixxx/Keyboard-Jukebox-scripts.js', import.meta.url), 'utf8');

test('ids + notes are unique', () => {
  assert.equal(new Set(DJ_COMMANDS.map(c => c.id)).size, DJ_COMMANDS.length);
  assert.equal(new Set(DJ_COMMANDS.map(c => c.note)).size, DJ_COMMANDS.length);
});

test('checked-in mapping xml matches dj-commands.js (run npm run mixxx-mapping if this fails)', () => {
  assert.equal(readFileSync(MAPPING_FILE, 'utf8').replace(/\r\n/g, '\n'), buildMappingXml());
});

// ---- run the real Mixxx script against a fake Mixxx engine ----
function fakeMixxx() {
  const values = {}, calls = [];
  const engine = {
    getValue: (g, k) => values[g + k] || 0,
    setValue: (g, k, v) => { values[g + k] = v; calls.push([g, k, v]); },
    spinback: (deck, on) => calls.push(['spinback', deck, on]),
    brake: (deck, on) => calls.push(['brake', deck, on]),
    beginTimer: (_ms, fn) => { fn(); return 1; },
  };
  const ctx = { engine };
  vm.runInNewContext(SCRIPT + '\nthis.KeyboardJukebox = KeyboardJukebox;', ctx);
  const KJ = ctx.KeyboardJukebox;
  // simulate one tap from our app: note on, then note off
  const tap = (id) => { KJ[id](0, 0, 127, 0x90, '[Master]'); KJ[id](0, 0, 0, 0x80, '[Master]'); };
  return { KJ, tap, calls, values };
}

test('the Mixxx script has a function for every command', () => {
  const { KJ } = fakeMixxx();
  for (const c of DJ_COMMANDS) assert.equal(typeof KJ[c.id], 'function', `missing KeyboardJukebox.${c.id}`);
});

test('play toggles the targeted deck', () => {
  const { tap, values } = fakeMixxx();
  tap('play');
  assert.equal(values['[Channel1]play'], 1);
  tap('deck2'); tap('play');
  assert.equal(values['[Channel2]play'], 1);
  tap('deck1'); tap('play');
  assert.equal(values['[Channel1]play'], 0); // second tap pauses
});

test('cue presses on note-on and releases on note-off', () => {
  const { tap, calls } = fakeMixxx();
  tap('cue');
  assert.deepEqual(calls, [['[Channel1]', 'cue_default', 1], ['[Channel1]', 'cue_default', 0]]);
});

test('crossfader slams toward the targeted deck', () => {
  const { tap, values } = fakeMixxx();
  tap('fade'); assert.equal(values['[Master]crossfader'], -1);
  tap('deck2'); tap('fade'); assert.equal(values['[Master]crossfader'], 1);
});

test('spinback turns itself back off', () => {
  const { tap, calls } = fakeMixxx();
  tap('spin');
  assert.deepEqual(calls, [['spinback', 1, true], ['spinback', 1, false]]);
});

test('alt shortcuts + dj words resolve, AltGr does not', () => {
  const resolve = createTriggerEngine(DJ_COMMANDS);
  assert.equal(resolve({ key: '3', alt: true }), 'play');
  assert.equal(resolve({ key: '3', alt: true, ctrl: true }), null); // AltGr
  assert.equal(resolve({ key: '3' }), null);
  const last = [...'dj drop'].map(key => resolve({ key })).at(-1);
  assert.equal(last, 'drop');
  assert.equal([...'drop'].map(key => resolve({ key })).at(-1), null); // plain "drop" stays safe
});
