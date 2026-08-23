(function () {
"use strict";
let menuEl = null;

function ensure() {
  if (!menuEl) menuEl = document.getElementById("context-menu");
  return menuEl;
}

function closeContextMenu() {
  const menu = ensure();
  if (menu) menu.classList.add("hidden");
}

function openContextMenu(x, y, items) {
  const menu = ensure();
  if (!menu) return;
  menu.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    if (item.separator) {
      li.className = "sep";
      menu.appendChild(li);
      return;
    }
    const icon = document.createElement("span");
    icon.textContent = item.icon || "•";
    const label = document.createElement("span");
    label.textContent = item.label;
    li.appendChild(icon);
    li.appendChild(label);
    li.addEventListener("click", () => {
      closeContextMenu();
      if (typeof item.action === "function") item.action();
    });
    menu.appendChild(li);
  });
  menu.classList.remove("hidden");
  const rect = menu.getBoundingClientRect();
  const px = Math.min(x, window.innerWidth - rect.width - 10);
  const py = Math.min(y, window.innerHeight - rect.height - 10);
  menu.style.left = Math.max(6, px) + "px";
  menu.style.top = Math.max(34, py) + "px";
}

function initContextMenu(targetSelector, buildItems) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  target.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".window") || e.target.closest(".dock") || e.target.closest(".menubar")) return;
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, buildItems(e));
  });
  document.addEventListener("pointerdown", (e) => {
    const menu = ensure();
    if (menu && !menu.classList.contains("hidden") && !menu.contains(e.target)) closeContextMenu();
  });
  window.addEventListener("blur", closeContextMenu);
  window.addEventListener("resize", closeContextMenu);
}
NatureOS.closeContextMenu = closeContextMenu;
NatureOS.openContextMenu = openContextMenu;
NatureOS.initContextMenu = initContextMenu;
})();
