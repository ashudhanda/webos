// panel.js - top panel, calendar, tray popups & context menus

const Panel = (function() {
  let activePopup = null;
  let calDate = new Date();

  function init() {
    setupClock();
    setupPopups();
    setupAppMenu();
    setupCalendar();
    setupDesktopContextMenu();
  }

  function setupClock() {
    const clockEl = document.getElementById('panel-clock');
    const lockTimeEl = document.getElementById('lock-time');
    const lockDateEl = document.getElementById('lock-date');
    const dtHoursEl = document.getElementById('desktop-clock-hours');
    const dtMinsEl = document.getElementById('desktop-clock-mins');
    const dtDateEl = document.getElementById('desktop-clock-date');

    function update() {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const dayStr = days[now.getDay()];
      const monthStr = months[now.getMonth()];
      const dateNum = now.getDate();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      // exact format requested: ddd MMM D, HH:MM
      if (clockEl) {
        clockEl.textContent = `${dayStr} ${monthStr} ${dateNum}, ${hours}:${mins}`;
      }

      if (lockTimeEl) {
        lockTimeEl.textContent = `${hours}:${mins}`;
      }
      if (lockDateEl) {
        lockDateEl.textContent = `${fullDays[now.getDay()]}, ${monthStr} ${dateNum}`;
      }

      // Desktop Clock Widget: Line 1 HH:MM (24-hr), Line 2 "Thu, 27 Aug"
      if (dtHoursEl) dtHoursEl.textContent = hours;
      if (dtMinsEl) dtMinsEl.textContent = mins;
      if (dtDateEl) {
        dtDateEl.textContent = `${dayStr}, ${dateNum} ${monthStr}`;
      }
    }

    update();
    setInterval(update, 1000);
  }

  function togglePopup(popupEl, triggerBtn) {
    if (activePopup === popupEl) {
      closeAllPopups();
      return;
    }

    closeAllPopups();
    popupEl.classList.remove('hidden');
    if (triggerBtn) triggerBtn.classList.add('active');
    activePopup = popupEl;
  }

  function closeAllPopups() {
    const popups = document.querySelectorAll('.panel-popup, .ctx-menu');
    popups.forEach(p => p.classList.add('hidden'));

    const btns = document.querySelectorAll('.panel-btn');
    btns.forEach(b => b.classList.remove('active'));

    activePopup = null;
  }

  function setupPopups() {
    const menuBtn = document.getElementById('panel-menu-btn');
    const menuPopup = document.getElementById('app-menu-popup');

    const clockBtn = document.getElementById('panel-clock-btn');
    const calPopup = document.getElementById('calendar-popup');

    const wifiBtn = document.getElementById('tray-wifi-btn');
    const wifiPopup = document.getElementById('wifi-popup');

    const volBtn = document.getElementById('tray-volume-btn');
    const volPopup = document.getElementById('volume-popup');
    const volSlider = document.getElementById('volume-slider');
    const volVal = document.getElementById('volume-val');

    const batBtn = document.getElementById('tray-battery-btn');
    const batPopup = document.getElementById('battery-popup');

    const powerBtn = document.getElementById('tray-power-btn');
    const powerPopup = document.getElementById('power-popup');

    if (menuBtn && menuPopup) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup(menuPopup, menuBtn);
      });
    }

    if (clockBtn && calPopup) {
      clockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calDate = new Date();
        renderCalendar();
        togglePopup(calPopup, clockBtn);
      });
    }

    if (wifiBtn && wifiPopup) {
      wifiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup(wifiPopup, wifiBtn);
      });
    }

    if (volBtn && volPopup) {
      volBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup(volPopup, volBtn);
      });
    }

    if (volSlider && volVal) {
      volSlider.addEventListener('input', (e) => {
        volVal.textContent = e.target.value + '%';
      });
    }

    if (batBtn && batPopup) {
      batBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup(batPopup, batBtn);
      });
    }

    if (powerBtn && powerPopup) {
      powerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup(powerPopup, powerBtn);
      });
    }

    const sessionLockBtn = document.getElementById('session-lock-btn');
    if (sessionLockBtn) {
      sessionLockBtn.addEventListener('click', () => {
        closeAllPopups();
        Boot.lock();
      });
    }

    const sessionRebootBtn = document.getElementById('session-reboot-btn');
    if (sessionRebootBtn) {
      sessionRebootBtn.addEventListener('click', () => {
        closeAllPopups();
        Boot.restart();
      });
    }

    const menuLockBtn = document.getElementById('menu-lock-btn');
    if (menuLockBtn) {
      menuLockBtn.addEventListener('click', () => {
        closeAllPopups();
        Boot.lock();
      });
    }

    // close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.panel-popup') && !e.target.closest('.panel-btn') && !e.target.closest('.ctx-menu')) {
        closeAllPopups();
      }
    });
  }

  function setupAppMenu() {
    document.querySelectorAll('.menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        const appName = item.getAttribute('data-launch');
        closeAllPopups();
        Apps.launch(appName);
      });
    });
  }

  function setupCalendar() {
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calDate.setMonth(calDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calDate.setMonth(calDate.getMonth() + 1);
        renderCalendar();
      });
    }
  }

  function renderCalendar() {
    const monthTitle = document.getElementById('cal-month-title');
    const grid = document.getElementById('cal-days-grid');
    if (!monthTitle || !grid) return;

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthTitle.textContent = `${months[calDate.getMonth()]} ${calDate.getFullYear()}`;

    grid.innerHTML = '';

    // headers
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    days.forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-day-head';
      h.textContent = d;
      grid.appendChild(h);
    });

    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // leading days from prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.textContent = prevMonthDays - i;
      grid.appendChild(cell);
    }

    // current month days
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (isCurrentMonth && day === today.getDate()) {
        cell.classList.add('today');
      }
      cell.textContent = day;
      grid.appendChild(cell);
    }

    // trailing days to fill 35 or 42 grid cells
    const totalRendered = firstDayIndex + totalDays;
    const remaining = totalRendered <= 35 ? 35 - totalRendered : 42 - totalRendered;
    for (let day = 1; day <= remaining; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.textContent = day;
      grid.appendChild(cell);
    }
  }

  function setupDesktopContextMenu() {
    const desktopEnv = document.getElementById('desktop-env');
    const ctxMenu = document.getElementById('desktop-ctx-menu');

    if (!desktopEnv || !ctxMenu) return;

    desktopEnv.addEventListener('contextmenu', (e) => {
      // ignore right click on windows or inside apps
      if (e.target.closest('.os-window') || e.target.closest('.top-panel') || e.target.closest('.panel-popup')) {
        return;
      }
      e.preventDefault();
      closeAllPopups();

      const x = Math.min(e.clientX, window.innerWidth - 170);
      const y = Math.min(e.clientY, window.innerHeight - 130);

      ctxMenu.style.left = `${x}px`;
      ctxMenu.style.top = `${y}px`;
      ctxMenu.classList.remove('hidden');
      activePopup = ctxMenu;
    });

    ctxMenu.querySelectorAll('.ctx-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        closeAllPopups();

        if (action === 'ctx-open-terminal') {
          Apps.launch('terminal');
        } else if (action === 'ctx-change-wallpaper') {
          Apps.launch('settings', { tab: 'wallpaper' });
        } else if (action === 'ctx-about') {
          Apps.launch('settings', { tab: 'about' });
        }
      });
    });
  }

  return {
    init,
    closeAllPopups
  };
})();


