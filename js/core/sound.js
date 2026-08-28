const Sound = (function() {
  let actx = null;

  function ctx() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (actx.state === 'suspended') {
      actx.resume();
    }
    return actx;
  }

  function vol() {
    const slider = document.getElementById('volume-slider');
    if (!slider) return 0.5;
    return slider.value / 100;
  }

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

  function boot() {
    tone(392, 0.35, 0.08);
    setTimeout(() => tone(587, 0.5, 0.08), 180);
  }

  function open() {
    tone(500, 0.09, 0.05, 760);
  }

  function close() {
    tone(480, 0.09, 0.05, 300);
  }

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
