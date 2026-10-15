# 🎹 Keyboard Jukebox

**every key u press makes a sound. everywhere. in every app.**

typing in discord? sound. writing an essay? sound. hit enter and u get the rizz sound. type "67" and u already know. it all runs on a fake windows 98 desktop because why not.

> windows only for now.

## what it does

- 🔊 **a sound on every keystroke**, system-wide (not just inside the app)
- 🎛️ **10 typing sounds to pick from**: mechanical, minecraft click, camera shutter, lizard button, sans talking, anvil drop, censor bleep and more
- ✨ **special triggers**: Enter = rizz, Ctrl+C = another one, Ctrl+Z = snapchat, Ctrl+A = flash bang, Ctrl+P = windows xp shutdown, and typing words like `67`, `claude` or `no mistakes` sets off their own sounds
- 🎚️ **make it feel right**: stereo panning (left keys play left, right keys play right) + humanize so it never sounds the same twice
- 📤 **upload ur own sounds**, trim them, mess with the pitch
- 📊 **typing history** so u can see how much u've been mashing
- 🎧 **DJ mode**: two decks + a mixer with BPM detection, sync, loops, hotcues, EQ, echo, brake, spinback and an airhorn. with DJ mode on, Alt + number keys and typed "dj ..." words run the decks from any app. it can drive [Mixxx](integrations/mixxx/README.md) over MIDI too

## how to install

### the easy way (just the .exe)

1. go to the **Releases** page and download `Keyboard Jukebox 1.0.0.exe`
2. put it somewhere u'll remember (desktop is fine)
3. double click it. no installer, it just runs
4. windows might yell **"Windows protected your PC"** because i didn't pay for a code signing certificate. click **More info** then **Run anyway**
5. start typing anywhere. u should hear it right away 🎉

if u hear nothing: check ur system volume and make sure the jukebox window isn't muted.

### the nerd way (from source)

u need [Node.js](https://nodejs.org) (LTS is fine) and git.

```bash
git clone <this repo's url>
cd keyboard-jukebox
npm install
npm start
```

want ur own portable .exe? `npm run dist` builds one into `dist/`.

## adding ur own trigger

drop the mp3 in `assets/sounds/` and add one line to `TRIGGERS` in `src/renderer/js/config/sounds.js`. the key handler, the editor dropdown and the cheat sheet all read from that list so thats literally it.

## for devs

folder map, how the pieces talk to each other and the original notes are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

```bash
npm test   # unit tests
```

## heads up

it listens to ur keyboard globally (thats how it works in every app). it only counts keys for the history screen, saved locally in `Documents/Keyboard Jukebox/sessions.json`. quit the app and it stops.

## credits

made by **zlatasaurus**. win98 theme from [classic-stylesheets](https://github.com/nielssp/classic-stylesheets) by Niels Sonnich Poulsen (MIT). sound effects from [myinstants](https://www.myinstants.com), all belong to their original creators.

MIT licensed, do whatever.
