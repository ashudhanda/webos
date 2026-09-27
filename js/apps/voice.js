// voice.js - Voice Assistant: speak commands to control moonOS.
// Uses the Web Speech API (SpeechRecognition for input, speechSynthesis
// for spoken replies). Commands: "open <app>", "what time is it",
// "what's the date", "tell me a joke", "what can you do". Falls back to
// typed input when speech recognition is unavailable.

const VoiceApp = (function() {
  const APP_NAMES = {
    terminal: ['terminal'],
    files: ['files', 'file manager'],
    editor: ['editor', 'text editor', 'notepad'],
    calc: ['calculator', 'calc'],
    settings: ['settings'],
    monitor: ['system monitor', 'monitor'],
    notes: ['sticky notes', 'notes'],
    snake: ['snake'],
    mines: ['minesweeper', 'mines'],
    music: ['music studio', 'music', 'piano'],
    calendar: ['calendar'],
    tasks: ['tasks', 'todo', 'to do'],
    clock: ['clock'],
    passgen: ['password generator', 'passgen'],
    voice: ['voice assistant'],
    aichat: ['ai chat', 'chat'],
    weather: ['weather'],
    camera: ['camera'],
    recorder: ['sound recorder', 'recorder', 'voice recorder'],
    paint: ['paint', 'drawing'],
    game2048: ['2048', 'twenty forty eight']
  };

  const JOKES = [
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    'I told my computer I needed a break. Now it will not stop sending me KitKat ads.',
    'Why did the developer go broke? He used up all his cache.',
    'There are only 10 kinds of people: those who understand binary and those who do not.',
    'My computer and I have a great relationship. It does what I say. Eventually. After three restarts.'
  ];

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'voice',
      title: 'Voice Assistant',
      width: 460,
      height: 520,
      minWidth: 380,
      minHeight: 440,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><line x1="12" y1="17" x2="12" y2="22"></line></svg>',
      render: (bodyEl) => {
        cleanupFn = initVoice(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function initVoice(container) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SR;

    container.innerHTML = `
      <div class="voice-app">
        <div class="voice-orb-wrap">
          <button class="voice-mic-btn" ${supported ? '' : 'disabled'} title="${supported ? 'Click and speak' : 'Speech recognition not supported in this browser'}">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><line x1="12" y1="17" x2="12" y2="22"></line></svg>
          </button>
          <div class="voice-status">tap the mic and speak</div>
        </div>
        ${supported ? '' : '<div class="voice-nosupport">Speech recognition is not supported in this browser. You can still type commands below.</div>'}
        <div class="voice-log"></div>
        <div class="voice-input-row">
          <input class="voice-text-input" type="text" placeholder="or type a command, e.g. open snake" />
          <button class="voice-send-btn">Send</button>
        </div>
        <div class="voice-hint">Try: "open music", "what time is it", "tell me a joke"</div>
      </div>
    `;

    const logEl = container.querySelector('.voice-log');
    const statusEl = container.querySelector('.voice-status');
    const micBtn = container.querySelector('.voice-mic-btn');
    const textInput = container.querySelector('.voice-text-input');
    const sendBtn = container.querySelector('.voice-send-btn');

    let rec = null;
    let listening = false;

    function addMsg(who, text) {
      const div = document.createElement('div');
      div.className = 'voice-msg ' + who;
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function setStatus(t) {
      statusEl.textContent = t;
    }

    function handleCommand(raw) {
      const cmd = raw.toLowerCase().trim();
      if (!cmd) return;
      addMsg('user', raw);
      let reply;

      // open <app>
      const openMatch = cmd.match(/^(open|launch|start)\s+(.+)$/);
      if (openMatch) {
        const want = openMatch[2].trim();
        let found = null;
        for (const [id, names] of Object.entries(APP_NAMES)) {
          if (names.some(n => want === n || want.includes(n) || n.includes(want))) {
            found = id;
            break;
          }
        }
        if (found) {
          Apps.launch(found);
          reply = `Opening ${found}.`;
        } else {
          reply = `I could not find an app called ${want}.`;
        }
      } else if (/\btime\b/.test(cmd)) {
        const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        reply = `It is ${t}.`;
      } else if (/\b(date|day|today)\b/.test(cmd)) {
        const d = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        reply = `Today is ${d}.`;
      } else if (/\bjoke\b/.test(cmd)) {
        reply = JOKES[Math.floor(Math.random() * JOKES.length)];
      } else if (/what can you do|help|commands/.test(cmd)) {
        reply = 'I can open any app for you, tell the time and date, or tell a joke. Just say "open snake", for example.';
      } else if (/^(hi|hello|hey)\b/.test(cmd)) {
        reply = 'Hello! How can I help?';
      } else if (/who are you|your name/.test(cmd)) {
        reply = 'I am the moonOS voice assistant, at your service.';
      } else if (/\b(bye|goodbye|stop)\b/.test(cmd)) {
        reply = 'Goodbye! Tap the mic whenever you need me.';
        stopListening();
      } else {
        reply = `Sorry, I did not understand "${raw}". Try "what can you do".`;
      }

      addMsg('bot', reply);
      speak(reply);
    }

    function startListening() {
      if (!supported || listening) return;
      try {
        rec = new SR();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e) => {
          const text = e.results[0][0].transcript;
          handleCommand(text);
        };
        rec.onerror = (e) => {
          setStatus(e.error === 'not-allowed' ? 'mic blocked - allow microphone access' : 'could not hear you, try again');
          stopListening();
        };
        rec.onend = () => {
          if (listening) {
            try { rec.start(); } catch (err) { stopListening(); }
          }
        };
        rec.start();
        listening = true;
        micBtn.classList.add('listening');
        setStatus('listening... speak now');
      } catch (e) {
        setStatus('could not start microphone');
      }
    }

    function stopListening() {
      listening = false;
      micBtn.classList.remove('listening');
      setStatus('tap the mic and speak');
      try { if (rec) rec.stop(); } catch (e) {}
      rec = null;
    }

    micBtn.addEventListener('click', () => {
      if (listening) stopListening();
      else startListening();
    });

    function sendTyped() {
      const v = textInput.value.trim();
      if (!v) return;
      textInput.value = '';
      handleCommand(v);
    }
    sendBtn.addEventListener('click', sendTyped);
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendTyped();
    });

    addMsg('bot', 'Hi! I am your voice assistant. Tap the mic and say "open snake", or type below.');

    return function cleanup() {
      stopListening();
      try { window.speechSynthesis.cancel(); } catch (e) {}
    };
  }

  return { open };
})();

window.VoiceApp = VoiceApp;
