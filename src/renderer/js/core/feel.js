// feel.js — the math that makes typing sound less like a robot. pure fns, easy to test

// random pitch nudge in semitones, anywhere from -cents to +cents (100 cents = 1 semitone)
export const humanize = (cents, rand = Math.random) => cents ? ((rand() * 2 - 1) * cents) / 100 : 0;

// how far left/right a key should go: its position on the keyboard scaled by the stereo slider
export const stereoPan = (keyPan, width) => Math.max(-1, Math.min(1, (keyPan || 0) * width));
