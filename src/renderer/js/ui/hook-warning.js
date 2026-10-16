// hook-warning.js — big obvious box when the app can't hear the keyboard, instead of silently doing nothing.
// on a mac that's almost always the Accessibility permission. it vanishes by itself once the hook starts
import { $ } from './dom.js';
import { bridge } from '../services/bridge.js';

const MESSAGES = {
  'mac-permission': 'macOS needs your OK first. In System Settings > Privacy & Security > Accessibility, '
    + 'switch on Keyboard Jukebox (running from source? switch on your terminal or Electron instead). '
    + "It starts working the second you do, no restart needed.",
  error: "The keyboard hook wouldn't start. Try quitting and reopening the app.",
};

export function mountHookWarning() {
  const box = $('hookWarn'), text = $('hookWarnText'), fix = $('hookFix');
  fix.addEventListener('click', () => bridge.openKeyboardSettings());

  function render(s) {
    box.hidden = !s || s.ok || s.reason === 'starting';
    if (box.hidden) return;
    text.textContent = MESSAGES[s.reason] || MESSAGES.error;
    fix.hidden = s.reason !== 'mac-permission'; // the button only helps on a mac
  }

  bridge.onHookStatus(render);
  bridge.hookStatus().then(render).catch(() => {});
}
