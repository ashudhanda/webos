// editor.js - simple text editor with debounced autosaving to VFS

const EditorApp = (function() {
  function open(filePath = '/home/ashu/readme.txt') {
    const title = 'Text Editor - ' + filePath;
    WM.createWindow({
      id: 'editor',
      title: title,
      width: 580,
      height: 420,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      render: (bodyEl, winObj) => {
        initEditor(bodyEl, winObj, filePath);
      }
    });
  }

  function initEditor(container, winObj, filePath) {
    let currentPath = filePath;
    let initialContent = '';
    let saveTimeout = null;

    try {
      if (FS.exists(currentPath)) {
        initialContent = FS.read(currentPath);
      } else {
        // create file if missing
        FS.write(currentPath, '');
        initialContent = '';
      }
    } catch (e) {
      initialContent = '';
    }

    container.innerHTML = `
      <div class="editor-app">
        <textarea class="editor-textarea" spellcheck="false" placeholder="Start typing..."></textarea>
        <div class="editor-statusbar">
          <span class="editor-stat-info">Ln 1, Col 1</span>
          <span class="editor-status-state editor-status-saved">Saved</span>
        </div>
      </div>
    `;

    const textarea = container.querySelector('.editor-textarea');
    const statInfo = container.querySelector('.editor-stat-info');
    const stateEl = container.querySelector('.editor-status-state');

    textarea.value = initialContent;

    function updateCursorInfo() {
      const pos = textarea.selectionStart;
      const textBefore = textarea.value.slice(0, pos);
      const lines = textBefore.split('\n');
      const lineNum = lines.length;
      const colNum = lines[lines.length - 1].length + 1;
      statInfo.textContent = `Ln ${lineNum}, Col ${colNum}`;
    }

    function scheduleAutosave() {
      stateEl.textContent = 'Saving...';
      stateEl.className = 'editor-status-state editor-status-unsaved';

      if (saveTimeout) clearTimeout(saveTimeout);

      // autosave 500ms after typing stops
      saveTimeout = setTimeout(() => {
        try {
          FS.write(currentPath, textarea.value);
          stateEl.textContent = 'Saved';
          stateEl.className = 'editor-status-state editor-status-saved';
          Notify.show(`Saved ${currentPath.split('/').pop()}`, 'info');
        } catch (e) {
          stateEl.textContent = 'Save error';
          stateEl.className = 'editor-status-state editor-status-unsaved';
        }
      }, 500);
    }

    textarea.addEventListener('input', () => {
      updateCursorInfo();
      scheduleAutosave();
    });

    textarea.addEventListener('click', updateCursorInfo);
    textarea.addEventListener('keyup', updateCursorInfo);

    // tab key inserts 2 spaces instead of unfocusing
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        scheduleAutosave();
      }
    });

    setTimeout(() => {
      textarea.focus();
    }, 50);
  }

  return {
    open
  };
})();
