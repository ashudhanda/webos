

// main.js - entry point: app launcher registry, boot sequence, desktop icons.

// Apps: single registry mapping app names to their app modules. launch()
// routes to each app's open(); files/editor/settings accept options so
// desktop icons and search can deep-link (e.g. open a file by path).
const Apps = (function() {
  const registry = {
    terminal: TerminalApp,
    files: FilesApp,
    editor: EditorApp,
    calc: CalcApp,
    settings: SettingsApp,
    monitor: MonitorApp,
    notes: NotesApp,
    snake: SnakeApp,
    mines: MinesApp,
    music: MusicApp,
    calendar: CalendarApp,
    tasks: TasksApp,
    clock: ClockApp,
    passgen: PassgenApp,
    voice: VoiceApp,
    aichat: AIChatApp,
    weather: WeatherApp,
    camera: CameraApp,
    recorder: RecorderApp,
    paint: PaintApp
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

window.Apps = Apps;


document.addEventListener('DOMContentLoaded', () => {

  try {
    const THEME_MIGRATION = { luna: 'moon', nord: 'earth', gruvbox: 'saturn', everforest: 'mars' };
    let savedTheme = localStorage.getItem('moonos-theme') || 'moon';
    if (THEME_MIGRATION[savedTheme]) {
      savedTheme = THEME_MIGRATION[savedTheme];
      try { localStorage.setItem('moonos-theme', savedTheme); } catch (e) {}
    }
    if (!['moon', 'mars', 'earth', 'saturn'].includes(savedTheme)) savedTheme = 'moon';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e) {}

  // Animated planet wallpapers + ambient sounds per theme
  window.ThemeFX = (() => {
    function setScene(theme) {
      if (window.WallpaperFX) WallpaperFX.setTheme(theme);
    }

    function setSound(theme) {
      if (window.Ambience) Ambience.setTheme(theme);
    }

    function apply(theme) {
      if (!['moon', 'mars', 'earth', 'saturn'].includes(theme)) theme = 'moon';
      setScene(theme);
      setSound(theme);
    }

    function setSoundEnabled(on) {
      if (window.Ambience) Ambience.setEnabled(on);
    }

    function isSoundOn() {
      return window.Ambience ? Ambience.isOn() : true;
    }

    function unlock() {
      if (window.Ambience) Ambience.unlock();
    }

    return { apply, setSoundEnabled, isSoundOn, unlock };
  })();

  window.ThemeFX.apply(document.documentElement.getAttribute('data-theme') || 'moon');


  WM.init();
  Panel.init();
  if (window.Taskbar) Taskbar.init();
  Boot.init();
  NotesApp.init();


  setupDesktopIcons();
});

// setupDesktopIcons: restores icon positions saved in localStorage, then makes
// every desktop icon draggable with snap-to-grid (GRID px) and double-click to
// open. freezeIcons() converts the CSS flow layout to absolute coordinates on
// first drag so icons don't reflow while being moved; positions are only
// persisted after an actual drag (pointerup with moved=true), plain clicks
// just select.
//
// Also owns: user-created app shortcut icons (dragged from the app menus onto
// the desktop, persisted under localStorage 'moonos-app-icons'), the per-icon
// right-click menu (Open / Delete), and the menu-to-desktop drag gesture
// (long-press on touch, drag threshold on mouse).
function setupDesktopIcons() {
  const GRID = 84;
  const iconList = [];

  function eachIcon(fn) { iconList.forEach(fn); }

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('moonos-icon-pos') || '{}');
  } catch (e) {}

  document.querySelectorAll('.desktop-icon').forEach((icon) => {
    const p = saved[icon.getAttribute('data-path')];
    if (p) {
      icon.style.position = 'absolute';
      icon.style.left = p.left;
      icon.style.top = p.top;
    }
  });

  // Two-pass freeze: FIRST snapshot every icon's position, THEN switch them
  // to absolute. (Doing it in one pass is a bug: making icon N absolute
  // removes it from the grid flow, so icon N+1 reflows into its slot and
  // gets frozen at the wrong, overlapping position.)
  function freezeIcons() {
    const container = iconList[0] ? iconList[0].parentElement : null;
    const crect = container ? container.getBoundingClientRect() : null;
    const snapshots = [];
    eachIcon((icon) => {
      if (icon.style.position === 'absolute') return;
      const r = icon.getBoundingClientRect();
      snapshots.push({
        icon,
        left: r.left - (crect ? crect.left : 0),
        top: r.top - (crect ? crect.top : 0)
      });
    });
    snapshots.forEach(({ icon, left, top }) => {
      icon.style.position = 'absolute';
      icon.style.left = left + 'px';
      icon.style.top = top + 'px';
    });
  }

  // Built-in icons (folders/files) persist by data-path. App shortcuts
  // (data-action="open-app") persist separately via saveAppIcons().
  function savePositions() {
    const pos = {};
    eachIcon((icon) => {
      if (icon.getAttribute('data-action') === 'open-app') return;
      if (icon.style.position === 'absolute') {
        pos[icon.getAttribute('data-path')] = { left: icon.style.left, top: icon.style.top };
      }
    });
    try {
      localStorage.setItem('moonos-icon-pos', JSON.stringify(pos));
    } catch (e) {}
  }

  function saveAppIcons() {
    const list = [];
    eachIcon((icon) => {
      if (icon.getAttribute('data-action') !== 'open-app') return;
      if (icon.style.position === 'absolute') {
        list.push({ app: icon.getAttribute('data-app'), left: icon.style.left, top: icon.style.top });
      }
    });
    try {
      localStorage.setItem('moonos-app-icons', JSON.stringify(list));
    } catch (e) {}
  }

  function openDesktopIcon(icon) {
    const action = icon.getAttribute('data-action');
    const path = icon.getAttribute('data-path');
    if (action === 'open-folder') {
      Apps.launch('files', { path });
    } else if (action === 'open-file') {
      Apps.launch('editor', { path });
    } else if (action === 'open-app') {
      Apps.launch(icon.getAttribute('data-app'));
    }
  }

  // App display name + icon svg, read from the (static) panel app-menu DOM.
  function appMeta(appId) {
    const item = document.querySelector('.menu-item[data-launch="' + appId + '"]');
    if (!item) return null;
    const svg = item.querySelector('svg');
    const label = item.querySelector('span');
    return {
      name: label ? label.textContent.trim() : appId,
      svg: svg ? svg.outerHTML : ''
    };
  }

  function buildAppIconEl(appId, meta) {
    const el = document.createElement('div');
    el.className = 'desktop-icon app-shortcut';
    el.setAttribute('data-action', 'open-app');
    el.setAttribute('data-app', appId);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Open ' + meta.name);
    el.innerHTML = '<div class="icon-glyph">' + meta.svg + '</div><span class="icon-label"></span>';
    const svgEl = el.querySelector('.icon-glyph svg');
    if (svgEl) {
      svgEl.setAttribute('width', '34');
      svgEl.setAttribute('height', '34');
    }
    el.querySelector('.icon-label').textContent = meta.name;
    return el;
  }

  function findAppIcon(appId) {
    let found = null;
    eachIcon((icon) => {
      if (icon.getAttribute('data-action') === 'open-app' && icon.getAttribute('data-app') === appId) found = icon;
    });
    return found;
  }

  function createAppIcon(appId, x, y) {
    const meta = appMeta(appId);
    if (!meta) return null;
    const existing = findAppIcon(appId);
    if (existing) {
      eachIcon((i) => i.classList.remove('selected'));
      existing.classList.add('selected');
      if (window.Notify) Notify.show(meta.name + ' is already on the desktop', 'info');
      return existing;
    }
    const container = document.getElementById('desktop-icons');
    if (!container) return null;
    const el = buildAppIconEl(appId, meta);
    const gx = Math.max(0, Math.round(x / GRID) * GRID);
    const gy = Math.max(0, Math.round(y / GRID) * GRID);
    el.style.position = 'absolute';
    el.style.left = gx + 'px';
    el.style.top = gy + 'px';
    container.appendChild(el);
    wireDesktopIcon(el);
    saveAppIcons();
    if (window.Notify) Notify.show(meta.name + ' added to desktop', 'success');
    return el;
  }

  function restoreAppIcons() {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('moonos-app-icons') || '[]');
    } catch (e) {}
    const container = document.getElementById('desktop-icons');
    if (!container || !Array.isArray(list)) return;
    list.forEach((entry) => {
      if (!entry || !entry.app || findAppIcon(entry.app)) return;
      const meta = appMeta(entry.app);
      if (!meta) return;
      const el = buildAppIconEl(entry.app, meta);
      el.style.position = 'absolute';
      el.style.left = entry.left || '0px';
      el.style.top = entry.top || '0px';
      container.appendChild(el);
      wireDesktopIcon(el);
    });
  }

  function wireDesktopIcon(icon) {
    if (iconList.indexOf(icon) === -1) iconList.push(icon);
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
        saveAppIcons();
      }
      drag = null;
    });

    icon.addEventListener('pointercancel', () => {
      icon.classList.remove('dragging');
      drag = null;
    });

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      eachIcon((i) => i.classList.remove('selected'));
      icon.classList.add('selected');
    });

    icon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openDesktopIcon(icon);
    });
  }

  document.querySelectorAll('.desktop-icon').forEach(wireDesktopIcon);
  restoreAppIcons();

  // ---- per-icon right-click menu (Open / Delete) ----
  const iconCtx = document.getElementById('icon-ctx-menu');
  let ctxTarget = null;

  function hideIconCtx() {
    if (iconCtx) iconCtx.classList.add('hidden');
    ctxTarget = null;
  }

  const iconsContainer = document.getElementById('desktop-icons');
  if (iconsContainer && iconCtx) {
    iconsContainer.addEventListener('contextmenu', (e) => {
      const icon = e.target.closest ? e.target.closest('.desktop-icon') : null;
      if (!icon) return; // let the desktop background menu handle it
      e.preventDefault();
      e.stopPropagation();
      if (typeof Panel !== 'undefined' && Panel.closeAllPopups) Panel.closeAllPopups();

      ctxTarget = icon;
      const delBtn = iconCtx.querySelector('[data-action="icon-delete"]');
      // Delete is only offered for user-created app shortcuts
      if (delBtn) delBtn.style.display = icon.getAttribute('data-action') === 'open-app' ? '' : 'none';

      const x = Math.min(e.clientX, window.innerWidth - 170);
      const y = Math.min(e.clientY, window.innerHeight - 120);
      iconCtx.style.left = x + 'px';
      iconCtx.style.top = y + 'px';
      iconCtx.classList.remove('hidden');
    });

    iconCtx.querySelectorAll('.ctx-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = ctxTarget;
        hideIconCtx();
        if (!target) return;
        const action = item.getAttribute('data-action');
        if (action === 'icon-open') {
          openDesktopIcon(target);
        } else if (action === 'icon-delete') {
          if (target.getAttribute('data-action') === 'open-app') {
            const label = target.querySelector('.icon-label');
            const name = label ? label.textContent : 'icon';
            const idx = iconList.indexOf(target);
            if (idx >= 0) iconList.splice(idx, 1);
            target.remove();
            saveAppIcons();
            if (window.Notify) Notify.show(name + ' removed from desktop', 'info');
          }
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (iconCtx && !iconCtx.classList.contains('hidden') && !e.target.closest('#icon-ctx-menu')) {
        hideIconCtx();
      }
    });
  }

  const desktopEnv = document.getElementById('desktop-env');
  if (desktopEnv) {
    desktopEnv.addEventListener('click', (e) => {
      if (!e.target.closest('.desktop-icon') && !e.target.closest('.panel-btn') && !e.target.closest('.panel-popup') && !e.target.closest('.os-window')) {
        eachIcon((i) => i.classList.remove('selected'));
      }
    });
  }

  // exposed so the menu-drag drop handler can create icons
  window.DesktopIcons = {
    createAppIcon,
    openDesktopIcon
  };

  setupMenuIconDrag();
}

