

const Apps = (function() {
  const registry = {
    terminal: TerminalApp,
    files: FilesApp,
    editor: EditorApp,
    calc: CalcApp,
    settings: SettingsApp,
    monitor: MonitorApp
  };

  function launch(appName, options) {
    const app = registry[appName];
    if (app && typeof app.open === 'function') {
      if (appName === 'files' && options && options.path) {
        app.open(options.path);
      } else if (appName === 'editor' && options && options.path) {
        app.open(options.path);
      } else if (appName === 'settings' && options) {
        app.open(options);
      } else {
        app.open();
      }
    }
  }

  return {
    launch
  };
})();

// taskbar.js checks window.Apps — const alone doesn't attach
window.Apps = Apps;


document.addEventListener('DOMContentLoaded', () => {

  try {
    const savedTheme = localStorage.getItem('moonos-theme') || 'luna';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedWp = localStorage.getItem('moonos-wp');
    if (savedWp && savedWp !== 'default') {
      document.documentElement.setAttribute('data-wp', savedWp);
    }
  } catch (e) {}


  WM.init();
  Panel.init();
  if (window.Taskbar) Taskbar.init();
  Boot.init();
  Matrix.init();


  setupDesktopIcons();
});

function setupDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');
  const GRID = 84;

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('moonos-icon-pos') || '{}');
  } catch (e) {}

  icons.forEach((icon) => {
    const p = saved[icon.getAttribute('data-path')];
    if (p) {
      icon.style.position = 'absolute';
      icon.style.left = p.left;
      icon.style.top = p.top;
    }
  });

  function freezeIcons() {
    icons.forEach((icon) => {
      if (icon.style.position === 'absolute') return;
      icon.style.position = 'absolute';
      icon.style.left = icon.offsetLeft + 'px';
      icon.style.top = icon.offsetTop + 'px';
    });
  }

  function savePositions() {
    const pos = {};
    icons.forEach((icon) => {
      if (icon.style.position === 'absolute') {
        pos[icon.getAttribute('data-path')] = { left: icon.style.left, top: icon.style.top };
      }
    });
    try {
      localStorage.setItem('moonos-icon-pos', JSON.stringify(pos));
    } catch (e) {}
  }

  icons.forEach((icon) => {
    let drag = null;

    icon.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        left: icon.offsetLeft,
        top: icon.offsetTop,
        moved: false
      };
      icon.setPointerCapture(e.pointerId);
    });

    icon.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (!drag.moved) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        drag.moved = true;
        freezeIcons();
        icon.classList.add('dragging');
      }

      const sheet = icon.closest('.workspace-sheet');
      let x = drag.left + dx;
      let y = drag.top + dy;

      x = Math.max(0, Math.min(x, sheet.clientWidth - 104));
      y = Math.max(0, Math.min(y, sheet.clientHeight - 104));

      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
    });

    icon.addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.moved) {
        const x = Math.round(parseInt(icon.style.left, 10) / GRID) * GRID;
        const y = Math.round(parseInt(icon.style.top, 10) / GRID) * GRID;
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';
        icon.classList.remove('dragging');
        savePositions();
      }
      drag = null;
    });

    icon.addEventListener('pointercancel', () => {
      icon.classList.remove('dragging');
      drag = null;
    });

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      icons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });

    icon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const action = icon.getAttribute('data-action');
      const path = icon.getAttribute('data-path');

      if (action === 'open-folder') {
        Apps.launch('files', { path });
      } else if (action === 'open-file') {
        Apps.launch('editor', { path });
      }
    });
  });

  const desktopEnv = document.getElementById('desktop-env');
  if (desktopEnv) {
    desktopEnv.addEventListener('click', (e) => {
      if (!e.target.closest('.desktop-icon') && !e.target.closest('.panel-btn') && !e.target.closest('.panel-popup') && !e.target.closest('.os-window')) {
        icons.forEach(i => i.classList.remove('selected'));
      }
    });
  }
}
