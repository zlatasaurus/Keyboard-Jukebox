// status-panel.js — the top strip: what's playing, key counter, blinky dot, volume, on/off
import { $ } from './dom.js';
import { state, setState, subscribe } from '../state.js';
import { labelOf } from '../services/sound-library.js';

export function mountStatusPanel() {
  const nowEl = $('now'), countEl = $('count'), dot = $('dot'), power = $('power'), vol = $('vol');
  let count = 0;

  vol.value = state.volume;
  vol.addEventListener('input', (e) => setState({ volume: +e.target.value }));
  power.addEventListener('click', () => setState({ enabled: !state.enabled }));

  function render() {
    nowEl.textContent = labelOf(state.currentTyping);
    power.setAttribute('aria-pressed', state.enabled);
    power.classList.toggle('active', state.enabled); // pressed in = on
    power.textContent = state.enabled ? 'Sounds ON' : 'Sounds OFF';
  }
  subscribe((_s, p) => { if ('currentTyping' in p || 'custom' in p || 'enabled' in p) render(); });
  render();

  return {
    // flash the dot + tick the counter so u can see its alive
    bump() {
      countEl.textContent = (++count) + ' keys';
      dot.classList.add('hit');
      setTimeout(() => dot.classList.remove('hit'), 60);
    },
  };
}
