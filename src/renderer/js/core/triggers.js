// triggers.js — decides if a keypress is "special". pure logic, no audio, no DOM = easy to test

// give it a list of { id, when }, get back a fn that eats key events and spits out an id (or null)
// works for both the sound TRIGGERS and the DJ_COMMANDS
export function createTriggerEngine(triggers, { bufferSize = 20 } = {}) {
  const byKey = {}, byCtrl = {}, byAlt = {}, words = [];
  for (const t of triggers) {
    if (t.when.key) byKey[t.when.key] = t.id;
    if (t.when.ctrl) byCtrl[t.when.ctrl] = t.id;
    if (t.when.alt) byAlt[t.when.alt] = t.id;
    if (t.when.word) words.push({ text: t.when.word, id: t.id });
  }

  let typed = ''; // rolling buffer of the last few chars, for word triggers ("claude", "no mistakes")

  return function resolve({ key, ctrl, alt }) {
    // ctrl / alt + key shortcuts get their own thing
    if (ctrl && key && byCtrl[key]) return byCtrl[key];
    if (alt && !ctrl && key && byAlt[key]) return byAlt[key]; // !ctrl so AltGr (= ctrl+alt) doesnt count

    // enter = rizz, always (and it wipes the word buffer)
    if (byKey[key]) { typed = ''; return byKey[key]; }

    // keep the rolling buffer updated. backspace nukes the last char
    if (key === 'Backspace') typed = typed.slice(0, -1);
    else if (key && key.length === 1) typed = (typed + key).slice(-bufferSize);

    // special words / numbers
    for (const w of words) {
      if (typed.endsWith(w.text)) { typed = ''; return w.id; }
    }
    return null; // just normal typing
  };
}
