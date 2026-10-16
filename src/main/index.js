// main/index.js — the backstage crew. wires the window, the key hook and the session saver together
const { app } = require('electron');
const paths = require('./paths');
const { createMainWindow } = require('./window');
const { startKeyboardHook } = require('./keyboard');
const { createSessionTracker } = require('./sessions');
const { canHearKeyboard } = require('./permissions');
const { registerIpc } = require('./ipc');

// electron normally blocks sound until u click smth. we say nah, let it cook
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
paths.migrateLegacyFolders(); // we used to be "Keystroke Jukebox", bring the old saves along

const sessions = createSessionTracker({ dir: paths.dataDir() });
let win;
let stopHook = () => {};

// is the key hook actually running? the page shows a warning if not (mac permission, mostly)
let hookStatus = { ok: false, reason: 'starting' };
function setHookStatus(s) {
  hookStatus = s;
  if (win && !win.isDestroyed()) win.webContents.send('hook-status', s);
}

registerIpc({ getWindow: () => win, sessions, getHookStatus: () => hookStatus });

function onKeyDown({ modifier, ...key }) {
  if (modifier) return; // shift/ctrl/etc dont count as typing and dont make noise
  sessions.countKey();
  if (win && !win.isDestroyed()) win.webContents.send('key', key);
}

function tryStartHook() {
  try {
    stopHook = startKeyboardHook({ onKeyDown });
    setHookStatus({ ok: true });
    return true;
  } catch (e) {
    console.log('key hook wouldnt start', e.message);
    setHookStatus({ ok: false, reason: 'error', message: e.message });
    return false;
  }
}

app.whenReady().then(() => {
  win = createMainWindow();
  setInterval(sessions.save, 60000); // autosave every minute so a crash doesnt wipe the session

  // mac: ask for Accessibility once, then keep checking quietly. the second u flip the switch
  // in System Settings it just starts working, no restart needed
  if (canHearKeyboard({ prompt: true })) return tryStartHook();
  setHookStatus({ ok: false, reason: 'mac-permission' });
  const wait = setInterval(() => {
    if (canHearKeyboard() && tryStartHook()) clearInterval(wait);
  }, 2000);
});

app.on('before-quit', sessions.save); // the main event: closing the app saves ur stats
app.on('will-quit', () => stopHook());
app.on('window-all-closed', () => app.quit());
