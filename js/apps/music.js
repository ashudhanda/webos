// music.js - a playable synth piano on the Web Audio API. click the keys
// or use the computer keyboard (z-row = lower octave, q-row = upper).
// waveform + volume + octave shift, and a demo tune button.

const MusicApp = (function() {
  const WHITE = [0, 2, 4, 5, 7, 9, 11];       // semitone offsets of white keys
  const BLACK_AFTER = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // white index -> black offset
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // computer keyboard map: key -> midi offset from base C
  const KEYMAP = {
    z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7,
    h: 8, n: 9, j: 10, m: 11,
    q: 12, '2': 13, w: 14, '3': 15, e: 16, r: 17, '5': 18,
    t: 19, '6': 20, y: 21, '7': 22, u: 23
  };

  // twinkle twinkle, as (midi, beats)
  const DEMO = [
    [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
    [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]
  ];

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'music',
      title: 'Music Studio',
      width: 640,
      height: 380,
      minWidth: 520,
      minHeight: 340,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
      render: (bodyEl) => {
        cleanupFn = initMusic(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function noteName(m) {
    return NAMES[m % 12] + (Math.floor(m / 12) - 1);
  }

  function initMusic(container) {
    container.innerHTML = `
      <div class="music-app" tabindex="0">
        <div class="music-toolbar">
          <label class="music-label">wave
            <select class="music-wave">
              <option value="sine">sine</option>
              <option value="triangle">triangle</option>
              <option value="square">square</option>
              <option value="sawtooth">sawtooth</option>
            </select>
          </label>
          <label class="music-label">volume
            <input type="range" class="music-vol" min="0" max="100" value="60">
          </label>
          <div class="music-octave">
            <button class="music-btn oct-down" title="octave down">− oct</button>
            <span class="music-oct-label">C4</span>
            <button class="music-btn oct-up" title="octave up">+ oct</button>
          </div>
          <button class="music-btn music-demo" title="play a demo tune">▶ demo</button>
          <button class="music-btn music-stop" title="stop demo">■ stop</button>
        </div>
        <div class="music-keys"></div>
        <div class="music-hint">click the keys or type on your keyboard — z-row plays the lower octave, q-row the upper</div>
        <div class="music-now">♪ <span class="music-now-note">—</span></div>
      </div>
    `;

    const appEl = container.querySelector('.music-app');
    const keysEl = container.querySelector('.music-keys');
    const waveSel = container.querySelector('.music-wave');
    const volSlider = container.querySelector('.music-vol');
    const octLabel = container.querySelector('.music-oct-label');
    const nowNote = container.querySelector('.music-now-note');

    let audio = null;
    let master = null;
    let baseMidi = 60; // C4
    let octave = 4;
    const live = new Map();   // midi -> { osc, gain }
    let demoTimers = [];

    function ensureAudio() {
      if (audio) {
        if (audio.state === 'suspended') audio.resume().catch(() => {});
        return;
      }
      audio = new (window.AudioContext || window.webkitAudioContext)();
      master = audio.createGain();
      master.gain.value = volSlider.value / 100 * 0.5;
      master.connect(audio.destination);
    }

    function noteOn(midi) {
      ensureAudio();
      if (live.has(midi)) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = waveSel.value;
      osc.frequency.value = midiToFreq(midi);
      const t = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(1, t + 0.015);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      live.set(midi, { osc, gain });
      nowNote.textContent = noteName(midi);
      const keyEl = keysEl.querySelector(`[data-midi="${midi}"]`);
      if (keyEl) keyEl.classList.add('active');
    }

    function noteOff(midi) {
      const n = live.get(midi);
      if (!n) return;
      live.delete(midi);
      const t = audio.currentTime;
      n.gain.gain.cancelScheduledValues(t);
      n.gain.gain.setValueAtTime(Math.max(n.gain.gain.value, 0.0001), t);
      n.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.osc.stop(t + 0.2);
      const keyEl = keysEl.querySelector(`[data-midi="${midi}"]`);
      if (keyEl) keyEl.classList.remove('active');
      if (live.size === 0) nowNote.textContent = '—';
    }

    function buildKeys() {
      keysEl.innerHTML = '';
      // 14 white keys = 2 octaves from baseMidi
      for (let i = 0; i < 14; i++) {
        const semitone = WHITE[i % 7] + Math.floor(i / 7) * 12;
        const midi = baseMidi + semitone;
        const key = document.createElement('button');
        key.className = 'piano-white';
        key.setAttribute('data-midi', midi);
        const kbd = Object.keys(KEYMAP).find(k => KEYMAP[k] === semitone);
        key.innerHTML = `<span class="piano-name">${noteName(midi)}</span>${kbd ? `<span class="piano-kbd">${kbd.toUpperCase()}</span>` : ''}`;
        key.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          key.setPointerCapture(e.pointerId);
          noteOn(midi);
        });
        key.addEventListener('pointerup', () => noteOff(midi));
        key.addEventListener('pointercancel', () => noteOff(midi));
        keysEl.appendChild(key);

        // black key after this white key, if the scale has one
        if (i < 13 && BLACK_AFTER[i % 7] !== undefined) {
          const bMidi = baseMidi + semitone + 1;
          const b = document.createElement('button');
          b.className = 'piano-black';
          b.setAttribute('data-midi', bMidi);
          b.style.left = `calc(${(i + 1) * (100 / 14)}% - 14px)`;
          const bk = Object.keys(KEYMAP).find(k => KEYMAP[k] === semitone + 1);
          b.innerHTML = bk ? `<span class="piano-kbd">${bk.toUpperCase()}</span>` : '';
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            b.setPointerCapture(e.pointerId);
            noteOn(bMidi);
          });
          b.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            noteOff(bMidi);
          });
          b.addEventListener('pointercancel', () => noteOff(bMidi));
          keysEl.appendChild(b);
        }
      }
      octLabel.textContent = 'C' + octave;
    }

    function setOctave(o) {
      octave = Math.max(1, Math.min(7, o));
      baseMidi = 12 * (octave + 1); // C of that octave
      buildKeys();
    }

    function stopDemo() {
      demoTimers.forEach(clearTimeout);
      demoTimers = [];
      [...live.keys()].forEach(noteOff);
    }

    function playDemo() {
      stopDemo();
      ensureAudio();
      const beat = 320;
      let t = 0;
      DEMO.forEach(([midi, beats]) => {
        const dur = beats * beat;
        demoTimers.push(setTimeout(() => noteOn(midi), t));
        demoTimers.push(setTimeout(() => noteOff(midi), t + dur * 0.92));
        t += dur;
      });
    }

    const held = new Set();
    function onKeyDown(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'enter') {
        // let buttons handle their own activation
        return;
      }
      if (KEYMAP[k] !== undefined) {
        e.preventDefault();
        const midi = baseMidi + KEYMAP[k];
        held.add(k);
        noteOn(midi);
      }
    }

    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (KEYMAP[k] !== undefined && held.has(k)) {
        held.delete(k);
        noteOff(baseMidi + KEYMAP[k]);
      }
    }

    waveSel.addEventListener('change', () => appEl.focus());
    volSlider.addEventListener('input', () => {
      if (master) master.gain.value = volSlider.value / 100 * 0.5;
      appEl.focus();
    });
    container.querySelector('.oct-down').addEventListener('click', () => { setOctave(octave - 1); appEl.focus(); });
    container.querySelector('.oct-up').addEventListener('click', () => { setOctave(octave + 1); appEl.focus(); });
    container.querySelector('.music-demo').addEventListener('click', () => { playDemo(); appEl.focus(); });
    container.querySelector('.music-stop').addEventListener('click', () => { stopDemo(); appEl.focus(); });
    appEl.addEventListener('keydown', onKeyDown);
    appEl.addEventListener('keyup', onKeyUp);

    buildKeys();

    function cleanup() {
      stopDemo();
      [...live.keys()].forEach(noteOff);
      appEl.removeEventListener('keydown', onKeyDown);
      appEl.removeEventListener('keyup', onKeyUp);
      if (audio) {
        try {
          const c = audio.close();
          if (c && c.catch) c.catch(() => {});
        } catch (e) {}
        audio = null;
      }
    }

    setTimeout(() => appEl.focus(), 50);
    return cleanup;
  }

  return {
    open
  };
})();
