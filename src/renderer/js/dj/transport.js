// transport.js — "where's the playhead right now" math. web audio doesn't tell u, so we track it ourselves

// position after `elapsed` seconds at `rate`, wrapping around inside a loop if we're in one
export function transportPosition({ anchorPos, elapsed, rate, loop }) {
  const pos = anchorPos + elapsed * rate;
  if (loop && anchorPos < loop.end && pos >= loop.end) {
    const len = loop.end - loop.start;
    return loop.start + ((pos - loop.start) % len);
  }
  return pos;
}

// how far the track moved during a speed ramp (brake / spinback) going r0 -> r1 over T seconds.
// it's the area under a straight line, aka the one bit of calc that actually came in handy
export function rampDistance(r0, r1, T, t) {
  t = Math.max(0, Math.min(t, T));
  return r0 * t + ((r1 - r0) * t * t) / (2 * T);
}

// where in the bar a position is, 0..1 (0 = right on a beat). used to line decks up on sync
export function beatPhase(pos, bpm, offset) {
  const beat = 60 / bpm;
  return ((((pos - offset) / beat) % 1) + 1) % 1;
}

// smallest nudge (in beats, -0.5..0.5) to get from phase `from` to phase `to`
export function phaseNudge(from, to) {
  let d = to - from;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}
