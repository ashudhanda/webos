// game2048.js - 2048: the classic sliding-tile puzzle.
// Slide with arrow keys / WASD or the on-screen pad. Two equal tiles
// merge into their sum (one merge per tile per move); after every valid
// move a 2 (90%) or 4 (10%) spawns. Win at 2048, game over when no moves
// remain. Best score persists in localStorage.

const Game2048App = (function() {
  const SIZE = 4;
  const LS_BEST = 'moonos-2048-best';

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'game2048',
      title: '2048',
      width: 440,
      height: 600,
      minWidth: 380,
      minHeight: 520,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="8" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect><rect x="13" y="13" width="8" height="8" rx="1"></rect></svg>',
      render: (bodyEl) => {
        cleanupFn = initGame(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function initGame(container) {
    container.innerHTML = `
      <div class="g2048-app" tabindex="0">
        <div class="g2048-head">
          <div class="g2048-scores">
            <div class="g2048-score"><span>Score</span><b class="g2048-cur">0</b></div>
            <div class="g2048-score"><span>Best</span><b class="g2048-best">0</b></div>
          </div>
          <button class="g2048-new">New Game</button>
        </div>
        <div class="g2048-board-wrap">
          <div class="g2048-board"></div>
          <div class="g2048-overlay hidden"><div class="g2048-overlay-text"></div><button class="g2048-again">Play again</button></div>
        </div>
        <div class="g2048-pad">
          <button data-dir="up">▲</button>
          <div><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div>
        </div>
        <div class="g2048-hint">Arrow keys / WASD to play</div>
      </div>
    `;

    const appEl = container.querySelector('.g2048-app');
    const boardEl = container.querySelector('.g2048-board');
    const curEl = container.querySelector('.g2048-cur');
    const bestEl = container.querySelector('.g2048-best');
    const overlayEl = container.querySelector('.g2048-overlay');
    const overlayText = container.querySelector('.g2048-overlay-text');

    let grid, score, best, won, over;

    try {
      best = parseInt(localStorage.getItem(LS_BEST) || '0', 10) || 0;
    } catch (e) {
      best = 0;
    }

    function emptyGrid() {
      return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    }

    function emptyCells() {
      const cells = [];
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (grid[r][c] === 0) cells.push([r, c]);
      return cells;
    }

    function spawn() {
      const cells = emptyCells();
      if (cells.length === 0) return;
      const [r, c] = cells[Math.floor(Math.random() * cells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function newGame() {
      grid = emptyGrid();
      score = 0;
      won = false;
      over = false;
      spawn();
      spawn();
      overlayEl.classList.add('hidden');
      render();
    }

    // slide one row left; returns {row, gained, moved}
    function slideRow(row) {
      const vals = row.filter(v => v !== 0);
      const out = [];
      let gained = 0;
      let i = 0;
      while (i < vals.length) {
        if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
          const m = vals[i] * 2;
          out.push(m);
          gained += m;
          if (m === 2048) won = true;
          i += 2;
        } else {
          out.push(vals[i]);
          i += 1;
        }
      }
      while (out.length < SIZE) out.push(0);
      const moved = out.some((v, idx) => v !== row[idx]);
      return { row: out, gained, moved };
    }

    function rotateCW(g) {
      return g[0].map((_, c) => g.map(row => row[c]).reverse());
    }

    function move(dir) {
      if (over) return;
      // normalize: rotate so the move becomes "left"
      let g = grid;
      let rots = { left: 0, up: 3, right: 2, down: 1 }[dir];
      for (let i = 0; i < rots; i++) g = rotateCW(g);

      let moved = false;
      let gained = 0;
      const ng = g.map(row => {
        const r = slideRow(row);
        moved = moved || r.moved;
        gained += r.gained;
        return r.row;
      });

      for (let i = 0; i < (4 - rots) % 4; i++) g = rotateCW(ng), ng = g;

      if (!moved) return;
      grid = ng;
      score += gained;
      if (score > best) {
        best = score;
        try { localStorage.setItem(LS_BEST, String(best)); } catch (e) {}
      }
      spawn();
      render();
      if (won) showOverlay('You win! 🎉');
      else if (!canMove()) {
        over = true;
        showOverlay('Game over');
      }
    }

    function canMove() {
      if (emptyCells().length > 0) return true;
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
          const v = grid[r][c];
          if ((c + 1 < SIZE && grid[r][c + 1] === v) || (r + 1 < SIZE && grid[r + 1][c] === v)) return true;
        }
      return false;
    }

    function showOverlay(text) {
      overlayText.textContent = text;
      overlayEl.classList.remove('hidden');
    }

    function render() {
      curEl.textContent = score;
      bestEl.textContent = best;
      boardEl.innerHTML = '';
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
          const v = grid[r][c];
          const t = document.createElement('div');
          t.className = 'g2048-tile' + (v ? ' t' + v : '');
          t.textContent = v || '';
          boardEl.appendChild(t);
        }
    }

    function onKey(e) {
      const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right'
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    }

    appEl.addEventListener('keydown', onKey);
    container.querySelector('.g2048-new').addEventListener('click', newGame);
    container.querySelector('.g2048-again').addEventListener('click', newGame);
    container.querySelectorAll('.g2048-pad button[data-dir]').forEach(b => {
      b.addEventListener('click', () => move(b.getAttribute('data-dir')));
    });

    newGame();
    appEl.focus();

    return function cleanup() {
      appEl.removeEventListener('keydown', onKey);
    };
  }

  return { open };
})();

window.Game2048App = Game2048App;
