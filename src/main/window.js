// window.js — builds the actual app window
const { BrowserWindow } = require('electron');
const paths = require('./paths');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 820, backgroundColor: '#14141c', // wide enough for both DJ decks side by side
    icon: paths.icon, autoHideMenuBar: true, frame: false, // frameless, we draw our own win98 title bar
    webPreferences: {
      preload: paths.preload,
      backgroundThrottling: false, // fr important, otherwise minimized = no sound
    },
  });
  win.loadFile(paths.page);
  // pipe the window's console to the terminal so debugging isn't a nightmare
  win.webContents.on('console-message', (e) => console.log('[ui]', e.message));
  return win;
}

module.exports = { createMainWindow };
