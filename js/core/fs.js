// fs.js - virtual file system with localstorage persistence

const FS = (function() {
  const STORAGE_KEY = 'moonos-fs';
  const HOME_PATH = '/home/ashu';

  // default initial file system seed
  const defaultTree = {
    type: 'dir',
    children: {
      home: {
        type: 'dir',
        children: {
          ashu: {
            type: 'dir',
            children: {
              'readme.txt': {
                type: 'file',
                content: 'welcome to moonOS 1.0!\n\na lightweight desktop operating system built for the browser.\nuse the top panel to launch apps or explore the terminal.\ntype help in the terminal to see available commands.'
              },
              'Documents': {
                type: 'dir',
                children: {
                  'notes.txt': {
                    type: 'file',
                    content: 'hack club project notes:\n- make the terminal feel real\n- keep the window manager snappy\n- test all four themes before submitting'
                  },
                  'todo.txt': {
                    type: 'file',
                    content: '[x] implement window drag\n[x] add tab completion to terminal\n[ ] drink some water\n[ ] share with friends'
                  }
                }
              },
              'Pictures': {
                type: 'dir',
                children: {}
              },
              'Projects': {
                type: 'dir',
                children: {
                  'moonos.txt': {
                    type: 'file',
                    content: "you're looking at it :)"
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  let root = null;

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        root = JSON.parse(saved);
      } else {
        root = JSON.parse(JSON.stringify(defaultTree));
        save();
      }
    } catch (e) {
      // fallback if localstorage is full or blocked
      root = JSON.parse(JSON.stringify(defaultTree));
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch (e) {
      // silently ignore quota errors
    }
  }

  // normalize and resolve relative/absolute paths
  function resolve(pathStr, cwd = HOME_PATH) {
    if (!pathStr || pathStr.trim() === '') return cwd;

    let p = pathStr.trim();
    if (p.startsWith('~')) {
      p = HOME_PATH + p.slice(1);
    } else if (!p.startsWith('/')) {
      p = cwd + '/' + p;
    }

    const segments = p.split('/').filter(Boolean);
    const resolved = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        if (resolved.length > 0) resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/');
  }

  // traverse tree down to target node
  function getNode(pathStr, cwd = HOME_PATH) {
    const absPath = resolve(pathStr, cwd);
    if (absPath === '/') return { node: root, parent: null, name: '', path: '/' };

    const parts = absPath.split('/').filter(Boolean);
    let curr = root;
    let parent = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!curr || curr.type !== 'dir' || !curr.children) return null;
      parent = curr;
      curr = curr.children[part];
      if (!curr) return null;
    }

    return { node: curr, parent: parent, name: parts[parts.length - 1], path: absPath };
  }

  function exists(pathStr, cwd = HOME_PATH) {
    return getNode(pathStr, cwd) !== null;
  }

  function isDir(pathStr, cwd = HOME_PATH) {
    const item = getNode(pathStr, cwd);
    return item ? item.node.type === 'dir' : false;
  }

  function ls(pathStr = '.', cwd = HOME_PATH) {
    const item = getNode(pathStr, cwd);
    if (!item) throw new Error('no such file or directory');
    if (item.node.type !== 'dir') return [item.name];

    const entries = [];
    for (const name in item.node.children) {
      const child = item.node.children[name];
      entries.push({
        name: name,
        type: child.type
      });
    }
    return entries.sort((a, b) => {
      // folders first, then alphabetical
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function read(pathStr, cwd = HOME_PATH) {
    const item = getNode(pathStr, cwd);
    if (!item) throw new Error('no such file or directory');
    if (item.node.type === 'dir') throw new Error('is a directory');
    return item.node.content || '';
  }

  function write(pathStr, content = '', cwd = HOME_PATH) {
    const absPath = resolve(pathStr, cwd);
    const parts = absPath.split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('cannot write to root');

    const fileName = parts.pop();
    const dirPath = '/' + parts.join('/');
    const parentItem = getNode(dirPath, '/');

    if (!parentItem || parentItem.node.type !== 'dir') {
      throw new Error('parent directory does not exist');
    }

    parentItem.node.children[fileName] = {
      type: 'file',
      content: content
    };

    save();
    return true;
  }

  function mkdir(pathStr, cwd = HOME_PATH) {
    const absPath = resolve(pathStr, cwd);
    const parts = absPath.split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('cannot create root');

    const dirName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentItem = getNode(parentPath, '/');

    if (!parentItem || parentItem.node.type !== 'dir') {
      throw new Error('parent directory does not exist');
    }

    if (parentItem.node.children[dirName]) {
      throw new Error('file or directory already exists');
    }

    parentItem.node.children[dirName] = {
      type: 'dir',
      children: {}
    };

    save();
    return true;
  }

  function rm(pathStr, cwd = HOME_PATH) {
    const item = getNode(pathStr, cwd);
    if (!item) throw new Error('no such file or directory');
    if (item.path === '/' || item.path === HOME_PATH) {
      throw new Error('cannot remove system directory');
    }

    if (item.node.type === 'dir') {
      // standard bash rm behavior for dirs
      throw new Error(item.name + ': is a directory');
    }

    delete item.parent.children[item.name];
    save();
    return true;
  }

  function rmdir(pathStr, cwd = HOME_PATH) {
    const item = getNode(pathStr, cwd);
    if (!item) throw new Error('no such file or directory');
    if (item.node.type !== 'dir') throw new Error('not a directory');
    if (item.path === '/' || item.path === HOME_PATH) throw new Error('cannot delete system path');

    delete item.parent.children[item.name];
    save();
    return true;
  }

  function rename(oldPathStr, newName, cwd = HOME_PATH) {
    const item = getNode(oldPathStr, cwd);
    if (!item) throw new Error('no such file or directory');
    if (!newName || newName.includes('/')) throw new Error('invalid name');
    if (item.parent.children[newName]) throw new Error('destination already exists');

    item.parent.children[newName] = item.node;
    delete item.parent.children[item.name];
    save();
    return true;
  }

  load();

  return {
    HOME_PATH,
    resolve,
    exists,
    isDir,
    ls,
    read,
    write,
    mkdir,
    rm,
    rmdir,
    rename
  };
})();
