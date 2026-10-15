// preload — the safe little bridge between main and the page
// (sandboxed preloads can only require 'electron', so this stays one tiny file)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jukebox', {
  // page says "tell me when a key gets pressed" and we pass the event along
  onKey: (cb) => ipcRenderer.on('key', (_e, k) => cb(k)),
  // minimize / maximize / close for our fake win98 title bar
  win: (action) => ipcRenderer.send('win', action),
  // typing history for the chart + button that pops open the save folder
  history: () => ipcRenderer.invoke('history'),
  openFolder: () => ipcRenderer.send('open-folder'),
  // copies the Mixxx mapping into Mixxx's controllers folder -> { ok, dir } or { ok: false, error }
  installMixxxMapping: () => ipcRenderer.invoke('mixxx-install'),
});
