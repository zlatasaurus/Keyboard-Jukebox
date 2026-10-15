// controller.js — turns DJ_COMMANDS ids into actual deck moves. same ids the Mixxx script uses,
// so the keyboard shortcuts work the same whether ur driving Mixxx or our own decks

export function createDjController(mixer) {
  let target = 0; // which deck the commands hit (0 or 1)
  const deck = () => mixer.decks[target];
  const other = () => mixer.decks[1 - target];

  const commands = {
    deck1: () => { target = 0; },
    deck2: () => { target = 1; },
    play:  () => deck().togglePlay(),
    cue:   () => deck().cueTap(),
    sync:  () => deck().syncTo(other()),
    loop:  () => deck().toggleLoop(4),
    fx:    () => deck().toggleFx(),
    fade:  () => mixer.setCrossfader(target === 0 ? -1 : 1),
    drop:  () => deck().hotcueGo(),
    spin:  () => deck().spinback(),
    brake: () => deck().brake(),
    horn:  () => mixer.airhorn(),
  };

  return {
    commands: Object.keys(commands),
    run(id) {
      const fn = commands[id];
      if (fn) fn();
      return !!fn;
    },
    get target() { return target; },
    set target(i) { target = i; },
  };
}
