(function () {
"use strict";
var store = NatureOS.store;
var applyTheme = NatureOS.applyTheme;
var applyAccent = NatureOS.applyAccent;
var cycleTheme = NatureOS.cycleTheme;
var notify = NatureOS.notify;
var setApps = NatureOS.setApps;
var runBoot = NatureOS.runBoot;
var showLockScreen = NatureOS.showLockScreen;
var initContextMenu = NatureOS.initContextMenu;
var applyWallpaper = NatureOS.applyWallpaper;
var randomWallpaper = NatureOS.randomWallpaper;
var preloadWallpapers = NatureOS.preloadWallpapers;
var wm = NatureOS.wm;
var initDock = NatureOS.initDock;
var initMenubar = NatureOS.initMenubar;
var filesApp = NatureOS.filesApp;
var notesApp = NatureOS.notesApp;
var terminalApp = NatureOS.terminalApp;
var calculatorApp = NatureOS.calculatorApp;
var photosApp = NatureOS.photosApp;
var musicApp = NatureOS.musicApp;
var settingsApp = NatureOS.settingsApp;
var browserApp = NatureOS.browserApp;
var calendarApp = NatureOS.calendarApp;
var aboutApp = NatureOS.aboutApp;
const APPS = [
  filesApp,
  notesApp,
  terminalApp,
  calculatorApp,
  photosApp,
  musicApp,
  browserApp,
  calendarApp,
  settingsApp,
  aboutApp,
];

const DESKTOP_ICONS = ["files", "notes", "terminal", "photos", "music"];

const GRID = 100;

function savedIconPositions() {
  const saved = store.get("iconPositions");
  return saved && typeof saved === "object" ? { ...saved } : {};
}

function placeIcon(btn, x, y) {
  btn.style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px,0)";
  btn.dataset.x = String(x);
  btn.dataset.y = String(y);
}

function snap(value, min, max) {
  const snapped = Math.round(value / GRID) * GRID;
  return Math.max(min, Math.min(snapped, max));
}

function buildDesktopIcons() {
  const host = document.getElementById("desktop-icons");
  host.innerHTML = "";
  const positions = savedIconPositions();

  DESKTOP_ICONS.forEach((id, index) => {
    const app = APPS.find((a) => a.id === id);
    if (!app) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "desktop-icon";
    const icon = document.createElement("span");
    icon.textContent = app.icon;
    const label = document.createElement("span");
    label.textContent = app.name;
    btn.appendChild(icon);
    btn.appendChild(label);

    const fallback = { x: 24, y: 52 + index * GRID };
    const pos = positions[id] || fallback;
    placeIcon(btn, pos.x, pos.y);

    let drag = null;
    let moved = false;

    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      moved = false;
      drag = {
        pid: e.pointerId,
        px: e.clientX,
        py: e.clientY,
        x: Number(btn.dataset.x),
        y: Number(btn.dataset.y),
      };
      btn.setPointerCapture(e.pointerId);
    });

    btn.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.px;
      const dy = e.clientY - drag.py;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      btn.classList.add("dragging");
      placeIcon(btn, drag.x + dx, drag.y + dy);
    });

    const endDrag = (e) => {
      if (!drag) return;
      if (btn.hasPointerCapture(drag.pid)) btn.releasePointerCapture(drag.pid);
      drag = null;
      btn.classList.remove("dragging");
      if (!moved) return;
      const maxX = Math.max(0, window.innerWidth - 100);
      const maxY = Math.max(52, window.innerHeight - 180);
      const nx = snap(Number(btn.dataset.x), 8, maxX);
      const ny = snap(Number(btn.dataset.y), 40, maxY);
      placeIcon(btn, nx, ny);
      const next = savedIconPositions();
      next[id] = { x: nx, y: ny };
      store.set("iconPositions", next);
      void e;
    };

    btn.addEventListener("pointerup", endDrag);
    btn.addEventListener("pointercancel", endDrag);

    btn.addEventListener("click", () => {
      if (moved) return;
      if (btn.classList.contains("selected")) {
        wm.open(app);
        return;
      }
      host.querySelectorAll(".desktop-icon").forEach((n) => n.classList.remove("selected"));
      btn.classList.add("selected");
    });

    host.appendChild(btn);
  });

  document.getElementById("desktop").addEventListener("pointerdown", (e) => {
    if (e.target.closest(".desktop-icon")) return;
    host.querySelectorAll(".desktop-icon").forEach((n) => n.classList.remove("selected"));
  });
}

