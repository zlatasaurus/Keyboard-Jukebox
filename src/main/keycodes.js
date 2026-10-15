// keycodes.js — the global hook gives us raw scancodes, not letters, so we translate here
// renderer never sees scancodes, it just gets 'a', ' ', 'Enter', etc. clean handoff

// shift/ctrl/alt/win/caps — these stay silent, they're not "typing"
const MODIFIERS = new Set([42, 54, 29, 3613, 56, 3640, 3675, 3676, 58]);

const NAMED = { 28: 'Enter', 14: 'Backspace' };

const CHARS = {};
'1234567890'.split('').forEach((c, i) => CHARS[2 + i] = c);       // top row numbers
'qwertyuiop'.split('').forEach((c, i) => CHARS[16 + i] = c);      // letter row 1
'asdfghjkl'.split('').forEach((c, i) => CHARS[30 + i] = c);       // letter row 2
'zxcvbnm'.split('').forEach((c, i) => CHARS[44 + i] = c);         // letter row 3
CHARS[57] = ' ';                                                   // spacebar
// numpad numbers (so "67" works there too)
Object.assign(CHARS, { 82: '0', 79: '1', 80: '2', 81: '3', 75: '4', 76: '5', 77: '6', 71: '7', 72: '8', 73: '9' });

// ---- where each key physically sits, for stereo panning ----
// measured in key-widths from the left edge of the main block (which is ~15 keys wide).
// each row starts further right cuz of tab / caps / shift being chonky
const WIDTH = 15;
const X = {};
const row = (first, offset) => first.forEach((code, i) => X[code] = offset + i + 0.5);
row([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 1);           // 1 2 3 ... 0 - =
row([16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27], 1.5);  // q w e ... p [ ]
row([30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40], 1.75);     // a s d ... l ; '
row([44, 45, 46, 47, 48, 49, 50, 51, 52, 53], 2.25);         // z x c ... m , . /
Object.assign(X, { 41: 0.5, 15: 0.75, 57: 7.5, 14: 14, 43: 14.25, 28: 13.9, 1: 0.5 }); // ` tab space bksp \ enter esc
// numpad + arrows + nav cluster live off to the right of the main block
for (const code of [82, 79, 80, 81, 75, 76, 77, 71, 72, 73, 3637, 55, 74, 78, 3612, 83,
  57416, 57424, 57419, 57421, 3666, 3655, 3657, 3667, 3663, 3665]) X[code] = WIDTH;

const isModifier = (code) => MODIFIERS.has(code);
// 'a' / ' ' / 'Enter' / 'Backspace', or null for stuff we dont care about (arrows, F-keys...)
const describeKey = (code) => NAMED[code] || CHARS[code] || null;
// -1 = hard left, 0 = middle, 1 = hard right. keys we dont know about sit in the middle
const keyPan = (code) => X[code] == null ? 0 : Math.max(-1, Math.min(1, (X[code] / WIDTH) * 2 - 1));

module.exports = { isModifier, describeKey, keyPan };
