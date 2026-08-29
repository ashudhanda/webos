const NotesApp = (function() {
  const STORAGE_KEY = 'moonos-notes';
  let notes = [];
  let topZ = 1;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        notes = JSON.parse(raw);
      }
    } catch (err) {
      notes = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  function layer() {
    let el = document.getElementById('notes-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'notes-layer';
      document.getElementById('desktop-env').appendChild(el);
    }
    return el;
  }

  function renderNote(note) {
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.id = note.id;
    el.style.left = note.x + 'px';
    el.style.top = note.y + 'px';
    el.style.zIndex = ++topZ;

    el.innerHTML = `
      <div class="note-grip">
        <button class="note-del" title="Delete">&times;</button>
      </div>
      <textarea class="note-text" placeholder="write something..." spellcheck="false"></textarea>
    `;

    layer().appendChild(el);

    const grip = el.querySelector('.note-grip');
    const del = el.querySelector('.note-del');
    const text = el.querySelector('.note-text');

    text.value = note.text;

    text.addEventListener('input', () => {
      note.text = text.value;
      save();
    });

    del.addEventListener('click', () => {
      el.remove();
      notes = notes.filter(n => n.id !== note.id);
      save();
      Notify.show('note deleted');
    });

    el.addEventListener('pointerdown', () => {
      el.style.zIndex = ++topZ;
    });

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;

    grip.addEventListener('pointerdown', (e) => {
      dragging = true;
      grip.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      origX = parseInt(el.style.left, 10) || 0;
      origY = parseInt(el.style.top, 10) || 0;
      e.preventDefault();
    });

    grip.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      let nx = origX + (e.clientX - startX);
      let ny = origY + (e.clientY - startY);
      nx = Math.max(0, Math.min(nx, window.innerWidth - el.offsetWidth));
      ny = Math.max(32, Math.min(ny, window.innerHeight - el.offsetHeight - 48));
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });

    function stopDrag() {
      if (!dragging) return;
      dragging = false;
      note.x = parseInt(el.style.left, 10) || 0;
      note.y = parseInt(el.style.top, 10) || 0;
      save();
    }

    grip.addEventListener('pointerup', stopDrag);
    grip.addEventListener('pointercancel', stopDrag);
  }

  function open() {
    const note = {
      id: 'note-' + Date.now(),
      x: 120 + (notes.length % 5) * 36,
      y: 90 + (notes.length % 5) * 36,
      text: ''
    };
    notes.push(note);
    renderNote(note);
    save();
  }

  function init() {
    load();
    notes.forEach(renderNote);
  }

  return {
    open,
    init
  };
})();