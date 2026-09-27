// Ambience — per-planet ambient sound engine (Web Audio API).
//
// Why Web Audio instead of <audio>: an AudioBufferSourceNode with loop=true
// loops SAMPLE-ACCURATELY (zero gap, zero click), while <audio> elements add
// small gaps at the loop point and MP3 container padding breaks exact loops.
// The loop files are gapless OGG Vorbis (assets/themes/<theme>.ogg), trimmed
// to a verified zero-crossing loop point and decoded to PCM before playback.
//
// Public API:
//   Ambience.setTheme(theme)  - switch planet ambience (1s crossfade)
//   Ambience.setEnabled(on)   - sound on/off, persisted in localStorage
//   Ambience.unlock()         - resume AudioContext on first user gesture
//   Ambience.isOn()           - current enabled state
//   Ambience.state()          - debug snapshot { theme, playing, loop,
//                               duration, ctxState, enabled }
window.Ambience = (() => {
  'use strict';

  var THEMES = ['moon', 'mars', 'earth', 'saturn'];
  var LS_KEY = 'moonos-theme-sound';
  var MASTER_GAIN = 0.3;      // modest — subtle, not intrusive
  var FADE_TC = 0.35;         // ~1s crossfade time constant

  var ctx = null;
  var master = null;
  var buffers = {};           // theme -> AudioBuffer cache
  var current = null;         // { theme, source, gain } or null
  var desiredTheme = 'moon';
  var enabled = true;

  try {
    enabled = localStorage.getItem(LS_KEY) !== 'off';
  } catch (e) { /* storage unavailable: default on */ }

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function loadBuffer(theme) {
    if (buffers[theme]) return Promise.resolve(buffers[theme]);
    var c = ensureCtx();
    if (!c) return Promise.resolve(null);
    return fetch('assets/themes/' + theme + '.ogg')
      .then(function (res) {
        if (!res.ok) throw new Error('ambience fetch failed: ' + res.status);
        return res.arrayBuffer();
      })
      .then(function (ab) { return c.decodeAudioData(ab); })
      .then(function (buf) {
        buffers[theme] = buf;
        return buf;
      })
      .catch(function () { return null; }); // silent fallback
  }

  function startLooped(theme, buf, t) {
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true; // sample-accurate loop
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.setTargetAtTime(1.0, t, FADE_TC);
    src.connect(g);
    g.connect(master);
    src.start(t);
    return { theme: theme, source: src, gain: g };
  }

  function fadeOutAndStop(handle) {
    if (!handle || !ctx) return;
    var t = ctx.currentTime;
    try {
      handle.gain.gain.cancelScheduledValues(t);
      handle.gain.gain.setTargetAtTime(0.0001, t, FADE_TC);
      handle.source.stop(t + 1.6);
      setTimeout(function () {
        try { handle.source.disconnect(); } catch (e) {}
        try { handle.gain.disconnect(); } catch (e) {}
      }, 2000);
    } catch (e) { /* already stopped */ }
  }

  function setTheme(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'moon';
    desiredTheme = theme;
    if (!enabled) return Promise.resolve(); // remember, don't play
    if (current && current.theme === theme) return Promise.resolve();
    var c = ensureCtx();
    if (!c) return Promise.resolve();
    return loadBuffer(theme).then(function (buf) {
      if (!buf || desiredTheme !== theme || !enabled) return; // superseded / disabled
      if (current && current.theme === theme) return;
      var t = ctx.currentTime;
      var next = startLooped(theme, buf, t);
      var old = current;
      current = next;
      fadeOutAndStop(old);
    });
  }

  function setEnabled(on) {
    enabled = !!on;
    try {
      localStorage.setItem(LS_KEY, enabled ? 'on' : 'off');
    } catch (e) {}
    if (!enabled) {
      var old = current;
      current = null;
      fadeOutAndStop(old);
    } else if (!current) {
      setTheme(desiredTheme);
    }
    return enabled;
  }

  function unlock() {
    var c = ensureCtx();
    if (c && c.state === 'suspended') {
      c.resume().catch(function () {});
    }
    if (enabled && !current) setTheme(desiredTheme);
  }

  // Self-attach: first real user gesture resumes the context.
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  function isOn() { return enabled; }

  function state() {
    return {
      theme: current ? current.theme : null,
      desiredTheme: desiredTheme,
      playing: !!(current && ctx && ctx.state === 'running'),
      loop: !!(current && current.source.loop),
      duration: current ? current.source.buffer.duration : 0,
      ctxState: ctx ? ctx.state : 'none',
      enabled: enabled
    };
  }

  return {
    setTheme: setTheme,
    setEnabled: setEnabled,
    unlock: unlock,
    isOn: isOn,
    state: state
  };
})();
