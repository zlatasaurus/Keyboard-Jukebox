// mixxx.js — copies our controller mapping into Mixxx's user controllers folder
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILES = ['Keyboard-Jukebox.midi.xml', 'Keyboard-Jukebox-scripts.js'];

// where Mixxx keeps its settings on each OS. mac has two cuz the mixxx.org download
// is sandboxed (lives under Containers) but some builds aren't
function mixxxSettingsDirs(platform = process.platform, home = os.homedir(), env = process.env) {
  if (platform === 'win32') return [path.join(env.LOCALAPPDATA || '', 'Mixxx')];
  if (platform === 'darwin') return [
    path.join(home, 'Library', 'Containers', 'org.mixxx.mixxx', 'Data', 'Library', 'Application Support', 'Mixxx'),
    path.join(home, 'Library', 'Application Support', 'Mixxx'),
  ];
  return [path.join(home, '.mixxx'), path.join(home, '.local', 'share', 'mixxx')]; // linux
}

function installMapping() {
  try {
    // no Mixxx folder = Mixxx never ran here. we dont wanna make random folders, so bail
    const candidates = mixxxSettingsDirs();
    const settings = candidates.find(d => fs.existsSync(d));
    if (!settings) return { ok: false, error: `couldn't find Mixxx's settings (${candidates[0]}). Open Mixxx once first.` };
    const dir = path.join(settings, 'controllers');
    fs.mkdirSync(dir, { recursive: true });
    const { mixxxMapping } = require('./paths'); // loaded late so the folder logic above is testable without electron
    for (const f of FILES) fs.copyFileSync(path.join(mixxxMapping, f), path.join(dir, f));
    return { ok: true, dir };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { installMapping, mixxxSettingsDirs };
