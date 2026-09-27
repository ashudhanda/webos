// aichat.js - AI Chat: talk to a free AI right inside moonOS.
// Uses the Pollinations free text API (no API key needed):
//   GET https://text.pollinations.ai/{url-encoded prompt}?model=openai
// returns plain text. Graceful error state when offline or rate-limited.

const AIChatApp = (function() {
  const LS_KEY = 'moonos-aichat-history';

  function open() {
    WM.createWindow({
      id: 'aichat',
      title: 'AI Chat',
      width: 480,
      height: 560,
      minWidth: 380,
      minHeight: 440,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="9" cy="10" r="1" fill="currentColor"></circle><circle cx="13" cy="10" r="1" fill="currentColor"></circle><circle cx="17" cy="10" r="1" fill="currentColor"></circle></svg>',
      render: (bodyEl) => {
        initChat(bodyEl);
      }
    });
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveHistory(h) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(h.slice(-40)));
    } catch (e) {}
  }

  function initChat(container) {
    container.innerHTML = `
      <div class="aichat-app">
        <div class="aichat-head">
          <div class="aichat-title">AI Assistant</div>
          <button class="aichat-clear" title="Clear conversation">Clear</button>
        </div>
        <div class="aichat-log"></div>
        <div class="aichat-input-row">
          <input class="aichat-input" type="text" placeholder="Ask anything..." />
          <button class="aichat-send">Send</button>
        </div>
        <div class="aichat-note">Free AI API - needs internet. Answers may take a few seconds.</div>
      </div>
    `;

    const logEl = container.querySelector('.aichat-log');
    const inputEl = container.querySelector('.aichat-input');
    const sendBtn = container.querySelector('.aichat-send');
    const clearBtn = container.querySelector('.aichat-clear');

    let history = loadHistory();
    let busy = false;

    function addMsg(role, text) {
      const div = document.createElement('div');
      div.className = 'aichat-msg ' + role;
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
      return div;
    }

    history.forEach(m => addMsg(m.role, m.text));
    if (history.length === 0) {
      addMsg('ai', 'Hey! I am your AI assistant inside moonOS. Ask me anything - coding help, writing, ideas, whatever.');
    }

    function pushHistory(role, text) {
      history.push({ role, text });
      saveHistory(history);
    }

    async function askAI(question) {
      // keep answers short and chat-like via a system-style prefix.
      // note: no ?model= param - the shared key behind named models is
      // often out of budget; the default model answers fine anonymously.
      const prompt = 'Answer briefly and helpfully (a few sentences max): ' + question;
      const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = (await res.text()).trim();
        if (!text) throw new Error('empty response');
        return text;
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    }

    async function send() {
      const q = inputEl.value.trim();
      if (!q || busy) return;
      busy = true;
      inputEl.value = '';
      addMsg('user', q);
      pushHistory('user', q);
      const thinking = addMsg('ai', '');
      thinking.classList.add('typing');
      thinking.innerHTML = '<span></span><span></span><span></span>';
      try {
        const answer = await askAI(q);
        thinking.classList.remove('typing');
        thinking.textContent = answer;
        pushHistory('ai', answer);
      } catch (e) {
        thinking.classList.remove('typing');
        thinking.textContent = 'Hmm, I could not reach the AI right now. Check your internet and try again.';
      }
      logEl.scrollTop = logEl.scrollHeight;
      busy = false;
      inputEl.focus();
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });
    clearBtn.addEventListener('click', () => {
      history = [];
      saveHistory(history);
      logEl.innerHTML = '';
      addMsg('ai', 'Conversation cleared. What is on your mind?');
    });

    inputEl.focus();
  }

  return { open };
})();

window.AIChatApp = AIChatApp;
