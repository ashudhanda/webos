# moonOS

my own little operating system that runs in the browser. linux flavored,
moon themed. no install, no build step — open it and it boots.

## try it

https://ashudhanda.github.io/webos/

press enter on the boot screen, pick an entry in grub (both boot the
same thing, shh), then press-and-hold the "hold to sign in" ring (or just
hit enter) and you're in. no password.

## what's inside

- **Terminal** — the real star. a working shell with tab completion,
  command history and a virtual file system that survives refresh.
  `help` shows everything — ls, cd, cat, echo (yes, `>` works), mkdir,
  touch, rm, neofetch, theme, open, sudo (try it), apt install, vim...
- **Files** — a file manager on the same virtual fs, so a file you make
  in the terminal shows up here instantly
- **Text Editor** — opens files from the fs, autosaves as you type
- **Calculator** — full keyboard support
- **Settings** — 4 full themes (moon, mars, earth, saturn) plus
  extra wallpapers for each
- **System Monitor** — fake but alive, htop style
- **Sticky Notes** — quick sticky notes on the desktop, autosaved as you type
- **Snake** — the classic, arrows/wasd to steer, high score saved
- **Minesweeper** — three difficulties, first click is always safe,
  right-click to flag, chord clicks work
- **Music Studio** — a playable synth piano (Web Audio): click the keys
  or type, switch waveforms and octaves, or hit ▶ for a demo tune
- **Calendar** — month view with events you add yourself, saved locally
- **Tasks** — a todo list with filters, survives refresh
- **Clock** — world clock, stopwatch with laps, and a countdown timer
  that beeps when it finishes
- **Password Generator** — secure random passwords (crypto-grade),
  strength meter, click to copy
- **Voice Assistant** — speak commands ("open snake", "what time is it")
  or type them; replies out loud
- **AI Chat** — a free AI chatbot inside the OS, conversation history saved
- **Weather** — live conditions + 7-day forecast for any city you search
- **Camera** — webcam preview with photo capture and PNG download
- **Sound Recorder** — record from the mic, play back, save or delete clips
- **Paint** — brush, eraser, shapes, colors, undo, export as PNG

## stuff you can do

- drag windows by the titlebar, resize from the bottom-right corner,
  double-click the titlebar to maximize
- **aero snap** — drag a window to the left/right edge to snap it to half
  the screen, or to the top edge to maximize
- **right-click the desktop** for a context menu: open terminal,
  change/next wallpaper, arrange icons, about
- 4 workspaces — ctrl+alt+left/right, or the dots in the top panel
- alt+tab actually works
- the bottom taskbar has a start menu and a working search (try "term")
- super+L (or ctrl+alt+L) locks the screen. typing `exit` in the
  terminal does too, like a real os

## running it locally

clone the repo, open index.html with live server. that's it. plain html,
css and js — no npm, no bundler, nothing to install.

## project structure

- index.html — boot screen, login/lock screens, desktop shell markup
- css/ — one stylesheet per layer: base, themes, panel, windows,
  taskbar, terminal, apps
- js/main.js — boot glue, wires every module together at startup
- js/core/ — the guts: wm (window manager), fs (virtual fs), boot,
  loginfx, panel, taskbar, sound, notify, wallpaper, ambience, matrix
- js/apps/ — one module per app: terminal, files, editor, calc,
  settings, monitor, notes, snake, mines, music, calendar, tasks,
  clock, passgen, voice, aichat, weather, camera, recorder, paint

## things that took me forever

- the window manager. making a window draggable AND resizable without
  the two fighting each other broke so many times. pointer capture
  saved me.
- tab completion in the terminal — finding the longest common prefix of
  the matches sounds easy until you're doing it at 1am.
- workspaces. one giant 400% wide strip that slides with translateX, and
  every window has to remember which workspace it lives on.
- github pages. everything worked locally, then completely broke on
  pages because my asset paths started with "/". pages serves the site
  from /webos/ so every css and js file 404'd. relative paths fixed it.
- the taskbar couldn't find the window manager at all — turned out a
  top level `const` never attaches to `window`, so `window.WM` was just
  undefined. two lines fixed an entire evening of confusion.

## credits

- built for hack club stardance (webOS mission) — started from their
  guide and went way past it
- used a little AI to understand errors and debugging
- icons are hand-placed inline svg, fonts are inter + jetbrains mono

made by ashu dhanda — [@ashudhanda](https://github.com/ashudhanda)