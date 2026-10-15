// the trigger engine is pure logic, so we can test it without electron or speakers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTriggerEngine } from '../src/renderer/js/core/triggers.js';
import { TRIGGERS } from '../src/renderer/js/config/sounds.js';

const typeAll = (resolve, text) => [...text].map(key => resolve({ key, ctrl: false }));

test('ctrl shortcuts map to their sound', () => {
  const resolve = createTriggerEngine(TRIGGERS);
  assert.equal(resolve({ key: 'c', ctrl: true }), 'ctrl-c');
  assert.equal(resolve({ key: 's', ctrl: true }), 'ctrl-s');
  assert.equal(resolve({ key: 'q', ctrl: true }), null); // no sound for ctrl+q
});

test('enter always fires the enter sound', () => {
  const resolve = createTriggerEngine(TRIGGERS);
  assert.equal(resolve({ key: 'Enter' }), 'enter-rizz');
});

test('typing a trigger word fires on its last letter only', () => {
  const resolve = createTriggerEngine(TRIGGERS);
  assert.deepEqual(typeAll(resolve, 'claude'), [null, null, null, null, null, 'claude']);
  assert.equal(typeAll(resolve, 'no mistakes').at(-1), 'no-mistakes');
  assert.equal(typeAll(resolve, '67').at(-1), 'six-seven');
});

test('backspace un-types, enter wipes the buffer', () => {
  const resolve = createTriggerEngine(TRIGGERS);
  typeAll(resolve, 'claudx');
  resolve({ key: 'Backspace' });
  assert.equal(resolve({ key: 'e' }), 'claude');

  typeAll(resolve, 'clau');
  resolve({ key: 'Enter' });
  assert.equal(typeAll(resolve, 'de').at(-1), null);
});

test('non-character keys dont break anything', () => {
  const resolve = createTriggerEngine(TRIGGERS);
  assert.equal(resolve({ key: null }), null);
});
