// stereo + humanize math
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { humanize, stereoPan } from '../src/renderer/js/core/feel.js';

test('humanize stays inside ±cents', () => {
  assert.equal(humanize(50, () => 0), -0.5);   // lowest roll = -50 cents
  assert.equal(humanize(50, () => 1), 0.5);    // highest roll = +50 cents
  assert.equal(humanize(50, () => 0.5), 0);
  assert.equal(humanize(0), 0);                // slider at 0 = no wobble ever
});

test('stereo width scales the key position', () => {
  assert.equal(stereoPan(-1, 1), -1);
  assert.equal(stereoPan(-1, 0.5), -0.5);
  assert.equal(stereoPan(0.8, 0), 0);          // width 0 = mono
  assert.equal(stereoPan(undefined, 1), 0);    // no position info = center
});
