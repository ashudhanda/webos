// calendar.js - month calendar with events. click a day to see/add
// events; everything persists to localStorage. today is highlighted.

const CalendarApp = (function() {
  const STORAGE_KEY = 'moonos-calendar';
  const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const DOW = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

  function open() {
    WM.createWindow({
      id: 'calendar',
      title: 'Calendar',
      width: 560,
      height: 560,
      minWidth: 420,
      minHeight: 480,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      render: (bodyEl) => {
        initCalendar(bodyEl);
      }
    });
  }

  /**
   * Build the event-bucket key for a date: "YYYY-MM-DD" (e.g. "2026-09-29").
   * m is the Date getMonth() 0-based index, so +1 converts it to 1-12.
   * Keep this format stable: it doubles as the localStorage grouping key
   * and the data-key attribute on every calendar day cell.
   */
  function dateKey(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function initCalendar(container) {
    let events = {};
    try {
      events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      events = {};
    }

    const now = new Date();
    let viewY = now.getFullYear();
    let viewM = now.getMonth();
    let selected = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

    container.innerHTML = `
      <div class="cal-app">
        <div class="cal-app-header">
          <button class="cal-app-btn cal-app-prev" title="previous month">‹</button>
          <div class="cal-app-title">month year</div>
          <button class="cal-app-btn cal-app-today" title="go to today">today</button>
          <button class="cal-app-btn cal-app-next" title="next month">›</button>
        </div>
        <div class="cal-app-dow">${DOW.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="cal-app-grid"></div>
        <div class="cal-app-events">
          <div class="cal-app-events-title">events — <span class="cal-app-sel"></span></div>
          <div class="cal-app-events-list"></div>
          <form class="cal-app-add">
            <input type="text" class="cal-app-input" placeholder="new event…" maxlength="80" autocomplete="off">
            <input type="time" class="cal-app-time">
            <button type="submit" class="cal-app-btn">add</button>
          </form>
        </div>
      </div>
    `;

    const titleEl = container.querySelector('.cal-app-title');
    const gridEl = container.querySelector('.cal-app-grid');
    const listEl = container.querySelector('.cal-app-events-list');
    const selEl = container.querySelector('.cal-app-sel');
    const form = container.querySelector('.cal-app-add');
    const input = container.querySelector('.cal-app-input');
    const timeInput = container.querySelector('.cal-app-time');

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch (e) {}
    }

    function pretty(key) {
      const [y, m, d] = key.split('-').map(Number);
      return d + ' ' + MONTHS[m - 1] + ' ' + y;
    }

    function render() {
      titleEl.textContent = MONTHS[viewM] + ' ' + viewY;
      gridEl.innerHTML = '';

      // fixed 6x7 grid (42 cells): leading/trailing cells are filled with
      // the neighbouring month's days, styled as .other-month
      // monday-first offset: getDay() is sunday-first, so +6 %7 remaps
      // sunday->6, monday->0, ..., saturday->5
      const first = new Date(viewY, viewM, 1);
      let offset = (first.getDay() + 6) % 7;
      const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
      const daysInPrev = new Date(viewY, viewM, 0).getDate();
      const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

      const frag = document.createDocumentFragment();
      for (let i = 0; i < 42; i++) {
        const dayNum = i - offset + 1;
        const b = document.createElement('button');
        b.className = 'cal-app-day';
        let key;
        if (dayNum < 1) {
          const d = daysInPrev + dayNum;
          const pm = viewM === 0 ? 11 : viewM - 1;
          const py = viewM === 0 ? viewY - 1 : viewY;
          key = dateKey(py, pm, d);
          b.classList.add('other-month');
          b.innerHTML = `<span>${d}</span>`;
        } else if (dayNum > daysInMonth) {
          const d = dayNum - daysInMonth;
          const nm = viewM === 11 ? 0 : viewM + 1;
          const ny = viewM === 11 ? viewY + 1 : viewY;
          key = dateKey(ny, nm, d);
          b.classList.add('other-month');
          b.innerHTML = `<span>${d}</span>`;
        } else {
          key = dateKey(viewY, viewM, dayNum);
          b.innerHTML = `<span>${dayNum}</span>`;
          if (key === todayKey) b.classList.add('today');
        }
        if (key === selected) b.classList.add('selected');
        if (events[key] && events[key].length) {
          const dot = document.createElement('i');
          dot.className = 'cal-app-dot';
          b.appendChild(dot);
        }
        b.setAttribute('data-key', key);
        b.addEventListener('click', () => {
          selected = key;
          render();
        });
        frag.appendChild(b);
      }
      gridEl.appendChild(frag);
      renderEvents();
    }

    function renderEvents() {
      selEl.textContent = pretty(selected);
      const list = (events[selected] || []).slice().sort((a, b) =>
        (a.time || '99') < (b.time || '99') ? -1 : 1
      );
      if (!list.length) {
        listEl.innerHTML = '<div class="cal-app-empty">no events — add one below</div>';
        return;
      }
      listEl.innerHTML = '';
      list.forEach((ev) => {
        const row = document.createElement('div');
        row.className = 'cal-app-event';
        row.innerHTML = `
          ${ev.time ? `<span class="cal-app-event-time">${escapeHtml(ev.time)}</span>` : ''}
          <span class="cal-app-event-title">${escapeHtml(ev.title)}</span>
          <button class="cal-app-del" title="delete">×</button>
        `;
        row.querySelector('.cal-app-del').addEventListener('click', () => {
          events[selected] = events[selected].filter(e => e.id !== ev.id);
          if (!events[selected].length) delete events[selected];
          save();
          render();
        });
        listEl.appendChild(row);
      });
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      const ev = { id: 'ev-' + Date.now(), title, time: timeInput.value || '' };
      if (!events[selected]) events[selected] = [];
      events[selected].push(ev);
      save();
      input.value = '';
      timeInput.value = '';
      render();
      input.focus();
    });

    container.querySelector('.cal-app-prev').addEventListener('click', () => {
      viewM--;
      if (viewM < 0) { viewM = 11; viewY--; }
      render();
    });
    container.querySelector('.cal-app-next').addEventListener('click', () => {
      viewM++;
      if (viewM > 11) { viewM = 0; viewY++; }
      render();
    });
    container.querySelector('.cal-app-today').addEventListener('click', () => {
      viewY = now.getFullYear();
      viewM = now.getMonth();
      selected = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
      render();
    });

    render();
  }

  return {
    open
  };
})();
