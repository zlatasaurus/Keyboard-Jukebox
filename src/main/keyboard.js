// keyboard.js — global key hook = fires no matter which app ur typing in. kinda scary ngl but its all local
const { uIOhook } = require('uiohook-napi');
const { isModifier, describeKey, keyPan, shortcutMods } = require('./keycodes');

// calls onKeyDown once per physical press with a cleaned-up event. returns a stop fn.
// throws if the OS says no (on a mac that means Accessibility permission isn't on yet)
function startKeyboardHook({ onKeyDown }) {
  const held = new Set();
  uIOhook.removeAllListeners();
  uIOhook.on('keydown', (e) => {
    if (held.has(e.keycode)) return; // holding a key spams events, we don't want that
    held.add(e.keycode);
    onKeyDown({
      key: describeKey(e.keycode),
      modifier: isModifier(e.keycode),
      pan: keyPan(e.keycode), // where the key sits left<->right, for stereo
      ...shortcutMods(e),     // ctrl (Cmd on mac) / alt / shift, so shortcuts get their own sound
    });
  });
  uIOhook.on('keyup', (e) => held.delete(e.keycode));
  uIOhook.start();
  return () => { try { uIOhook.stop(); } catch {} };
}

module.exports = { startKeyboardHook };
