// Keyboard Jukebox — Mixxx controller script. this runs INSIDE Mixxx, not in our app.
// our app just taps MIDI notes, this file decides what each tap does to ur decks.
// every function name here has to match an `id` in src/renderer/js/config/dj-commands.js
// (Mixxx calls them as KeyboardJukebox.<id>(channel, control, value, status, group))

var KeyboardJukebox = {};

KeyboardJukebox.deck = 1; // which deck the commands hit. Alt+1 / Alt+2 switch it

KeyboardJukebox.init = function () {};
KeyboardJukebox.shutdown = function () {};

// ---- lil helpers ----
KeyboardJukebox.group = function () { return "[Channel" + KeyboardJukebox.deck + "]"; };
KeyboardJukebox.toggle = function (group, key) {
    engine.setValue(group, key, engine.getValue(group, key) ? 0 : 1);
};
// we get a note-on (value 127) and a note-off (value 0) per tap. most commands only care about the press
KeyboardJukebox.onPress = function (fn) {
    return function (channel, control, value) { if (value > 0) { fn(); } };
};

// ---- the commands ----
KeyboardJukebox.deck1 = KeyboardJukebox.onPress(function () { KeyboardJukebox.deck = 1; });
KeyboardJukebox.deck2 = KeyboardJukebox.onPress(function () { KeyboardJukebox.deck = 2; });

KeyboardJukebox.play = KeyboardJukebox.onPress(function () {
    KeyboardJukebox.toggle(KeyboardJukebox.group(), "play");
});

// cue is the one that cares about release too (CDJ style: hold = preview, let go = back to cue)
KeyboardJukebox.cue = function (channel, control, value) {
    engine.setValue(KeyboardJukebox.group(), "cue_default", value > 0 ? 1 : 0);
};

KeyboardJukebox.sync = KeyboardJukebox.onPress(function () {
    engine.setValue(KeyboardJukebox.group(), "beatsync", 1);
});

KeyboardJukebox.loop = KeyboardJukebox.onPress(function () {
    engine.setValue(KeyboardJukebox.group(), "beatloop_4_toggle", 1);
});

// route the target deck into effect unit 1 (or pull it back out)
KeyboardJukebox.fx = KeyboardJukebox.onPress(function () {
    KeyboardJukebox.toggle("[EffectRack1_EffectUnit1]", "group_" + KeyboardJukebox.group() + "_enable");
});

KeyboardJukebox.fade = KeyboardJukebox.onPress(function () {
    engine.setValue("[Master]", "crossfader", KeyboardJukebox.deck === 1 ? -1 : 1);
});

KeyboardJukebox.drop = KeyboardJukebox.onPress(function () {
    engine.setValue(KeyboardJukebox.group(), "hotcue_1_gotoandplay", 1);
});

// spinback needs to be switched off again, so we give it ~0.8s of drama then let go
KeyboardJukebox.spin = KeyboardJukebox.onPress(function () {
    var deck = KeyboardJukebox.deck;
    engine.spinback(deck, true);
    engine.beginTimer(800, function () { engine.spinback(deck, false); }, true);
});

KeyboardJukebox.brake = KeyboardJukebox.onPress(function () {
    engine.brake(KeyboardJukebox.deck, true);
});

// load an airhorn into sampler 1 and this fires it. u know what to do
KeyboardJukebox.horn = KeyboardJukebox.onPress(function () {
    engine.setValue("[Sampler1]", "cue_gotoandplay", 1);
});
