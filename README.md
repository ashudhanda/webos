# moonOS

my own little operating system that runs in the browser. linux flavored,
moon themed. no install, no build step — open it and it boots.

## try it

https://ashudhanda.github.io/webos/

press enter on the boot screen, pick an entry in grub (both boot the
same thing, shh), click the user card and you're in. no password.

## what's inside

- **Terminal** — the real star. a working shell with tab completion,
  command history and a virtual file system that survives refresh.
  `help` shows everything — ls, cd, cat, echo (yes, `>` works), mkdir,
  touch, rm, neofetch, theme, open, sudo (try it), apt install, vim...
- **Files** — a file manager on the same virtual fs, so a file you make
  in the terminal shows up here instantly
- **Text Editor** — opens files from the fs, autosaves as you type
- **Calculator** — full keyboard support
- **Settings** — 4 full themes (luna, nord, gruvbox, everforest) plus
  extra wallpapers for each
- **System Monitor** — fake but alive, htop style

## stuff you can do

- drag windows by the titlebar, resize from the bottom-right corner,
  double-click the titlebar to maximize
- 4 workspaces — ctrl+alt+left/right, or the dots in the top panel
- alt+tab actually works
- the bottom taskbar has a start menu and a working search (try "term")
- right click the desktop for a small menu
- super+L (or ctrl+alt+L) locks the screen. typing `exit` in the
  terminal does too, like a real os

## running it locally

clone the repo, open index.html with live server. that's it. plain html,
css and js — no npm, no bundler, nothing to install.

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
- used little amount of ai too understand error and debugging 
- icons are hand-placed inline svg, fonts are inter + jetbrains mono

made by ashu dhanda — [@ashudhanda](https://github.com/ashudhanda)