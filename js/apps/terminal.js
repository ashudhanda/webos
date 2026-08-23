(function () {
"use strict";
var store = NatureOS.store;
var applyTheme = NatureOS.applyTheme;
var THEMES = NatureOS.THEMES;
var getApps = NatureOS.getApps;
var notify = NatureOS.notify;
var formatTime = NatureOS.formatTime;
var wm = NatureOS.wm;
const TREE = [
  "        &&& &&  & &&",
  "     && &\\/&\\|& ()|/ @, &&",
  "     &\\/(/&/&||/& /_/)_&/_&",
  "  &() &\\/&|()|/&\\/ '%\" & ()",
  " &_\\_&&_\\ |& |&&/&__%_/_& &&",
  "&&   && & &| &| /& & % ()& /&&",
  " ()&_---()&\\&\\|&&-&&--%---()~",
  "         &&     \\|||",
  "                 |||",
  "                 |||",
  "                 |||",
  "           , -=-~  .-^- _",
];

const ANIMALS = [
  "🦊 Red fox — Vulpes vulpes — crepuscular, 12 vocalisations",
  "🦌 Roe deer — Capreolus capreolus — browses at dawn",
  "🦉 Tawny owl — Strix aluco — silent flight feathers",
  "🐿️ Red squirrel — Sciurus vulgaris — caches 3000 seeds/season",
  "🦡 European badger — Meles meles — digs multi-room setts",
  "🐗 Wild boar — Sus scrofa — rototills the understory",
  "🦇 Barbastelle bat — Barbastella barbastellus — whispering echolocation",
  "🐝 Forest bumblebee — Bombus sylvarum — pollinates 40 species",
  "🦔 Hedgehog — Erinaceus europaeus — 5000 spines",
  "🐺 Grey wolf — Canis lupus — 12 km territory howls",
];

const JOKES = [
  "Why do trees hate riddles? They get stumped.",
  "What did the beech say to the birch? Nothing, they just leaf each other alone.",
  "How do forests apologise? They turn over a new leaf.",
  "Why was the mushroom invited everywhere? Because he was a fungi.",
  "What is a tree's favourite drink? Root beer.",
  "Why did the pine tree get in trouble? It was being knotty.",
  "What did the owl say when it got a compliment? Owl be blushing.",
  "Why don't foxes use computers? Too many bugs in the woods.",
];

const BANNER = [
  "  ____                            ___  ____  ",
  " / ___|__ _ _ __   ___  _ __  _   / _ \\/ ___| ",
  "| |   / _` | '_ \\ / _ \\| '_ \\| | | | | \\___ \\ ",
  "| |__| (_| | | | | (_) | |_) | |_| | |_| |__) |",
  " \\____\\__,_|_| |_|\\___/| .__/ \\__, |\\___/____/ ",
  "                       |_|    |___/            ",
];

const terminalApp = {
  id: "terminal",
  name: "Terminal",
  icon: "🖥️",
  tagline: "Shell",
  keywords: ["terminal", "shell", "console", "command"],
  width: 720,
  height: 440,
  mount(body, win) {
    const term = document.createElement("div");
    term.className = "terminal";
    const out = document.createElement("div");
    out.className = "term-out";
    const line = document.createElement("div");
    line.className = "term-line";
    const prompt = document.createElement("span");
    prompt.className = "term-prompt";
    prompt.textContent = "forester@canopyos ~ %";
    const input = document.createElement("input");
    input.className = "term-input";
    input.spellcheck = false;
    input.autocomplete = "off";
    const caret = document.createElement("span");
    caret.className = "term-caret";
    line.appendChild(prompt);
    line.appendChild(input);
    line.appendChild(caret);
    term.appendChild(out);
    term.appendChild(line);
    body.appendChild(term);

    const history = [];
    let historyIndex = -1;

    function write(text, cls) {
      const div = document.createElement("div");
      if (cls) div.className = cls;
      div.textContent = text;
      out.appendChild(div);
      term.scrollTop = term.scrollHeight;
    }

    function writeLines(lines, cls) {
      lines.forEach((l) => write(l, cls));
    }

    const commands = {
      help() {
        writeLines([
          "Available commands:",
          "  help              show this list",
          "  about             about CanopyOS",
          "  whoami            current user",
          "  date              current date and time",
          "  echo [text]       print text",
          "  clear             clear the screen",
          "  theme [name]      forest | moss | autumn | night",
          "  apps              list installed applications",
          "  open [app]        launch an application",
          "  repo              project repository",
          "  banner            print the CanopyOS banner",
          "  forest            print ASCII tree art",
          "  animals           list forest animals",
          "  joke              random nature joke",
        ]);
      },
      about() {
        writeLines([
          "CanopyOS 1.0 (Evergreen)",
          "A forest-themed desktop environment written in plain HTML, CSS and JavaScript.",
          "No frameworks. No backend. Just leaves and pixels.",
        ]);
      },
      whoami() {
        write("forester");
      },
      date() {
        const now = new Date();
        write(now.toDateString() + "  " + formatTime(now, true));
      },
      echo(args) {
        write(args.join(" "));
      },
      clear() {
        out.innerHTML = "";
      },
      theme(args) {
        const name = (args[0] || "").toLowerCase();
        if (!name) {
          write("current theme: " + store.get("theme"));
          write("available: " + THEMES.map((t) => t.id).join(", "));
          return;
        }
        if (!THEMES.some((t) => t.id === name)) {
          write("theme: unknown theme '" + name + "'", "term-err");
          return;
        }
        applyTheme(name);
        write("theme set to " + name);
        notify("Theme changed", name, "🎨");
      },
      apps() {
        getApps().forEach((a) => write("  " + a.icon + "  " + a.id.padEnd(12) + a.name));
      },
      open(args) {
        const key = (args[0] || "").toLowerCase();
        if (!key) {
          write("open: missing application name", "term-err");
          return;
        }
        const app = getApps().find(
          (a) => a.id === key || a.name.toLowerCase() === key || a.name.toLowerCase().startsWith(key),
        );
        if (!app) {
          write("open: no application named '" + key + "'", "term-err");
          return;
        }
        wm.open(app);
        write("launching " + app.name + "…");
      },
      repo() {
        write("https://github.com/canopyos/canopyos");
        write("Static build — clone it, open index.html, done.");
      },
      banner() {
        writeLines(BANNER);
      },
      forest() {
        writeLines(TREE);
      },
      animals() {
        writeLines(ANIMALS);
      },
      joke() {
        write(JOKES[Math.floor(Math.random() * JOKES.length)]);
      },
    };

    function run(raw) {
      const text = raw.trim();
      write("forester@canopyos ~ % " + raw);
      if (!text) return;
      history.push(text);
      historyIndex = history.length;
      const [name, ...args] = text.split(/\s+/);
      const fn = commands[name.toLowerCase()];
      if (!fn) {
        write("canopy: command not found: " + name, "term-err");
        write("type 'help' for a list of commands");
        return;
      }
      fn(args);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const value = input.value;
        input.value = "";
        run(value);
        term.scrollTop = term.scrollHeight;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] || "";
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = "";
      }
    });

    term.addEventListener("pointerup", () => {
      if (!window.getSelection().toString()) input.focus();
    });

    writeLines(BANNER);
    write("");
    write("CanopyOS shell — " + new Date().toDateString());
    write("Type 'help' to see what grows here.");
    write("");
    setTimeout(() => input.focus(), 60);
    win.app.onFocusRestore = () => input.focus();
  },
};
NatureOS.terminalApp = terminalApp;
})();
