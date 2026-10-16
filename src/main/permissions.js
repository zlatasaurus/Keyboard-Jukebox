// permissions.js — macOS won't let ANY app hear the keyboard until u flip it on in
// System Settings > Privacy & Security > Accessibility. windows doesn't care, so it's always yes there
const { systemPreferences, shell } = require('electron');

const isMac = process.platform === 'darwin';

// prompt = also pop the "Keyboard Jukebox would like to control this computer" dialog
function canHearKeyboard({ prompt = false } = {}) {
  if (!isMac) return true;
  return systemPreferences.isTrustedAccessibilityClient(prompt);
}

// jumps straight to the right settings page so nobody has to go hunting
function openKeyboardSettings() {
  if (isMac) shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
}

module.exports = { canHearKeyboard, openKeyboardSettings };
