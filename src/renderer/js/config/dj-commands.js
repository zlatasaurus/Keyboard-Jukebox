// ============================================================
// DJ MODE — the command list. this file IS the protocol between us and Mixxx:
// every command = one MIDI note. `npm run mixxx-mapping` turns this list into the
// Mixxx mapping xml, so the notes can never drift out of sync. edit here, regen, done
// ============================================================

// note-on on MIDI channel 1. starts at C2 (36) cuz that's where pads usually live
export const MIDI_STATUS_ON = 0x90;
export const MIDI_STATUS_OFF = 0x80;

// `when` works the same as sounds.js TRIGGERS, plus { alt: '1' } for alt + key.
// alt + number row cuz basically no windows app uses it, so it won't fight ur other shortcuts.
// words start with "dj " so typing "drop" in a group chat doesn't nuke ur set
export const DJ_COMMANDS = [
  { id: 'deck1', note: 36, when: { alt: '1' },        hint: 'Alt + 1',          label: 'Target deck 1' },
  { id: 'deck2', note: 37, when: { alt: '2' },        hint: 'Alt + 2',          label: 'Target deck 2' },
  { id: 'play',  note: 38, when: { alt: '3' },        hint: 'Alt + 3',          label: 'Play / pause' },
  { id: 'cue',   note: 39, when: { alt: '4' },        hint: 'Alt + 4',          label: 'Cue' },
  { id: 'sync',  note: 40, when: { alt: '5' },        hint: 'Alt + 5',          label: 'Sync to the other deck' },
  { id: 'loop',  note: 41, when: { alt: '6' },        hint: 'Alt + 6',          label: '4-beat loop on / off' },
  { id: 'fx',    note: 42, when: { alt: '7' },        hint: 'Alt + 7',          label: 'Send deck to effect unit on / off' },
  { id: 'fade',  note: 43, when: { alt: '8' },        hint: 'Alt + 8',          label: 'Slam crossfader to deck' },
  { id: 'drop',  note: 44, when: { word: 'dj drop' }, hint: 'Type "dj drop"',   label: 'Jump to hotcue 1 + play' },
  { id: 'spin',  note: 45, when: { word: 'dj spin' }, hint: 'Type "dj spin"',   label: 'Spinback' },
  { id: 'brake', note: 46, when: { word: 'dj brake' }, hint: 'Type "dj brake"', label: 'Vinyl brake' },
  { id: 'horn',  note: 47, when: { word: 'dj horn' }, hint: 'Type "dj horn"',   label: 'Fire sampler 1 (airhorn it up)' },
];
