// dj-panel.js — DJ mode switch, where the commands go (our decks or Mixxx), MIDI port picker,
// Mixxx mapping installer, and the command cheat sheet
import { $, el } from './dom.js';
import { state, setState, subscribe } from '../state.js';
import { DJ_COMMANDS } from '../config/dj-commands.js';
import * as midi from '../services/midi-out.js';
import { bridge } from '../services/bridge.js';
import { keyLabel, isMac } from '../services/platform.js';

export function mountDjPanel({ runBuiltin }) {
  const toggle = $('djMode'), targetSel = $('djTarget'), portSel = $('midiOut'), status = $('djStatus');

  // macs have a virtual MIDI cable built in (IAC Driver), no loopMIDI needed
  if (isMac) {
    $('djHintMixxx').textContent = 'Setup: open Audio MIDI Setup > Window > Show MIDI Studio, double-click IAC Driver and tick '
      + '"Device is online". Pick it above, hit Install Mixxx mapping, then in Mixxx go to Settings > Controllers, '
      + 'pick the IAC port, tick Enabled and load the "Keyboard Jukebox" mapping. Commands work even with Sounds OFF.';
  }
  const say = (msg) => { status.textContent = msg; };
  const mixxx = () => state.djTarget === 'mixxx';

  // ---- cheat sheet, straight from the protocol file ----
  $('djTable').replaceChildren(...DJ_COMMANDS.map(c =>
    el('tr', { id: 'dj-' + c.id }, [el('td', { textContent: keyLabel(c.hint) }), el('td', { textContent: c.label })])));

  // ---- port picker (only matters for Mixxx) ----
  function renderPorts(names) {
    const opts = names.map(n => el('option', { value: n, textContent: n }));
    if (!opts.length) opts.push(el('option', { value: '', textContent: isMac ? '(no MIDI ports, is the IAC Driver on?)' : '(no MIDI ports, is loopMIDI open?)' }));
    portSel.replaceChildren(...opts);
    // keep the saved port if its around, otherwise guess
    const pick = names.includes(state.midiOut) ? state.midiOut : midi.guessPort(names);
    portSel.value = pick;
    midi.select(pick);
    if (pick !== state.midiOut && pick) setState({ midiOut: pick });
    render();
  }

  function render() {
    toggle.checked = state.djMode;
    targetSel.value = state.djTarget;
    // only show the Mixxx stuff when Mixxx is the target
    $('mixxxBits').hidden = !mixxx();
    $('djHintMixxx').hidden = !mixxx();
    $('djHintBuiltin').hidden = mixxx();
    if (!state.djMode) return say('DJ mode is off. Keys only make sounds.');
    if (!mixxx()) return say('DJ mode is on. Commands go to Keyboard Jukebox DJ.');
    say(midi.select(portSel.value) ? `DJ mode is on. Sending MIDI to "${portSel.value}".` : 'DJ mode is on but no MIDI port picked.');
  }

  portSel.addEventListener('change', () => { setState({ midiOut: portSel.value }); render(); });
  toggle.addEventListener('change', () => setState({ djMode: toggle.checked }));
  targetSel.addEventListener('change', () => setState({ djTarget: targetSel.value }));
  subscribe((_s, p) => { if ('djMode' in p || 'djTarget' in p) render(); });
  render();

  midi.connect(renderPorts).then(renderPorts).catch((e) => { if (mixxx()) say("Couldn't open MIDI: " + e.message); });

  // drops the mapping files into Mixxx's controllers folder so u dont have to go digging
  $('mixxxInstall').addEventListener('click', async () => {
    const r = await bridge.installMixxxMapping();
    say(r.ok ? `Mapping copied to ${r.dir}. Now enable it in Mixxx (see below).` : `Couldn't copy the mapping: ${r.error}`);
  });

  return {
    // fire a command at whichever target is picked + flash its row so u can see what went out
    send(id) {
      const cmd = DJ_COMMANDS.find(c => c.id === id);
      if (!cmd) return;
      if (mixxx()) say(midi.tap(cmd.note) ? `Sent to Mixxx: ${cmd.label}` : 'Command matched but no MIDI port picked.');
      else { runBuiltin(id); say(`Keyboard Jukebox DJ: ${cmd.label}`); }
      const row = $('dj-' + id);
      row.classList.add('hit');
      setTimeout(() => row.classList.remove('hit'), 300);
    },
  };
}
