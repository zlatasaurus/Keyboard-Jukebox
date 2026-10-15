# Keyboard Jukebox

Plays a sound effect on every keystroke, system-wide. Win98 vibes included.

Two programs on one fake Windows 98 desktop, switched from the taskbar / Start menu:

- **Keyboard Jukebox**: sound effects for every key, special triggers, stereo + humanize, typing history.
- **Keyboard Jukebox DJ**: two decks + a mixer (BPM detection, sync, beat-snapped loops, hotcue, EQ, echo,
  brake, spinback, airhorn). With DJ mode on, Alt + number keys and typed "dj ..." words drive the
  decks from any app. They can drive [Mixxx](integrations/mixxx/README.md) over MIDI instead.

```
npm start       # run it
npm test        # unit tests (triggers, keycodes, stereo/humanize, DJ decks + BPM, Mixxx mapping)
npm run dist    # build the portable .exe into dist/
```

## Where stuff lives

```
assets/                 icon + every built-in .mp3
docs/                   the original feature notes
integrations/mixxx/     DJ mode: Mixxx mapping (xml is generated) + controller script
src/
  main/                 Electron main process (Node)
    index.js            boots everything, wires the pieces together
    window.js           the frameless window
    keyboard.js         global key hook (uiohook), one event per physical press
    keycodes.js         scancode -> 'a' / 'Enter' / 'Backspace', plus left/right position
    sessions.js         key counting + Documents/Keyboard Jukebox/sessions.json
    ipc.js              every message the page can send
    mixxx.js            copies the DJ mapping into Mixxx
    paths.js            file locations
  preload/index.js      the window.jukebox bridge
  renderer/             the page (ES modules, no bundler)
    index.html          markup only
    styles/app.css      layout glue
    vendor/win98/       classic-stylesheets theme (MIT)
    js/
      app.js            boot file: plugs modules together, handles keys
      state.js          single source of truth + subscribe()
      config/sounds.js  THE SOUND LIST: typing sounds + triggers
      config/dj-commands.js  DJ mode protocol: one MIDI note per command
      core/triggers.js  pure "is this keypress special?" logic
      core/feel.js      stereo pan + humanize math
      audio/            engine (context, buffers, play), synth (+ airhorn), effects
      dj/               Keyboard Jukebox DJ: analysis (BPM + waveform), transport math, deck, mixer, controller
      services/         settings (localStorage), uploads (IndexedDB), sound library, bridge
      ui/               one file per panel/window (desktop.js = taskbar + Start menu)
tools/                  build-mixxx-mapping.mjs (npm run mixxx-mapping)
test/                   node --test
```

## Adding a trigger

Drop the mp3 in `assets/sounds/` and add one line to `TRIGGERS` in
`src/renderer/js/config/sounds.js`. The key handler, the editor dropdown and
the cheat-sheet table all read from that list.
