(function () {
"use strict";
var store = NatureOS.store;
var THEMES = NatureOS.THEMES;
var WALLPAPERS = NatureOS.WALLPAPERS;
function uptime(start) {
  const s = Math.floor((Date.now() - start) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (h ? h + "h " : "") + m + "m " + (s % 60) + "s";
}

const BOOTED_AT = Date.now();

const aboutApp = {
  id: "about",
  name: "About",
  icon: "ℹ️",
  tagline: "System info",
  keywords: ["about", "info", "credits", "version"],
  width: 520,
  height: 560,
  mount(body) {
    const root = document.createElement("div");
    root.className = "about";

    const logo = document.createElement("div");
    logo.className = "about-logo";
    logo.textContent = "🌲";
    const name = document.createElement("div");
    name.className = "about-name";
    name.textContent = "CANOPYOS";
    const ver = document.createElement("div");
    ver.className = "about-ver";
    ver.textContent = "Version 1.0 “Evergreen” · build 2026.04";
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.style.marginTop = "8px";
    badge.textContent = "Built for Hack Club Stardance";

    const stats = document.createElement("div");
    stats.className = "about-stats";

    const credit = document.createElement("div");
    credit.className = "about-credit";
    credit.textContent =
      "Handwritten in plain HTML, CSS and vanilla JavaScript — no frameworks, no build step, no backend. Wallpapers courtesy of Unsplash photographers. Ambient audio is synthesised live in your browser with the Web Audio API.";

    const tips = document.createElement("div");
    tips.className = "about-credit";
    tips.textContent =
      "Tips: Ctrl+K opens Spotlight · double-click a title bar to maximise · right-click the desktop for wallpaper and theme actions · drag the bottom-right corner of any window to resize.";

    root.appendChild(logo);
    root.appendChild(name);
    root.appendChild(ver);
    root.appendChild(badge);
    root.appendChild(stats);
    root.appendChild(credit);
    root.appendChild(tips);
    body.appendChild(root);

    function row(k, v) {
      const r = document.createElement("div");
      const a = document.createElement("span");
      a.textContent = k;
      const b = document.createElement("span");
      b.textContent = v;
      r.appendChild(a);
      r.appendChild(b);
      return r;
    }

    function render() {
      const themeName = (THEMES.find((t) => t.id === store.get("theme")) || THEMES[0]).name;
      stats.innerHTML = "";
      stats.appendChild(row("Kernel", "canopy-kernel 4.2.1-leaf"));
      stats.appendChild(row("Shell", "canopysh 1.0"));
      stats.appendChild(row("Window manager", "Understory WM"));
      stats.appendChild(row("Theme", themeName));
      stats.appendChild(row("Display", window.innerWidth + " × " + window.innerHeight + " @ " + window.devicePixelRatio + "x"));
      stats.appendChild(row("Cores", String(navigator.hardwareConcurrency || 8) + " logical"));
      stats.appendChild(row("Memory", "16 GB unified biomass"));
      stats.appendChild(row("Storage", "512 GB heartwood SSD"));
      stats.appendChild(row("Wallpapers", String(WALLPAPERS.length) + " installed"));
      stats.appendChild(row("Uptime", uptime(BOOTED_AT)));
      stats.appendChild(row("Language", navigator.language));
    }

    render();
    const timer = setInterval(render, 1000);
    body.addEventListener("DOMNodeRemovedFromDocument", () => clearInterval(timer));
    this.timer = timer;
  },
  onClose() {
    if (this.timer) clearInterval(this.timer);
  },
};
NatureOS.aboutApp = aboutApp;
})();
