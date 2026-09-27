// recorder.js - Sound Recorder: record from the microphone, play back,
// download or delete recordings. Uses MediaRecorder; mic tracks are
// released when the window closes. Friendly message on denied access.

const RecorderApp = (function() {
  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'recorder',
      title: 'Sound Recorder',
      width: 440,
      height: 520,
      minWidth: 380,
      minHeight: 440,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>',
      render: (bodyEl) => {
        cleanupFn = initRecorder(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function initRecorder(container) {
    container.innerHTML = `
      <div class="rec-app">
        <div class="rec-status-wrap">
          <div class="rec-dot"></div>
          <div class="rec-status">ready</div>
          <div class="rec-time">00:00</div>
        </div>
        <div class="rec-controls">
          <button class="rec-btn-start">● Record</button>
          <button class="rec-btn-stop" disabled>■ Stop</button>
        </div>
        <div class="rec-msg"></div>
        <div class="rec-list-title">Recordings</div>
        <div class="rec-list"><div class="rec-empty">No recordings yet.</div></div>
      </div>
    `;

    const statusEl = container.querySelector('.rec-status');
    const timeEl = container.querySelector('.rec-time');
    const dotEl = container.querySelector('.rec-dot');
    const startBtn = container.querySelector('.rec-btn-start');
    const stopBtn = container.querySelector('.rec-btn-stop');
    const msgEl = container.querySelector('.rec-msg');
    const listEl = container.querySelector('.rec-list');

    let stream = null;
    let recorder = null;
    let chunks = [];
    let timerId = null;
    let startTs = 0;
    let recCount = 0;

    function setStatus(t, recording) {
      statusEl.textContent = t;
      dotEl.classList.toggle('on', !!recording);
    }

    function tick() {
      timeEl.textContent = fmtTime(Date.now() - startTs);
    }

    async function ensureStream() {
      if (stream) return stream;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('unsupported');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return stream;
    }

    function pickMime() {
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
        for (const m of candidates) {
          if (MediaRecorder.isTypeSupported(m)) return m;
        }
      }
      return '';
    }

    startBtn.addEventListener('click', async () => {
      msgEl.textContent = '';
      try {
        const s = await ensureStream();
        chunks = [];
        const mime = pickMime();
        recorder = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = onStopped;
        recorder.start();
        startTs = Date.now();
        timerId = setInterval(tick, 250);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        setStatus('recording...', true);
      } catch (e) {
        msgEl.textContent = e && e.name === 'NotAllowedError'
          ? 'Microphone permission denied. Allow mic access and try again.'
          : 'Could not access the microphone on this device.';
      }
    });

    stopBtn.addEventListener('click', () => {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    });

    function onStopped() {
      clearInterval(timerId);
      timerId = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus('ready', false);
      timeEl.textContent = '00:00';

      const type = (recorder && recorder.mimeType) || 'audio/webm';
      const blob = new Blob(chunks, { type });
      if (blob.size === 0) {
        msgEl.textContent = 'Recording came out empty. Try again.';
        return;
      }
      addRecording(blob, type);
      recorder = null;
    }

    function addRecording(blob, type) {
      recCount++;
      const empty = listEl.querySelector('.rec-empty');
      if (empty) empty.remove();

      const url = URL.createObjectURL(blob);
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';

      const item = document.createElement('div');
      item.className = 'rec-item';

      const name = document.createElement('div');
      name.className = 'rec-name';
      name.textContent = 'Recording ' + recCount;

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = url;

      const dl = document.createElement('a');
      dl.href = url;
      dl.download = 'moonos-recording-' + Date.now() + '.' + ext;
      dl.className = 'rec-dl';
      dl.textContent = '⬇ Save';

      const del = document.createElement('button');
      del.className = 'rec-del';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        URL.revokeObjectURL(url);
        item.remove();
        if (!listEl.querySelector('.rec-item')) {
          listEl.innerHTML = '<div class="rec-empty">No recordings yet.</div>';
        }
      });

      const row = document.createElement('div');
      row.className = 'rec-item-row';
      row.appendChild(dl);
      row.appendChild(del);

      item.appendChild(name);
      item.appendChild(audio);
      item.appendChild(row);
      listEl.prepend(item);
    }

    return function cleanup() {
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
      clearInterval(timerId);
      if (stream) {
        stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        stream = null;
      }
    };
  }

  return { open };
})();

window.RecorderApp = RecorderApp;
