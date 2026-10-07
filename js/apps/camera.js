// camera.js - Camera: live webcam preview with photo capture.
// Uses getUserMedia; captured photos land in a gallery strip with
// per-photo download. Camera tracks are stopped when the window closes.
// Shows a friendly message if permission is denied or no camera exists.

const CameraApp = (function() {
  // set by the currently open camera window; used by capturePhoto()
  let activeCapture = null;
  let activeReady = null;

  // Open the camera (if needed), wait for the stream, capture one photo.
  // Resolves true when a photo was captured, false otherwise.
  // Polls every 250ms (cheap, still responsive); the 10s timeout plus the
  // window-exists check bail out if permission is never granted or the user
  // closes the window mid-capture.
  function capturePhoto() {
    return new Promise((resolve) => {
      if (!window.Apps || !window.WM) { resolve(false); return; }
      Apps.launch('camera');
      const t0 = Date.now();
      const timer = setInterval(() => {
        const ready = activeReady && activeReady();
        if (ready && activeCapture) {
          clearInterval(timer);
          try { activeCapture(); } catch (e) { resolve(false); return; }
          resolve(true);
        } else if (Date.now() - t0 > 10000 || !WM.getWindow('camera')) {
          clearInterval(timer);
          resolve(false);
        }
      }, 250);
    });
  }

  function open() {
    let cleanupFn = null;
    WM.createWindow({
      id: 'camera',
      title: 'Camera',
      width: 560,
      height: 560,
      minWidth: 440,
      minHeight: 480,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
      render: (bodyEl) => {
        cleanupFn = initCamera(bodyEl);
      },
      onClose: () => {
        if (cleanupFn) cleanupFn();
      }
    });
  }

  function initCamera(container) {
    container.innerHTML = `
      <div class="camera-app">
        <div class="camera-view">
          <video class="camera-video" autoplay playsinline muted></video>
          <div class="camera-msg">Requesting camera...</div>
          <div class="camera-flash"></div>
        </div>
        <div class="camera-controls">
          <button class="camera-capture" disabled>📸 Capture</button>
          <span class="camera-count">0 photos</span>
        </div>
        <div class="camera-gallery"></div>
      </div>
    `;

    const video = container.querySelector('.camera-video');
    const msgEl = container.querySelector('.camera-msg');
    const captureBtn = container.querySelector('.camera-capture');
    const countEl = container.querySelector('.camera-count');
    const galleryEl = container.querySelector('.camera-gallery');
    const flashEl = container.querySelector('.camera-flash');

    let stream = null;
    let photoCount = 0;

    function updateCount() {
      countEl.textContent = photoCount + (photoCount === 1 ? ' photo' : ' photos');
    }

    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        msgEl.textContent = 'Camera is not supported in this browser.';
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
        video.srcObject = stream;
        msgEl.style.display = 'none';
        captureBtn.disabled = false;
      } catch (e) {
        msgEl.textContent = e && e.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access and reopen the app.'
          : 'No camera found on this device.';
      }
    }

    captureBtn.addEventListener('click', () => {
      if (!stream) return;
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const c = document.createElement('canvas');
      c.width = vw;
      c.height = vh;
      c.getContext('2d').drawImage(video, 0, 0, vw, vh);
      const url = c.toDataURL('image/png');

      flashEl.classList.add('on');
      setTimeout(() => flashEl.classList.remove('on'), 180);

      photoCount++;
      updateCount();

      const item = document.createElement('div');
      item.className = 'camera-photo';
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'captured photo';
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = 'moonos-photo-' + Date.now() + '.png';
      dl.className = 'camera-dl';
      dl.textContent = '⬇ Save';
      item.appendChild(img);
      item.appendChild(dl);
      galleryEl.prepend(item);
    });

    start();

    // expose capture to voice assistant / external callers
    activeCapture = () => { captureBtn.click(); };
    activeReady = () => !!stream && !captureBtn.disabled;

    return function cleanup() {
      if (stream) {
        stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        stream = null;
      }
      activeCapture = null;
      activeReady = null;
    };
  }

  return { open, capturePhoto };
})();

window.CameraApp = CameraApp;
