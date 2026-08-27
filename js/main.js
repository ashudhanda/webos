// main.js - bootstrap & application registry

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

// initialize everything on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // restore saved theme
  try {
    const savedTheme = localStorage.getItem('moonos-theme') || 'luna';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedWp = localStorage.getItem('moonos-wp');
    if (savedWp && savedWp !== 'default') {
      document.documentElement.setAttribute('data-wp', savedWp);
    }
  } catch (e) {}

  // initialize subsystems
  WM.init();
  Panel.init();
  Boot.init();

  // setup desktop icons
  setupDesktopIcons();
});

function setupDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');

  icons.forEach((icon) => {
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

  // clear desktop icon selection when clicking desktop canvas
  const desktopEnv = document.getElementById('desktop-env');
  if (desktopEnv) {
    desktopEnv.addEventListener('click', (e) => {
      if (!e.target.closest('.desktop-icon') && !e.target.closest('.panel-btn') && !e.target.closest('.panel-popup') && !e.target.closest('.os-window')) {
        icons.forEach(i => i.classList.remove('selected'));
      }
    });
  }
}
