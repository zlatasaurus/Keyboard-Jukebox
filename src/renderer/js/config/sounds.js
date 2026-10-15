// ============================================================
// THE SOUND LIST — every sound has an id, a label, and a file
// wanna add a new trigger? its literally one line in TRIGGERS, the rest of the app picks it up
// ============================================================

// relative to src/renderer/index.html
const SOUND_DIR = '../../assets/sounds';
export const soundUrl = (id) => `${SOUND_DIR}/${id}.mp3`;

// the 10 default typing sounds u can pick from (9 audio files + the synth one)
export const TYPING_SOUNDS = [
  { id: 'mechanical',      label: 'Mechanical',      synth: true },
  { id: 'error',           label: 'Error' },
  { id: 'mouse-click',     label: 'Mouse click' },
  { id: 'minecraft-click', label: 'Minecraft click' },
  { id: 'camera-shutter',  label: 'Camera shutter' },
  { id: 'lizard-button',   label: 'Lizard button' },
  { id: 'minecraft-hurt',  label: 'Minecraft hurt' },
  { id: 'sans-talking',    label: 'Sans talking' },
  { id: 'anvil-drop',      label: 'Anvil drop' },
  { id: 'censor-bleep',    label: 'Censor bleep' },
];

export const DEFAULT_TYPING = 'mechanical';

// sounds that only fire on special stuff. `when` says what sets it off:
//   { key: 'Enter' }   -> that key
//   { ctrl: 'c' }      -> ctrl + that letter
//   { word: 'claude' } -> when u finish typing that word (checked top to bottom)
export const TRIGGERS = [
  { id: 'enter-rizz',  when: { key: 'Enter' },        hint: 'Enter',              label: 'Rizz' },
  { id: 'six-seven',   when: { word: '67' },          hint: 'Type "67"',          label: '67' },
  { id: 'claude',      when: { word: 'claude' },      hint: 'Type "claude"',      label: 'FNAF 6 AM' },
  { id: 'no-mistakes', when: { word: 'no mistakes' }, hint: 'Type "no mistakes"', label: 'Speedrun music' },
  { id: 'ctrl-c',      when: { ctrl: 'c' },           hint: 'Ctrl + C',           label: 'Another one' },
  { id: 'ctrl-x',      when: { ctrl: 'x' },           hint: 'Ctrl + X',           label: 'Discord leave' },
  { id: 'ctrl-v',      when: { ctrl: 'v' },           hint: 'Ctrl + V',           label: 'Apple Pay' },
  { id: 'ctrl-z',      when: { ctrl: 'z' },           hint: 'Ctrl + Z',           label: 'Snapchat message' },
  { id: 'ctrl-y',      when: { ctrl: 'y' },           hint: 'Ctrl + Y',           label: 'LEGO die' },
  { id: 'ctrl-a',      when: { ctrl: 'a' },           hint: 'Ctrl + A',           label: 'Flash bang' },
  { id: 'ctrl-p',      when: { ctrl: 'p' },           hint: 'Ctrl + P',           label: 'Windows XP shutdown' },
  { id: 'ctrl-s',      when: { ctrl: 's' },           hint: 'Ctrl + S',           label: 'Cave ambience' },
];
