// matrix.js - matrix-rain easter egg: a full-screen katakana rain overlay
// rendered on a canvas at ~15fps. Any key or click dismisses it; the rain
// color reads the theme's --accent so it matches the active theme.

const Matrix = (function() {
  const chars = 'アイウエオカキクケコサシスセソ0123456789'.split('');

  let canvas = null;
  let ctx = null;
  let drops = [];
  let fontSize = 16;
  let interval = null;
  let running = false;
  let rainColor = '#9db8ff';

  // start: build the canvas, seed one "drop" per text column at a random
  // negative row so columns begin at staggered heights, then tick draw()
  // every 66ms. The dismiss listeners attach 300ms late on purpose — if they
  // were added synchronously, the very keypress or click that triggered
  // start() would hit the capture-phase handlers and stop() the rain
  // instantly.
  function start() {
    if (running) return;
    running = true;

    canvas = document.createElement('canvas');
    canvas.id = 'matrix-rain';
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / fontSize);
    drops = [];
    for (let i = 0; i < cols; i++) {
      drops[i] = Math.floor(Math.random() * -30);
    }

    rainColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#9db8ff';

    interval = setInterval(draw, 66);

    setTimeout(() => {
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('pointerdown', onClick, true);
    }, 300);
  }

  // onKey: Enter or Escape dismisses the rain. capture phase + stopPropagation
  // so the press doesn't leak into the desktop behind it.
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      stop();
    }
  }

  // onClick: any pointer press dismisses the rain.
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    stop();
  }

  // stop: tear down the rain — clear the frame timer, detach the dismiss
  // listeners, and remove the canvas from the page.
  function stop() {
    if (!running) return;
    running = false;
    clearInterval(interval);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onClick, true);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
  }

  // draw: one frame of rain. Painting translucent black over the whole canvas
  // fades old glyphs instead of erasing them, which is what makes the trails.
  // Each column draws one random glyph and falls; when a drop passes the
  // bottom it has a ~2.5% chance per frame to reset to the top, so columns
  // restart at different times.
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = rainColor;
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  return {
    start,
    stop
  };
})();