function startWidgets() {
  const hour = document.getElementById("ac-hour");
  const minute = document.getElementById("ac-minute");
  const second = document.getElementById("ac-second");
  const digital = document.getElementById("widget-digital");
  const dayLabel = document.getElementById("widget-day");
  const monthLabel = document.getElementById("widget-month");
  const grid = document.getElementById("widget-grid");

  const tick = () => {
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;
    second.style.transform = "rotate(" + s * 6 + "deg)";
    minute.style.transform = "rotate(" + (m * 6 + s * 0.1) + "deg)";
    hour.style.transform = "rotate(" + (h * 30 + m * 0.5) + "deg)";
    digital.textContent = now.toLocaleTimeString(undefined, { hour12: false });
    dayLabel.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
  };

  const renderCalendar = () => {
    const now = new Date();
    monthLabel.textContent = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    grid.innerHTML = "";
    ["S", "M", "T", "W", "T", "F", "S"].forEach((d) => {
      const cell = document.createElement("span");
      cell.className = "wg-head";
      cell.textContent = d;
      grid.appendChild(cell);
    });
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i += 1) grid.appendChild(document.createElement("span"));
    for (let d = 1; d <= days; d += 1) {
      const cell = document.createElement("span");
      cell.textContent = String(d);
      if (d === now.getDate()) cell.className = "wg-today";
      grid.appendChild(cell);
    }
  };

  tick();
  renderCalendar();
  setInterval(tick, 1000);
  setInterval(renderCalendar, 60000);
}

function bindDesktopContextMenu() {
  initContextMenu("#desktop", () => [
    {
      icon: "🔄",
      label: "Refresh",
      action: () => window.location.reload(),
    },
    { separator: true },
    {
      icon: "🌄",
      label: "Change Wallpaper",
      action: () => randomWallpaper(),
    },
    {
      icon: "🎨",
      label: "Toggle Theme",
      action: () => {
        const next = cycleTheme();
        notify("Theme changed", next.name, "🎨");
      },
    },
    { separator: true },
    { icon: "⚙️", label: "Open Settings", action: () => wm.open(settingsApp) },
    { icon: "🔍", label: "Spotlight Search", action: () => document.getElementById("mb-spotlight").click() },
    { separator: true },
    { icon: "ℹ️", label: "About CanopyOS", action: () => wm.open(aboutApp) },
  ]);
}

function bindGlobalShortcuts() {
  document.addEventListener("keydown", (e) => {
    const active = wm.activeWindow();
    if (!active) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
      e.preventDefault();
      wm.close(active.id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
      e.preventDefault();
      wm.minimize(active.id);
    }
  });
}

function restorePreferences() {
  applyTheme(store.get("theme"));
  applyAccent(store.get("accent"));
  applyWallpaper(store.get("wallpaper"), true);
}

async function start() {
  setApps(APPS);
  restorePreferences();
  preloadWallpapers();

  await runBoot(2200);
  await showLockScreen();

  document.getElementById("desktop").classList.remove("hidden");

  initDock(APPS);
  initMenubar(APPS, {
    onLock: async () => {
      await showLockScreen();
    },
  });
  buildDesktopIcons();
  startWidgets();
  bindDesktopContextMenu();
  bindGlobalShortcuts();

  store.set("bootCount", (store.get("bootCount") || 0) + 1);

  setTimeout(() => {
    notify("Welcome to CanopyOS", "Press Ctrl+K to search, right-click the desktop for options.", "🌲");
  }, 600);

  setTimeout(() => {
    wm.open(filesApp);
  }, 900);
}

start();

})();
