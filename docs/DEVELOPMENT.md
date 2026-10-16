# Keyboard Jukebox

Plays a sound effect on every keystroke, system-wide. Win98 vibes included.

Two programs on one fake Windows 98 desktop, switched from the taskbar / Start menu:

- **Keyboard Jukebox**: sound effects for every key, special triggers, stereo + humanize, typing history.
- **Keyboard Jukebox DJ**: two decks + a mixer (BPM detection, sync, beat-snapped loops, hotcue, EQ, echo,
  brake, spinback, airhorn). With DJ mode on, Alt + number keys and typed "dj ..." words drive the
  decks from any app. They can drive [Mixxx](integrations/mixxx/README.md) over MIDI instead.

```
npm start           # run it
npm test            # unit tests (triggers, keycodes, stereo/humanize, DJ decks + BPM, Mixxx mapping)
npm run dist:win    # portable .exe into dist/ (npm run dist does the same)
npm run dist:mac    # .dmg for arm64 + x64 into dist/ (must run on a mac)
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
    permissions.js      macOS Accessibility check (the OS blocks key hooks until the user allows it)
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
      services/         settings (localStorage), uploads (IndexedDB), sound library, bridge, platform (Cmd/Option labels on mac)
      ui/               one file per panel/window (desktop.js = taskbar + Start menu)
tools/                  build-mixxx-mapping.mjs (npm run mixxx-mapping)
.github/workflows/       build.yml: builds windows + mac on GitHub, tag v* = auto Release
test/                   node --test
```

## Adding a trigger

Drop the mp3 in `assets/sounds/` and add one line to `TRIGGERS` in
`src/renderer/js/config/sounds.js`. The key handler, the editor dropdown and
the cheat-sheet table all read from that list.

## Windows vs mac

One codebase. The only platform checks:

- `src/main/keycodes.js` `shortcutMods`: on mac, **Cmd** is reported as `ctrl`, so every "Ctrl + X" trigger fires on Cmd + X.
- `src/main/permissions.js` + `ui/hook-warning.js`: on mac the key hook waits for Accessibility permission,
  polls every 2s, and starts on its own once it's granted. The page shows a red box until then.
- `services/platform.js` `keyLabel`: shows Cmd / Option instead of Ctrl / Alt in the tables.
- `src/main/mixxx.js`: Mixxx's settings folder per OS. `services/midi-out.js` prefers the mac IAC Driver.

Mac builds are ad-hoc signed (`"identity": "-"`, no Apple Developer account), so users right-click > Open the first time.
Scancodes come from uiohook, which uses the same codes on every OS, so key position / panning needs no mac table.
