// loginfx.js - advanced login screen effects for moonOS.
// "Aurora" login: twinkling starfield canvas with shooting stars, live
// clock, mouse parallax, and a press-and-hold sign-in ring. Wired into
// boot.js (init on showLogin, teardown on signIn). No-ops entirely when
// the user prefers reduced motion.

(function () {
  'use strict';

  const reducedMotion = () =>
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rafId = 0;
  let clockTimer = 0;
  let stars = [];
  let meteors = [];
  let nextMeteorAt = 0;
  let canvas = null;
  let ctx = null;
  let running = false;

  // parallax state
  let px = 0, py = 0, tx = 0, ty = 0;
  let auroraEl = null, starsEl = null, cardEl = null;

  const HOLD_MS = 750;

  // ---------- clock ----------
  function tickClock() {
    const clockEl = document.getElementById('login-clock');
    const dateEl = document.getElementById('login-date');
    if (!clockEl && !dateEl) return;
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: 'long', month: 'long', day: 'numeric',
      });
    }
  }

  // ---------- starfield ----------
  function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
  }

  function seedStars() {
    const w = window.innerWidth, h = window.innerHeight;
    const count = Math.min(220, Math.floor((w * h) / 9000));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.3,
        base: 0.25 + Math.random() * 0.55,
        amp: 0.15 + Math.random() * 0.35,
        speed: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnMeteor(now) {
    const w = window.innerWidth, h = window.innerHeight;
    const x = w * (0.25 + Math.random() * 0.7);
    const y = h * Math.random() * 0.35;
    const angle = Math.PI * (0.72 + Math.random() * 0.1); // down-left streak
    const speed = 7 + Math.random() * 5;
    meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 });
    nextMeteorAt = now + 5000 + Math.random() * 8000;
  }

  function drawFrame(now) {
    if (!running) return;
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    // stars
    for (const s of stars) {
      const a = s.base + s.amp * Math.sin(now / 1000 * s.speed + s.phase);
      ctx.globalAlpha = Math.max(0.05, Math.min(1, a));
      ctx.fillStyle = '#dfe8ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // meteors
    if (now >= nextMeteorAt && meteors.length < 2) spawnMeteor(now);
    meteors = meteors.filter((m) => m.life > 0 && m.x > -100 && m.y < h + 100);
    for (const m of meteors) {
      m.x += m.vx; m.y += m.vy; m.life -= 0.016;
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
      grad.addColorStop(0, 'rgba(255,255,255,' + (0.9 * m.life) + ')');
      grad.addColorStop(1, 'rgba(160,190,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // parallax easing
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    if (auroraEl) auroraEl.style.transform = 'translate(' + (px * 26) + 'px,' + (py * 26) + 'px)';
    if (starsEl) starsEl.style.transform = 'translate(' + (px * 12) + 'px,' + (py * 12) + 'px)';
    if (cardEl) cardEl.style.translate = (px * -10) + 'px ' + (py * -10) + 'px';

    rafId = requestAnimationFrame(drawFrame);
  }

  function onMouseMove(e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  }

  // ---------- hold to sign in ----------
  // press-and-hold UX: sign-in only commits after a full 750ms hold;
  // releasing early, sliding off the ring, or pointercancel aborts the
  // timer (the .charging class drives the ring-fill progress animation)
  function wireHoldButton() {
    const btn = document.getElementById('login-hold-btn');
    const card = document.getElementById('login-user-card');
    if (!btn || !card) return;
    let holdTimer = 0;

    const cancel = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; }
      btn.classList.remove('charging');
    };
    const complete = () => {
      holdTimer = 0;
      btn.classList.remove('charging');
      btn.classList.add('done');
      setTimeout(() => card.click(), 320);
    };

    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      btn.classList.add('charging');
      holdTimer = setTimeout(complete, HOLD_MS + 60);
    });
    btn.addEventListener('pointerup', (e) => { e.stopPropagation(); cancel(); });
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
    // a plain click on the ring never signs in by itself — hold (or Enter) does
    btn.addEventListener('click', (e) => e.stopPropagation());
    btn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
    });
  }

  function wireKeyboard() {
    document.addEventListener('keydown', function onKey(e) {
      const screen = document.getElementById('login-screen');
      if (!screen || screen.classList.contains('hidden')) return;
      if (e.key === 'Enter') {
        const card = document.getElementById('login-user-card');
        if (card) card.click();
      }
    });
  }

  // ---------- public ----------
  function init() {
    if (running) return;
    running = true;

    tickClock();
    clockTimer = setInterval(tickClock, 1000);

    wireHoldButton();
    wireKeyboard();

    if (reducedMotion()) return;

    canvas = document.getElementById('login-stars');
    auroraEl = document.querySelector('.login-aurora');
    starsEl = canvas;
    cardEl = document.getElementById('login-user-card');
    if (canvas) {
      ctx = canvas.getContext('2d');
      sizeCanvas();
      window.addEventListener('resize', sizeCanvas);
    }
    nextMeteorAt = performance.now() + 3500;
    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(drawFrame);
  }

  function teardown() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = 0;
    window.removeEventListener('resize', sizeCanvas);
    window.removeEventListener('mousemove', onMouseMove);
    stars = [];
    meteors = [];
  }

  window.LoginFX = { init, teardown };
})();
