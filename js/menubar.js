(function () {
"use strict";
var wm = NatureOS.wm;
var store = NatureOS.store;
var THEMES = NatureOS.THEMES;
var ACCENTS = NatureOS.ACCENTS;
var applyTheme = NatureOS.applyTheme;
var applyAccent = NatureOS.applyAccent;
var notify = NatureOS.notify;
var formatTime = NatureOS.formatTime;
var cycleTheme = NatureOS.cycleTheme;
var randomWallpaper = NatureOS.randomWallpaper;
let appsRegistry = [];
let spotlightIndex = 0;
let filtered = [];
let lockRequest = null;

function el(id) {
  return document.getElementById(id);
}

function startClock() {
  const clock = el("mb-clock");
  const tick = () => {
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: "short" });
    const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    clock.textContent = day + " " + date + "  " + formatTime(now, true);
  };
  tick();
  setInterval(tick, 1000);
}

function trackActiveApp() {
  const label = el("mb-appname");
  wm.subscribe((list, activeId) => {
    const active = list.find((w) => w.id === activeId);
    label.textContent = active ? active.app.name : "Finder";
  });
}

function score(query, app) {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const name = app.name.toLowerCase();
  const keywords = (app.keywords || []).join(" ").toLowerCase();
  if (name.startsWith(q)) return 100;
  if (name.includes(q)) return 70;
  if (keywords.includes(q)) return 50;
  let i = 0;
  for (const ch of name) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return 30;
  }
  return 0;
}

function renderSpotlight(query) {
  const listEl = el("spotlight-results");
  filtered = appsRegistry
    .map((app) => ({ app, s: score(query, app) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.app);
  spotlightIndex = 0;
  listEl.innerHTML = "";
  filtered.forEach((app, i) => {
    const li = document.createElement("li");
    li.className = i === 0 ? "active" : "";
    const icon = document.createElement("span");
    icon.className = "sr-icon";
    icon.textContent = app.icon;
    const name = document.createElement("span");
    name.textContent = app.name;
    const sub = document.createElement("span");
    sub.className = "sr-sub";
    sub.textContent = app.tagline || "Application";
    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(sub);
    li.addEventListener("click", () => {
      wm.open(app);
      closeSpotlight();
    });
    li.addEventListener("pointerenter", () => {
      spotlightIndex = i;
      highlight();
    });
    listEl.appendChild(li);
  });
  if (!filtered.length) {
    const li = document.createElement("li");
    li.textContent = "No results in the canopy";
    li.style.opacity = "0.6";
    listEl.appendChild(li);
  }
}

function highlight() {
  const nodes = el("spotlight-results").querySelectorAll("li");
  nodes.forEach((n, i) => n.classList.toggle("active", i === spotlightIndex));
  const active = nodes[spotlightIndex];
  if (active) active.scrollIntoView({ block: "nearest" });
}

function openSpotlight() {
  const box = el("spotlight");
  const input = el("spotlight-input");
  box.classList.remove("hidden");
  input.value = "";
  renderSpotlight("");
  setTimeout(() => input.focus(), 10);
}

function closeSpotlight() {
  el("spotlight").classList.add("hidden");
}

function toggleControlCenter(force) {
  const cc = el("control-center");
  const shouldOpen = typeof force === "boolean" ? force : cc.classList.contains("hidden");
  cc.classList.toggle("hidden", !shouldOpen);
  if (shouldOpen) syncControlCenter();
}

function syncControlCenter() {
  const theme = store.get("theme");
  const accent = store.get("accent");
  el("cc-themes")
    .querySelectorAll(".cc-theme")
    .forEach((b) => b.classList.toggle("active", b.dataset.theme === theme));
  el("cc-accents")
    .querySelectorAll(".cc-accent")
    .forEach((b) => b.classList.toggle("active", b.dataset.accent === accent));
}

function buildControlCenter() {
  const themeHost = el("cc-themes");
  themeHost.innerHTML = "";
  THEMES.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cc-theme " + t.swatch;
    b.dataset.theme = t.id;
    const span = document.createElement("span");
    span.textContent = t.name.split(" ")[0];
    b.appendChild(span);
    b.addEventListener("click", () => {
      applyTheme(t.id);
      syncControlCenter();
      notify("Theme changed", t.name, "🎨");
    });
    themeHost.appendChild(b);
  });

  const accentHost = el("cc-accents");
  accentHost.innerHTML = "";
  ACCENTS.forEach((a) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cc-accent";
    b.dataset.accent = a.id;
    b.style.background = a.color;
    b.title = a.name;
    b.addEventListener("click", () => {
      applyAccent(a.id);
      syncControlCenter();
      notify("Accent updated", a.name, "🎯");
    });
    accentHost.appendChild(b);
  });

  el("cc-shuffle").addEventListener("click", () => {
    randomWallpaper();
  });
  el("cc-lock").addEventListener("click", () => {
    toggleControlCenter(false);
    if (lockRequest) lockRequest();
  });
}

let openMenu = null;

function menuDefinitions() {
  return {
    file: [
      { label: "New Window", icon: "🗂️", action: () => reopenActiveApp() },
      { label: "Close Window", icon: "✕", shortcut: "⌘W", action: () => {
        const active = wm.activeWindow();
        if (active) wm.close(active.id);
      } },
    ],
    edit: [
      { label: "Undo", icon: "↩️", action: () => document.execCommand("undo") },
      { label: "Copy", icon: "📋", action: () => document.execCommand("copy") },
      { label: "Paste", icon: "📥", action: () => document.execCommand("paste") },
    ],
    view: [
      { label: "Toggle Theme", icon: "🎨", action: () => {
        const next = cycleTheme();
        notify("Theme changed", next.name, "🎨");
      } },
      { label: "Change Wallpaper", icon: "🌄", action: () => randomWallpaper() },
    ],
    window: windowMenuItems(),
    help: [{ label: "About CanopyOS", icon: "ℹ️", action: () => {
      const about = appsRegistry.find((a) => a.id === "about");
      if (about) wm.open(about);
    } }],
  };
}

