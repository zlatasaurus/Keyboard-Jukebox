// midi-out.js — sends DJ commands out a MIDI port using Web MIDI (built into electron, no native deps)
// windows can't make virtual MIDI ports by itself, so u need loopMIDI running with a port open.
// macs have one built in: the IAC Driver (Audio MIDI Setup)
import { MIDI_STATUS_ON, MIDI_STATUS_OFF } from '../config/dj-commands.js';

let access = null, output = null;

const outputs = () => (access ? [...access.outputs.values()] : []);
export const outputNames = () => outputs().map(o => o.name);

// asks for MIDI. calls onChange whenever ports show up / disappear (loopMIDI opened or closed)
export async function connect(onChange) {
  if (!navigator.requestMIDIAccess) throw new Error('Web MIDI not available');
  access = await navigator.requestMIDIAccess();
  access.onstatechange = () => onChange(outputNames());
  return outputNames();
}

// picks the port. returns false if it isnt there (yet)
export function select(name) {
  output = outputs().find(o => o.name === name) || null;
  return !!output;
}

// best guess at the right port. NEVER the windows GS wavetable synth, that thing plays piano notes lmao
export function guessPort(names) {
  const usable = names.filter(n => !/wavetable/i.test(n));
  return usable.find(n => /jukebox|loopmidi|mixxx|iac/i.test(n)) || usable[0] || '';
}

// one command = one quick tap: note on, then note off 40ms later (cue uses the release)
export function tap(note) {
  if (!output) return false;
  output.send([MIDI_STATUS_ON, note, 127]);
  output.send([MIDI_STATUS_OFF, note, 0], performance.now() + 40);
  return true;
}