// setupMenuIconDrag: lets the user create a desktop shortcut by dragging an
// app out of either app menu (top-panel popup or taskbar start menu).
// Touch: press-and-hold ~450ms (so normal scroll/tap still works), then drag.
// Mouse: drag past a small threshold. A floating ghost follows the pointer;
// releasing over the desktop drops a new app icon there.
function setupMenuIconDrag() {
  const LONG_PRESS_MS = 450;
  let press = null; // {appId, startX, startY, timer, isMouse}
  let drag = null;  // {appId, ghost}
  let suppressClickUntil = 0;

  function menuItemFromEvent(e) {
    if (!e.target || !e.target.closest) return null;
    return e.target.closest('.menu-item[data-launch], .start-menu-item[data-app]');
  }

  function closeMenus() {
    try {
      if (typeof Panel !== 'undefined' && Panel.closeAllPopups) Panel.closeAllPopups();
    } catch (e) {}
    const sm = document.getElementById('start-menu');
    if (sm) sm.classList.remove('open');
    const rp = document.getElementById('taskbar-search-results');
    if (rp) rp.classList.remove('open');
  }

  function startDrag(appId, x, y) {
    closeMenus();
    const item = document.querySelector('.menu-item[data-launch="' + appId + '"]');
    const svg = item ? item.querySelector('svg') : null;
    const label = item ? item.querySelector('span') : null;
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = '<div class="icon-glyph">' + (svg ? svg.outerHTML : '') + '</div><span></span>';
    const gsvg = ghost.querySelector('svg');
    if (gsvg) {
      gsvg.setAttribute('width', '34');
      gsvg.setAttribute('height', '34');
    }
    ghost.querySelector('span').textContent = label ? label.textContent.trim() : appId;
    document.body.appendChild(ghost);
    moveGhost(ghost, x, y);
    drag = { appId, ghost };
    suppressClickUntil = Date.now() + 600;
  }

  function moveGhost(ghost, x, y) {
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
  }

  function endDrag(x, y) {
    if (!drag) return;
    const { appId, ghost } = drag;
    drag = null;
    ghost.remove();
    suppressClickUntil = Date.now() + 600;
    // accept the drop only on open desktop (not over windows/panels/menus)
    const el = document.elementFromPoint(x, y);
    const onDesktop = el && el.closest('#desktop-env') &&
      !el.closest('.os-window') && !el.closest('.top-panel') &&
      !el.closest('.taskbar') && !el.closest('.panel-popup') &&
      !el.closest('#start-menu') && !el.closest('.ctx-menu');
    if (!onDesktop) return;
    const container = document.getElementById('desktop-icons');
    if (!container) return;
    const r = container.getBoundingClientRect();
    // createAppIcon lives in setupDesktopIcons' closure — reach it via the
    // icon system exposed on window by setupDesktopIcons.
    if (window.DesktopIcons && window.DesktopIcons.createAppIcon) {
      window.DesktopIcons.createAppIcon(appId, x - r.left - 38, y - r.top - 38);
    }
  }

  function cancelPress() {
    if (press && press.timer) clearTimeout(press.timer);
    press = null;
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag) return;
    const item = menuItemFromEvent(e);
    if (!item) return;
    const appId = item.getAttribute('data-launch') || item.getAttribute('data-app');
    if (!appId) return;
    press = {
      appId,
      startX: e.clientX,
      startY: e.clientY,
      timer: 0,
      isMouse: e.pointerType === 'mouse'
    };
    if (!press.isMouse) {
      press.timer = setTimeout(() => {
        if (press) {
          startDrag(press.appId, press.startX, press.startY);
          press = null;
        }
      }, LONG_PRESS_MS);
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (drag) {
      moveGhost(drag.ghost, e.clientX, e.clientY);
      return;
    }
    if (!press) return;
    const dx = e.clientX - press.startX;
    const dy = e.clientY - press.startY;
    if (press.isMouse) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        startDrag(press.appId, e.clientX, e.clientY);
        press = null;
      }
    } else if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      cancelPress(); // it was a scroll, not a hold
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (drag) endDrag(e.clientX, e.clientY);
    cancelPress();
  });

  document.addEventListener('pointercancel', () => {
    if (drag) {
      drag.ghost.remove();
      drag = null;
    }
    cancelPress();
  });

  // swallow the click that fires on the menu item after a drag ends
  document.addEventListener('click', (e) => {
    if (Date.now() < suppressClickUntil) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  // keep the native touch callout from appearing during a long-press drag
  document.addEventListener('contextmenu', (e) => {
    if (drag) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}
