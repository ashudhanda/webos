(function () {
"use strict";
var clamp = NatureOS.clamp;
var uid = NatureOS.uid;
const MENUBAR_H = 30;
const DOCK_SPACE = 88;

const windows = new Map();
const listeners = new Set();
let zCounter = 100;
let activeId = null;
let cascade = 0;

function layer() {
  return document.getElementById("windows-layer");
}

function viewport() {
  return { w: window.innerWidth, h: window.innerHeight };
}

function emit() {
  listeners.forEach((fn) => fn(list(), activeId));
}

function list() {
  return Array.from(windows.values());
}

function applyRect(win) {
  const { x, y, w, h } = win.rect;
  win.frame.style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px,0)";
  win.frame.style.width = Math.round(w) + "px";
  win.frame.style.height = Math.round(h) + "px";
}

function makeTrafficLights(win) {
  const wrap = document.createElement("div");
  wrap.className = "traffic";
  const defs = [
    { cls: "tl-close", glyph: "✕", action: () => close(win.id) },
    { cls: "tl-min", glyph: "−", action: () => minimize(win.id) },
    { cls: "tl-max", glyph: "+", action: () => toggleMaximize(win.id) },
  ];
  defs.forEach((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tl " + d.cls;
    const g = document.createElement("span");
    g.className = "tl-glyph";
    g.textContent = d.glyph;
    b.appendChild(g);
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      d.action();
    });
    wrap.appendChild(b);
  });
  return wrap;
}

