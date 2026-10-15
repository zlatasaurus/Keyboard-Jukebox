// keyboard.js — global key hook = fires no matter which app ur typing in. kinda scary ngl but its all local
const { uIOhook } = require('uiohook-napi');
const { isModifier, describeKey, keyPan } = require('./keycodes');

// calls onKeyDown once per physical press with a cleaned-up event. returns a stop fn
function startKeyboardHook({ onKeyDown }) {
  const held = new Set();
  uIOhook.on('keydown', (e) => {
    if (held.has(e.keycode)) return; // holding a key spams events, we don't want that
    held.add(e.keycode);
    onKeyDown({
      key: describeKey(e.keycode),
      modifier: isModifier(e.keycode),
      pan: keyPan(e.keycode), // where the key sits left<->right, for stereo
      // which modifiers are held so ctrl+c etc can get their own sound
      ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey,
    });
  });
  uIOhook.on('keyup', (e) => held.delete(e.keycode));
  uIOhook.start();
  return () => { try { uIOhook.stop(); } catch {} };
}

module.exports = { startKeyboardHook };
