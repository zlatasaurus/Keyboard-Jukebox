# Keyboard Jukebox × Mixxx (DJ mode prototype)

DJ mode turns Keyboard Jukebox into a virtual MIDI controller for [Mixxx](https://mixxx.org).
Because the key hook is global, you can drive your decks while typing in a completely
different app.

It only talks MIDI, so none of Mixxx's GPL code is in this project.

## Setup (Windows)

1. Install **loopMIDI** (free, by Tobias Erichsen) and add a port named `Keyboard Jukebox`.
   Windows can't create virtual MIDI ports on its own.
2. In Keyboard Jukebox, tick **DJ mode** and pick that port.
3. Click **Install Mixxx mapping**. It copies the two files in this folder into
   `%LOCALAPPDATA%\Mixxx\controllers` (run Mixxx once first so that folder exists).
4. In Mixxx: Preferences > Controllers > `Keyboard Jukebox` > tick **Enabled**,
   choose the **Keyboard Jukebox** mapping and click Apply.

## Commands

| Trigger | Does |
|---|---|
| Alt + 1 / Alt + 2 | pick which deck the other commands hit |
| Alt + 3 | play / pause |
| Alt + 4 | cue |
| Alt + 5 | sync to the other deck |
| Alt + 6 | 4-beat loop on/off |
| Alt + 7 | route deck into effect unit 1 on/off |
| Alt + 8 | slam crossfader to the deck |
| `dj drop` | jump to hotcue 1 and play |
| `dj spin` | spinback |
| `dj brake` | vinyl brake |
| `dj horn` | fire sampler 1 (load an airhorn there) |

## How it fits together

- `src/renderer/js/config/dj-commands.js` is the protocol: one MIDI note per command.
- `Keyboard-Jukebox.midi.xml` is **generated** from it by `npm run mixxx-mapping`.
- `Keyboard-Jukebox-scripts.js` is hand-written: one function per command id, run inside Mixxx.

Adding a command: add it to `dj-commands.js`, add a matching function to the script,
run `npm run mixxx-mapping`. `npm test` fails if any of the three drift apart.
