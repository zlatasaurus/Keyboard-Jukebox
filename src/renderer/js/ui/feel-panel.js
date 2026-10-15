// feel-panel.js — stereo width + humanize sliders, plus a lil left-to-right demo sweep
import { $ } from './dom.js';
import { state, setState } from '../state.js';
import { ensureAudio } from '../audio/engine.js';
import { playSound } from '../services/sound-library.js';
import { humanize, stereoPan } from '../core/feel.js';

export function mountFeelPanel() {
  const stereo = $('stereo'), human = $('humanize');

  const showVals = () => {
    $('stereoV').textContent = Math.round(state.stereo * 100) + '%';
    $('humanizeV').textContent = '±' + state.humanize + 'c';
  };

  stereo.value = state.stereo;
  human.value = state.humanize;
  stereo.addEventListener('input', () => { setState({ stereo: +stereo.value }); showVals(); });
  human.addEventListener('input', () => { setState({ humanize: +human.value }); showVals(); });
  showVals();

  // plays ur typing sound "across the keyboard" so u can actually hear what the sliders do
  $('feelTest').addEventListener('click', () => {
    ensureAudio();
    for (let i = 0; i < 9; i++) {
      const keyPan = (i / 8) * 2 - 1;
      setTimeout(() => playSound(state.currentTyping, {
        pan: stereoPan(keyPan, state.stereo),
        detune: humanize(state.humanize),
      }), i * 110);
    }
  });
}
