(function () {
"use strict";
var wm = NatureOS.wm;
const MAX_SCALE = 1.75;
const RANGE = 130;

let items = [];
let dockEl = null;

function buildItem(app) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dock-item";
  btn.dataset.app = app.id;
  btn.setAttribute("aria-label", app.name);

  const tip = document.createElement("span");
  tip.className = "dock-tip";
  tip.textContent = app.name;

  const emoji = document.createElement("span");
  emoji.className = "emoji";
  emoji.textContent = app.icon;

  const dot = document.createElement("span");
  dot.className = "dot";

  btn.appendChild(tip);
  btn.appendChild(emoji);
  btn.appendChild(dot);

  btn.addEventListener("click", () => {
    const open = wm.windowsForApp(app.id);
    if (!open.length) {
      wm.open(app);
      return;
    }
    const target = open[0];
    wm.toggleMinimize(target.id);
  });

  return { app, el: btn, emoji };
}

function magnify(clientX) {
  items.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(clientX - center);
    let scale = 1;
    if (distance < RANGE) {
      const t = 1 - distance / RANGE;
      scale = 1 + (MAX_SCALE - 1) * Math.pow(t, 1.8);
    }
    const lift = (scale - 1) * 16;
    item.emoji.style.transform = "translateY(" + -lift.toFixed(2) + "px) scale(" + scale.toFixed(3) + ")";
  });
}

function resetMagnify() {
  items.forEach((item) => {
    item.emoji.style.transform = "translateY(0) scale(1)";
  });
}

function initDock(apps) {
  dockEl = document.getElementById("dock");
  dockEl.innerHTML = "";
  items = [];

  apps.forEach((app, index) => {
    if (app.dockSeparatorBefore && index > 0) {
      const sep = document.createElement("div");
      sep.className = "dock-sep";
      dockEl.appendChild(sep);
    }
    const item = buildItem(app);
    items.push(item);
    dockEl.appendChild(item.el);
  });

  dockEl.addEventListener("pointermove", (e) => {
    magnify(e.clientX);
  });
  dockEl.addEventListener("pointerleave", resetMagnify);

  wm.subscribe((openWindows) => {
    const running = new Set(openWindows.map((w) => w.app.id));
    items.forEach((item) => {
      item.el.classList.toggle("running", running.has(item.app.id));
    });
  });
}
NatureOS.initDock = initDock;
})();
