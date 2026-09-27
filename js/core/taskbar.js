const Taskbar = (function() {
  const apps = [
    {
      id: 'terminal',
      name: 'Terminal',
      aliases: ['term', 'console', 'bash', 'sh', 'shell', 'cli'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>'
    },
    {
      id: 'files',
      name: 'Files',
      aliases: ['file', 'files', 'explorer', 'folder', 'directory'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
    },
    {
      id: 'editor',
      name: 'Text Editor',
      aliases: ['notes', 'edit', 'editor', 'notepad', 'txt'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
    },
    {
      id: 'calc',
      name: 'Calculator',
      aliases: ['calc', 'calculator', 'math'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"></path></svg>'
    },
    {
      id: 'settings',
      name: 'Settings',
      aliases: ['settings', 'config', 'theme', 'wallpaper', 'appearance', 'preferences'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>'
    },
    {
      id: 'monitor',
      name: 'System Monitor',
      aliases: ['monitor', 'top', 'htop', 'process', 'cpu', 'ram'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><polyline points="6 10 9 13 12 7 15 11 18 8"></polyline></svg>'
    },
    {
      id: 'notes',
      name: 'Sticky Notes',
      aliases: ['notes', 'note', 'sticky', 'reminder'],
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`
    },
    {
      id: 'snake',
      name: 'Snake',
      aliases: ['snake', 'game', 'arcade'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16c4 0 4-4 8-4s4-4 8-4"></path><circle cx="19" cy="8" r="1" fill="currentColor"></circle><path d="M4 16v3h3"></path></svg>'
    },
    {
      id: 'mines',
      name: 'Minesweeper',
      aliases: ['mines', 'minesweeper', 'game', 'arcade'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>'
    },
    {
      id: 'music',
      name: 'Music Studio',
      aliases: ['music', 'piano', 'synth', 'sound'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'
    },
    {
      id: 'calendar',
      name: 'Calendar',
      aliases: ['calendar', 'events', 'schedule', 'date'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    },
    {
      id: 'tasks',
      name: 'Tasks',
      aliases: ['tasks', 'todo', 'checklist'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
    },
    {
      id: 'clock',
      name: 'Clock',
      aliases: ['clock', 'time', 'stopwatch', 'timer', 'world clock'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
    },
    {
      id: 'passgen',
      name: 'Password Generator',
      aliases: ['password', 'passgen', 'generator', 'pass'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path><circle cx="12" cy="16" r="1.5" fill="currentColor"></circle></svg>'
    },
    {
      id: 'voice',
      name: 'Voice Assistant',
      aliases: ['voice', 'assistant', 'mic', 'microphone', 'speak'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><line x1="12" y1="17" x2="12" y2="22"></line></svg>'
    },
    {
      id: 'aichat',
      name: 'AI Chat',
      aliases: ['ai', 'chat', 'assistant', 'gpt', 'bot'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
    },
    {
      id: 'weather',
      name: 'Weather',
      aliases: ['weather', 'forecast', 'temperature', 'rain'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>'
    },
    {
      id: 'camera',
      name: 'Camera',
      aliases: ['camera', 'webcam', 'photo', 'picture'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'
    },
    {
      id: 'recorder',
      name: 'Sound Recorder',
      aliases: ['recorder', 'record', 'audio', 'sound', 'mic'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>'
    },
    {
      id: 'paint',
      name: 'Paint',
      aliases: ['paint', 'draw', 'drawing', 'canvas'],
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><circle cx="11" cy="11" r="2"></circle></svg>'
    }
  ];

  let selectedResultIndex = 0;
  let currentSearchResults = [];

  // only these apps get a permanent taskbar icon — everything else stays
  // reachable via start menu / search / terminal so the bar never overflows
  const PINNED_IDS = ['terminal', 'files', 'editor', 'notes', 'aichat', 'settings'];

  function init() {
    const mountEl = document.getElementById('taskbar');
    if (!mountEl) return;

    const pinnedApps = apps.filter((a) => PINNED_IDS.includes(a.id));

    mountEl.innerHTML = `
      <div class="taskbar">
        <button id="taskbar-start-btn" class="taskbar-start-btn" title="Start">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>

        <div class="taskbar-search-wrap">
          <span class="taskbar-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input type="text" id="taskbar-search-input" class="taskbar-search-input" placeholder="type to search apps…" autocomplete="off" spellcheck="false" />
        </div>

        <div class="taskbar-pinned-apps">
          ${pinnedApps.map(app => `
            <button class="taskbar-app-btn" data-app="${app.id}" data-tooltip="${app.name}">
              ${app.icon}
              <span class="taskbar-app-dot"></span>
            </button>
          `).join('')}
        </div>
      </div>

      <div id="start-menu" class="start-menu">
        ${apps.map(app => `
          <button class="start-menu-item" data-app="${app.id}">
            ${app.icon}
            <span>${app.name}</span>
          </button>
        `).join('')}
        <div class="start-menu-divider"></div>
        <button class="start-menu-item" data-action="about">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>About moonOS</span>
        </button>
      </div>

      <div id="taskbar-search-results" class="taskbar-search-results"></div>

      <div id="taskbar-reveal-zone"></div>
    `;

    setupEvents();
    setupRevealZone();
    updateRunningDots();

    setInterval(updateRunningDots, 300);
  }

  // Bottom-edge reveal for the auto-hidden taskbar during fullscreen.
  function setupRevealZone() {
    const zone = document.getElementById('taskbar-reveal-zone');
    const taskbarEl = document.querySelector('#taskbar .taskbar');
    if (!zone || !taskbarEl) return;

    zone.addEventListener('mouseenter', () => {
      if (document.body.classList.contains('has-maximized')) {
        document.body.classList.add('taskbar-peek');
      }
    });
    zone.addEventListener('mouseleave', () => {
      document.body.classList.remove('taskbar-peek');
    });

    taskbarEl.addEventListener('mouseleave', (e) => {
      if (!document.body.classList.contains('has-maximized')) return;
      // moving down onto the reveal strip keeps it visible; moving
      // anywhere else (or while the start menu is open) hides it
      const to = e.relatedTarget;
      if (to && (to.id === 'taskbar-reveal-zone' || to.closest('#taskbar-reveal-zone'))) return;
      if (document.getElementById('start-menu').classList.contains('open')) return;
      if (document.activeElement && document.activeElement.id === 'taskbar-search-input') return;
      document.body.classList.remove('taskbar-peek');
    });
  }

  function launchOrFocusApp(id) {
    if (window.WM && WM.getWindow(id)) {
      const win = WM.getWindow(id);
      if (win.minimized) {
        WM.unminimizeWindow(id);
      } else {
        WM.focusWindow(id);
      }
    } else if (window.Apps && typeof Apps.launch === 'function') {
      Apps.launch(id);
    } else {
      console.log('open', id);
    }
    updateRunningDots();
  }

  function updateRunningDots() {
    const buttons = document.querySelectorAll('.taskbar-app-btn');
    buttons.forEach((btn) => {
      const appId = btn.getAttribute('data-app');
      // check active window existence in window manager or DOM
      const isRunning = window.WM && typeof WM.getWindow === 'function'
        ? !!WM.getWindow(appId)
        : !!document.getElementById(`win-${appId}`);
      btn.classList.toggle('is-running', isRunning);
    });
  }

  function setupEvents() {
    const startBtn = document.getElementById('taskbar-start-btn');
    const startMenu = document.getElementById('start-menu');
    const searchInput = document.getElementById('taskbar-search-input');
    const resultsPopup = document.getElementById('taskbar-search-results');

    function toggleStartMenu() {
      const isOpen = startMenu.classList.contains('open');
      closeSearch();
      if (isOpen) {
        closeStartMenu();
      } else {
        startMenu.classList.add('open');
        startBtn.classList.add('active');
      }
    }

    function closeStartMenu() {
      startMenu.classList.remove('open');
      startBtn.classList.remove('active');
      // in fullscreen auto-hide mode, drop the peek unless the pointer
      // is currently over the taskbar or the reveal strip
      if (document.body.classList.contains('has-maximized')) {
        const tb = document.querySelector('#taskbar .taskbar');
        if (tb && !tb.matches(':hover')) {
          document.body.classList.remove('taskbar-peek');
        }
      }
    }

    function closeSearch() {
      resultsPopup.classList.remove('open');
      resultsPopup.innerHTML = '';
      currentSearchResults = [];
      selectedResultIndex = 0;
    }

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStartMenu();
    });

    document.querySelectorAll('.taskbar-app-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeStartMenu();
        closeSearch();
        launchOrFocusApp(btn.getAttribute('data-app'));
      });
    });

    startMenu.querySelectorAll('.start-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        closeStartMenu();
        const appId = item.getAttribute('data-app');
        const action = item.getAttribute('data-action');
        if (appId) {
          launchOrFocusApp(appId);
        } else if (action === 'about') {
          if (window.Apps && typeof Apps.launch === 'function') {
            Apps.launch('settings', { tab: 'about' });
          }
        }
      });
    });

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      closeStartMenu();

      if (!query) {
        closeSearch();
        return;
      }

      currentSearchResults = apps.filter((app) => {
        if (app.name.toLowerCase().includes(query)) return true;
        return app.aliases.some(alias => alias.includes(query));
      }).slice(0, 5);

      selectedResultIndex = 0;
      renderSearchResults();
    });

    function renderSearchResults() {
      if (currentSearchResults.length === 0) {
        resultsPopup.innerHTML = '<div class="search-no-results">no results</div>';
      } else {
        resultsPopup.innerHTML = currentSearchResults.map((app, idx) => `
          <button class="start-menu-item ${idx === selectedResultIndex ? 'selected' : ''}" data-app="${app.id}">
            ${app.icon}
            <span>${app.name}</span>
          </button>
        `).join('');

        resultsPopup.querySelectorAll('.start-menu-item').forEach((btn, idx) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            launchOrFocusApp(btn.getAttribute('data-app'));
            searchInput.value = '';
            closeSearch();
          });
          btn.addEventListener('mouseenter', () => {
            selectedResultIndex = idx;
            highlightSelectedResult();
          });
        });
      }

      resultsPopup.classList.add('open');
    }

    function highlightSelectedResult() {
      const items = resultsPopup.querySelectorAll('.start-menu-item');
      items.forEach((item, idx) => {
        item.classList.toggle('selected', idx === selectedResultIndex);
      });
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        closeSearch();
      } else if (e.key === 'ArrowDown') {
        if (currentSearchResults.length > 0) {
          e.preventDefault();
          selectedResultIndex = (selectedResultIndex + 1) % currentSearchResults.length;
          highlightSelectedResult();
        }
      } else if (e.key === 'ArrowUp') {
        if (currentSearchResults.length > 0) {
          e.preventDefault();
          selectedResultIndex = (selectedResultIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
          highlightSelectedResult();
        }
      } else if (e.key === 'Enter') {
        if (currentSearchResults.length > 0) {
          e.preventDefault();
          const chosen = currentSearchResults[selectedResultIndex];
          launchOrFocusApp(chosen.id);
          searchInput.value = '';
          closeSearch();
        }
      }
    });


    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeStartMenu();
        closeSearch();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#start-menu') && !e.target.closest('#taskbar-start-btn')) {
        closeStartMenu();
      }
      if (!e.target.closest('#taskbar-search-results') && !e.target.closest('.taskbar-search-wrap')) {
        closeSearch();
      }
    });
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    updateRunningDots
  };
})();
