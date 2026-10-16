// ============================================================
// KEYBOARD JUKEBOX — app.js is the boot file. it doesn't DO much itself,
// it just plugs all the lil modules together and starts listening
// ============================================================
import * as audio from './audio/engine.js';
import { state, setState, subscribe } from './state.js';
import { TRIGGERS } from './config/sounds.js';
import { DJ_COMMANDS } from './config/dj-commands.js';
import { createTriggerEngine } from './core/triggers.js';
import { humanize, stereoPan } from './core/feel.js';
import { loadSettings, saveSettings, SAVED_FIELDS } from './services/settings-store.js';
import { loadAll, playSound } from './services/sound-library.js';
import { bridge } from './services/bridge.js';
import { mountTitleBar } from './ui/title-bar.js';
import { mountStatusPanel } from './ui/status-panel.js';
import { mountSoundGrid } from './ui/sound-grid.js';
import { mountUploadButton } from './ui/upload-button.js';
import { mountFeelPanel } from './ui/feel-panel.js';
import { mountDjPanel } from './ui/dj-panel.js';
import { mountTweakPanel } from './ui/tweak-panel.js';
import { mountTriggerTable } from './ui/trigger-table.js';
import { mountHistoryChart } from './ui/history-chart.js';
import { mountDesktop } from './ui/desktop.js';
import { mountHookWarning } from './ui/hook-warning.js';
import { mountDjWindow } from './ui/dj-window.js';
import { createMixer } from './dj/mixer.js';
import { createDjController } from './dj/controller.js';

async function boot() {
  // settings first, then wire up the side effects that follow state around
  setState(loadSettings());
  subscribe((s, p) => { if (SAVED_FIELDS.some(f => f in p)) saveSettings(s); });
  subscribe((s, p) => { if ('volume' in p) audio.setVolume(s.volume); });
  audio.setVolume(state.volume);
  audio.ensureAudio();

  mountDesktop();
  mountHookWarning();
  mountTitleBar();
  mountTriggerTable();
  const status = mountStatusPanel();

  // program 2: Keyboard Jukebox DJ. plugs into the same master volume as the typing sounds
  const mixer = createMixer(audio.ensureAudio(), audio.getOutput());
  const djController = createDjController(mixer);
  mountDjWindow({ mixer, controller: djController });

  await loadAll(); // the sound files have to exist before the editor can show their lengths

  const tweak = mountTweakPanel();
  // picking or uploading a sound = jump the editor to it + lil preview so u know what u picked
  const showOff = (id) => { audio.ensureAudio(); tweak.focus(id); playSound(id); };
  mountSoundGrid({ onPick: showOff });
  mountUploadButton({ onAdded: ({ id }) => showOff(id) });
  mountFeelPanel();
  const dj = mountDjPanel({ runBuiltin: (id) => djController.run(id) });

  // THE ACTUAL KEY HANDLER — DJ command first (if DJ mode is on), then special trigger,
  // otherwise ur chosen typing sound.
  // (triggers stay centered + un-wobbled, nobody wants the speedrun music detuned in one ear)
  const resolveTrigger = createTriggerEngine(TRIGGERS);
  const resolveDj = createTriggerEngine(DJ_COMMANDS);
  bridge.onKey((key) => {
    const command = state.djMode ? resolveDj(key) : null;
    if (command) { dj.send(command); status.bump(); return; } // works even with Sounds OFF
    if (!state.enabled) return;
    const special = resolveTrigger(key);
    if (special) playSound(special, { cutPrevious: true });
    else playSound(state.currentTyping, { pan: stereoPan(key.pan, state.stereo), detune: humanize(state.humanize) });
    status.bump();
  });

  mountHistoryChart();
}

boot();
