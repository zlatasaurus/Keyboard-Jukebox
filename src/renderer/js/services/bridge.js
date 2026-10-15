// bridge.js — the only file that touches window.jukebox (the preload api).
// everything else imports from here, so swapping it for a fake in tests is ez
export const bridge = window.jukebox;
