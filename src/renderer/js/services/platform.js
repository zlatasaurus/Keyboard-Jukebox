// platform.js — mac vs windows differences the page cares about (mostly what the keys are called)

export const isMac = (globalThis.jukebox?.platform) === 'darwin';

// config files say "Ctrl + C" / "Alt + 1". on a mac those are Cmd and Option, so show that instead
export function keyLabel(text, mac = isMac) {
  return mac ? text.replace(/\bCtrl\b/g, 'Cmd').replace(/\bAlt\b/g, 'Option') : text;
}
