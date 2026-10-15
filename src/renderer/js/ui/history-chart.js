// history-chart.js — bar chart of keys per session, saved on every close
import { $ } from './dom.js';
import { bridge } from '../services/bridge.js';

const fmtDate = (ms) => new Date(ms).toLocaleDateString([], { month: 'numeric', day: 'numeric' });
const fmtTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; };

function buildSvg(rows) {
  const W = 760, H = 190, padL = 8, padB = 40, padT = 18;
  const max = Math.max(10, ...rows.map(r => r.keys));
  const bw = Math.min(48, (W - padL * 2) / rows.length - 10);
  const slot = (W - padL * 2) / rows.length;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<line x1="${padL}" y1="${H - padB}" x2="${W - padL}" y2="${H - padB}" stroke="#808080"/>`;
  rows.forEach((r, i) => {
    const bh = Math.round((r.keys / max) * (H - padB - padT));
    const x = padL + i * slot + (slot - bw) / 2, y = H - padB - bh;
    const cx = x + bw / 2;
    svg += `<g><title>${new Date(r.start).toLocaleString()} · ${fmtDur(r.end - r.start)} · ${r.keys} keys</title>`
        +  `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(bh, 1)}" fill="${r.live ? '#008080' : '#000080'}"/>`
        +  `<text x="${cx}" y="${y - 4}" text-anchor="middle">${r.keys}</text>`
        +  `<text x="${cx}" y="${H - padB + 14}" text-anchor="middle">${fmtDate(r.start)}</text>`
        +  `<text x="${cx}" y="${H - padB + 28}" text-anchor="middle">${fmtTime(r.start)}</text></g>`;
  });
  return svg + '</svg>';
}

async function render() {
  let h;
  try { h = await bridge.history(); } catch { return; }
  // past sessions + the one thats running right now (teal bar)
  const rows = [...h.sessions.map(s => ({ ...s, live: false })),
                { start: h.current.start, end: Date.now(), keys: h.current.keys, live: true }]
    .sort((a, b) => a.start - b.start).slice(-12);

  const allTime = h.sessions.reduce((n, r) => n + r.keys, 0) + h.current.keys;
  $('histTotal').textContent = `All-time: ${allTime.toLocaleString()} keys across ${h.sessions.length + 1} sessions`;
  $('chart').innerHTML = buildSvg(rows);
}

export function mountHistoryChart({ refreshMs = 3000 } = {}) {
  $('openFolder').addEventListener('click', () => bridge.openFolder());
  render();
  setInterval(render, refreshMs); // keeps the live bar moving
}