function reopenActiveApp() {
  const active = wm.activeWindow();
  const app = active ? active.app : appsRegistry.find((a) => a.id === "files");
  if (app) wm.open(app);
}

function windowMenuItems() {
  const items = [
    { label: "Minimize", icon: "−", shortcut: "⌘M", action: () => {
      const active = wm.activeWindow();
      if (active) wm.minimize(active.id);
    } },
    { label: "Maximize", icon: "⤢", action: () => {
      const active = wm.activeWindow();
      if (active) wm.toggleMaximize(active.id);
    } },
  ];
  const list = wm.allWindows();
  items.push({ separator: true });
  items.push({ head: true, label: "Open Windows" });
  if (!list.length) {
    items.push({ disabled: true, label: "No open windows", icon: "🌫️" });
  } else {
    list.forEach((w) => {
      items.push({
        label: w.app.name + (w.minimized ? " (minimized)" : ""),
        icon: w.app.icon,
        action: () => {
          wm.restoreFromDock(w.id);
          wm.focus(w.id);
        },
      });
    });
  }
  return items;
}

function closeMenuDropdown() {
  const dd = el("menu-dropdown");
  if (dd) dd.classList.add("hidden");
  document.querySelectorAll(".mb-menu").forEach((b) => b.classList.remove("open"));
  openMenu = null;
}

function openMenuDropdown(button) {
  const key = button.dataset.menu;
  const dd = el("menu-dropdown");
  const items = menuDefinitions()[key] || [];
  closeMenuDropdown();
  dd.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    if (item.separator) {
      li.className = "sep";
      dd.appendChild(li);
      return;
    }
    if (item.head) {
      li.className = "head";
      li.textContent = item.label;
      dd.appendChild(li);
      return;
    }
    if (item.disabled) li.className = "disabled";
    const icon = document.createElement("span");
    icon.textContent = item.icon || "•";
    const label = document.createElement("span");
    label.textContent = item.label;
    li.appendChild(icon);
    li.appendChild(label);
    if (item.shortcut) {
      const sc = document.createElement("span");
      sc.className = "md-shortcut";
      sc.textContent = item.shortcut;
      li.appendChild(sc);
    }
    li.addEventListener("click", () => {
      closeMenuDropdown();
      if (typeof item.action === "function") item.action();
    });
    dd.appendChild(li);
  });
  dd.classList.remove("hidden");
  const rect = button.getBoundingClientRect();
  const width = dd.getBoundingClientRect().width;
  dd.style.left = Math.max(6, Math.min(rect.left, window.innerWidth - width - 8)) + "px";
  button.classList.add("open");
  openMenu = key;
}

function bindMenus() {
  document.querySelectorAll(".mb-menu").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleControlCenter(false);
      if (openMenu === button.dataset.menu) closeMenuDropdown();
      else openMenuDropdown(button);
    });
    button.addEventListener("pointerenter", () => {
      if (openMenu && openMenu !== button.dataset.menu) openMenuDropdown(button);
    });
  });
  document.addEventListener("pointerdown", (e) => {
    if (!openMenu) return;
    if (e.target.closest("#menu-dropdown") || e.target.closest(".mb-menu")) return;
    closeMenuDropdown();
  });
  window.addEventListener("blur", closeMenuDropdown);
  window.addEventListener("resize", closeMenuDropdown);
}

function initMenubar(apps, options) {
  appsRegistry = apps;
  lockRequest = options && options.onLock;
  startClock();
  trackActiveApp();
  buildControlCenter();
  syncControlCenter();
  bindMenus();

  el("mb-spotlight").addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenuDropdown();
    toggleControlCenter(false);
    openSpotlight();
  });

  el("mb-control").addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenuDropdown();
    toggleControlCenter();
  });

  el("mb-logo").addEventListener("click", (e) => {
    e.stopPropagation();
    const about = apps.find((a) => a.id === "about");
    if (about) wm.open(about);
  });

  const input = el("spotlight-input");
  input.addEventListener("input", () => renderSpotlight(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      spotlightIndex = Math.min(spotlightIndex + 1, Math.max(0, filtered.length - 1));
      highlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      spotlightIndex = Math.max(spotlightIndex - 1, 0);
      highlight();
    } else if (e.key === "Enter") {
      const app = filtered[spotlightIndex];
      if (app) {
        wm.open(app);
        closeSpotlight();
      }
    } else if (e.key === "Escape") {
      closeSpotlight();
    }
  });

  el("spotlight").addEventListener("pointerdown", (e) => {
    if (e.target.id === "spotlight") closeSpotlight();
  });

  document.addEventListener("pointerdown", (e) => {
    const cc = el("control-center");
    if (cc.classList.contains("hidden")) return;
    if (cc.contains(e.target) || e.target.id === "mb-control") return;
    toggleControlCenter(false);
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSpotlight();
    } else if (e.key === "Escape") {
      closeSpotlight();
      closeMenuDropdown();
      toggleControlCenter(false);
    }
  });

  store.subscribe((key) => {
    if (key === "theme" || key === "accent") syncControlCenter();
  });
}
NatureOS.openSpotlight = openSpotlight;
NatureOS.closeSpotlight = closeSpotlight;
NatureOS.toggleControlCenter = toggleControlCenter;
NatureOS.closeMenuDropdown = closeMenuDropdown;
NatureOS.initMenubar = initMenubar;
})();
