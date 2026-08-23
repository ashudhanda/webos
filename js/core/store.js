(function () {
"use strict";
const KEY = "canopyos.v1";

const defaults = {
  theme: "forest",
  accent: "green",
  wallpaper: "misty-forest",
  volume: 0.55,
  layers: { rain: true, wind: true, birds: true },
  notes: null,
  activeNote: null,
  browserUrl: "https://en.wikipedia.org/wiki/Forest",
  bootCount: 0,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (err) {
    return { ...defaults };
  }
}

let state = read();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    void err;
  }
}

const store = {
  get(key) {
    return state[key];
  },
  set(key, value) {
    state[key] = value;
    persist();
    listeners.forEach((fn) => fn(key, value));
  },
  patch(obj) {
    state = { ...state, ...obj };
    persist();
    Object.keys(obj).forEach((k) => listeners.forEach((fn) => fn(k, obj[k])));
  },
  all() {
    return { ...state };
  },
  reset() {
    state = { ...defaults };
    persist();
    listeners.forEach((fn) => fn("*", null));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

const THEMES = [
  { id: "forest", name: "Forest", swatch: "swatch-forest" },
  { id: "moss", name: "Moss", swatch: "swatch-moss" },
  { id: "autumn", name: "Autumn", swatch: "swatch-autumn" },
  { id: "night", name: "Night Forest", swatch: "swatch-night" },
];

const ACCENTS = [
  { id: "green", name: "Green", color: "#2fbf6b" },
  { id: "lime", name: "Lime", color: "#a6de37" },
  { id: "teal", name: "Teal", color: "#24c4c0" },
  { id: "amber", name: "Amber", color: "#f0a92c" },
];

function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) ? id : "forest";
  document.documentElement.setAttribute("data-theme", theme);
  store.set("theme", theme);
  return THEMES.find((t) => t.id === theme);
}

function applyAccent(id) {
  const accent = ACCENTS.find((a) => a.id === id) ? id : "green";
  document.documentElement.setAttribute("data-accent", accent);
  store.set("accent", accent);
  return ACCENTS.find((a) => a.id === accent);
}

function cycleTheme() {
  const current = store.get("theme");
  const index = THEMES.findIndex((t) => t.id === current);
  const next = THEMES[(index + 1) % THEMES.length];
  applyTheme(next.id);
  return next;
}

function notify(title, body, icon) {
  const host = document.getElementById("toasts");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  const ic = document.createElement("div");
  ic.className = "t-icon";
  ic.textContent = icon || "🌿";
  const wrap = document.createElement("div");
  const t = document.createElement("div");
  t.className = "t-title";
  t.textContent = title;
  wrap.appendChild(t);
  if (body) {
    const b = document.createElement("div");
    b.className = "t-body";
    b.textContent = body;
    wrap.appendChild(b);
  }
  el.appendChild(ic);
  el.appendChild(wrap);
  host.appendChild(el);
  const remove = () => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  };
  const timer = setTimeout(remove, 3200);
  el.addEventListener("click", () => {
    clearTimeout(timer);
    remove();
  });
}

function uid(prefix) {
  return (prefix || "id") + "-" + Math.random().toString(36).slice(2, 9);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date, withSeconds) {
  let h = date.getHours();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const base = h + ":" + pad(date.getMinutes());
  return withSeconds ? base + ":" + pad(date.getSeconds()) + " " + suffix : base + " " + suffix;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

let appRegistry = [];

function setApps(list) {
  appRegistry = list;
}

function getApps() {
  return appRegistry;
}
NatureOS.store = store;
NatureOS.THEMES = THEMES;
NatureOS.ACCENTS = ACCENTS;
NatureOS.applyTheme = applyTheme;
NatureOS.applyAccent = applyAccent;
NatureOS.cycleTheme = cycleTheme;
NatureOS.notify = notify;
NatureOS.uid = uid;
NatureOS.clamp = clamp;
NatureOS.pad = pad;
NatureOS.formatTime = formatTime;
NatureOS.formatDate = formatDate;
NatureOS.setApps = setApps;
NatureOS.getApps = getApps;
})();
