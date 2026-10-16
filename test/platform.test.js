// mac vs windows differences, faked so they can be tested on either OS
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { shortcutMods } = require('../src/main/keycodes');
const { mixxxSettingsDirs } = require('../src/main/mixxx');

test('Cmd is the shortcut key on mac, Ctrl everywhere else', () => {
  assert.equal(shortcutMods({ metaKey: true }, 'darwin').ctrl, true);   // Cmd+C on mac = shortcut
  assert.equal(shortcutMods({ ctrlKey: true }, 'darwin').ctrl, false);  // Ctrl+C on mac = not (thats a terminal thing)
  assert.equal(shortcutMods({ ctrlKey: true }, 'win32').ctrl, true);
  assert.equal(shortcutMods({ metaKey: true }, 'win32').ctrl, false);   // windows key isn't ctrl
  assert.equal(shortcutMods({ altKey: true }, 'darwin').alt, true);     // Option
});

test('Mixxx settings folders per OS', () => {
  const home = path.join('/', 'Users', 'z');
  const mac = mixxxSettingsDirs('darwin', home, {});
  assert.ok(mac[0].includes(path.join('Containers', 'org.mixxx.mixxx')), 'sandboxed mac build checked first');
  assert.ok(mac[1].endsWith(path.join('Application Support', 'Mixxx')));
  assert.deepEqual(mixxxSettingsDirs('win32', home, { LOCALAPPDATA: 'C:\\AppData\\Local' }), [path.join('C:\\AppData\\Local', 'Mixxx')]);
});

test('labels say Cmd / Option on mac', async () => {
  const { keyLabel } = await import('../src/renderer/js/services/platform.js');
  assert.equal(keyLabel('Ctrl + C', true), 'Cmd + C');
  assert.equal(keyLabel('Alt + 3', true), 'Option + 3');
  assert.equal(keyLabel('Ctrl + C', false), 'Ctrl + C');
  assert.equal(keyLabel('Type "claude"', true), 'Type "claude"');
});
