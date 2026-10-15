// mixxx.js — copies our controller mapping into Mixxx's user controllers folder
const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const FILES = ['Keyboard-Jukebox.midi.xml', 'Keyboard-Jukebox-scripts.js'];

// where Mixxx looks for user mappings on windows (mac/linux are different, prototype = windows only)
const mixxxSettingsDir = () => path.join(process.env.LOCALAPPDATA || '', 'Mixxx');

function installMapping() {
  try {
    // no Mixxx folder = Mixxx never ran here. we dont wanna make random folders, so bail
    if (!fs.existsSync(mixxxSettingsDir())) {
      return { ok: false, error: `couldn't find ${mixxxSettingsDir()}. Open Mixxx once first.` };
    }
    const dir = path.join(mixxxSettingsDir(), 'controllers');
    fs.mkdirSync(dir, { recursive: true });
    for (const f of FILES) fs.copyFileSync(path.join(paths.mixxxMapping, f), path.join(dir, f));
    return { ok: true, dir };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { installMapping };
