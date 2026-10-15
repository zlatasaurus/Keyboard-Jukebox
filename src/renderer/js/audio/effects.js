// effects.js — the "quality" dropdown magic: lowpass + bit-crush

export const QUALITY = {
  high:   null,
  medium: { lp: 7000, bits: 10 },
  low:    { lp: 3000, bits: 6 },
  trash:  { lp: 1500, bits: 4 },
};

// bit-crush curve: fewer bits = crunchier. cached cuz rebuilding it every keypress is wasteful
const curves = {};
function crushCurve(bits) {
  if (curves[bits]) return curves[bits];
  const steps = Math.pow(2, bits), n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.round(x * steps) / steps;
  }
  return curves[bits] = c;
}

// hooks `node` through the quality chain, returns whatever the next thing should connect to
export function applyQuality(ctx, node, quality) {
  const q = QUALITY[quality];
  if (!q) return node;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = q.lp;
  const sh = ctx.createWaveShaper(); sh.curve = crushCurve(q.bits);
  node.connect(lp); lp.connect(sh);
  return sh;
}
