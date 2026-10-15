// ipc.js — every message the page can send to the backstage crew, all in one list
const { ipcMain, shell } = require('electron');
const mixxx = require('./mixxx');

function registerIpc({ getWindow, sessions }) {
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

  // DJ mode: drop the mapping into Mixxx
  ipcMain.handle('mixxx-install', () => mixxx.installMapping());
}

module.exports = { registerIpc };
