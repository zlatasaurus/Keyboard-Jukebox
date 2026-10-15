// tweak-panel.js — trim / pitch / crunch any sound. changes save as u drag
import { $, el } from './dom.js';
import { state, subscribe, cfgOf, setCfg } from '../state.js';
import { TYPING_SOUNDS, TRIGGERS } from '../config/sounds.js';
import { ensureAudio, getBuffer } from '../audio/engine.js';
import { playSound, removeUpload, isUpload, triggerLabel } from '../services/sound-library.js';

export function mountTweakPanel() {
  const sel = $('tweakSel'), start = $('start'), end = $('end'), pitch = $('pitch'), quality = $('quality');
  const hasOption = (id) => [...sel.options].some(o => o.value === id);

  function renderSelect() {
    const keep = sel.value;
    const group = (label, items) => {
      const opts = items.filter(s => !s.synth).map(s => el('option', { value: s.id, textContent: s.label }));
      if (opts.length) sel.append(el('optgroup', { label }, opts));
    };
    sel.replaceChildren();
    group('Typing sounds', TYPING_SOUNDS);
    group('Your uploads', state.custom);
    group('Special triggers', TRIGGERS.map(t => ({ id: t.id, label: triggerLabel(t) })));
    sel.value = hasOption(keep) ? keep : hasOption(state.currentTyping) ? state.currentTyping : sel.options[0].value;
  }

  // read the sliders into a config object
  function panelCfg() {
    const dur = getBuffer(sel.value)?.duration || 1;
    const e = +end.value;
    return { start: +start.value, end: e >= dur - 0.005 ? null : e, pitch: +pitch.value, quality: quality.value };
  }

  // push the saved config for the selected sound into the sliders
  function sync() {
    const id = sel.value, buf = getBuffer(id), c = cfgOf(id);
    const dur = buf ? buf.duration : 1;
    for (const s of [start, end]) { s.max = dur; s.disabled = !buf; }
    start.value = c.start || 0;
    end.value = c.end == null ? dur : c.end;
    pitch.value = c.pitch || 0;
    quality.value = c.quality;
    $('del').style.display = isUpload(id) ? '' : 'none';
    $('tweakHint').textContent = buf ? `Clip is ${dur.toFixed(2)}s long. Changes save automatically.` : 'Loading this sound...';
    showVals();
  }

  function showVals() {
    $('startV').textContent = (+start.value).toFixed(2) + 's';
    $('endV').textContent = (+end.value).toFixed(2) + 's';
    const p = +pitch.value;
    $('pitchV').textContent = (p > 0 ? '+' : '') + p + ' st';
  }

  // any slider moved -> save it + keep start < end so we dont get silence
  function onTweak(which) {
    let s = +start.value, e = +end.value;
    if (s >= e - 0.02) {
      if (which === 'start') start.value = Math.max(0, e - 0.02);
      else end.value = Math.min(+end.max, s + 0.02);
    }
    setCfg(sel.value, panelCfg());
    showVals();
  }

  start.addEventListener('input', () => onTweak('start'));
  end.addEventListener('input', () => onTweak('end'));
  pitch.addEventListener('input', () => onTweak('pitch'));
  quality.addEventListener('input', () => onTweak('quality'));
  sel.addEventListener('change', sync);
  $('preview').addEventListener('click', () => { ensureAudio(); playSound(sel.value, { cutPrevious: true }); });
  $('reset').addEventListener('click', () => { setCfg(sel.value, null); sync(); });
  $('del').addEventListener('click', () => removeUpload(sel.value));

  // uploads added/removed -> rebuild the dropdown
  subscribe((_s, p) => { if ('custom' in p) { renderSelect(); sync(); } });
  renderSelect(); sync();

  return {
    // jump the editor to a sound (synth sounds have nothing to tweak, so those get skipped)
    focus(id) { if (hasOption(id)) { sel.value = id; sync(); } },
  };
}
