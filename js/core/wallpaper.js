/* js/core/wallpaper.js
 *
 * Procedural animated planet wallpaper — pure canvas 2D, zero video files.
 *
 * What it draws (back to front), per theme (moon / mars / earth / saturn):
 *   1. vertical background gradient
 *   2. 2-3 faint nebula blobs drifting on very slow Lissajous paths
 *   3. ~160 twinkling stars in 3 depth layers (sine twinkle + slow drift)
 *   4. planet halo (fake bloom: one radial-gradient sprite)
 *   5. saturn ring-back (static stroked ellipses)
 *   6. planet disc: linear-gradient lighting + terminator shadow +
 *      surface features rotating VERY slowly (one turn ~150s)
 *   7. atmosphere rim glow on the lit side
 *   8. saturn ring-front (static)
 *
 * Motion is deliberately subtle ("halka fhulka"): nothing pulses, wobbles or
 * flashes. Framerate-independent via requestAnimationFrame delta time, DPR
 * capped at 1.25, ~5% CPU territory.
 *
 * Accessibility: when prefers-reduced-motion is set, exactly one static
 * frame is rendered and no loop runs (re-evaluated on change events).
 *
 * API:
 *   WallpaperFX.setTheme('moon' | 'mars' | 'earth' | 'saturn')
 *   WallpaperFX.start()  — idempotent; safe to call before the canvas exists
 *                          (no-ops and returns false until it does).
 *   window.__wallpaperFrame — incremented once per rendered frame (for tests).
 */

