(function () {
"use strict";
var store = NatureOS.store;
var THEMES = NatureOS.THEMES;
var ACCENTS = NatureOS.ACCENTS;
var applyTheme = NatureOS.applyTheme;
var applyAccent = NatureOS.applyAccent;
var notify = NatureOS.notify;
var WALLPAPERS = NatureOS.WALLPAPERS;
var wallpaperStyle = NatureOS.wallpaperStyle;
var applyWallpaper = NatureOS.applyWallpaper;
var randomWallpaper = NatureOS.randomWallpaper;
var wm = NatureOS.wm;
var aboutApp = NatureOS.aboutApp;
const SECTIONS = [
  { id: "appearance", name: "Appearance", icon: "🎨" },
  { id: "accent", name: "Accent Color", icon: "🎯" },
  { id: "wallpaper", name: "Wallpaper", icon: "🌄" },
  { id: "system", name: "System", icon: "⚙️" },
];

const PREVIEW = {
  forest: "linear-gradient(150deg, #14523a, #06180f)",
  moss: "linear-gradient(150deg, #dff4e4, #93cfa3)",
  autumn: "linear-gradient(150deg, #85390f, #2c1005)",
  night: "linear-gradient(150deg, #17335f, #050c1e)",
};

const settingsApp = {
  id: "settings",
  name: "Settings",
  icon: "⚙️",
  tagline: "System",
  keywords: ["settings", "preferences", "theme", "accent", "appearance"],
  width: 800,
  height: 540,
  mount(body) {
    let section = "appearance";

    const root = document.createElement("div");
    root.className = "app";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    const st = document.createElement("div");
    st.className = "sidebar-title";
    st.textContent = "System Settings";
    sidebar.appendChild(st);

    const sideButtons = SECTIONS.map((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sidebar-item";
      b.textContent = s.icon + "  " + s.name;
      b.addEventListener("click", () => {
        section = s.id;
        render();
      });
      sidebar.appendChild(b);
      return { id: s.id, el: b };
    });

    const content = document.createElement("div");
    content.className = "app-scroll settings-body";

    root.appendChild(sidebar);
    root.appendChild(content);
    body.appendChild(root);

    function heading(text) {
      const h = document.createElement("div");
      h.className = "settings-h";
      h.textContent = text;
      return h;
    }

    function themeSection() {
      const wrap = document.createElement("div");
      wrap.className = "settings-section";
      wrap.appendChild(heading("Theme"));
      const grid = document.createElement("div");
      grid.className = "theme-cards";
      THEMES.forEach((t) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "theme-card" + (store.get("theme") === t.id ? " active" : "");
        const prev = document.createElement("div");
        prev.className = "tc-preview";
        prev.style.background = PREVIEW[t.id];
        const bar = document.createElement("i");
        prev.appendChild(bar);
        const name = document.createElement("div");
        name.className = "tc-name";
        name.textContent = t.name;
        card.appendChild(prev);
        card.appendChild(name);
        card.addEventListener("click", () => {
          applyTheme(t.id);
          notify("Theme changed", t.name, "🎨");
          render();
        });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      return wrap;
    }

    function accentSection() {
      const wrap = document.createElement("div");
      wrap.className = "settings-section";
      wrap.appendChild(heading("Accent color"));
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "14px";
      row.style.flexWrap = "wrap";
      ACCENTS.forEach((a) => {
        const item = document.createElement("button");
        item.type = "button";
        item.style.display = "grid";
        item.style.justifyItems = "center";
        item.style.gap = "8px";
        const dot = document.createElement("span");
        dot.style.width = "36px";
        dot.style.height = "36px";
        dot.style.borderRadius = "50%";
        dot.style.background = a.color;
        dot.style.border = store.get("accent") === a.id ? "3px solid var(--text)" : "3px solid transparent";
        dot.style.boxShadow = "var(--shadow-sm)";
        const label = document.createElement("span");
        label.style.fontSize = "12px";
        label.textContent = a.name;
        item.appendChild(dot);
        item.appendChild(label);
        item.addEventListener("click", () => {
          applyAccent(a.id);
          notify("Accent updated", a.name, "🎯");
          render();
        });
        row.appendChild(item);
      });
      wrap.appendChild(row);
      return wrap;
    }

    function wallpaperSection() {
      const wrap = document.createElement("div");
      wrap.className = "settings-section";
      wrap.appendChild(heading("Wallpaper"));
      const grid = document.createElement("div");
      grid.className = "wall-grid";
      WALLPAPERS.forEach((wp) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "wall-cell" + (store.get("wallpaper") === wp.id ? " active" : "");
        cell.style.backgroundImage = wallpaperStyle(wp);
        const span = document.createElement("span");
        span.textContent = wp.name;
        cell.appendChild(span);
        cell.addEventListener("click", () => {
          applyWallpaper(wp.id);
          render();
        });
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      const shuffle = document.createElement("button");
      shuffle.type = "button";
      shuffle.className = "ghost-btn";
      shuffle.style.marginTop = "12px";
      shuffle.textContent = "🎲 Shuffle wallpaper";
      shuffle.addEventListener("click", () => {
        randomWallpaper();
        render();
      });
      wrap.appendChild(shuffle);
      return wrap;
    }

    function systemSection() {
      const wrap = document.createElement("div");
      wrap.className = "settings-section";
      wrap.appendChild(heading("System"));
      const info = document.createElement("div");
      info.className = "about-stats";
      info.style.maxWidth = "100%";
      const rows = [
        ["Operating system", "CanopyOS 1.0 (Evergreen)"],
        ["Theme", THEMES.find((t) => t.id === store.get("theme")).name],
        ["Accent", ACCENTS.find((a) => a.id === store.get("accent")).name],
        ["Wallpapers installed", String(WALLPAPERS.length)],
        ["Storage", "localStorage · persistent"],
        ["Renderer", "CSS backdrop-filter compositor"],
      ];
      rows.forEach(([k, v]) => {
        const r = document.createElement("div");
        const a = document.createElement("span");
        a.textContent = k;
        const b = document.createElement("span");
        b.textContent = v;
        r.appendChild(a);
        r.appendChild(b);
        info.appendChild(r);
      });
      wrap.appendChild(info);

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "10px";
      actions.style.marginTop = "14px";
      actions.style.flexWrap = "wrap";

      const aboutBtn = document.createElement("button");
      aboutBtn.type = "button";
      aboutBtn.className = "accent-btn";
      aboutBtn.textContent = "ℹ️ About CanopyOS";
      aboutBtn.addEventListener("click", () => wm.open(aboutApp));

      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "ghost-btn";
      resetBtn.textContent = "♻️ Reset preferences";
      resetBtn.addEventListener("click", () => {
        store.reset();
        applyTheme(store.get("theme"));
        applyAccent(store.get("accent"));
        applyWallpaper(store.get("wallpaper"), true);
        notify("Preferences reset", "Back to a fresh forest.", "♻️");
        render();
      });

      actions.appendChild(aboutBtn);
      actions.appendChild(resetBtn);
      wrap.appendChild(actions);
      return wrap;
    }

    function render() {
      sideButtons.forEach((s) => s.el.classList.toggle("active", s.id === section));
      content.innerHTML = "";
      if (section === "appearance") {
        content.appendChild(themeSection());
        content.appendChild(accentSection());
      } else if (section === "accent") {
        content.appendChild(accentSection());
      } else if (section === "wallpaper") {
        content.appendChild(wallpaperSection());
      } else {
        content.appendChild(systemSection());
      }
    }

    render();
  },
};
NatureOS.settingsApp = settingsApp;
})();
