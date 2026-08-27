// terminal.js - moonterm terminal emulator with bash commands & tab completion

const TerminalApp = (function() {
  const COMMANDS = [
    'help', 'ls', 'cd', 'pwd', 'cat', 'echo', 'touch', 'mkdir', 'rm',
    'clear', 'whoami', 'hostname', 'date', 'uname', 'history', 'neofetch',
    'theme', 'open', 'sudo', 'apt', 'vim', 'exit'
  ];

  function open() {
    WM.createWindow({
      id: 'terminal',
      title: 'Terminal - ashu@moonos:~',
      width: 640,
      height: 400,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
      render: (bodyEl, winObj) => {
        initTerminal(bodyEl, winObj);
      }
    });
  }

  function initTerminal(container, winObj) {
    let cwd = '/home/ashu';
    const history = [];
    let historyIdx = -1;
    let lastTabTime = 0;

    container.innerHTML = `
      <div class="terminal-app" tabindex="0">
        <div class="terminal-output">
          <div class="terminal-welcome">moonOS 1.0 (tty1)<br/>type 'help' to see what you can do</div>
        </div>
        <div class="terminal-prompt-row">
          <span class="term-user">ashu@moonos</span><span class="term-colon">:</span><span class="term-path">~</span><span class="term-dollar">$</span>
          <div class="term-input-wrapper">
            <input type="text" class="term-input" spellcheck="false" autocomplete="off" />
          </div>
        </div>
      </div>
    `;

    const appEl = container.querySelector('.terminal-app');
    const outputEl = container.querySelector('.terminal-output');
    const pathEl = container.querySelector('.term-path');
    const inputEl = container.querySelector('.term-input');

    function getShortPath(p) {
      if (p === '/home/ashu') return '~';
      if (p.startsWith('/home/ashu/')) return '~/' + p.slice('/home/ashu/'.length);
      return p;
    }

    function updatePrompt() {
      const shortP = getShortPath(cwd);
      pathEl.textContent = shortP;
      WM.setWindowTitle(winObj.id, `Terminal - ashu@moonos:${shortP}`);
    }

    function print(html, isRaw = false) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      if (isRaw) {
        line.innerHTML = html;
      } else {
        line.textContent = html;
      }
      outputEl.appendChild(line);
      appEl.scrollTop = appEl.scrollHeight;
    }

    function printPromptEcho(cmdText) {
      const line = document.createElement('div');
      line.className = 'terminal-prompt-row';
      line.innerHTML = `
        <span class="term-user">ashu@moonos</span><span class="term-colon">:</span><span class="term-path">${getShortPath(cwd)}</span><span class="term-dollar">$</span>
        <span>${escapeHtml(cmdText)}</span>
      `;
      outputEl.appendChild(line);
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Tab Completion
    function handleTab() {
      const val = inputEl.value;
      const cursor = inputEl.selectionStart;
      const textBefore = val.slice(0, cursor);
      const parts = textBefore.split(' ');

      let candidates = [];

      if (parts.length === 1) {
        // complete command names
        const prefix = parts[0];
        candidates = COMMANDS.filter(c => c.startsWith(prefix));
      } else {
        // complete file or directory paths
        const lastPart = parts[parts.length - 1];
        let searchDir = cwd;
        let filePrefix = lastPart;

        if (lastPart.includes('/')) {
          const slashIdx = lastPart.lastIndexOf('/');
          const dirPart = lastPart.slice(0, slashIdx) || '/';
          filePrefix = lastPart.slice(slashIdx + 1);
          searchDir = FS.resolve(dirPart, cwd);
        }

        try {
          if (FS.isDir(searchDir)) {
            const entries = FS.ls(searchDir);
            candidates = entries
              .map(e => e.name + (e.type === 'dir' ? '/' : ''))
              .filter(name => name.startsWith(filePrefix));
          }
        } catch (e) {
          // ignore
        }
      }

      if (candidates.length === 1) {
        // complete single match
        const match = candidates[0];
        const lastWord = parts[parts.length - 1];
        const completed = val.slice(0, cursor - lastWord.length) + match + (match.endsWith('/') ? '' : ' ') + val.slice(cursor);
        inputEl.value = completed;
      } else if (candidates.length > 1) {
        // find longest common prefix
        const lcp = getLCP(candidates);
        const lastWord = parts[parts.length - 1];

        if (lcp.length > lastWord.length) {
          inputEl.value = val.slice(0, cursor - lastWord.length) + lcp + val.slice(cursor);
        } else {
          // double tab prints options
          const now = Date.now();
          if (now - lastTabTime < 500) {
            printPromptEcho(inputEl.value);
            print(candidates.join('  '));
          }
        }
      }

      lastTabTime = Date.now();
    }

    function getLCP(arr) {
      if (!arr.length) return '';
      let prefix = arr[0];
      for (let i = 1; i < arr.length; i++) {
        while (!arr[i].startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
          if (!prefix) return '';
        }
      }
      return prefix;
    }

    function executeCommand(raw) {
      const trimmed = raw.trim();
      printPromptEcho(raw);

      if (!trimmed) {
        appEl.scrollTop = appEl.scrollHeight;
        return;
      }

      history.push(raw);
      historyIdx = history.length;

      const tokens = trimmed.split(' ').filter(Boolean);
      const cmd = tokens[0];
      const args = tokens.slice(1);

      switch (cmd) {
        case 'help': {
          print(`
<div class="help-grid">
  <div class="help-cmd">help</div><div class="help-desc">show this list of commands</div>
  <div class="help-cmd">ls [path]</div><div class="help-desc">list directory contents</div>
  <div class="help-cmd">cd [path]</div><div class="help-desc">change current working directory</div>
  <div class="help-cmd">pwd</div><div class="help-desc">print current working directory</div>
  <div class="help-cmd">cat &lt;file&gt;</div><div class="help-desc">display file contents</div>
  <div class="help-cmd">echo &lt;text&gt;</div><div class="help-desc">print text to terminal</div>
  <div class="help-cmd">touch &lt;file&gt;</div><div class="help-desc">create an empty file</div>
  <div class="help-cmd">mkdir &lt;dir&gt;</div><div class="help-desc">create a new directory</div>
  <div class="help-cmd">rm &lt;file&gt;</div><div class="help-desc">remove a file</div>
  <div class="help-cmd">clear</div><div class="help-desc">clear terminal display</div>
  <div class="help-cmd">whoami</div><div class="help-desc">print current logged in user</div>
  <div class="help-cmd">hostname</div><div class="help-desc">print system hostname</div>
  <div class="help-cmd">date</div><div class="help-desc">print current system date &amp; time</div>
  <div class="help-cmd">uname -a</div><div class="help-desc">print kernel and system build info</div>
  <div class="help-cmd">history</div><div class="help-desc">list command history</div>
  <div class="help-cmd">neofetch</div><div class="help-desc">display system info &amp; ASCII logo</div>
  <div class="help-cmd">theme [name]</div><div class="help-desc">list or switch OS theme</div>
  <div class="help-cmd">open &lt;app|file&gt;</div><div class="help-desc">launch app or open file in editor</div>
  <div class="help-cmd">apt install &lt;x&gt;</div><div class="help-desc">install a package / app</div>
  <div class="help-cmd">sudo &lt;cmd&gt;</div><div class="help-desc">execute command as root</div>
  <div class="help-cmd">vim</div><div class="help-desc">open the text editor</div>
  <div class="help-cmd">exit</div><div class="help-desc">lock the desktop session</div>
</div>
          `, true);
          break;
        }

        case 'ls': {
          const target = args[0] || '.';
          try {
            const entries = FS.ls(target, cwd);
            if (entries.length === 0) {
              // empty folder produces no output
            } else {
              const formatted = entries.map(e => {
                if (e.type === 'dir') {
                  return `<span class="term-dir">${escapeHtml(e.name)}/</span>`;
                }
                return `<span class="term-file">${escapeHtml(e.name)}</span>`;
              }).join('  ');
              print(formatted, true);
            }
          } catch (err) {
            print(`<span class="term-error">ls: cannot access '${escapeHtml(target)}': ${err.message}</span>`, true);
          }
          break;
        }

        case 'cd': {
          const target = args[0] || '~';
          const resolved = FS.resolve(target, cwd);
          if (!FS.exists(resolved)) {
            print(`<span class="term-error">cd: no such file or directory: ${escapeHtml(target)}</span>`, true);
          } else if (!FS.isDir(resolved)) {
            print(`<span class="term-error">cd: not a directory: ${escapeHtml(target)}</span>`, true);
          } else {
            cwd = resolved;
            updatePrompt();
          }
          break;
        }

        case 'pwd': {
          print(cwd);
          break;
        }

        case 'cat': {
          if (!args[0]) {
            print('<span class="term-error">cat: missing file argument</span>', true);
            break;
          }
          try {
            const content = FS.read(args[0], cwd);
            print(escapeHtml(content));
          } catch (err) {
            print(`<span class="term-error">cat: ${escapeHtml(args[0])}: ${err.message}</span>`, true);
          }
          break;
        }

        case 'echo': {
          const fullText = args.join(' ');
          // check for simple redirect like echo "hi" > file.txt
          if (fullText.includes('>')) {
            const isAppend = fullText.includes('>>');
            const parts = isAppend ? fullText.split('>>') : fullText.split('>');
            const textToSave = parts[0].trim().replace(/^["']|["']$/g, '');
            const targetFile = parts[1].trim();

            if (targetFile) {
              try {
                let finalContent = textToSave;
                if (isAppend && FS.exists(targetFile, cwd)) {
                  finalContent = FS.read(targetFile, cwd) + '\n' + textToSave;
                }
                FS.write(targetFile, finalContent, cwd);
              } catch (err) {
                print(`<span class="term-error">echo: ${err.message}</span>`, true);
              }
              break;
            }
          }
          print(fullText.replace(/^["']|["']$/g, ''));
          break;
        }

        case 'touch': {
          if (!args[0]) {
            print('<span class="term-error">touch: missing file operand</span>', true);
            break;
          }
          try {
            if (!FS.exists(args[0], cwd)) {
              FS.write(args[0], '', cwd);
            }
          } catch (err) {
            print(`<span class="term-error">touch: ${err.message}</span>`, true);
          }
          break;
        }

        case 'mkdir': {
          if (!args[0]) {
            print('<span class="term-error">mkdir: missing operand</span>', true);
            break;
          }
          try {
            FS.mkdir(args[0], cwd);
          } catch (err) {
            print(`<span class="term-error">mkdir: cannot create directory '${escapeHtml(args[0])}': ${err.message}</span>`, true);
          }
          break;
        }

        case 'rm': {
          if (!args[0]) {
            print('<span class="term-error">rm: missing operand</span>', true);
            break;
          }
          try {
            FS.rm(args[0], cwd);
          } catch (err) {
            print(`<span class="term-error">rm: ${err.message}</span>`, true);
          }
          break;
        }

        case 'clear': {
          outputEl.innerHTML = '';
          break;
        }

        case 'whoami': {
          print('ashu');
          break;
        }

        case 'hostname': {
          print('moonos');
          break;
        }

        case 'date': {
          print(new Date().toString());
          break;
        }

        case 'uname': {
          if (args[0] === '-a' || args.length === 0) {
            print('Linux moonos 6.9.1-moon #1 SMP x86_64 GNU/Linux');
          } else {
            print('Linux');
          }
          break;
        }

        case 'history': {
          history.forEach((h, i) => {
            print(`  ${i + 1}  ${escapeHtml(h)}`, true);
          });
          break;
        }

        case 'neofetch': {
          const currTheme = document.documentElement.getAttribute('data-theme') || 'luna';
          const asciiMoon = `    ___
 .-'   '-.
/       .'
|      |
\\       '.
 '-. __.-'`;

          const infoHtml = `
<div class="neofetch-container">
  <pre class="neofetch-ascii">${escapeHtml(asciiMoon)}</pre>
  <div class="neofetch-info">
    <div class="neofetch-title">ashu@moonos</div>
    <div class="neofetch-divider">-----------</div>
    <div><span class="neofetch-key">OS:</span> moonOS 1.0 x86_64</div>
    <div><span class="neofetch-key">Host:</span> Web Browser</div>
    <div><span class="neofetch-key">Kernel:</span> 6.9.1-moon</div>
    <div><span class="neofetch-key">WM:</span> moonwm</div>
    <div><span class="neofetch-key">Shell:</span> ash 1.0</div>
    <div><span class="neofetch-key">Theme:</span> ${currTheme}</div>
    <div><span class="neofetch-key">Terminal:</span> moonterm</div>
  </div>
</div>
          `;
          print(infoHtml, true);
          break;
        }

        case 'theme': {
          const themes = ['luna', 'nord', 'gruvbox', 'everforest'];
          if (!args[0]) {
            const current = document.documentElement.getAttribute('data-theme') || 'luna';
            print(`available themes: ${themes.join(', ')}\ncurrent theme: ${current}`);
          } else {
            const targetTheme = args[0].toLowerCase();
            if (themes.includes(targetTheme)) {
              document.documentElement.setAttribute('data-theme', targetTheme);
              try {
                localStorage.setItem('moonos-theme', targetTheme);
              } catch (e) {}
              Notify.show(`theme set to ${targetTheme}`, 'success');
              print(`switched theme to ${targetTheme}`);
            } else {
              print(`<span class="term-error">theme: unknown theme '${escapeHtml(targetTheme)}'. Choose from: ${themes.join(', ')}</span>`, true);
            }
          }
          break;
        }

        case 'open': {
          if (!args[0]) {
            print('<span class="term-error">open: specify an app or file (terminal, files, editor, calc, settings, monitor)</span>', true);
            break;
          }
          const target = args[0].toLowerCase();
          if (['terminal', 'files', 'editor', 'calc', 'settings', 'monitor'].includes(target)) {
            Apps.launch(target);
          } else {
            // check if it's a file
            try {
              const resolved = FS.resolve(args[0], cwd);
              if (FS.exists(resolved) && !FS.isDir(resolved)) {
                Apps.launch('editor', { path: resolved });
              } else {
                print(`<span class="term-error">open: cannot open '${escapeHtml(args[0])}'</span>`, true);
              }
            } catch (e) {
              print(`<span class="term-error">open: ${e.message}</span>`, true);
            }
          }
          break;
        }

        case 'sudo': {
          print('ashu is not in the sudoers file. This incident will be reported.');
          break;
        }

        case 'apt': {
          if (args[0] === 'install' && args[1]) {
            const pkg = args[1];
            print(`Reading package lists... Done`);
            inputEl.disabled = true;

            setTimeout(() => {
              print(`Building dependency tree... Done`);
            }, 500);

            setTimeout(() => {
              print(`Unpacking ${escapeHtml(pkg)} (1.0.0)...`);
            }, 1000);

            setTimeout(() => {
              inputEl.disabled = false;
              inputEl.focus();

              if (['terminal', 'files', 'editor', 'calc', 'settings', 'monitor'].includes(pkg.toLowerCase())) {
                print(`Setting up ${escapeHtml(pkg)}... Done.`);
                Notify.show(`Installed ${pkg}`, 'success');
                Apps.launch(pkg.toLowerCase());
              } else {
                print(`done. ${escapeHtml(pkg)} is probably not real, but it's installed now.`);
                Notify.show(`Installed ${pkg}`, 'info');
              }
            }, 1500);
          } else {
            print('usage: apt install &lt;package&gt;', true);
          }
          break;
        }

        case 'vim': {
          print('no. opening the normal editor instead.');
          Apps.launch('editor');
          break;
        }

        case 'exit': {
          Boot.lock();
          break;
        }

        default: {
          print(`<span class="term-error">${escapeHtml(cmd)}: command not found. Type 'help' for available commands.</span>`, true);
          break;
        }
      }

      appEl.scrollTop = appEl.scrollHeight;
    }

    // Input and keyboard events
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value;
        inputEl.value = '';
        executeCommand(val);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleTab();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0 && historyIdx > 0) {
          historyIdx--;
          inputEl.value = history[historyIdx];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx < history.length - 1) {
          historyIdx++;
          inputEl.value = history[historyIdx];
        } else {
          historyIdx = history.length;
          inputEl.value = '';
        }
      } else if (e.ctrlKey && e.key === 'c') {
        printPromptEcho(inputEl.value + '^C');
        inputEl.value = '';
      } else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        outputEl.innerHTML = '';
      }
    });

    // focus input when clicking terminal
    appEl.addEventListener('click', () => {
      inputEl.focus();
    });

    setTimeout(() => {
      inputEl.focus();
    }, 50);
  }

  return {
    open
  };
})();
