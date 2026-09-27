// settings.js - system settings app for appearance (planet themes) & system info

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
      } else if (tabName === 'about') {
        renderAbout();
      }
    }

    function renderAppearance() {
      const current = document.documentElement.getAttribute('data-theme') || 'moon';

      const themes = [
        { id: 'moon', name: 'Moon', desc: 'Silver lunar glow, calm and focused.' },
        { id: 'mars', name: 'Mars', desc: 'Warm red desert energy.' },
        { id: 'earth', name: 'Earth', desc: 'Fresh blue-green living vibe.' },
        { id: 'saturn', name: 'Saturn', desc: 'Golden ringed elegance.' }
      ];

      const soundOn = window.ThemeFX ? window.ThemeFX.isSoundOn() : true;

      contentEl.innerHTML = `
        <div class="settings-section-title">Appearance</div>
        <div class="settings-section-desc">Pick a living planet theme &mdash; the desktop wallpaper animates and plays its own ambient sound.</div>
        <div class="theme-grid">
          ${themes.map(t => `
            <div class="theme-card ${t.id === current ? 'active' : ''}" data-theme="${t.id}">
              <div class="planet-preview">
                <img src="assets/themes/${t.id}.jpg" alt="${t.name} theme preview" loading="lazy">
                <span class="planet-live">Live</span>
              </div>
              <div class="theme-card-name">${t.name}</div>
              <div class="theme-card-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
        <div class="sound-row">
          <div class="sound-row-info">
            <div class="sound-row-title">Ambient sound</div>
            <div class="sound-row-desc">Each planet plays its own subtle space ambience.</div>
          </div>
          <button class="sound-toggle ${soundOn ? 'on' : ''}" id="sound-toggle" aria-label="Toggle ambient sound"></button>
        </div>
      `;

      contentEl.querySelectorAll('.theme-card').forEach((card) => {
        card.addEventListener('click', () => {
          const t = card.getAttribute('data-theme');
          document.documentElement.setAttribute('data-theme', t);
          try {
            localStorage.setItem('moonos-theme', t);
          } catch (e) {}
          if (window.ThemeFX) window.ThemeFX.apply(t);
          Notify.show('Theme applied: ' + t, 'success');
          renderAppearance();
        });
      });

      const soundToggle = contentEl.querySelector('#sound-toggle');
      if (soundToggle) {
        soundToggle.addEventListener('click', () => {
          const on = !soundToggle.classList.contains('on');
          soundToggle.classList.toggle('on', on);
          if (window.ThemeFX) window.ThemeFX.setSoundEnabled(on);
          Notify.show(on ? 'Ambient sound on' : 'Ambient sound off', 'success');
        });
      }
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
