// calc.js - simple calculator with 4x5 grid & keyboard input

const CalcApp = (function() {
  function open() {
    WM.createWindow({
      id: 'calc',
      title: 'Calculator',
      width: 320,
      height: 420,
      minWidth: 280,
      minHeight: 380,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"></path></svg>',
      render: (bodyEl) => {
        initCalc(bodyEl);
      }
    });
  }

  function initCalc(container) {
    let currentInput = '0';
    let prevExpr = '';
    let resetOnNext = false;

    container.innerHTML = `
      <div class="calc-app" tabindex="0">
        <div class="calc-display">
          <div class="calc-expr"></div>
          <div class="calc-result">0</div>
        </div>
        <div class="calc-grid">
          <button class="calc-btn action" data-key="C">C</button>
          <button class="calc-btn action" data-key="plusminus">&plusmn;</button>
          <button class="calc-btn action" data-key="%">%</button>
          <button class="calc-btn op" data-key="/">&divide;</button>

          <button class="calc-btn num" data-key="7">7</button>
          <button class="calc-btn num" data-key="8">8</button>
          <button class="calc-btn num" data-key="9">9</button>
          <button class="calc-btn op" data-key="*">&times;</button>

          <button class="calc-btn num" data-key="4">4</button>
          <button class="calc-btn num" data-key="5">5</button>
          <button class="calc-btn num" data-key="6">6</button>
          <button class="calc-btn op" data-key="-">&minus;</button>

          <button class="calc-btn num" data-key="1">1</button>
          <button class="calc-btn num" data-key="2">2</button>
          <button class="calc-btn num" data-key="3">3</button>
          <button class="calc-btn op" data-key="+">+</button>

          <button class="calc-btn num" data-key="0">0</button>
          <button class="calc-btn num" data-key=".">.</button>
          <button class="calc-btn action" data-key="backspace">&#9003;</button>
          <button class="calc-btn equals" data-key="=">=</button>
        </div>
      </div>
    `;

    const appEl = container.querySelector('.calc-app');
    const exprEl = container.querySelector('.calc-expr');
    const resEl = container.querySelector('.calc-result');

    function updateDisplay() {
      exprEl.textContent = prevExpr;
      resEl.textContent = currentInput;
    }

    function handleInput(key) {
      if (key >= '0' && key <= '9') {
        if (currentInput === '0' || currentInput === 'error' || resetOnNext) {
          currentInput = key;
          resetOnNext = false;
        } else {
          currentInput += key;
        }
      } else if (key === '.') {
        if (resetOnNext || currentInput === 'error') {
          currentInput = '0.';
          resetOnNext = false;
        } else if (!currentInput.includes('.')) {
          currentInput += '.';
        }
      } else if (['+', '-', '*', '/'].includes(key)) {
        if (currentInput === 'error') currentInput = '0';
        prevExpr = currentInput + ' ' + (key === '*' ? '×' : key === '/' ? '÷' : key === '-' ? '−' : '+');
        resetOnNext = true;
      } else if (key === '=') {
        if (prevExpr && !resetOnNext) {
          evaluate();
        }
      } else if (key === 'C') {
        currentInput = '0';
        prevExpr = '';
        resetOnNext = false;
      } else if (key === 'plusminus') {
        if (currentInput !== '0' && currentInput !== 'error') {
          if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
          } else {
            currentInput = '-' + currentInput;
          }
        }
      } else if (key === '%') {
        if (currentInput !== 'error') {
          try {
            const val = parseFloat(currentInput);
            currentInput = String(val / 100);
          } catch (e) {
            currentInput = 'error';
          }
        }
      } else if (key === 'backspace') {
        if (currentInput === 'error' || resetOnNext) {
          currentInput = '0';
          resetOnNext = false;
        } else if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
        } else {
          currentInput = '0';
        }
      }

      updateDisplay();
    }

    function evaluate() {
      try {
        let expr = prevExpr + ' ' + currentInput;
        // sanitize symbols to valid js arithmetic
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

        // only allow safe characters
        if (!/^[\d\.\s\+\-\*\/]+$/.test(expr)) {
          throw new Error('invalid characters');
        }

        // eval the sanitized arithmetic string
        const result = Function('"use strict"; return (' + expr + ')')();

        if (!isFinite(result) || isNaN(result)) {
          currentInput = 'error';
        } else {
          currentInput = String(Math.round(result * 100000000) / 100000000);
        }
        prevExpr = '';
        resetOnNext = true;
      } catch (err) {
        currentInput = 'error';
        prevExpr = '';
        resetOnNext = true;
      }
    }

    container.querySelectorAll('.calc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleInput(btn.getAttribute('data-key'));
      });
    });

    appEl.addEventListener('keydown', (e) => {
      if (e.key >= '0' && e.key <= '9' || e.key === '.') {
        handleInput(e.key);
      } else if (e.key === '+') {
        handleInput('+');
      } else if (e.key === '-') {
        handleInput('-');
      } else if (e.key === '*') {
        handleInput('*');
      } else if (e.key === '/') {
        e.preventDefault();
        handleInput('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleInput('=');
      } else if (e.key === 'Backspace') {
        handleInput('backspace');
      } else if (e.key === 'Escape') {
        handleInput('C');
      } else if (e.key === '%') {
        handleInput('%');
      }
    });

    setTimeout(() => appEl.focus(), 50);
  }

  return {
    open
  };
})();
