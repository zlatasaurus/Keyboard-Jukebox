// mixer.js — two decks, a crossfader, a shared echo, and the airhorn. the whole DJ booth
import { Deck } from './deck.js';
import { SYNTHS } from '../audio/synth.js';

export function createMixer(ctx, out) {
  // echo bus: delay that feeds back into itself. both decks can send into it
  const fxIn = ctx.createGain();
  const delay = ctx.createDelay(2); delay.delayTime.value = 0.375;
  const feedback = ctx.createGain(); feedback.gain.value = 0.45;
  const wet = ctx.createGain(); wet.gain.value = 0.6;
  fxIn.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(out);

  const decks = [new Deck(ctx, { out, fxIn }), new Deck(ctx, { out, fxIn })];

  // equal-power curve so the middle doesn't get a volume dip. -1 = deck 1 only, 1 = deck 2 only
  let crossfader = 0;
  function setCrossfader(x) {
    crossfader = Math.max(-1, Math.min(1, x));
    const a = ((crossfader + 1) / 2) * (Math.PI / 2);
    decks[0].xfade.gain.setTargetAtTime(Math.cos(a), ctx.currentTime, 0.005);
    decks[1].xfade.gain.setTargetAtTime(Math.sin(a), ctx.currentTime, 0.005);
  }
  setCrossfader(0);

  return {
    decks,
    setCrossfader,
    get crossfader() { return crossfader; },
    airhorn: () => SYNTHS.airhorn(ctx, out),
  };
}
