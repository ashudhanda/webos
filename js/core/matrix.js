const Matrix = (function() {
  const chars = 'アイウエオカキクケコサシスセソ0123456789'.split('');

  let canvas = null;
  let ctx = null;
  let drops = [];
  let fontSize = 16;
  let interval = null;
  let running = false;

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

    interval = setInterval(draw, 66);

    setTimeout(() => {
      window.addEventListener('keydown', onKey, true);
    }, 300);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      stop();
    }
  }

  function stop() {
    if (!running) return;
    running = false;
    clearInterval(interval);
    window.removeEventListener('keydown', onKey, true);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
  }

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#9db8ff';
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
