// title-bar.js — our fake win98 title bar buttons ask the main process to do the window stuff.
// every program window has its own set, so we grab them all by data attribute
import { bridge } from '../services/bridge.js';

export function mountTitleBar() {
  const wire = (attr, action) => {
    for (const b of document.querySelectorAll(`.title-bar [${attr}]`)) b.addEventListener('click', () => bridge.win(action));
  };
  wire('data-minimize', 'min');
  wire('data-maximize', 'max');
  wire('data-close', 'close');
}
