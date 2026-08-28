// settings.js - system settings app for appearance, wallpaper & system info

const SettingsApp = (function() {
  function open(options = {}) {
    const initialTab = options.tab || 'appearance';
    WM.createWindow({
      id: 'settings',
      title: 'Settings',
      width: 580,
      height: 400,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
      render: (bodyEl) => {
        initSettings(bodyEl, initialTab);
      }
    });
  }

  function initSettings(container, initialTab) {
    let activeTab = initialTab;

    container.innerHTML = `
      <div class="settings-app">
        <div class="settings-sidebar">
          <button class="settings-tab-btn" data-tab="appearance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a7 7 0 0 0 0 14v6"></path></svg>
            <span>Appearance</span>
          </button>
          <button class="settings-tab-btn" data-tab="wallpaper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Wallpaper</span>
          </button>
          <button class="settings-tab-btn" data-tab="about">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>About</span>
          </button>
        </div>
        <div class="settings-content"></div>
      </div>
    `;

    const contentEl = container.querySelector('.settings-content');

    function switchTab(tabName) {
      activeTab = tabName;
      container.querySelectorAll('.settings-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });

      if (tabName === 'appearance') {
        renderAppearance();
      } else if (tabName === 'wallpaper') {
        renderWallpaper();
      } else if (tabName === 'about') {
        renderAbout();
      }
    }

    function renderAppearance() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'luna';

      const themes = [
        { id: 'luna', name: 'Luna (Default)', bg: '#0b0e17', accent: '#9db8ff', dots: ['#9db8ff', '#dfe6f5', '#131a2b'] },
        { id: 'nord', name: 'Nord', bg: '#242933', accent: '#88c0d0', dots: ['#88c0d0', '#eceff4', '#2e3440'] },
        { id: 'gruvbox', name: 'Gruvbox', bg: '#1d2021', accent: '#fabd2f', dots: ['#fabd2f', '#ebdbb2', '#282828'] },
        { id: 'everforest', name: 'Everforest', bg: '#232a2e', accent: '#a7c080', dots: ['#a7c080', '#d3c6aa', '#2d353b'] }
      ];

      contentEl.innerHTML = `
        <div class="settings-section-title">Color Theme</div>
        <div class="settings-section-desc">Choose your preferred desktop aesthetic palette.</div>
        <div class="theme-grid">
          ${themes.map(t => `
            <div class="theme-card ${t.id === currentTheme ? 'active' : ''}" data-theme="${t.id}">
              <div class="theme-preview" style="background: ${t.bg}">
                <div class="theme-preview-dots">
                  ${t.dots.map(d => `<span class="theme-dot" style="background: ${d}"></span>`).join('')}
                </div>
                <div style="height: 3px; width: 40%; background: ${t.accent}; border-radius: 2px;"></div>
              </div>
              <div class="theme-card-name">${t.name}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentEl.querySelectorAll('.theme-card').forEach((card) => {
        card.addEventListener('click', () => {
          const t = card.getAttribute('data-theme');
          document.documentElement.setAttribute('data-theme', t);
          try {
            localStorage.setItem('moonos-theme', t);
          } catch (e) {}
          Notify.show(`Theme changed to ${t}`, 'success');
          renderAppearance();
        });
      });
    }

    function renderWallpaper() {
      const currentWp = document.documentElement.getAttribute('data-wp') || 'default';
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'luna';

      const wallpapers = [
        { id: 'default', name: 'Default Gradient' },
        { id: 'alt1', name: 'Radial Glow Style' },
        { id: 'alt2', name: 'Linear Dark Flow' }
      ];

      contentEl.innerHTML = `
        <div class="settings-section-title">Wallpaper Selection</div>
        <div class="settings-section-desc">Select a background gradient for the active theme (${currentTheme}).</div>
        <div class="wallpaper-grid">
          ${wallpapers.map(w => `
            <div class="wallpaper-card ${w.id === currentWp ? 'active' : ''}" data-wp="${w.id}">
              <div class="wallpaper-thumb" style="background: var(--wallpaper-base)"></div>
              <div class="wallpaper-card-name">${w.name}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentEl.querySelectorAll('.wallpaper-card').forEach((card) => {
        card.addEventListener('click', () => {
          const wp = card.getAttribute('data-wp');
          if (wp === 'default') {
            document.documentElement.removeAttribute('data-wp');
          } else {
            document.documentElement.setAttribute('data-wp', wp);
          }
          try {
            localStorage.setItem('moonos-wp', wp);
          } catch (e) {}
          Notify.show('Wallpaper updated', 'success');
          renderWallpaper();
        });
      });
    }

    function renderAbout() {
      contentEl.innerHTML = `
        <div class="about-box">
          <div class="about-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <div class="about-title">moonOS 1.0</div>
          <div class="about-sub">Handmade with care by ashu for Hack Club</div>
          <div class="about-specs">
            <div>Kernel: 6.9.1-moon #1 SMP x86_64</div>
            <div>Window Manager: moonwm 1.0</div>
            <div>Virtual Filesystem: 100% in-memory / localStorage</div>
            <div>Zero external runtime dependencies</div>
          </div>
        </div>
      `;
    }

    container.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    switchTab(initialTab);
  }

  return {
    open
  };
})();
