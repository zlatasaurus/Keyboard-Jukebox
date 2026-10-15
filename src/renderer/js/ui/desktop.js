// desktop.js — the fake win98 desktop: taskbar buttons + Start menu flip between the two programs
import { $ } from './dom.js';
import { state, setState, subscribe } from '../state.js';
import { bridge } from '../services/bridge.js';

export const VIEWS = ['jukebox', 'dj'];

export function mountDesktop() {
  const wins = { jukebox: $('win-jukebox'), dj: $('win-dj') };
  const menu = $('startMenu'), startBtn = $('startBtn');

  function render() {
    for (const v of VIEWS) wins[v].hidden = state.view !== v;
    for (const b of document.querySelectorAll('.taskbar [data-show]')) b.classList.toggle('active', b.dataset.show === state.view);
  }

  const setMenu = (open) => { menu.hidden = !open; startBtn.classList.toggle('active', open); };
  startBtn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // taskbar buttons + start menu entries all use data-show="<view>"
  for (const b of document.querySelectorAll('[data-show]')) {
    b.addEventListener('click', () => { setState({ view: b.dataset.show }); setMenu(false); });
  }
  $('shutdown').addEventListener('click', () => bridge.win('close')); // "it is now safe to turn off your computer"

  // tray clock, because obviously
  const clock = $('clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  tick(); setInterval(tick, 10000);

  subscribe((_s, p) => { if ('view' in p) render(); });
  render();
}
