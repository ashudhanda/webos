// ===== Window open/close =====
function openWindow(id) {
  const win = document.getElementById(id);
  win.style.display = "block";
  bringToFront(win);
}

function closeWindow(id) {
  document.getElementById(id).style.display = "none";
}

// ===== Drag system (mission requirement #1) =====
let topZ = 10;

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
}

document.querySelectorAll(".window").forEach((win) => {
  const bar = win.querySelector(".titlebar");
  let offsetX = 0, offsetY = 0, dragging = false;

  bar.addEventListener("pointerdown", (e) => {
    dragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    bringToFront(win);
  });

  document.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    win.style.left = e.clientX - offsetX + "px";
    win.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("pointerup", () => (dragging = false));
});

// ===== Taskbar clock =====
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 1000);