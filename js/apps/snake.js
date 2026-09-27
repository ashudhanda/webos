// snake.js - classic snake on canvas. arrows/wasd to steer, p to pause.
// high score persists to localStorage. game loop stops on window close.

const SnakeApp = (function() {
  const STORAGE_KEY = 'moonos-snake-high';
  const COLS = 20;
  const ROWS = 20;

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'snake',
      title: 'Snake',
      width: 420,
      height: 520,
      minWidth: 340,
      minHeight: 440,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16c4 0 4-4 8-4s4-4 8-4"></path><circle cx="19" cy="8" r="1" fill="currentColor"></circle><path d="M4 16v3h3"></path></svg>',
      render: (bodyEl) => {
        cleanupFn = initSnake(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function initSnake(container) {
    let high = 0;
    try {
      high = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
    } catch (e) {}

    container.innerHTML = `
      <div class="snake-app" tabindex="0">
        <div class="snake-hud">
          <div class="snake-score">score <b class="snake-score-val">0</b></div>
          <div class="snake-high">best <b class="snake-high-val">${high}</b></div>
          <button class="snake-btn snake-pause-btn" title="pause (p)">pause</button>
          <button class="snake-btn snake-restart-btn" title="restart">restart</button>
        </div>
        <div class="snake-board-wrap">
          <canvas class="snake-canvas" width="400" height="400"></canvas>
          <div class="snake-overlay">
            <div class="snake-overlay-title">snake</div>
            <div class="snake-overlay-sub">arrows / wasd to move</div>
            <button class="snake-btn snake-start-btn">start</button>
          </div>
        </div>
      </div>
    `;

    const appEl = container.querySelector('.snake-app');
    const canvas = container.querySelector('.snake-canvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('.snake-overlay');
    const overlayTitle = container.querySelector('.snake-overlay-title');
    const overlaySub = container.querySelector('.snake-overlay-sub');
    const startBtn = container.querySelector('.snake-start-btn');
    const pauseBtn = container.querySelector('.snake-pause-btn');
    const restartBtn = container.querySelector('.snake-restart-btn');
    const scoreVal = container.querySelector('.snake-score-val');
    const highVal = container.querySelector('.snake-high-val');

    const CELL = canvas.width / COLS;
    let snake, dir, pendingDir, food, score, running, paused, timer;

    function reset() {
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dir = { x: 1, y: 0 };
      pendingDir = dir;
      score = 0;
      paused = false;
      scoreVal.textContent = '0';
      pauseBtn.textContent = 'pause';
      placeFood();
    }

    function placeFood() {
      while (true) {
        const f = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS)
        };
        if (!snake.some(s => s.x === f.x && s.y === f.y)) {
          food = f;
          return;
        }
      }
    }

    function speed() {
      // faster as you eat, floors at 70ms
      return Math.max(70, 140 - score * 2);
    }

    function step() {
      dir = pendingDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // wall or self collision ends the run
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreVal.textContent = String(score);
        placeFood();
      } else {
        snake.pop();
      }
      draw();
      timer = setTimeout(step, speed());
    }

    function draw() {
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent').trim() || '#7aa2f7';
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grid dots, subtle
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
        }
      }

      // food
      ctx.fillStyle = '#f7768e';
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.36, 0, Math.PI * 2);
      ctx.fill();

      // snake, head brighter
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? accent : accent + 'aa';
        const pad = i === 0 ? 1 : 2;
        ctx.fillRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
      });
    }

    function start() {
      stop();
      reset();
      running = true;
      overlay.classList.add('hidden');
      draw();
      timer = setTimeout(step, speed());
      appEl.focus();
    }

    function stop() {
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function gameOver() {
      stop();
      if (score > high) {
        high = score;
        highVal.textContent = String(high);
        try {
          localStorage.setItem(STORAGE_KEY, String(high));
        } catch (e) {}
      }
      overlayTitle.textContent = 'game over';
      overlaySub.textContent = 'score ' + score + (score >= high && score > 0 ? ' — new best!' : '');
      startBtn.textContent = 'play again';
      overlay.classList.remove('hidden');
    }

    function togglePause() {
      if (!running) return;
      if (paused) {
        paused = false;
        pauseBtn.textContent = 'pause';
        overlay.classList.add('hidden');
        timer = setTimeout(step, speed());
      } else {
        paused = true;
        pauseBtn.textContent = 'resume';
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        overlayTitle.textContent = 'paused';
        overlaySub.textContent = 'press p or resume to continue';
        startBtn.textContent = 'resume';
        overlay.classList.remove('hidden');
      }
      appEl.focus();
    }

    const KEYMAP = {
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 }
    };

    function onKey(e) {
      const k = e.key.toLowerCase();
      if (KEYMAP[k]) {
        e.preventDefault();
        const nd = KEYMAP[k];
        // no 180-degree turns
        if (nd.x !== -dir.x || nd.y !== -dir.y) {
          pendingDir = nd;
        }
        if (!running && !paused) start();
        return;
      }
      if (k === 'p') {
        togglePause();
      } else if (k === 'enter' || k === ' ') {
        if (!running) start();
      }
    }

    appEl.addEventListener('keydown', onKey);
    startBtn.addEventListener('click', () => {
      if (paused) {
        togglePause();
      } else {
        start();
      }
    });
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', start);

    reset();
    draw();

    function cleanup() {
      stop();
      appEl.removeEventListener('keydown', onKey);
    }

    setTimeout(() => appEl.focus(), 50);
    return cleanup;
  }

  return {
    open
  };
})();
