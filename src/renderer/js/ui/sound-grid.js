// sound-grid.js — the big grid of typing sounds. click one = that's ur sound now
import { $, el } from './dom.js';
import { state, setState, subscribe } from '../state.js';
import { typingSounds } from '../services/sound-library.js';

export function mountSoundGrid({ onPick }) {
  const root = $('sounds');

  function render() {
    root.replaceChildren(...typingSounds().map(s => {
      const b = el('button', { textContent: s.label });
      if (s.id === state.currentTyping) b.className = 'active'; // win98 pressed-in look
      b.addEventListener('click', () => { setState({ currentTyping: s.id }); onPick(s.id); });
      return b;
    }));
  }
  subscribe((_s, p) => { if ('currentTyping' in p || 'custom' in p) render(); });
  render();
}
