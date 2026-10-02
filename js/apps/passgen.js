// passgen.js - secure password generator on crypto.getRandomValues.
// length slider, character-set toggles, entropy-based strength meter,
// copy button. history is session-only, never written to disk.

const PassgenApp = (function() {
  const SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
  };

  function open() {
    WM.createWindow({
      id: 'passgen',
      title: 'Password Generator',
      width: 440,
      height: 480,
      minWidth: 360,
      minHeight: 420,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path><circle cx="12" cy="16" r="1.5" fill="currentColor"></circle></svg>',
      render: (bodyEl) => {
        initPassgen(bodyEl);
      }
    });
  }

  function initPassgen(container) {
    container.innerHTML = `
      <div class="passgen-app">
        <div class="passgen-out-wrap">
          <div class="passgen-out" title="generated password">press generate</div>
          <button class="passgen-copy" title="copy to clipboard" aria-label="copy to clipboard">copy</button>
        </div>
        <div class="passgen-strength">
          <div class="passgen-bar"><div class="passgen-fill"></div></div>
          <div class="passgen-label">strength — <b class="passgen-word">—</b> <span class="passgen-bits"></span></div>
        </div>
        <label class="passgen-row">length <b class="passgen-len-val">16</b>
          <input type="range" class="passgen-len" min="8" max="64" value="16" aria-label="password length">
        </label>
        <div class="passgen-toggles">
          <label><input type="checkbox" class="pg-lower" checked> a–z</label>
          <label><input type="checkbox" class="pg-upper" checked> A–Z</label>
          <label><input type="checkbox" class="pg-digits" checked> 0–9</label>
          <label><input type="checkbox" class="pg-symbols" checked> symbols</label>
        </div>
        <button class="passgen-generate" aria-label="generate password">generate</button>
        <div class="passgen-history-title">this session</div>
        <div class="passgen-history"></div>
      </div>
    `;

    const outEl = container.querySelector('.passgen-out');
    const fillEl = container.querySelector('.passgen-fill');
    const wordEl = container.querySelector('.passgen-word');
    const bitsEl = container.querySelector('.passgen-bits');
    const lenSlider = container.querySelector('.passgen-len');
    const lenVal = container.querySelector('.passgen-len-val');
    const historyEl = container.querySelector('.passgen-history');
    const history = [];

    function pool() {
      let p = '';
      if (container.querySelector('.pg-lower').checked) p += SETS.lower;
      if (container.querySelector('.pg-upper').checked) p += SETS.upper;
      if (container.querySelector('.pg-digits').checked) p += SETS.digits;
      if (container.querySelector('.pg-symbols').checked) p += SETS.symbols;
      return p;
    }

    function generate() {
      const chars = pool();
      const len = parseInt(lenSlider.value, 10);
      if (!chars.length) {
        outEl.textContent = 'pick at least one set';
        wordEl.textContent = '—';
        bitsEl.textContent = '';
        fillEl.style.width = '0%';
        return '';
      }
      // rejection sampling: avoid modulo bias
      const rand = new Uint32Array(len * 2);
      crypto.getRandomValues(rand);
      const limit = Math.floor(4294967296 / chars.length) * chars.length;
      let pw = '';
      for (let i = 0; i < rand.length && pw.length < len; i++) {
        if (rand[i] < limit) pw += chars[rand[i] % chars.length];
      }
      // extremely unlikely fallback if rejection ate too much
      while (pw.length < len) {
        const b = new Uint8Array(1);
        crypto.getRandomValues(b);
        pw += chars[b[0] % chars.length];
      }

      outEl.textContent = pw;

      const bits = Math.round(len * Math.log2(chars.length));
      bitsEl.textContent = bits + ' bits';
      let word, pct, color;
      if (bits < 50) { word = 'weak'; pct = 25; color = '#f7768e'; }
      else if (bits < 80) { word = 'fair'; pct = 50; color = '#e0af68'; }
      else if (bits < 110) { word = 'strong'; pct = 75; color = '#9ece6a'; }
      else { word = 'very strong'; pct = 100; color = '#7aa2f7'; }
      wordEl.textContent = word;
      fillEl.style.width = pct + '%';
      fillEl.style.background = color;

      history.unshift(pw);
      if (history.length > 8) history.pop();
      renderHistory();
      return pw;
    }

    function renderHistory() {
      historyEl.innerHTML = '';
      history.forEach((pw) => {
        const row = document.createElement('button');
        row.className = 'passgen-hist-row';
        row.textContent = pw;
        row.title = 'click to copy';
        row.addEventListener('click', () => copyText(pw));
        historyEl.appendChild(row);
      });
      if (!history.length) {
        historyEl.innerHTML = '<div class="passgen-hist-empty">nothing yet</div>';
      }
    }

    function copyText(text) {
      if (!text) return;
      const done = () => {
        if (window.Notify) Notify.show('copied to clipboard');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else {
        fallbackCopy(text, done);
      }
    }

    function fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) {}
      ta.remove();
    }

    lenSlider.addEventListener('input', () => {
      lenVal.textContent = lenSlider.value;
    });
    container.querySelector('.passgen-generate').addEventListener('click', generate);
    container.querySelector('.passgen-copy').addEventListener('click', () => {
      copyText(outEl.textContent === 'press generate' ? '' : outEl.textContent);
    });

    renderHistory();
    generate();
  }

  return {
    open
  };
})();
