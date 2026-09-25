// sound.js - tiny WebAudio synth for UI sounds: a shared lazily-created
// AudioContext plus one tone() helper for sine blips with an optional pitch
// slide. Volume follows the settings panel slider (0 = silent).

const Sound = (function() {
  let actx = null;

  // ctx: lazily create the shared AudioContext and resume it if the browser
  // suspended it (autoplay policy) so the first boot sound always plays.
  function ctx() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (actx.state === 'suspended') {
      actx.resume();
    }
    return actx;
  }

  // vol: current volume from the settings slider (0..1); defaults to 0.5.
  function vol() {
    const slider = document.getElementById('volume-slider');
    if (!slider) return 0.5;
    return slider.value / 100;
  }

  // tone: play a sine blip at `freq` Hz for `dur` seconds at gain `gainVal`,
  // optionally sliding the pitch to `slideTo` Hz. Short-circuits when muted.
  function tone(freq, dur, gainVal, slideTo) {
    if (vol() === 0) return;
    const a = ctx();

    const osc = a.createOscillator();
    const gain = a.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, a.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    }

    gain.gain.setValueAtTime(gainVal * vol(), a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);

    osc.connect(gain);
    gain.connect(a.destination);

    osc.start();
    osc.stop(a.currentTime + dur);
  }

  // boot: two-note startup chime, played right after sign-in.
  function boot() {
    tone(392, 0.35, 0.08);
    setTimeout(() => tone(587, 0.5, 0.08), 180);
  }

  // open: short rising blip when a window opens.
  function open() {
    tone(500, 0.09, 0.05, 760);
  }

  // close: short falling blip when a window closes.
  function close() {
    tone(480, 0.09, 0.05, 300);
  }

  // notify: single high ping whenever a toast notification appears.
  function notify() {
    tone(880, 0.16, 0.05);
  }

  return {
    boot,
    open,
    close,
    notify
  };
})();
