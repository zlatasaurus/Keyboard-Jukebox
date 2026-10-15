// paths.js — one spot for every file location so nobody has to count ../../ ever again
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const root = app.getAppPath(); // project root in dev, the asar in the built exe

const NAME = 'Keyboard Jukebox';
// what the app was called before the glow up. we still look for these so nobody loses their stuff
const OLD_DOCS = 'Keystroke Jukebox';
const OLD_USER_DATA = ['keystroke-jukebox', 'Keystroke Jukebox'];

const dataDir = () => path.join(app.getPath('documents'), NAME);

// call before app is ready. keeps settings/uploads/history from before the rename
function migrateLegacyFolders() {
  // settings + uploads live in electron's userData, which is named after the app.
  // if an old one exists just keep using it (moving it while chromium has it open = pain)
  const appData = app.getPath('appData');
  const old = OLD_USER_DATA.map(n => path.join(appData, n)).find(p => fs.existsSync(p));
  if (old) app.setPath('userData', old);

  // session history is our own folder, so we can just rename it
  const oldDocs = path.join(app.getPath('documents'), OLD_DOCS);
  try { if (fs.existsSync(oldDocs) && !fs.existsSync(dataDir())) fs.renameSync(oldDocs, dataDir()); }
  catch (e) { console.log('couldnt move old history folder', e.message); }
}

module.exports = {
  icon: path.join(root, 'assets', 'icon.png'),
  preload: path.join(root, 'src', 'preload', 'index.js'),
  page: path.join(root, 'src', 'renderer', 'index.html'),
  mixxxMapping: path.join(root, 'integrations', 'mixxx'),
  // lives in Documents so its easy to find: Documents/Keyboard Jukebox/sessions.json
  dataDir,
  migrateLegacyFolders,
};
