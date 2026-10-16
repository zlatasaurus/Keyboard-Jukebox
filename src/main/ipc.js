// ipc.js — every message the page can send to the backstage crew, all in one list
const { ipcMain, shell } = require('electron');
const mixxx = require('./mixxx');
const { openKeyboardSettings } = require('./permissions');

function registerIpc({ getWindow, sessions, getHookStatus }) {
  // title bar button clicks from the page
  ipcMain.on('win', (_e, action) => {
    const win = getWindow();
    if (!win) return;
    if (action === 'min') win.minimize();
    else if (action === 'max') win.isMaximized() ? win.unmaximize() : win.maximize();
    else if (action === 'close') win.close();
  });

  // page asks for the history so it can draw the chart
  ipcMain.handle('history', () => sessions.history());
  ipcMain.on('open-folder', () => { sessions.save(); shell.showItemInFolder(sessions.file()); });

  // is the keyboard hook running? (page asks once on load, then gets 'hook-status' pushes)
  ipcMain.handle('hook-status', () => getHookStatus());
  ipcMain.on('open-keyboard-settings', () => openKeyboardSettings());

  // DJ mode: drop the mapping into Mixxx
  ipcMain.handle('mixxx-install', () => mixxx.installMapping());
}

module.exports = { registerIpc };
