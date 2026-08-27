// files.js - file manager with sidebar, breadcrumbs, context menu & inline rename

const FilesApp = (function() {
  function open(initialPath = '/home/ashu') {
    WM.createWindow({
      id: 'files',
      title: 'Files - ' + initialPath,
      width: 620,
      height: 420,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      render: (bodyEl, winObj) => {
        initFiles(bodyEl, winObj, initialPath);
      }
    });
  }

  function initFiles(container, winObj, initialPath) {
    let currentPath = initialPath;
    let selectedItem = null;

    container.innerHTML = `
      <div class="files-app">
        <div class="files-sidebar">
          <div class="sidebar-title">Places</div>
          <button class="sidebar-item" data-path="/home/ashu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            <span>Home</span>
          </button>
          <button class="sidebar-item" data-path="/home/ashu/Documents">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Documents</span>
          </button>
          <button class="sidebar-item" data-path="/home/ashu/Pictures">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Pictures</span>
          </button>
          <button class="sidebar-item" data-path="/home/ashu/Projects">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span>Projects</span>
          </button>
        </div>

        <div class="files-main">
          <div class="files-toolbar">
            <button class="files-nav-btn btn-up" title="Parent Directory">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
            <div class="files-breadcrumb"></div>
          </div>
          <div class="files-content" tabindex="0"></div>
        </div>
      </div>
    `;

    const breadcrumbEl = container.querySelector('.files-breadcrumb');
    const contentEl = container.querySelector('.files-content');
    const upBtn = container.querySelector('.btn-up');
    const ctxMenu = document.getElementById('files-ctx-menu');

    function navigate(newPath) {
      if (!FS.exists(newPath) || !FS.isDir(newPath)) return;
      currentPath = FS.resolve(newPath, '/');
      WM.setWindowTitle(winObj.id, 'Files - ' + currentPath);
      renderSidebar();
      renderBreadcrumb();
      renderContent();
    }

    function renderSidebar() {
      container.querySelectorAll('.sidebar-item').forEach((item) => {
        const p = item.getAttribute('data-path');
        item.classList.toggle('active', p === currentPath);
      });
    }

    function renderBreadcrumb() {
      breadcrumbEl.innerHTML = '';
      const parts = currentPath.split('/').filter(Boolean);

      const rootSpan = document.createElement('span');
      rootSpan.className = 'breadcrumb-part';
      rootSpan.textContent = 'root';
      rootSpan.addEventListener('click', () => navigate('/'));
      breadcrumbEl.appendChild(rootSpan);

      let accumulated = '';
      parts.forEach((part) => {
        accumulated += '/' + part;
        const constPath = accumulated;

        const sep = document.createElement('span');
        sep.className = 'breadcrumb-sep';
        sep.textContent = '/';
        breadcrumbEl.appendChild(sep);

        const partSpan = document.createElement('span');
        partSpan.className = 'breadcrumb-part';
        partSpan.textContent = part;
        partSpan.addEventListener('click', () => navigate(constPath));
        breadcrumbEl.appendChild(partSpan);
      });
    }

    function renderContent() {
      contentEl.innerHTML = '';
      selectedItem = null;

      try {
        const items = FS.ls(currentPath);

        if (items.length === 0) {
          contentEl.innerHTML = `
            <div class="files-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span>Folder is empty</span>
            </div>
          `;
          return;
        }

        items.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'file-card';
          card.setAttribute('data-name', item.name);
          card.setAttribute('data-type', item.type);

          const iconSvg = item.type === 'dir'
            ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
            : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';

          card.innerHTML = `
            <div class="file-icon">${iconSvg}</div>
            <div class="file-name" title="${item.name}">${item.name}</div>
          `;

          // single click select
          card.addEventListener('click', (e) => {
            e.stopPropagation();
            contentEl.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedItem = item.name;
          });

          // double click action
          card.addEventListener('dblclick', () => {
            if (item.type === 'dir') {
              navigate(currentPath + (currentPath === '/' ? '' : '/') + item.name);
            } else {
              Apps.launch('editor', { path: currentPath + (currentPath === '/' ? '' : '/') + item.name });
            }
          });

          // item right click
          card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            contentEl.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedItem = item.name;
            showContextMenu(e.clientX, e.clientY, true);
          });

          contentEl.appendChild(card);
        });
      } catch (err) {
        contentEl.innerHTML = `<div class="files-empty"><span>${err.message}</span></div>`;
      }
    }

    // Up directory navigation
    upBtn.addEventListener('click', () => {
      if (currentPath === '/') return;
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      navigate('/' + parts.join('/'));
    });

    // Sidebar navigation
    container.querySelectorAll('.sidebar-item').forEach((item) => {
      item.addEventListener('click', () => {
        navigate(item.getAttribute('data-path'));
      });
    });

    // Canvas click deselects
    contentEl.addEventListener('click', () => {
      contentEl.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
      selectedItem = null;
    });

    // Canvas background right click
    contentEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.file-card')) return;
      e.preventDefault();
      selectedItem = null;
      contentEl.querySelectorAll('.file-card').forEach(c => c.classList.remove('selected'));
      showContextMenu(e.clientX, e.clientY, false);
    });

    function showContextMenu(clientX, clientY, hasItem) {
      if (!ctxMenu) return;
      Panel.closeAllPopups();

      const itemActions = ctxMenu.querySelectorAll('.item-action, .item-action-divider');
      itemActions.forEach(el => {
        el.style.display = hasItem ? 'flex' : 'none';
      });

      const x = Math.min(clientX, window.innerWidth - 170);
      const y = Math.min(clientY, window.innerHeight - 150);

      ctxMenu.style.left = `${x}px`;
      ctxMenu.style.top = `${y}px`;
      ctxMenu.classList.remove('hidden');

      // attach current handler
      ctxMenu.onclick = (e) => {
        const btn = e.target.closest('.ctx-item');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        ctxMenu.classList.add('hidden');

        if (action === 'files-new-file') {
          createNewFile();
        } else if (action === 'files-new-folder') {
          createNewFolder();
        } else if (action === 'files-rename' && selectedItem) {
          startInlineRename(selectedItem);
        } else if (action === 'files-delete' && selectedItem) {
          deleteItem(selectedItem);
        }
      };
    }

    function createNewFile() {
      let baseName = 'untitled.txt';
      let count = 1;
      while (FS.exists(currentPath + '/' + baseName)) {
        baseName = `untitled-${count}.txt`;
        count++;
      }
      try {
        FS.write(currentPath + '/' + baseName, '');
        renderContent();
        startInlineRename(baseName);
      } catch (e) {
        Notify.show(e.message, 'error');
      }
    }

    function createNewFolder() {
      let baseName = 'New Folder';
      let count = 1;
      while (FS.exists(currentPath + '/' + baseName)) {
        baseName = `New Folder (${count})`;
        count++;
      }
      try {
        FS.mkdir(currentPath + '/' + baseName);
        renderContent();
        startInlineRename(baseName);
      } catch (e) {
        Notify.show(e.message, 'error');
      }
    }

    function startInlineRename(oldName) {
      const card = contentEl.querySelector(`[data-name="${CSS.escape(oldName)}"]`);
      if (!card) return;

      const nameEl = card.querySelector('.file-name');
      if (!nameEl) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'file-rename-input';
      input.value = oldName;

      nameEl.replaceWith(input);
      input.focus();
      input.select();

      function commit() {
        const newName = input.value.trim();
        if (newName && newName !== oldName) {
          try {
            FS.rename(currentPath + '/' + oldName, newName);
          } catch (e) {
            Notify.show(e.message, 'error');
          }
        }
        renderContent();
      }

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          commit();
        } else if (e.key === 'Escape') {
          renderContent();
        }
      });
    }

    function deleteItem(name) {
      const itemPath = currentPath + '/' + name;
      try {
        if (FS.isDir(itemPath)) {
          FS.rmdir(itemPath);
        } else {
          FS.rm(itemPath);
        }
        renderContent();
      } catch (e) {
        Notify.show(e.message, 'error');
      }
    }

    navigate(initialPath);
  }

  return {
    open
  };
})();
