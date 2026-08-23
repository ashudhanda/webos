# CanopyOS 🌲

A forest-themed desktop operating system that runs entirely in your browser —
frosted glass windows, a working dock, real apps, and ambient forest sounds.
No installs, no accounts, no backend. Just open the link and you're in the woods.

![CanopyOS Screenshot](screenshot.png)

## 👉 Try it live

**(GitHub Pages link goes here after deployment)**

## What is this?

CanopyOS is a complete desktop environment built as a single static website.
It boots up like a real OS, greets you with a lock screen, and drops you onto
a desktop with draggable windows, a magnifying dock, a Spotlight-style search,
and ten working apps — all wrapped in a calm, nature-inspired glass theme.

Everything runs client-side. There is no server, no database, and no login.
Your settings, notes, and desktop layout are saved in your browser's
localStorage, so everything is right where you left it when you come back.

## ✨ The experience

- **Boot screen** — animated loading with the CanopyOS logo
- **Lock screen** — huge clock over a blurred forest, click anywhere to enter (no password, ever)
- **Glass windows** — drag them by the title bar, resize them from any edge or corner, minimize, maximize, and watch them fade and scale as they open and close
- **Traffic lights** — red, yellow, green window controls with hover symbols, just like macOS
- **The Dock** — icons magnify as your mouse glides across them, running apps show a dot
- **Menubar** — working File / Edit / View / Window / Help dropdowns, a live clock, Spotlight search (Ctrl+K), and a Control Center for themes and accents
- **Desktop** — draggable icons with grid snapping, right-click context menu (Refresh, Change Wallpaper, Toggle Theme, About), and live widgets: an analog clock and a mini calendar
- **Themes** — Forest, Moss, Autumn, and Night Forest, plus four accent colors
- **Wallpapers** — a built-in gallery of misty forests, deer, foxes, and waterfalls, with CSS gradient fallbacks that work offline

## 📱 The apps

| App | What it does |
|---|---|
| 🌲 Finder | Browse a fake file system — folders, breadcrumbs, back button, file grid |
| 📝 Notes | Multiple notes, autosave, word count |
| 🖥️ Terminal | A working shell with 12+ commands: `help`, `about`, `echo`, `theme`, `open`, `forest`, `animals`, `joke`... |
| 🧮 Calculator | Full arithmetic with keyboard support |
| 🦊 Photos | The whole wallpaper collection as a gallery, with a lightbox viewer |
| 🎵 Forest Sounds | Rain, wind, and bird ambience **synthesized live with the Web Audio API** — zero audio files |
| ⚙️ Settings | Theme cards, accent swatches, wallpaper picker — all persisted |
| 🍃 Browser | An iframe-based web viewer with quick links |
| 📅 Calendar | A real month grid with today highlighted |
| ℹ️ About | Version info, credits, and tips |

## 🚀 Running it locally

Zero setup. Seriously.

1. Clone the repo:

2. Open `index.html` with any static server (VS Code Live Server works great),
   or just double-click it.

That's it. No dependencies, no build step, no npm.

## ⚙️ How it works

The whole thing is **handwritten in plain HTML, CSS and vanilla JavaScript** —
no frameworks, no libraries. A few decisions I'm happy about:

- **Window dragging and resizing run on Pointer Events**, so one code path
  handles mouse and touch. Windows can be resized from all four edges and
  corners with invisible hit zones.
- **The dock magnification** scales each icon based on its distance from the
  cursor — the same math macOS uses.
- **Forest Sounds are synthesized, not played.** The rain is filtered noise,
  the wind is slowly modulated noise, and the birds are randomized chirp
  oscillators — all generated in your browser with the Web Audio API.
- **Performance rule:** blur is only ever applied to three layers (menubar,
  windows, dock) and animations only touch `transform` and `opacity`, so the
  whole OS stays at 60fps.

## 📁 Project structure
index.html
css/base, themes, menubar, dock, window, apps
js/core/ (store, boot, contextmenu), wm, dock, menubar, wallpapers, main
js/apps/ files, notepad, terminal, calculator, photos, music, settings, browser, calendar, about


## 🗺️ Roadmap

- [x] Boot + lock screen
- [x] Window manager (drag, resize, minimize, maximize)
- [x] 10 working apps
- [x] Themes, accents, wallpaper gallery
- [ ] Paint app (canvas)
- [ ] A game or two in the dock
- [ ] Window edge-snapping
- [ ] More terminal easter eggs

## 🙏 Credits

- Built for [Hack Club Stardance](https://stardance.hackclub.com) — WebOS 1 mission
- Started from Hack Club's [WebOS guide](https://jams.hackclub.com/batch/webOS), then went way past it
- Wallpapers by the photographers of [Unsplash](https://unsplash.com)
- Made by **Ashu Dhanda** ([@ashudhanda](https://github.com/ashudhanda))