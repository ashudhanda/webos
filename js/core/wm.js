// wm.js - window manager, dragging, resizing, workspaces & alt-tab

const WM = (function() {
  let highestZ = 100;
  const windows = new Map(); // id -> window object
  let activeWindowId = null;
  let currentWorkspace = 0;
  const TOTAL_WORKSPACES = 4;

  // alt-tab state
  let isAltTabOpen = false;
  let altTabSelectedIndex = 0;
  let altTabOrder = [];

  // aero snap preview element (shared, moved into the active workspace container)
  let snapPreviewEl = null;

  function ensureSnapPreview(container) {
    if (!snapPreviewEl || snapPreviewEl.parentNode !== container) {
      if (snapPreviewEl && snapPreviewEl.parentNode) {
        snapPreviewEl.parentNode.removeChild(snapPreviewEl);
      }
      snapPreviewEl = document.createElement('div');
      snapPreviewEl.className = 'snap-preview hidden';
      container.appendChild(snapPreviewEl);
    }
    return snapPreviewEl;
  }

  function showSnapPreview(container, zone) {
    const el = ensureSnapPreview(container);
    el.classList.remove('hidden');
    if (zone === 'left') {
      el.style.left = '6px';
      el.style.top = '6px';
      el.style.width = 'calc(50% - 10px)';
      el.style.height = 'calc(100% - 12px)';
    } else if (zone === 'right') {
      el.style.left = 'calc(50% + 4px)';
      el.style.top = '6px';
      el.style.width = 'calc(50% - 10px)';
      el.style.height = 'calc(100% - 12px)';
    } else if (zone === 'max') {
      el.style.left = '6px';
      el.style.top = '6px';
      el.style.width = 'calc(100% - 12px)';
      el.style.height = 'calc(100% - 12px)';
    }
  }

  function hideSnapPreview() {
    if (snapPreviewEl) snapPreviewEl.classList.add('hidden');
  }

  function applySnap(id, zone) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    const { el } = winObj;

    if (zone === 'max') {
      if (!winObj.maximized) toggleMaximize(id);
      return;
    }

    // save pre-snap geometry (skip if already snapped/maximized - prevRect holds the true restore point)
    if (!winObj.snapped && !winObj.maximized) {
      winObj.prevRect = {
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height
      };
    }
    el.classList.remove('maximized', 'snapped-left', 'snapped-right');
    winObj.maximized = false;
    el.classList.add(zone === 'left' ? 'snapped-left' : 'snapped-right');
    winObj.snapped = zone;
    focusWindow(id);
  }

  function unsnapWindow(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    if (!winObj.snapped) return;
    const { el } = winObj;
    el.classList.remove('snapped-left', 'snapped-right');
    winObj.snapped = null;
    if (winObj.prevRect) {
      el.style.left = winObj.prevRect.left;
      el.style.top = winObj.prevRect.top;
      el.style.width = winObj.prevRect.width;
      el.style.height = winObj.prevRect.height;
    }
  }

  function init() {
    setupGlobalShortcuts();
    setupWorkspaceDots();
  }

  function getWorkspaceContainer(wsIndex = currentWorkspace) {
    return document.getElementById(`windows-ws-${wsIndex}`) || document.getElementById('windows-ws-0');
  }

  function createWindow(config) {
    // config: { id, title, iconSvg, width, height, x, y, ws, render(bodyEl), onClose, minWidth, minHeight }
    const id = config.id || 'app-' + Math.random().toString(36).substr(2, 6);

    // single instance per app rule
    if (windows.has(id)) {
      const existing = windows.get(id);
      if (existing.minimized) {
        unminimizeWindow(id);
      }
      // switch to its workspace if needed
      if (existing.workspace !== currentWorkspace) {
        setWorkspace(existing.workspace);
      }
      focusWindow(id);
      return existing;
    }

    const wsIndex = typeof config.ws === 'number' ? config.ws : currentWorkspace;
    const parentContainer = getWorkspaceContainer(wsIndex);

    const winEl = document.createElement('div');
    winEl.className = 'os-window';
    winEl.id = `win-${id}`;

    // calculate centered or cascaded initial position
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight - 32;
    const width = Math.min(config.width || 600, viewportW - 40);
    const height = Math.min(config.height || 400, viewportH - 40);

    const cascadeOffset = (windows.size % 6) * 24;
    const left = config.x !== undefined ? config.x : Math.max(30, Math.floor((viewportW - width) / 2) + cascadeOffset);
    const top = config.y !== undefined ? config.y : Math.max(20, Math.floor((viewportH - height) / 2) + cascadeOffset);

    winEl.style.width = `${width}px`;
    winEl.style.height = `${height}px`;
    winEl.style.left = `${left}px`;
    winEl.style.top = `${top}px`;
    winEl.style.zIndex = ++highestZ;

    winEl.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title-left">
          <span class="win-icon">${config.iconSvg || ''}</span>
          <span class="win-title">${config.title || 'Window'}</span>
        </div>
        <div class="win-controls">
          <button class="win-btn minimize" title="Minimize">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button class="win-btn maximize" title="Maximize">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
          </button>
          <button class="win-btn close" title="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <div class="win-body" id="body-${id}"></div>
      <div class="win-resize-grip" title="Resize"></div>
    `;

    parentContainer.appendChild(winEl);

    const winObj = {
      id,
      title: config.title,
      iconSvg: config.iconSvg,
      el: winEl,
      bodyEl: winEl.querySelector(`#body-${id}`),
      titleEl: winEl.querySelector('.win-title'),
      workspace: wsIndex,
      minimized: false,
      maximized: false,
      prevRect: null,
      onClose: config.onClose,
      minW: config.minWidth || 320,
      minH: config.minHeight || 200,
      snapped: null
    };

    windows.set(id, winObj);

    // setup event handlers
    setupWindowEvents(winObj);

    // render contents
    if (typeof config.render === 'function') {
      config.render(winObj.bodyEl, winObj);
    }

    Sound.open();
    focusWindow(id);
    return winObj;
  }

  function setupWindowEvents(winObj) {
    const { el, id } = winObj;
    const titlebar = el.querySelector('.win-titlebar');
    const minBtn = el.querySelector('.win-btn.minimize');
    const maxBtn = el.querySelector('.win-btn.maximize');
    const closeBtn = el.querySelector('.win-btn.close');
    const resizeGrip = el.querySelector('.win-resize-grip');

    // bring to front on any click
    el.addEventListener('pointerdown', () => {
      focusWindow(id);
    });

    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(id);
    });

    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize(id);
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(id);
    });

    // double click titlebar to maximize toggle
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.win-controls')) return;
      toggleMaximize(id);
    });

    // dragging with pointer events & geometry caching
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let winStartX = 0;
    let winStartY = 0;
    let pendingSnap = null; // aero snap zone while dragging: 'left' | 'right' | 'max' | null

    titlebar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.win-btn')) return;
      if (winObj.maximized) return;

      // dragging a snapped window restores it first (standard aero behavior)
      if (winObj.snapped) {
        unsnapWindow(id);
      }

      isDragging = true;
      pendingSnap = null;
      titlebar.setPointerCapture(e.pointerId);

      dragStartX = e.clientX;
      dragStartY = e.clientY;
      winStartX = parseInt(el.style.left, 10) || 0;
      winStartY = parseInt(el.style.top, 10) || 0;
      e.preventDefault();
    });

    titlebar.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      let nextX = winStartX + dx;
      let nextY = winStartY + dy;

      // avoid losing titlebar above screen
      nextY = Math.max(0, nextY);

      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;

      // aero snap: detect screen edges during drag
      const container = el.parentNode;
      if (container) {
        const rect = container.getBoundingClientRect();
        const EDGE = 12;
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        let zone = null;
        if (px <= EDGE) zone = 'left';
        else if (px >= rect.width - EDGE) zone = 'right';
        else if (py <= EDGE) zone = 'max';
        pendingSnap = zone;
        if (zone) showSnapPreview(container, zone);
        else hideSnapPreview();
      }
    });

    function stopDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      hideSnapPreview();
      if (pendingSnap) {
        applySnap(id, pendingSnap);
        pendingSnap = null;
      }
      try {
        titlebar.releasePointerCapture(e.pointerId);
      } catch (err) {
        // pointer was already released
      }
    }

    titlebar.addEventListener('pointerup', stopDrag);
    titlebar.addEventListener('pointercancel', stopDrag);

    // corner resize with geometry caching
    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let winStartW = 0;
    let winStartH = 0;

    resizeGrip.addEventListener('pointerdown', (e) => {
      if (winObj.maximized) return;
      isResizing = true;
      resizeGrip.setPointerCapture(e.pointerId);

      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      winStartW = el.offsetWidth;
      winStartH = el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });

    resizeGrip.addEventListener('pointermove', (e) => {
      if (!isResizing) return;
      const dw = e.clientX - resizeStartX;
      const dh = e.clientY - resizeStartY;

      const newW = Math.max(winObj.minW, winStartW + dw);
      const newH = Math.max(winObj.minH, winStartH + dh);

      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
    });

    function stopResize(e) {
      if (!isResizing) return;
      isResizing = false;
      try {
        resizeGrip.releasePointerCapture(e.pointerId);
      } catch (err) {
        // pass
      }
    }

    resizeGrip.addEventListener('pointerup', stopResize);
    resizeGrip.addEventListener('pointercancel', stopResize);
  }

  function focusWindow(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);

    windows.forEach((w) => {
      w.el.classList.remove('active');
    });

    winObj.el.classList.add('active');
    winObj.el.style.zIndex = ++highestZ;
    activeWindowId = id;
  }

  function minimizeWindow(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    winObj.minimized = true;
    winObj.el.classList.add('minimized');

    if (activeWindowId === id) {
      activeWindowId = null;
      // focus another visible window in this workspace
      const visible = Array.from(windows.values()).filter(w => w.workspace === currentWorkspace && !w.minimized);
      if (visible.length > 0) {
        focusWindow(visible[visible.length - 1].id);
      }
    }
    updateFullscreenState();
  }

  function unminimizeWindow(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    winObj.minimized = false;
    winObj.el.classList.remove('minimized');
    focusWindow(id);
    updateFullscreenState();
  }

  // True-fullscreen bookkeeping: while any non-minimized window is
  // maximized, the taskbar auto-hides (revealed via the bottom edge).
  function updateFullscreenState() {
    let anyMax = false;
    windows.forEach((w) => {
      if (w.maximized && !w.minimized) anyMax = true;
    });
    document.body.classList.toggle('has-maximized', anyMax);
    if (!anyMax) document.body.classList.remove('taskbar-peek');
  }

  function toggleMaximize(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    const { el } = winObj;

    if (!winObj.maximized) {
      // save previous rect (skip when snapped - prevRect already holds the pre-snap rect)
      if (!winObj.snapped) {
        winObj.prevRect = {
          left: el.style.left,
          top: el.style.top,
          width: el.style.width,
          height: el.style.height
        };
      }
      el.classList.remove('snapped-left', 'snapped-right');
      winObj.snapped = null;
      el.classList.add('maximized');
      winObj.maximized = true;
    } else {
      el.classList.remove('maximized');
      if (winObj.prevRect) {
        el.style.left = winObj.prevRect.left;
        el.style.top = winObj.prevRect.top;
        el.style.width = winObj.prevRect.width;
        el.style.height = winObj.prevRect.height;
      }
      winObj.maximized = false;
    }
    updateFullscreenState();
  }

  function closeWindow(id) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);

    if (typeof winObj.onClose === 'function') {
      winObj.onClose();
    }

    winObj.el.classList.add('closing');
    Sound.close();
    setTimeout(() => {
      if (winObj.el.parentNode) {
        winObj.el.parentNode.removeChild(winObj.el);
      }
      windows.delete(id);

      if (activeWindowId === id) {
        activeWindowId = null;
        const visible = Array.from(windows.values()).filter(w => w.workspace === currentWorkspace && !w.minimized);
        if (visible.length > 0) {
          focusWindow(visible[visible.length - 1].id);
        }
      }
      updateFullscreenState();
    }, 120);
  }

  function setWindowTitle(id, newTitle) {
    if (!windows.has(id)) return;
    const winObj = windows.get(id);
    winObj.title = newTitle;
    if (winObj.titleEl) {
      winObj.titleEl.textContent = newTitle;
    }
  }

  function getWindow(id) {
    return windows.get(id);
  }

  // Workspaces implementation
  function setWorkspace(index) {
    if (index < 0 || index >= TOTAL_WORKSPACES) return;
    currentWorkspace = index;

    const strip = document.getElementById('workspaces-strip');
    if (strip) {
      strip.style.transform = `translateX(-${index * 25}%)`;
    }

    // update dots
    document.querySelectorAll('.ws-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // focus last active window on this workspace
    const wsWindows = Array.from(windows.values()).filter(w => w.workspace === currentWorkspace && !w.minimized);
    if (wsWindows.length > 0) {
      focusWindow(wsWindows[wsWindows.length - 1].id);
    }
  }

  function setupWorkspaceDots() {
    document.querySelectorAll('.ws-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const ws = parseInt(dot.getAttribute('data-ws'), 10);
        setWorkspace(ws);
      });
    });
  }

  // Alt+Tab Switcher
  function openAltTab() {
    const openWins = Array.from(windows.values());
    if (openWins.length === 0) return;

    altTabOrder = openWins;
    altTabSelectedIndex = (altTabSelectedIndex + 1) % altTabOrder.length;
    isAltTabOpen = true;

    renderAltTabUI();
    const overlay = document.getElementById('alttab-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function renderAltTabUI() {
    const list = document.getElementById('alttab-list');
    if (!list) return;

    list.innerHTML = '';
    altTabOrder.forEach((win, index) => {
      const item = document.createElement('div');
      item.className = `alttab-item ${index === altTabSelectedIndex ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="alttab-item-icon">${win.iconSvg || ''}</div>
        <div class="alttab-item-title">${win.title}</div>
      `;
      list.appendChild(item);
    });
  }

  function closeAltTab(commit = true) {
    if (!isAltTabOpen) return;
    isAltTabOpen = false;
    const overlay = document.getElementById('alttab-overlay');
    if (overlay) overlay.classList.add('hidden');

    if (commit && altTabOrder.length > 0 && altTabOrder[altTabSelectedIndex]) {
      const selectedWin = altTabOrder[altTabSelectedIndex];
      if (selectedWin.minimized) {
        unminimizeWindow(selectedWin.id);
      }
      if (selectedWin.workspace !== currentWorkspace) {
        setWorkspace(selectedWin.workspace);
      }
      focusWindow(selectedWin.id);
    }
    altTabSelectedIndex = 0;
  }

  function setupGlobalShortcuts() {
    let altPressed = false;

    window.addEventListener('keydown', (e) => {
      // track alt key
      if (e.key === 'Alt') {
        altPressed = true;
      }

      // Alt+Tab handling
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        if (!isAltTabOpen) {
          openAltTab();
        } else {
          altTabSelectedIndex = (altTabSelectedIndex + 1) % altTabOrder.length;
          renderAltTabUI();
        }
        return;
      }

      // Esc cancels Alt+Tab or closes menus
      if (e.key === 'Escape') {
        if (isAltTabOpen) {
          e.preventDefault();
          closeAltTab(false);
          return;
        }
        Panel.closeAllPopups();
        return;
      }

      // Ctrl + Alt + Left/Right workspace switching
      if (e.ctrlKey && e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setWorkspace((currentWorkspace - 1 + TOTAL_WORKSPACES) % TOTAL_WORKSPACES);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setWorkspace((currentWorkspace + 1) % TOTAL_WORKSPACES);
        }
      }

      // Super + L or Meta + L for lock screen
      if (e.key === 'l' && (e.metaKey || e.ctrlKey && e.altKey)) {
        e.preventDefault();
        Boot.lock();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
        altPressed = false;
        if (isAltTabOpen) {
          closeAltTab(true);
        }
      }
    });
  }

  return {
    init,
    createWindow,
    getWindow,
    focusWindow,
    minimizeWindow,
    unminimizeWindow,
    toggleMaximize,
    closeWindow,
    setWindowTitle,
    setWorkspace,
    getCurrentWorkspace: () => currentWorkspace
  };
})();

// const alone doesn't attach to window — taskbar.js checks window.WM
window.WM = WM;
