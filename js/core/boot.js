// boot.js - boot sequence, login & lock screens

const Boot = (function() {
  const KERNEL_LINES = [
    '[    0.000000] moonOS 1.0 booting on web',
    '[    0.042131] moonwm: window manager started',
    '[    0.118445] fs: mounted /home/ashu (rw)',
    '[    0.204882] themes: loaded luna, nord, gruvbox, everforest',
    '[    0.311509] net: connected to moon-net',
    '[    0.402773] sandbox: all systems nominal',
    '[    0.467001] welcome, ashu'
  ];

  let bootState = 'prompt'; // prompt -> grub -> log -> login -> desktop
  let logInterval = null;

  function init() {
    setupPrompt();
    setupGrub();
    setupLogin();
    setupLock();
  }

  function setupPrompt() {
    const bootPrompt = document.getElementById('boot-prompt');
    const bootScreen = document.getElementById('boot-screen');

    function startGrub() {
      if (bootState !== 'prompt') return;
      bootState = 'grub';
      bootPrompt.classList.add('hidden');
      const grub = document.getElementById('boot-grub');
      if (grub) grub.classList.remove('hidden');

      // auto proceed to kernel log after 1.2s or on enter
      setTimeout(() => {
        if (bootState === 'grub') {
          startKernelLog();
        }
      }, 1200);
    }

    if (bootPrompt) {
      bootPrompt.addEventListener('click', startGrub);
    }

    window.addEventListener('keydown', (e) => {
      if (bootState === 'prompt' && e.key === 'Enter') {
        startGrub();
      } else if (bootState === 'grub' && e.key === 'Enter') {
        startKernelLog();
      } else if (bootState === 'log' && (e.key === 'Enter' || e.key === 'Escape')) {
        skipToLogin();
      }
    });

    if (bootScreen) {
      bootScreen.addEventListener('click', () => {
        if (bootState === 'log') {
          skipToLogin();
        }
      });
    }
  }

  function setupGrub() {
    const items = document.querySelectorAll('.grub-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        setTimeout(startKernelLog, 300);
      });
    });
  }

  function startKernelLog() {
    if (bootState === 'log' || bootState === 'login' || bootState === 'desktop') return;
    bootState = 'log';

    const grub = document.getElementById('boot-grub');
    const logBox = document.getElementById('boot-log');
    const logText = document.getElementById('boot-log-text');

    if (grub) grub.classList.add('hidden');
    if (logBox) logBox.classList.remove('hidden');
    if (logText) logText.textContent = '';

    let lineIndex = 0;
    logInterval = setInterval(() => {
      if (lineIndex < KERNEL_LINES.length) {
        logText.textContent += KERNEL_LINES[lineIndex] + '\n';
        lineIndex++;
      } else {
        clearInterval(logInterval);
        setTimeout(showLogin, 400);
      }
    }, 45); // ~45ms per line
  }

  function skipToLogin() {
    if (logInterval) clearInterval(logInterval);
    showLogin();
  }

  function showLogin() {
    bootState = 'login';
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');

    if (bootScreen) bootScreen.classList.add('hidden');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      loginScreen.style.opacity = '1';
    }
  }

  function setupLogin() {
    const card = document.getElementById('login-user-card');
    const loginScreen = document.getElementById('login-screen');
    const desktopEnv = document.getElementById('desktop-env');

    function signIn() {
      if (bootState !== 'login') return;
      bootState = 'desktop';

      if (loginScreen) {
        loginScreen.style.opacity = '0';
        setTimeout(() => {
          loginScreen.classList.add('hidden');
        }, 300); // 300ms fade transition
      }

      if (desktopEnv) {
        desktopEnv.classList.remove('hidden');
      }

      // open terminal by default on first boot
      setTimeout(() => {
        Apps.launch('terminal');
      }, 200);
    }

    if (card) {
      card.addEventListener('click', signIn);
    }
  }

  function lock() {
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) {
      lockScreen.classList.remove('hidden');
      lockScreen.style.opacity = '1';
    }
  }

  function setupLock() {
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) {
      lockScreen.addEventListener('click', () => {
        lockScreen.style.opacity = '0';
        setTimeout(() => {
          lockScreen.classList.add('hidden');
        }, 250);
      });
    }
  }

  function restart() {
    location.reload();
  }

  return {
    init,
    lock,
    restart
  };
})();