function enableDrag(win, handle) {
  let start = null;
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    focus(win.id);
    if (win.maximized) return;
    handle.setPointerCapture(e.pointerId);
    handle.classList.add("dragging");
    start = { px: e.clientX, py: e.clientY, x: win.rect.x, y: win.rect.y };
  });
  handle.addEventListener("pointermove", (e) => {
    if (!start) return;
    const vp = viewport();
    const nx = clamp(start.x + (e.clientX - start.px), -win.rect.w + 120, vp.w - 120);
    const ny = clamp(start.y + (e.clientY - start.py), MENUBAR_H, vp.h - 60);
    win.rect.x = nx;
    win.rect.y = ny;
    applyRect(win);
  });
  const end = (e) => {
    if (!start) return;
    start = null;
    handle.classList.remove("dragging");
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

const RESIZE_DIRS = ["n", "s", "e", "w", "nw", "ne", "sw", "se"];

function enableResize(win, handle, dir) {
  let start = null;
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    focus(win.id);
    if (win.maximized) restore(win.id);
    handle.setPointerCapture(e.pointerId);
    start = { px: e.clientX, py: e.clientY, x: win.rect.x, y: win.rect.y, w: win.rect.w, h: win.rect.h };
  });
  handle.addEventListener("pointermove", (e) => {
    if (!start) return;
    const vp = viewport();
    const dx = e.clientX - start.px;
    const dy = e.clientY - start.py;
    if (dir.includes("e")) {
      win.rect.w = clamp(start.w + dx, win.minW, vp.w - start.x - 4);
    }
    if (dir.includes("s")) {
      win.rect.h = clamp(start.h + dy, win.minH, vp.h - start.y - 4);
    }
    if (dir.includes("w")) {
      const maxW = start.w + start.x - 4;
      const nw = clamp(start.w - dx, win.minW, Math.max(win.minW, maxW));
      win.rect.x = start.x + (start.w - nw);
      win.rect.w = nw;
    }
    if (dir.includes("n")) {
      const maxH = start.h + start.y - MENUBAR_H;
      const nh = clamp(start.h - dy, win.minH, Math.max(win.minH, maxH));
      win.rect.y = start.y + (start.h - nh);
      win.rect.h = nh;
    }
    applyRect(win);
  });
  const end = (e) => {
    if (!start) return;
    start = null;
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    if (typeof win.app.onResize === "function") win.app.onResize(win);
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

function open(app) {
  if (app.single !== false) {
    const existing = list().find((w) => w.app.id === app.id);
    if (existing) {
      if (existing.minimized) restoreFromDock(existing.id);
      focus(existing.id);
      return existing;
    }
  }

  const vp = viewport();
  const w = Math.min(app.width || 720, vp.w - 40);
  const h = Math.min(app.height || 480, vp.h - DOCK_SPACE - MENUBAR_H);
  const offset = (cascade % 6) * 26;
  cascade += 1;
  const x = clamp(Math.round((vp.w - w) / 2) + offset - 60, 12, Math.max(12, vp.w - w - 12));
  const y = clamp(MENUBAR_H + 24 + offset, MENUBAR_H + 6, Math.max(MENUBAR_H + 6, vp.h - h - 90));

  const frame = document.createElement("div");
  frame.style.position = "absolute";
  frame.style.left = "0";
  frame.style.top = "0";
  frame.style.willChange = "transform";

  const el = document.createElement("section");
  el.className = "window";
  el.style.width = "100%";
  el.style.height = "100%";

  const bar = document.createElement("header");
  bar.className = "titlebar";
  const title = document.createElement("div");
  title.className = "win-title";
  const ti = document.createElement("span");
  ti.className = "wt-icon";
  ti.textContent = app.icon;
  const tn = document.createElement("span");
  tn.textContent = app.name;
  title.appendChild(ti);
  title.appendChild(tn);

  const body = document.createElement("div");
  body.className = "win-body";


  const win = {
    id: uid("win"),
    app,
    frame,
    el,
    body,
    titleEl: tn,
    rect: { x, y, w, h },
    minW: Math.max(320, app.minWidth || 320),
    minH: Math.max(220, app.minHeight || 220),
    maximized: false,
    minimized: false,
    prevRect: null,
    setTitle(text) {
      tn.textContent = text;
    },
  };

  bar.appendChild(makeTrafficLights(win));
  bar.appendChild(title);
  el.appendChild(bar);
  el.appendChild(body);
  RESIZE_DIRS.forEach((dir) => {
    const rh = document.createElement("div");
    rh.className = "resize-handle rh-" + dir;
    rh.dataset.dir = dir;
    el.appendChild(rh);
  });
  frame.appendChild(el);

  applyRect(win);
  layer().appendChild(frame);
  windows.set(win.id, win);

  enableDrag(win, bar);
  el.querySelectorAll(".resize-handle").forEach((rh) => enableResize(win, rh, rh.dataset.dir));
  bar.addEventListener("dblclick", () => toggleMaximize(win.id));
  frame.addEventListener("pointerdown", () => focus(win.id));

  try {
    app.mount(body, win);
  } catch (err) {
    const pre = document.createElement("pre");
    pre.style.padding = "16px";
    pre.style.fontSize = "12px";
    pre.textContent = "This app failed to start.\n" + String(err && err.message ? err.message : err);
    body.appendChild(pre);
  }

  focus(win.id);
  emit();
  return win;
}

function focus(id) {
  const win = windows.get(id);
  if (!win) return;
  if (win.minimized) restoreFromDock(id);
  zCounter += 1;
  win.frame.style.zIndex = String(zCounter);
  if (activeId === id) return;
  const prev = windows.get(activeId);
  if (prev) prev.el.classList.remove("active");
  win.el.classList.add("active");
  activeId = id;
  emit();
}

function close(id) {
  const win = windows.get(id);
  if (!win) return;
  if (typeof win.app.onClose === "function") {
    try {
      win.app.onClose(win);
    } catch (err) {
      void err;
    }
  }
  win.el.classList.add("closing");
  setTimeout(() => {
    win.frame.remove();
    windows.delete(id);
    if (activeId === id) {
      activeId = null;
      const next = list()
        .filter((w) => !w.minimized)
        .pop();
      if (next) focus(next.id);
      else emit();
    } else {
      emit();
    }
  }, 180);
}

function minimize(id) {
  const win = windows.get(id);
  if (!win || win.minimized) return;
  win.el.classList.add("minimizing");
  setTimeout(() => {
    win.minimized = true;
    win.frame.style.display = "none";
    win.el.classList.remove("minimizing", "active");
    if (activeId === id) activeId = null;
    emit();
  }, 200);
}

function restoreFromDock(id) {
  const win = windows.get(id);
  if (!win) return;
  win.minimized = false;
  win.frame.style.display = "";
  win.el.classList.remove("minimizing");
  win.el.style.animation = "none";
  requestAnimationFrame(() => {
    win.el.style.animation = "";
  });
  emit();
}

function toggleMinimize(id) {
  const win = windows.get(id);
  if (!win) return;
  if (win.minimized) {
    restoreFromDock(id);
    focus(id);
  } else if (activeId === id) {
    minimize(id);
  } else {
    focus(id);
  }
}

function toggleMaximize(id) {
  const win = windows.get(id);
  if (!win) return;
  if (win.maximized) restore(id);
  else maximize(id);
}

function maximize(id) {
  const win = windows.get(id);
  if (!win || win.maximized) return;
  const vp = viewport();
  win.prevRect = { ...win.rect };
  win.rect = { x: 0, y: MENUBAR_H, w: vp.w, h: vp.h - MENUBAR_H };
  win.maximized = true;
  win.el.classList.add("maximized");
  applyRect(win);
  if (typeof win.app.onResize === "function") win.app.onResize(win);
}

function restore(id) {
  const win = windows.get(id);
  if (!win || !win.maximized) return;
  win.rect = win.prevRect || win.rect;
  win.maximized = false;
  win.el.classList.remove("maximized");
  applyRect(win);
  if (typeof win.app.onResize === "function") win.app.onResize(win);
}

function windowsForApp(appId) {
  return list().filter((w) => w.app.id === appId);
}

function activeWindow() {
  return windows.get(activeId) || null;
}

function allWindows() {
  return list();
}

function subscribe(fn) {
  listeners.add(fn);
  fn(list(), activeId);
  return () => listeners.delete(fn);
}

window.addEventListener("resize", () => {
  const vp = viewport();
  list().forEach((win) => {
    if (win.maximized) {
      win.rect = { x: 0, y: MENUBAR_H, w: vp.w, h: vp.h - MENUBAR_H };
    } else {
      win.rect.x = clamp(win.rect.x, -win.rect.w + 120, Math.max(12, vp.w - 120));
      win.rect.y = clamp(win.rect.y, MENUBAR_H, Math.max(MENUBAR_H, vp.h - 60));
      win.rect.w = Math.min(win.rect.w, vp.w - 8);
      win.rect.h = Math.min(win.rect.h, vp.h - MENUBAR_H - 8);
    }
    applyRect(win);
    if (typeof win.app.onResize === "function") win.app.onResize(win);
  });
});
NatureOS.open = open;
NatureOS.focus = focus;
NatureOS.close = close;
NatureOS.minimize = minimize;
NatureOS.restoreFromDock = restoreFromDock;
NatureOS.toggleMinimize = toggleMinimize;
NatureOS.toggleMaximize = toggleMaximize;
NatureOS.maximize = maximize;
NatureOS.restore = restore;
NatureOS.windowsForApp = windowsForApp;
NatureOS.activeWindow = activeWindow;
NatureOS.allWindows = allWindows;
NatureOS.subscribe = subscribe;
NatureOS.wm = { open, focus, close, minimize, restoreFromDock, toggleMinimize, toggleMaximize, maximize, restore, windowsForApp, activeWindow, allWindows, subscribe };
})();