(function () {
  'use strict';

  var THEMES = ['moon', 'mars', 'earth', 'saturn'];
  var ROT_PERIOD = 150;   // seconds per full planet rotation — very slow
  var MAX_DPR = 1.25;
  var STATIC_T = 8.0;     // fixed timestamp used for the reduced-motion frame
  var TAU = Math.PI * 2;

  // ---------------------------------------------------------------- config

  var SCENES = {
    moon: {
      bg: ['#04060d', '#0b1224'],
      nebulae: [
        { c: '#2a3f6e', a: 0.12 }, { c: '#1d2b52', a: 0.10 }, { c: '#3b2a5e', a: 0.10 }
      ],
      starTint: '#cdd8ff',
      planet: {
        lit: '#e9edf5', mid: '#9aa3b5', dark: '#39404f', glow: '#bcd0ff',
        kind: 'craters', craterColor: 'rgba(52,60,78,0.38)'
      }
    },
    mars: {
      bg: ['#0d0505', '#1f0d07'],
      nebulae: [
        { c: '#6e2f1a', a: 0.12 }, { c: '#4a1e10', a: 0.10 }, { c: '#7a3a1e', a: 0.09 }
      ],
      starTint: '#ffd9c4',
      planet: {
        lit: '#ffb08a', mid: '#e0703a', dark: '#57200f', glow: '#ff9a66',
        kind: 'patches', patchColor: 'rgba(110,45,20,0.32)'
      }
    },
    earth: {
      bg: ['#030a08', '#07231c'],
      nebulae: [
        { c: '#0f4a3a', a: 0.12 }, { c: '#0d3a52', a: 0.10 }, { c: '#14532d', a: 0.09 }
      ],
      starTint: '#d2f0ff',
      planet: {
        lit: '#a5dcff', mid: '#3f8fd2', dark: '#0f2c4c', glow: '#7fd4ff',
        kind: 'earth',
        land: ['#3f9e63', '#57b06f', '#2f7d4e'],
        cloud: 'rgba(255,255,255,0.55)'
      }
    },
    saturn: {
      bg: ['#0a0703', '#1d1206'],
      nebulae: [
        { c: '#6e4a1a', a: 0.12 }, { c: '#54400f', a: 0.10 }, { c: '#6e5a20', a: 0.09 }
      ],
      starTint: '#ffe9c4',
      planet: {
        lit: '#f6e2ae', mid: '#ddb26a', dark: '#7a5a26', glow: '#ffd98a',
        kind: 'bands',
        bands: ['rgba(242,216,160,0.50)', 'rgba(224,185,111,0.50)',
                'rgba(201,154,78,0.45)', 'rgba(240,205,140,0.40)'],
        spot: 'rgba(190,140,80,0.50)',
        ring: true,
        ringRGB: '232,200,140'
      }
    }
  };

  // ---------------------------------------------------------------- helpers

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function mod(n, m) { return ((n % m) + m) % m; }

  // ---------------------------------------------------------------- state

  var canvas = null;
  var ctx = null;
  var theme = 'moon';
  var started = false;
  var running = false;
  var rafId = 0;
  var lastTs = 0;
  var reducedMotion = false;

  var W = 0, H = 0;
  var bgGrad = null;

  var stars = [];
  var nebulae = [];
  var planet = null;

  // smoothed mouse parallax, normalized -1..1
  var mX = 0, mY = 0, parX = 0, parY = 0;

  var mq = null;
  try { mq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { mq = null; }

  window.__wallpaperFrame = 0;

  // ---------------------------------------------------------------- scene build (deterministic per theme)

  function buildScene(name) {
    var rng = mulberry32(hashStr('moonos-wallpaper:' + name));
    var sc = SCENES[name];
    var i, k;

    stars = [];
    var layers = [
      { n: 80, sMin: 0.6, sMax: 1.3, aMin: 0.25, aMax: 0.50, drift: 0.8, par: 4 },
      { n: 55, sMin: 1.0, sMax: 1.9, aMin: 0.35, aMax: 0.65, drift: 1.8, par: 8 },
      { n: 25, sMin: 1.6, sMax: 2.6, aMin: 0.50, aMax: 0.90, drift: 3.2, par: 12 }
    ];
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li];
      for (i = 0; i < L.n; i++) {
        stars.push({
          fx: rng(), fy: rng(),
          size: L.sMin + rng() * (L.sMax - L.sMin),
          base: L.aMin + rng() * (L.aMax - L.aMin),
          sp: 0.5 + rng() * 1.6,
          ph: rng() * TAU,
          drift: L.drift * (0.7 + rng() * 0.6),
          par: L.par
        });
      }
    }

    nebulae = [];
    for (k = 0; k < 3; k++) {
      var nc = sc.nebulae[k % sc.nebulae.length];
      nebulae.push({
        fx: 0.12 + rng() * 0.76,
        fy: 0.12 + rng() * 0.76,
        fr: 0.32 + rng() * 0.22,
        ax: 0.020 + rng() * 0.012,
        ay: 0.020 + rng() * 0.012,
        px: 40 + rng() * 20,          // Lissajous periods: 40-60s
        py: 40 + rng() * 20,
        ph1: rng() * TAU, ph2: rng() * TAU,
        color: nc.c, alpha: nc.a
      });
    }

    // planet surface features in unit-disc coords (rotated slowly at render)
    var feats = { kind: sc.planet.kind, items: [], clouds: [] };
    function discPoint(maxR) {
      var a = rng() * TAU, rr = Math.sqrt(rng()) * maxR;
      return { dx: Math.cos(a) * rr, dy: Math.sin(a) * rr };
    }
    if (feats.kind === 'craters') {
      for (i = 0; i < 16; i++) {
        var c = discPoint(0.85);
        c.s = 0.03 + rng() * 0.07;
        feats.items.push(c);
      }
    } else if (feats.kind === 'patches') {
      for (i = 0; i < 10; i++) {
        var pt = discPoint(0.8);
        pt.s = 0.08 + rng() * 0.12;
        pt.sq = 0.5 + rng() * 0.4;
        pt.rot = rng() * TAU;
        feats.items.push(pt);
      }
    } else if (feats.kind === 'earth') {
      for (i = 0; i < 9; i++) {
        var land = discPoint(0.8);
        land.s = 0.08 + rng() * 0.14;
        land.ci = i % sc.planet.land.length;
        feats.items.push(land);
      }
      for (i = 0; i < 12; i++) {
        var cl = discPoint(0.85);
        cl.len = 0.15 + rng() * 0.20;
        cl.w = 0.020 + rng() * 0.016;
        cl.rot = rng() * TAU;
        feats.clouds.push(cl);
      }
    } else if (feats.kind === 'bands') {
      for (i = 0; i < 7; i++) {
        feats.items.push({ y: -0.84 + i * 0.28, h: 0.13, ci: i % sc.planet.bands.length });
      }
      feats.spot = { dx: 0.30, dy: 0.18, sx: 0.14, sy: 0.09 };
    }

    planet = { fx: 0.72, fy: 0.38, fr: 0.26, tilt: -0.32, feats: feats };
    bgGrad = null;
  }

  // ---------------------------------------------------------------- drawing

  function drawBG() {
    if (!bgGrad) {
      var c = SCENES[theme].bg;
      bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, c[0]);
      bgGrad.addColorStop(1, c[1]);
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawNebulae(t) {
    var m = Math.min(W, H);
    for (var i = 0; i < nebulae.length; i++) {
      var n = nebulae[i];
      var x = (n.fx + n.ax * Math.sin(TAU * t / n.px + n.ph1)) * W + parX * 14;
      var y = (n.fy + n.ay * Math.cos(TAU * t / n.py + n.ph2)) * H + parY * 14;
      var rad = n.fr * m;
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, hexA(n.color, n.alpha));
      g.addColorStop(1, hexA(n.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }

  function drawStars(t) {
    ctx.fillStyle = SCENES[theme].starTint;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
      var x = mod(s.fx * W - t * s.drift, W) + parX * s.par;
      var y = s.fy * H + parY * s.par;
      ctx.globalAlpha = s.base * tw;
      if (s.size <= 1.4) {
        ctx.fillRect(x, y, s.size, s.size);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s.size * 0.5, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawFeatures(px, py, r, cfg, t) {
    var feats = planet.feats;
    var rot = TAU * t / ROT_PERIOD;
    var i, f;

    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.translate(-px, -py);

    if (feats.kind === 'craters') {
      ctx.fillStyle = cfg.craterColor;
      for (i = 0; i < feats.items.length; i++) {
        f = feats.items[i];
        ctx.beginPath();
        ctx.arc(px + f.dx * r, py + f.dy * r, f.s * r, 0, TAU);
        ctx.fill();
      }
    } else if (feats.kind === 'patches') {
      ctx.fillStyle = cfg.patchColor;
      for (i = 0; i < feats.items.length; i++) {
        f = feats.items[i];
        ctx.beginPath();
        ctx.ellipse(px + f.dx * r, py + f.dy * r, f.s * r, f.s * f.sq * r, f.rot, 0, TAU);
        ctx.fill();
      }
    } else if (feats.kind === 'earth') {
      for (i = 0; i < feats.items.length; i++) {
        f = feats.items[i];
        ctx.fillStyle = cfg.land[f.ci];
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px + f.dx * r, py + f.dy * r, f.s * r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // clouds drift a little faster than the surface (differential rotation)
      ctx.translate(px, py);
      ctx.rotate(rot * 0.6);
      ctx.translate(-px, -py);
      ctx.fillStyle = cfg.cloud;
      for (i = 0; i < feats.clouds.length; i++) {
        f = feats.clouds[i];
        ctx.beginPath();
        ctx.ellipse(px + f.dx * r, py + f.dy * r, f.len * r, f.w * r, f.rot, 0, TAU);
        ctx.fill();
      }
    } else if (feats.kind === 'bands') {
      for (i = 0; i < feats.items.length; i++) {
        f = feats.items[i];
        ctx.fillStyle = cfg.bands[f.ci];
        ctx.fillRect(px - r, py + f.y * r, r * 2, f.h * r);
      }
      if (feats.spot) {
        ctx.fillStyle = cfg.spot;
        ctx.beginPath();
        ctx.ellipse(px + feats.spot.dx * r, py + feats.spot.dy * r,
                    feats.spot.sx * r, feats.spot.sy * r, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawRings(px, py, r, cfg, front) {
    var rgb = cfg.ringRGB;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(planet.tilt);
    var rx = r * 1.9, ry = r * 0.52;
    if (!front) {
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(' + rgb + ',0.45)';
      ctx.lineWidth = r * 0.14;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.18, ry * 1.18, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(' + rgb + ',0.25)';
      ctx.lineWidth = r * 0.05;
      ctx.stroke();
    } else {
      // near-side arc only — rings stay fully static, no wobble
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.strokeStyle = 'rgba(' + rgb + ',0.80)';
      ctx.lineWidth = r * 0.14;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.18, ry * 1.18, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.strokeStyle = 'rgba(' + rgb + ',0.40)';
      ctx.lineWidth = r * 0.05;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlanet(t) {
    var cfg = SCENES[theme].planet;
    var r = planet.fr * Math.min(W, H);
    var px = planet.fx * W + parX * 6;
    var py = planet.fy * H + parY * 6;

    // halo — fake bloom sprite behind the planet
    var halo = ctx.createRadialGradient(px, py, r * 0.8, px, py, r * 2.3);
    halo.addColorStop(0, hexA(cfg.glow, 0.22));
    halo.addColorStop(1, hexA(cfg.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(px - r * 2.3, py - r * 2.3, r * 4.6, r * 4.6);

    if (cfg.ring) drawRings(px, py, r, cfg, false);

    // disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TAU);
    ctx.clip();
    var lg = ctx.createLinearGradient(px - 0.7 * r, py - 0.75 * r, px + 0.7 * r, py + 0.75 * r);
    lg.addColorStop(0, cfg.lit);
    lg.addColorStop(0.55, cfg.mid);
    lg.addColorStop(1, cfg.dark);
    ctx.fillStyle = lg;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);

    drawFeatures(px, py, r, cfg, t);

    // terminator shadow (night side, bottom-right)
    var tg = ctx.createRadialGradient(px + 0.55 * r, py + 0.62 * r, r * 0.1,
                                      px + 0.55 * r, py + 0.62 * r, r * 1.5);
    tg.addColorStop(0, 'rgba(2,4,10,0.62)');
    tg.addColorStop(0.75, 'rgba(2,4,10,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
    ctx.restore();

    // atmosphere rim on the lit side (top-left)
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, Math.PI * 0.72, Math.PI * 1.68);
    ctx.strokeStyle = hexA(cfg.glow, 0.55);
    ctx.lineWidth = Math.max(2, r * 0.018);
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    if (cfg.ring) drawRings(px, py, r, cfg, true);
  }

  // ---------------------------------------------------------------- frame

  function step(t, dt) {
    var k = Math.min(1, dt * 2.5);   // ease mouse parallax toward target
    parX += (mX - parX) * k;
    parY += (mY - parY) * k;

    drawBG();
    drawNebulae(t);
    drawStars(t);
    drawPlanet(t);

    window.__wallpaperFrame++;
  }

  function loop(ts) {
    if (!running) return;
    var t = ts / 1000;
    var dt = lastTs ? Math.min(0.1, Math.max(0, t - lastTs)) : 0.016;
    lastTs = t;
    step(t, dt);
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    stopLoop();
    running = true;
    lastTs = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  // ---------------------------------------------------------------- sizing / input

  function resize() {
    if (!canvas || !ctx) return;
    var w = canvas.clientWidth || window.innerWidth || 1;
    var h = canvas.clientHeight || window.innerHeight || 1;
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = w; H = h;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgGrad = null;
  }

  var resizeQueued = false;
  function onResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(function () {
      resizeQueued = false;
      resize();
      if (reducedMotion) step(STATIC_T, 1);   // keep the static frame fresh
    });
  }

  function onMouse(e) {
    mX = Math.max(-1, Math.min(1, (e.clientX / (window.innerWidth || 1)) * 2 - 1));
    mY = Math.max(-1, Math.min(1, (e.clientY / (window.innerHeight || 1)) * 2 - 1));
  }

  function applyMotionPref() {
    var red = !!(mq && mq.matches);
    if (red === reducedMotion) return;
    reducedMotion = red;
    if (!started) return;
    if (red) { stopLoop(); step(STATIC_T, 1); }
    else { startLoop(); }
  }

  // ---------------------------------------------------------------- public API

  var WallpaperFX = {
    setTheme: function (name) {
      if (THEMES.indexOf(name) === -1) name = 'moon';
      theme = name;
      if (started && ctx) {
        buildScene(theme);
        if (reducedMotion) step(STATIC_T, 1);
      }
      return theme;
    },

    start: function () {
      if (started) return true;
      canvas = document.getElementById('wallpaper-canvas');
      if (!canvas) return false;               // integration not done yet — stay silent
      ctx = canvas.getContext('2d');
      if (!ctx) return false;
      started = true;

      buildScene(theme);
      resize();
      window.addEventListener('resize', onResize);
      window.addEventListener('mousemove', onMouse, { passive: true });
      document.addEventListener('pagehide', stopLoop);

      reducedMotion = !!(mq && mq.matches);
      if (reducedMotion) step(STATIC_T, 1);
      else startLoop();
      return true;
    },

    // introspection for tests / debugging
    _theme: function () { return theme; },
    _running: function () { return running; }
  };

  window.WallpaperFX = WallpaperFX;

  if (mq) {
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', applyMotionPref);
    else if (typeof mq.addListener === 'function') mq.addListener(applyMotionPref);
  }

  // auto-start when the canvas is already in the DOM (deferred scripts run
  // before DOMContentLoaded, so this covers the normal integration path)
  function autoStart() { WallpaperFX.start(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }
})();
