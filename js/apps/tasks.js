// tasks.js - a todo list. add with enter, check off, filter by
// all/active/done. persists to localStorage.

const TasksApp = (function() {
  const STORAGE_KEY = 'moonos-tasks';

  function open() {
    WM.createWindow({
      id: 'tasks',
      title: 'Tasks',
      width: 420,
      height: 520,
      minWidth: 340,
      minHeight: 400,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      render: (bodyEl) => {
        initTasks(bodyEl);
      }
    });
  }

  function initTasks(container) {
    let tasks = [];
    try {
      tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      tasks = [];
    }
    let filter = 'all';

    container.innerHTML = `
      <div class="tasks-app">
        <form class="tasks-add">
          <input type="text" class="tasks-input" placeholder="what needs doing?" maxlength="120" autocomplete="off">
          <button type="submit" class="tasks-add-btn">add</button>
        </form>
        <div class="tasks-filters">
          <button class="tasks-filter active" data-filter="all">all</button>
          <button class="tasks-filter" data-filter="active">active</button>
          <button class="tasks-filter" data-filter="done">done</button>
          <span class="tasks-count"></span>
        </div>
        <div class="tasks-list"></div>
        <button class="tasks-clear">clear completed</button>
      </div>
    `;

    const listEl = container.querySelector('.tasks-list');
    const input = container.querySelector('.tasks-input');
    const countEl = container.querySelector('.tasks-count');
    const form = container.querySelector('.tasks-add');

    function save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {}
    }

    // escapeHtml: task text is user input and rows are built with innerHTML,
    // so a task like "<img onerror=...>" would run code. Escape first.
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function visible() {
      if (filter === 'active') return tasks.filter(t => !t.done);
      if (filter === 'done') return tasks.filter(t => t.done);
      return tasks;
    }

    function render() {
      const items = visible();
      const activeCount = tasks.filter(t => !t.done).length;
      countEl.textContent = activeCount === 1 ? '1 left' : activeCount + ' left';

      container.querySelectorAll('.tasks-filter').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-filter') === filter);
      });

      const clearBtn = container.querySelector('.tasks-clear');
      clearBtn.style.display = tasks.some(t => t.done) ? '' : 'none';

      if (!items.length) {
        listEl.innerHTML = `<div class="tasks-empty">${
          filter === 'done' ? 'nothing done yet' :
          filter === 'active' ? 'all clear 🎉' : 'no tasks — add one above'
        }</div>`;
        return;
      }

      listEl.innerHTML = '';
      items.forEach((t) => {
        const row = document.createElement('div');
        row.className = 'task-row' + (t.done ? ' done' : '');
        row.innerHTML = `
          <button class="task-check" title="toggle done">${t.done ? '✓' : ''}</button>
          <span class="task-text">${escapeHtml(t.text)}</span>
          <button class="task-del" title="delete">×</button>
        `;
        row.querySelector('.task-check').addEventListener('click', () => {
          t.done = !t.done;
          save();
          render();
        });
        row.querySelector('.task-del').addEventListener('click', () => {
          tasks = tasks.filter(x => x.id !== t.id);
          save();
          render();
        });
        listEl.appendChild(row);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      tasks.unshift({ id: 't-' + Date.now(), text, done: false });
      save();
      input.value = '';
      render();
      input.focus();
    });

    container.querySelectorAll('.tasks-filter').forEach((b) => {
      b.addEventListener('click', () => {
        filter = b.getAttribute('data-filter');
        render();
      });
    });

    container.querySelector('.tasks-clear').addEventListener('click', () => {
      tasks = tasks.filter(t => !t.done);
      save();
      render();
    });

    render();
    setTimeout(() => input.focus(), 50);
  }

  return {
    open
  };
})();
