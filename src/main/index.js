// main/index.js — the backstage crew. wires the window, the key hook and the session saver together
const { app } = require('electron');
const paths = require('./paths');
const { createMainWindow } = require('./window');
const { startKeyboardHook } = require('./keyboard');
const { createSessionTracker } = require('./sessions');
const { registerIpc } = require('./ipc');

// electron normally blocks sound until u click smth. we say nah, let it cook
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
paths.migrateLegacyFolders(); // we used to be "Keystroke Jukebox", bring the old saves along

const sessions = createSessionTracker({ dir: paths.dataDir() });
let win;
let stopHook = () => {};

registerIpc({ getWindow: () => win, sessions });

app.whenReady().then(() => {
  win = createMainWindow();
  setInterval(sessions.save, 60000); // autosave every minute so a crash doesnt wipe the session

  stopHook = startKeyboardHook({
    onKeyDown: ({ modifier, ...key }) => {
      if (modifier) return; // shift/ctrl/etc dont count as typing and dont make noise
      sessions.countKey();
      if (win && !win.isDestroyed()) win.webContents.send('key', key);
    },
  });
});

app.on('before-quit', sessions.save); // the main event: closing the app saves ur stats
app.on('will-quit', () => stopHook());
app.on('window-all-closed', () => app.quit());
