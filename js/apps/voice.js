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
        <div class="voice-hint">Try: "open music", "close music", "take a photo", "sum of 9 and 5"</div>
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

    function findApp(want) {
      w = want.toLowerCase().trim();
      for (const [id, names] of Object.entries(APP_NAMES)) {
        if (names.some(n => w === n || w.includes(n) || n.includes(w))) {
          return id;
        }
      }
      return null;
    }

    function appLabel(id) {
      const names = APP_NAMES[id];
      return names ? names[0] : id;
    }

    // Ask the camera app to capture a photo; resolves true on success.
    function takePhoto() {
      return new Promise((resolve) => {
        try {
          if (window.CameraApp && typeof CameraApp.capturePhoto === 'function') {
            CameraApp.capturePhoto().then(resolve).catch(() => resolve(false));
          } else {
            resolve(false);
          }
        } catch (e) {
          resolve(false);
        }
        setTimeout(() => resolve(false), 15000);
      }).then((ok) => !!ok);
    }

    const WORD_NUMS = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
      eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
      fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
      nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100
    };

    // Parse spoken math like "sum of 9 and 5", "9 plus 5", "what is 12 * 3".
    // Returns a reply string, or null when the command is not math.
    function parseMath(cmd) {
      let c = cmd.toLowerCase();
      // strip common wrappers
      c = c.replace(/^(what is|whats|what's|calculate|compute|solve|tell me|please)\s+/, '');
      c = c.replace(/\?$/, '').trim();

      // "sum of X and Y" / "add X and Y" / "product of X and Y" ...
      let m = c.match(/^(sum|add|addition|product|multiply)\s+of\s+(.+?)\s+and\s+(.+)$/);
      let op = null, aStr, bStr;
      if (m) {
        op = (m[1] === 'sum' || m[1] === 'add' || m[1] === 'addition') ? '+' : '*';
        aStr = m[2]; bStr = m[3];
      } else {
        // "X plus Y", "X minus Y", "X times Y", "X divided by Y", symbol forms
        m = c.match(/^(.+?)\s+(plus|add|minus|subtract|times|multiplied by|multiply by|multiplied|multiply|divided by|divide by|divide|over|mod|modulo)\s+(.+)$/);
        if (!m) {
          m = c.match(/^(.+?)\s*([+\-*/x×÷])\s*(.+)$/);
          if (!m) return null;
          aStr = m[1]; bStr = m[3];
          op = ({ '+': '+', '-': '-', '*': '*', '/': '/', 'x': '*', '×': '*', '÷': '/' })[m[2]];
        } else {
          aStr = m[1]; bStr = m[3];
          const w = m[2];
          if (/plus|add/.test(w)) op = '+';
          else if (/minus|subtract/.test(w)) op = '-';
          else if (/times|multipl/.test(w)) op = '*';
          else if (/divid|divide|over/.test(w)) op = '/';
          else if (/mod/.test(w)) op = '%';
        }
      }

      const a = wordToNum(aStr.trim());
      const b = wordToNum(bStr.trim());
      if (a === null || b === null || !op) return null;
      if (op === '/' && b === 0) return 'Cannot divide by zero.';

      let result;
      try {
        result = Function('"use strict"; return (' + a + op + b + ')')();
      } catch (e) {
        return null;
      }
      if (typeof result !== 'number' || !isFinite(result)) return null;
      const pretty = Math.round(result * 1e10) / 1e10;
      const opWord = { '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by', '%': 'mod' }[op];
      return `${a} ${opWord} ${b} is ${pretty}.`;
    }

    function wordToNum(s) {
      s = s.toLowerCase().trim();
      if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      if (WORD_NUMS[s] !== undefined) return WORD_NUMS[s];
      // "twenty one" style
      const parts = s.split(/[\s-]+/);
      let total = 0, ok = true;
      for (const p of parts) {
        if (WORD_NUMS[p] === undefined) { ok = false; break; }
        total += WORD_NUMS[p];
      }
      return ok && parts.length ? total : null;
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
        const found = findApp(want);
        if (found) {
          Apps.launch(found);
          reply = `Opening ${appLabel(found)}.`;
        } else {
          reply = `I could not find an app called ${want}.`;
        }
      } else if (/^(close|quit|exit|kill)\s+(.+)$/.test(cmd)) {
        // close <app>
        const want = cmd.match(/^(close|quit|exit|kill)\s+(.+)$/)[2].trim();
        const found = findApp(want);
        if (!found) {
          reply = `I could not find an app called ${want}.`;
        } else if (window.WM && WM.getWindow(found)) {
          WM.closeWindow(found);
          reply = `Closing ${appLabel(found)}.`;
        } else {
          reply = `${appLabel(found)} is not open.`;
        }
      } else if (/\b(take|capture|click|snap)\b.*\b(photo|picture|selfie|shot)\b/.test(cmd) ||
                 /\b(photo|picture|selfie)\b.*\b(take|capture|click|snap)\b/.test(cmd)) {
        // take a photo / capture photo
        reply = 'Opening the camera to take your photo.';
        addMsg('bot', reply);
        speak(reply);
        takePhoto().then((ok) => {
          const done = ok ? 'Photo captured! You can save it from the camera gallery.' : 'Could not take the photo. Please allow camera access and try again.';
          addMsg('bot', done);
          speak(done);
        });
        return;
      } else {
        const math = parseMath(cmd);
        if (math !== null) {
          reply = math;
        } else if (/\btime\b/.test(cmd)) {
        const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        reply = `It is ${t}.`;
      } else if (/\b(date|day|today)\b/.test(cmd)) {
        const d = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        reply = `Today is ${d}.`;
      } else if (/\bjoke\b/.test(cmd)) {
        reply = JOKES[Math.floor(Math.random() * JOKES.length)];
      } else if (/what can you do|help|commands/.test(cmd)) {
        reply = 'I can open and close apps ("open snake", "close music"), take a photo, do quick math like "sum of 9 and 5", tell the time and date, or tell a joke.';
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
