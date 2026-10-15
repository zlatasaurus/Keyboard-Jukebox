// scancode translation is the contract between main and the page, so it gets a test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { describeKey, isModifier, keyPan } = require('../src/main/keycodes');

test('keys pan by where they sit on the keyboard', () => {
  const [q, t, p, space, enter] = [16, 20, 25, 57, 28].map(keyPan);
  assert.ok(q < -0.6, 'q is way left');
  assert.ok(q < t && t < p, 'q -> t -> p moves left to right');
  assert.ok(p > 0.3, 'p is right');
  assert.equal(space, 0);
  assert.ok(enter > 0.8);
  assert.equal(keyPan(59), 0); // F1 unknown -> center
});

test('letters, numbers, numpad and space translate', () => {
  assert.equal(describeKey(16), 'q');
  assert.equal(describeKey(46), 'c');
  assert.equal(describeKey(7), '6');
  assert.equal(describeKey(77), '6'); // numpad 6
  assert.equal(describeKey(57), ' ');
});

test('enter + backspace get names, unknown keys are null', () => {
  assert.equal(describeKey(28), 'Enter');
  assert.equal(describeKey(14), 'Backspace');
  assert.equal(describeKey(59), null); // F1
});

test('modifiers are flagged', () => {
  for (const code of [42, 54, 29, 3613, 56, 3640, 3675, 3676, 58]) assert.ok(isModifier(code));
  assert.ok(!isModifier(30));
});
