// mines.js - minesweeper with 3 difficulties, first-click safety,
// flood-fill reveal, flagging and chord clicks. timer + mine counter.

const MinesApp = (function() {
  const DIFFS = {
    beginner: { cols: 9, rows: 9, mines: 10, label: 'beginner 9×9 · 10' },
    intermediate: { cols: 16, rows: 16, mines: 40, label: 'intermediate 16×16 · 40' },
    expert: { cols: 30, rows: 16, mines: 99, label: 'expert 30×16 · 99' }
  };

  function open() {
    WM.createWindow({
      id: 'mines',
      title: 'Minesweeper',
      width: 620,
      height: 600,
      minWidth: 380,
      minHeight: 420,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="5" y1="5" x2="8" y2="8"></line><line x1="16" y1="16" x2="19" y2="19"></line><line x1="19" y1="5" x2="16" y2="8"></line><line x1="8" y1="16" x2="5" y2="19"></line></svg>',
      render: (bodyEl) => {
        initMines(bodyEl);
      }
    });
  }

  const NUM_COLORS = {
    1: '#7aa2f7', 2: '#9ece6a', 3: '#f7768e', 4: '#bb9af7',
    5: '#e0af68', 6: '#7dcfff', 7: '#f7768e', 8: '#a9b1d6'
  };

  function initMines(container) {
    container.innerHTML = `
      <div class="mines-app">
        <div class="mines-toolbar">
          <div class="mines-diff">
            <button class="mines-btn diff-btn active" data-diff="beginner">easy</button>
            <button class="mines-btn diff-btn" data-diff="intermediate">medium</button>
            <button class="mines-btn diff-btn" data-diff="expert">hard</button>
          </div>
          <button class="mines-btn mines-new" title="new game">↻ new</button>
        </div>
        <div class="mines-hud">
          <div class="mines-counter">🚩 <b class="mines-flags">10</b></div>
          <div class="mines-status">click a square to start</div>
          <div class="mines-counter">⏱ <b class="mines-time">0</b>s</div>
        </div>
        <div class="mines-board-wrap">
          <div class="mines-board"></div>
        </div>
      </div>
    `;

    const appEl = container.querySelector('.mines-app');
    const boardEl = container.querySelector('.mines-board');
    const flagsEl = container.querySelector('.mines-flags');
    const timeEl = container.querySelector('.mines-time');
    const statusEl = container.querySelector('.mines-status');

    let cols, rows, mineCount;
    let grid;          // grid[y][x] = { mine, revealed, flagged, count }
    let minesPlaced;
    let revealedCount;
    let flagCount;
    let over;
    let won;
    let timer;
    let seconds;
    let currentDiff = 'beginner';

    function newGame(diffKey) {
      currentDiff = diffKey;
      const d = DIFFS[diffKey];
      cols = d.cols;
      rows = d.rows;
      mineCount = d.mines;

      grid = [];
      for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
          row.push({ mine: false, revealed: false, flagged: false, count: 0 });
        }
        grid.push(row);
      }

      minesPlaced = false;
      revealedCount = 0;
      flagCount = 0;
      over = false;
      won = false;
      seconds = 0;
      stopTimer();
      timeEl.textContent = '0';
      flagsEl.textContent = String(mineCount);
      statusEl.textContent = 'click a square to start';

      container.querySelectorAll('.diff-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-diff') === diffKey);
      });

      // cell size fits the board into the available area
      const cell = Math.max(16, Math.min(30, Math.floor(560 / cols), Math.floor(430 / rows)));
      boardEl.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`;
      boardEl.style.gridAutoRows = `${cell}px`;
      boardEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const c = document.createElement('button');
          c.className = 'mine-cell';
          c.setAttribute('data-x', x);
          c.setAttribute('data-y', y);
          c.setAttribute('aria-label', `cell ${x + 1},${y + 1}`);
          frag.appendChild(c);
        }
      }
      boardEl.appendChild(frag);
    }

    function inBounds(x, y) {
      return x >= 0 && y >= 0 && x < cols && y < rows;
    }

    function neighbors(x, y) {
      const out = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (inBounds(x + dx, y + dy)) out.push([x + dx, y + dy]);
        }
      }
      return out;
    }

    // mines go down after the first click so the first click (and its
    // neighbors) can never be a mine
    function placeMines(safeX, safeY) {
      const safe = new Set();
      safe.add(safeX + ',' + safeY);
      neighbors(safeX, safeY).forEach(([nx, ny]) => safe.add(nx + ',' + ny));

      let placed = 0;
      while (placed < mineCount) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        if (safe.has(x + ',' + y) || grid[y][x].mine) continue;
        grid[y][x].mine = true;
        placed++;
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          grid[y][x].count = neighbors(x, y).filter(([nx, ny]) => grid[ny][nx].mine).length;
        }
      }
      minesPlaced = true;
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(() => {
        seconds++;
        timeEl.textContent = String(seconds);
        if (seconds >= 999) stopTimer();
      }, 1000);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function cellEl(x, y) {
      return boardEl.children[y * cols + x];
    }

    function paintCell(x, y) {
      const cell = grid[y][x];
      const el = cellEl(x, y);
      el.classList.toggle('revealed', cell.revealed);
      el.classList.toggle('flagged', cell.flagged && !cell.revealed);
      if (cell.revealed) {
        el.textContent = '';
        el.removeAttribute('aria-label');
        if (cell.mine) {
          el.textContent = '💥';
          el.classList.add('exploded');
        } else if (cell.count > 0) {
          el.textContent = String(cell.count);
          el.style.color = NUM_COLORS[cell.count] || '#a9b1d6';
        }
      } else if (cell.flagged) {
        el.textContent = '🚩';
      } else {
        el.textContent = '';
      }
    }

    function reveal(x, y) {
      if (over || !inBounds(x, y)) return;
      const cell = grid[y][x];
      if (cell.revealed || cell.flagged) return;

      if (!minesPlaced) {
        placeMines(x, y);
        startTimer();
        statusEl.textContent = 'good luck — right-click to flag';
      }

      if (cell.mine) {
        lose(x, y);
        return;
      }

      flood(x, y);
      checkWin();
    }

    function flood(sx, sy) {
      const stack = [[sx, sy]];
      while (stack.length) {
        const [x, y] = stack.pop();
        const cell = grid[y][x];
        if (cell.revealed || cell.flagged) continue;
        cell.revealed = true;
        revealedCount++;
        paintCell(x, y);
        if (cell.count === 0) {
          neighbors(x, y).forEach(([nx, ny]) => {
            if (!grid[ny][nx].revealed && !grid[ny][nx].flagged) stack.push([nx, ny]);
          });
        }
      }
    }

    function toggleFlag(x, y) {
      if (over || !inBounds(x, y)) return;
      const cell = grid[y][x];
      if (cell.revealed) return;
      cell.flagged = !cell.flagged;
      flagCount += cell.flagged ? 1 : -1;
      flagsEl.textContent = String(mineCount - flagCount);
      paintCell(x, y);
    }

    // chord: clicking a revealed number whose flag count matches reveals
    // the remaining unflagged neighbors
    function chord(x, y) {
      if (over || !inBounds(x, y)) return;
      const cell = grid[y][x];
      if (!cell.revealed || cell.count === 0) return;
      const nbs = neighbors(x, y);
      const flags = nbs.filter(([nx, ny]) => grid[ny][nx].flagged).length;
      if (flags !== cell.count) return;
      nbs.forEach(([nx, ny]) => {
        if (!grid[ny][nx].flagged && !grid[ny][nx].revealed) reveal(nx, ny);
      });
    }

    function revealAllMines() {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];
          if (cell.mine && !cell.flagged) {
            cell.revealed = true;
            paintCell(x, y);
          } else if (!cell.mine && cell.flagged) {
            // wrong flag
            const el = cellEl(x, y);
            el.textContent = '❌';
          }
        }
      }
    }

    function lose(bx, by) {
      over = true;
      stopTimer();
      grid[by][bx].revealed = true;
      revealAllMines();
      paintCell(bx, by);
      statusEl.textContent = 'boom! press ↻ for a new game';
    }

    function checkWin() {
      if (over) return;
      if (revealedCount === cols * rows - mineCount) {
        over = true;
        won = true;
        stopTimer();
        // auto-flag remaining mines
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (grid[y][x].mine && !grid[y][x].flagged) {
              grid[y][x].flagged = true;
              paintCell(x, y);
            }
          }
        }
        flagCount = mineCount;
        flagsEl.textContent = '0';
        statusEl.textContent = `you win! cleared in ${seconds}s 🎉`;
      }
    }

    boardEl.addEventListener('click', (e) => {
      const t = e.target.closest('.mine-cell');
      if (!t) return;
      const x = parseInt(t.getAttribute('data-x'), 10);
      const y = parseInt(t.getAttribute('data-y'), 10);
      if (grid[y][x].revealed) {
        chord(x, y);
      } else {
        reveal(x, y);
      }
    });

    boardEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const t = e.target.closest('.mine-cell');
      if (!t) return;
      toggleFlag(parseInt(t.getAttribute('data-x'), 10), parseInt(t.getAttribute('data-y'), 10));
    });

    container.querySelectorAll('.diff-btn').forEach((b) => {
      b.addEventListener('click', () => newGame(b.getAttribute('data-diff')));
    });
    container.querySelector('.mines-new').addEventListener('click', () => newGame(currentDiff));

    newGame('beginner');
  }

  return {
    open
  };
})();
