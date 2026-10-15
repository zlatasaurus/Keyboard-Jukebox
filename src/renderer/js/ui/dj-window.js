// dj-window.js — the Keyboard Jukebox DJ program: two decks + the mixer strip.
// buttons call straight into the decks. the screen redraws every frame from deck state,
// so keyboard commands from other apps show up here without any extra wiring
import { $ } from './dom.js';
import { decode } from '../audio/engine.js';

const fmt = (s) => {
  s = Math.max(0, s);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

// waveform colors, win98 palette
const C = { bg: '#ffffff', wave: '#000080', played: '#008080', head: '#ff0000', cue: '#ff8000', hot: '#008000', loop: 'rgba(255,255,0,.55)' };

function drawWave(canvas, deck) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const g = canvas.getContext('2d');
  g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
  if (!deck.peaks) return;

  const px = (t) => (t / deck.duration) * w;
  if (deck.loop) { g.fillStyle = C.loop; g.fillRect(px(deck.loop.start), 0, Math.max(2, px(deck.loop.end) - px(deck.loop.start)), h); }

  const played = px(deck.position()), n = deck.peaks.length, mid = h / 2;
  for (let x = 0; x < w; x++) {
    const bar = Math.max(1, deck.peaks[Math.floor((x / w) * n)] * (h - 4));
    g.fillStyle = x < played ? C.played : C.wave;
    g.fillRect(x, mid - bar / 2, 1, bar);
  }
  const line = (t, color, width) => { g.fillStyle = color; g.fillRect(Math.round(px(t)) - (width >> 1), 0, width, h); };
  line(deck.cuePoint, C.cue, 2 * dpr);
  if (deck.hotcue != null) line(deck.hotcue, C.hot, 2 * dpr);
  line(deck.position(), C.head, 2 * dpr);
}

function mountDeck(root, deck, other, index, controller) {
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  r('legend').textContent = `Deck ${index + 1}`;

  // ---- loading a track ----
  r('load').addEventListener('click', () => r('file').click());
  r('file').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    const title = r('title');
    title.textContent = `Loading ${f.name}...`;
    try {
      const buf = await decode(await f.arrayBuffer());
      title.textContent = 'Finding the beat...';
      await new Promise(res => setTimeout(res, 20)); // let that text actually paint before the math hogs the thread
      deck.loadBuffer(buf, f.name.replace(/\.[^.]+$/, ''));
      title.textContent = deck.title;
      title.title = deck.title;
    } catch {
      title.textContent = "That file didn't work. Try an mp3, wav or ogg.";
    }
  });

  // clicking anything on a deck also makes it the keyboard target
  const target = () => { controller.target = index; };
  const tap = (name, fn) => r(name).addEventListener('click', () => { target(); fn(); });
  tap('play', () => deck.togglePlay());
  tap('sync', () => deck.syncTo(other));
  tap('loop', () => deck.toggleLoop(4));
  tap('hotcue', () => deck.hotcueGo());
  tap('fx', () => deck.toggleFx());
  tap('brake', () => deck.brake());
  tap('spin', () => deck.spinback());

  // cue on screen = hold-able, like a real CDJ
  const cue = r('cue');
  cue.addEventListener('pointerdown', () => { target(); deck.cuePress(); });
  for (const ev of ['pointerup', 'pointerleave']) cue.addEventListener(ev, () => deck.cueRelease());

  const tempo = r('tempo');
  tempo.addEventListener('input', () => deck.setRate(1 + tempo.value / 100));
  tempo.addEventListener('dblclick', () => deck.setRate(1)); // double click = back to normal speed
  r('vol').addEventListener('input', (e) => deck.setVolume(+e.target.value));
  for (const band of ['low', 'mid', 'high']) {
    const s = r('eq-' + band);
    s.addEventListener('input', () => deck.setEq(band, +s.value));
    s.addEventListener('dblclick', () => { s.value = 0; deck.setEq(band, 0); });
  }

  const wave = r('wave');
  wave.addEventListener('click', (e) => {
    if (!deck.buffer) return;
    target();
    deck.seek(((e.clientX - wave.getBoundingClientRect().left) / wave.clientWidth) * deck.duration);
  });

  const on = (name, yes) => r(name).classList.toggle('active', !!yes); // win98 pressed-in look
  return {
    draw() {
      const pos = deck.position();
      r('time').textContent = fmt(pos);
      r('left').textContent = '-' + fmt(deck.duration - pos);
      r('bpm').textContent = deck.liveBpm ? `${deck.liveBpm.toFixed(1)} BPM` : '--- BPM';
      const pct = (deck.rate - 1) * 100;
      if (document.activeElement !== tempo) tempo.value = Math.max(-16, Math.min(16, pct));
      r('tempoV').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
      on('play', deck.playing); on('loop', deck.loop); on('fx', deck.fxOn); on('hotcue', deck.hotcue != null);
      root.classList.toggle('targeted', controller.target === index);
      drawWave(wave, deck);
    },
  };
}

export function mountDjWindow({ mixer, controller }) {
  const tpl = $('deckTemplate'), host = $('decks'), win = $('win-dj');
  const views = mixer.decks.map((deck, i) => {
    const root = tpl.content.firstElementChild.cloneNode(true);
    host.append(root);
    return mountDeck(root, deck, mixer.decks[1 - i], i, controller);
  });

  const xf = $('xfader');
  xf.addEventListener('input', () => mixer.setCrossfader(+xf.value));
  xf.addEventListener('dblclick', () => mixer.setCrossfader(0));
  $('airhorn').addEventListener('click', () => mixer.airhorn());

  // redraw loop. skips the work while the DJ window isn't the one on screen
  (function frame() {
    if (!win.hidden) {
      for (const v of views) v.draw();
      if (document.activeElement !== xf) xf.value = mixer.crossfader;
    }
    requestAnimationFrame(frame);
  })();
}
