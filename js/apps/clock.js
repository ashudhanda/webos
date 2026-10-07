// clock.js - three tabs: world clock (local + a few cities), stopwatch
// with laps, and a countdown timer that beeps when it finishes.

const ClockApp = (function() {
  const CITIES = [
    { name: 'local', tz: undefined },
    { name: 'kolkata', tz: 'Asia/Kolkata' },
    { name: 'london', tz: 'Europe/London' },
    { name: 'new york', tz: 'America/New_York' },
    { name: 'tokyo', tz: 'Asia/Tokyo' },
    { name: 'sydney', tz: 'Australia/Sydney' }
  ];

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'clock',
      title: 'Clock',
      width: 440,
      height: 480,
      minWidth: 360,
      minHeight: 420,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      render: (bodyEl) => {
        cleanupFn = initClock(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function pad(n, len) {
    return String(n).padStart(len || 2, '0');
  }

  function fmtTime(d, tz) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: tz
      }).format(d);
    } catch (e) {
      return '--:--:--';
    }
  }

  function fmtDate(d, tz) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', timeZone: tz
      }).format(d);
    } catch (e) {
      return '';
    }
  }

  function initClock(container) {
    container.innerHTML = `
      <div class="clock-app">
        <div class="clock-tabs">
          <button class="clock-tab active" data-tab="world">world</button>
          <button class="clock-tab" data-tab="stopwatch">stopwatch</button>
          <button class="clock-tab" data-tab="timer">timer</button>
        </div>

        <div class="clock-pane clock-world active">
          <div class="world-rows"></div>
        </div>

        <div class="clock-pane clock-stopwatch">
          <div class="sw-display">00:00<span class="sw-ms">.00</span></div>
          <div class="clock-controls">
            <button class="clock-btn sw-start">start</button>
            <button class="clock-btn sw-lap" disabled>lap</button>
            <button class="clock-btn sw-reset">reset</button>
          </div>
          <div class="sw-laps"></div>
        </div>

        <div class="clock-pane clock-timer">
          <div class="tm-display">05:00</div>
          <div class="tm-bar"><div class="tm-fill"></div></div>
          <div class="tm-set">
            <label>min <input type="number" class="tm-min" min="0" max="999" value="5"></label>
            <label>sec <input type="number" class="tm-sec" min="0" max="59" value="0"></label>
          </div>
          <div class="clock-controls">
            <button class="clock-btn tm-start">start</button>
            <button class="clock-btn tm-reset">reset</button>
          </div>
          <div class="tm-status"></div>
        </div>
      </div>
    `;

    const timers = [];

    // Run fn immediately, then on a repeating interval. The returned timer
    // id goes into the shared `timers` list so the window-close cleanup can
    // clear every interval in one pass.
    function every(ms, fn) {
      fn();
      const t = setInterval(fn, ms);
      timers.push(t);
      return t;
    }

    // ---- tabs ----
    container.querySelectorAll('.clock-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.clock-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.clock-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        container.querySelector('.clock-' + tab.getAttribute('data-tab')).classList.add('active');
      });
    });

    // ---- world clock ----
    const worldRows = container.querySelector('.world-rows');
    worldRows.innerHTML = CITIES.map((c, i) =>
      `<div class="world-row"><span class="world-name">${c.name}</span><span class="world-date" data-i="${i}"></span><span class="world-time" data-i="${i}">--:--:--</span></div>`
    ).join('');
    every(1000, () => {
      const d = new Date();
      CITIES.forEach((c, i) => {
        worldRows.querySelector(`.world-time[data-i="${i}"]`).textContent = fmtTime(d, c.tz);
        worldRows.querySelector(`.world-date[data-i="${i}"]`).textContent = fmtDate(d, c.tz);
      });
    });

    // ---- stopwatch ----
    const swDisplay = container.querySelector('.sw-display');
    const swStart = container.querySelector('.sw-start');
    const swLap = container.querySelector('.sw-lap');
    const swReset = container.querySelector('.sw-reset');
    const swLaps = container.querySelector('.sw-laps');
    let swRunning = false;
    let swStartAt = 0;
    let swElapsed = 0;
    let swTick = null;
    let lapN = 0;

    function swRender() {
      const ms = swElapsed + (swRunning ? Date.now() - swStartAt : 0);
      const m = Math.floor(ms / 60000);
      const s = Math.floor(ms / 1000) % 60;
      const cs = Math.floor(ms / 10) % 100;
      swDisplay.innerHTML = `${pad(m)}:${pad(s)}<span class="sw-ms">.${pad(cs)}</span>`;
    }

    swStart.addEventListener('click', () => {
      if (swRunning) {
        swRunning = false;
        swElapsed += Date.now() - swStartAt;
        clearInterval(swTick);
        swTick = null;
        swStart.textContent = 'resume';
      } else {
        swRunning = true;
        swStartAt = Date.now();
        // 31ms ≈ 32fps: fast enough for a smooth centisecond readout, but
        // slow enough to not re-render the DOM every single animation frame.
        swTick = setInterval(swRender, 31);
        timers.push(swTick);
        swStart.textContent = 'stop';
      }
      swLap.disabled = !swRunning && swElapsed === 0;
      swRender();
    });

    swLap.addEventListener('click', () => {
      if (!swRunning) return;
      lapN++;
      const ms = swElapsed + (Date.now() - swStartAt);
      const m = Math.floor(ms / 60000);
      const s = Math.floor(ms / 1000) % 60;
      const cs = Math.floor(ms / 10) % 100;
      const row = document.createElement('div');
      row.className = 'sw-lap-row';
      row.innerHTML = `<span>lap ${lapN}</span><span>${pad(m)}:${pad(s)}.${pad(cs)}</span>`;
      swLaps.prepend(row);
    });

    swReset.addEventListener('click', () => {
      swRunning = false;
      if (swTick) clearInterval(swTick);
      swTick = null;
      swElapsed = 0;
      lapN = 0;
      swLaps.innerHTML = '';
      swStart.textContent = 'start';
      swLap.disabled = true;
      swRender();
    });
    swRender();

    // ---- timer ----
    const tmDisplay = container.querySelector('.tm-display');
    const tmFill = container.querySelector('.tm-fill');
    const tmMin = container.querySelector('.tm-min');
    const tmSec = container.querySelector('.tm-sec');
    const tmStart = container.querySelector('.tm-start');
    const tmReset = container.querySelector('.tm-reset');
    const tmStatus = container.querySelector('.tm-status');
    let tmTotal = 5 * 60 * 1000;
    let tmLeft = tmTotal;
    let tmRunning = false;
    let tmTick = null;
    let tmEndAt = 0;
    let audio = null;

    function tmRender() {
      const s = Math.max(0, Math.ceil(tmLeft / 1000));
      tmDisplay.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
      const pct = tmTotal > 0 ? (tmLeft / tmTotal) * 100 : 0;
      tmFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }

    function beep() {
      try {
        if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === 'suspended') {
          try {
            const r = audio.resume();
            if (r && r.catch) r.catch(() => {});
          } catch (e) {}
        }
        [0, 0.25, 0.5].forEach((delay) => {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'sine';
          osc.frequency.value = 880;
          const t = audio.currentTime + delay;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          osc.connect(gain);
          gain.connect(audio.destination);
          osc.start(t);
          osc.stop(t + 0.25);
        });
      } catch (e) {}
    }

    function tmStopTick() {
      if (tmTick) {
        clearInterval(tmTick);
        tmTick = null;
      }
    }

    tmStart.addEventListener('click', () => {
      if (tmRunning) {
        // pause
        tmRunning = false;
        tmLeft = Math.max(0, tmEndAt - Date.now());
        tmStopTick();
        tmStart.textContent = 'resume';
        tmStatus.textContent = 'paused';
        return;
      }
      if (tmLeft <= 0) {
        const m = Math.max(0, parseInt(tmMin.value, 10) || 0);
        const s = Math.max(0, Math.min(59, parseInt(tmSec.value, 10) || 0));
        tmTotal = (m * 60 + s) * 1000;
        if (tmTotal <= 0) {
          tmStatus.textContent = 'set a time first';
          return;
        }
        tmLeft = tmTotal;
      }
      tmRunning = true;
      tmEndAt = Date.now() + tmLeft;
      tmStart.textContent = 'pause';
      tmStatus.textContent = '';
      tmTick = setInterval(() => {
        tmLeft = tmEndAt - Date.now();
        if (tmLeft <= 0) {
          tmLeft = 0;
          tmRunning = false;
          tmStopTick();
          tmStart.textContent = 'start';
          tmStatus.textContent = "time's up!";
          beep();
          if (window.Notify) Notify.show("timer finished");
        }
        tmRender();
      }, 100);
      timers.push(tmTick);
      tmRender();
    });

    tmReset.addEventListener('click', () => {
      tmRunning = false;
      tmStopTick();
      const m = Math.max(0, parseInt(tmMin.value, 10) || 0);
      const s = Math.max(0, Math.min(59, parseInt(tmSec.value, 10) || 0));
      tmTotal = (m * 60 + s) * 1000 || 5 * 60 * 1000;
      tmLeft = tmTotal;
      tmStart.textContent = 'start';
      tmStatus.textContent = '';
      tmRender();
    });

    [tmMin, tmSec].forEach((inp) => {
      inp.addEventListener('change', () => {
        if (!tmRunning && tmLeft === tmTotal) {
          const m = Math.max(0, parseInt(tmMin.value, 10) || 0);
          const s = Math.max(0, Math.min(59, parseInt(tmSec.value, 10) || 0));
          tmTotal = (m * 60 + s) * 1000;
          tmLeft = tmTotal;
          tmRender();
        }
      });
    });

    tmRender();

    function cleanup() {
      timers.forEach(clearInterval);
      tmStopTick();
      if (swTick) clearInterval(swTick);
      if (audio) {
        try {
          const c = audio.close();
          if (c && c.catch) c.catch(() => {});
        } catch (e) {}
      }
    }

    return cleanup;
  }

  return {
    open
  };
})();
