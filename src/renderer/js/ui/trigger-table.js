// trigger-table.js — the "special triggers" cheat sheet, built straight from config so it never lies
import { $, el } from './dom.js';
import { TRIGGERS } from '../config/sounds.js';

export function mountTriggerTable() {
  $('triggerTable').replaceChildren(...TRIGGERS.map(t =>
    el('tr', {}, [el('td', { textContent: t.hint }), el('td', { textContent: t.label })])));
}
