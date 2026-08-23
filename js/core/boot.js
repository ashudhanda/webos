(function () {
"use strict";
var formatTime = NatureOS.formatTime;
var formatDate = NatureOS.formatDate;
const MESSAGES = [
  "Waking the forest…",
  "Growing the canopy…",
  "Loading moss drivers…",
  "Calibrating birdsong…",
  "Filtering morning mist…",
  "Ready.",
];

function runBoot(duration) {
  const total = duration || 2200;
  const boot = document.getElementById("boot");
  const fill = document.getElementById("boot-bar-fill");
  const status = document.getElementById("boot-status");
  const started = performance.now();

  return new Promise((resolve) => {
    const step = (now) => {
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / total);
      fill.style.width = (progress * 100).toFixed(1) + "%";
      const index = Math.min(MESSAGES.length - 1, Math.floor(progress * MESSAGES.length));
      if (status.textContent !== MESSAGES[index]) status.textContent = MESSAGES[index];
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        boot.classList.add("fade-out");
        setTimeout(() => {
          boot.classList.add("hidden");
          resolve();
        }, 700);
      }
    };
    requestAnimationFrame(step);
  });
}

function showLockScreen() {
  const lock = document.getElementById("lock");
  const timeEl = document.getElementById("lock-time");
  const dateEl = document.getElementById("lock-date");

  lock.classList.remove("hidden", "fade-out");

  const tick = () => {
    const now = new Date();
    timeEl.textContent = formatTime(now, false).replace(/\s(AM|PM)/, "");
    dateEl.textContent = formatDate(now);
  };
  tick();
  const timer = setInterval(tick, 1000);

  return new Promise((resolve) => {
    const unlock = () => {
      lock.removeEventListener("click", unlock);
      document.removeEventListener("keydown", onKey);
      clearInterval(timer);
      lock.classList.add("fade-out");
      setTimeout(() => {
        lock.classList.add("hidden");
        resolve();
      }, 500);
    };
    const onKey = () => unlock();
    lock.addEventListener("click", unlock);
    document.addEventListener("keydown", onKey);
  });
}
NatureOS.runBoot = runBoot;
NatureOS.showLockScreen = showLockScreen;
})();
