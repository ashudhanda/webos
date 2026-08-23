(function () {
"use strict";
var WALLPAPERS = NatureOS.WALLPAPERS;
var wallpaperStyle = NatureOS.wallpaperStyle;
var applyWallpaper = NatureOS.applyWallpaper;
var notify = NatureOS.notify;
const photosApp = {
  id: "photos",
  name: "Photos",
  icon: "🦊",
  tagline: "Gallery",
  keywords: ["photos", "gallery", "images", "pictures", "wallpaper"],
  width: 760,
  height: 520,
  mount(body) {
    const root = document.createElement("div");
    root.className = "app app-col";

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";
    const title = document.createElement("div");
    title.className = "breadcrumb";
    title.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = "Forest Library";
    title.appendChild(b);
    const count = document.createElement("span");
    count.style.marginLeft = "auto";
    count.style.fontSize = "12px";
    count.style.opacity = "0.6";
    count.textContent = WALLPAPERS.length + " photos";
    toolbar.appendChild(title);
    toolbar.appendChild(count);

    const grid = document.createElement("div");
    grid.className = "photo-grid app-scroll";

    root.appendChild(toolbar);
    root.appendChild(grid);
    body.appendChild(root);

    let lightbox = null;
    let index = 0;

    WALLPAPERS.forEach((wp, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "photo-cell";
      cell.style.backgroundImage = wallpaperStyle(wp);
      const label = document.createElement("span");
      label.textContent = wp.name;
      cell.appendChild(label);
      cell.addEventListener("click", () => openLightbox(i));
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        applyWallpaper(wp.id);
      });
      grid.appendChild(cell);
    });

    function renderLightbox() {
      const wp = WALLPAPERS[index];
      const img = lightbox.querySelector("img");
      const fallback = lightbox.querySelector(".lb-fallback");
      if (wp.url) {
        img.src = wp.url;
        img.style.display = "";
        fallback.style.display = "none";
      } else {
        img.style.display = "none";
        fallback.style.display = "";
        fallback.style.background = wp.css;
      }
      lightbox.querySelector(".lb-caption").textContent =
        wp.name + " · " + (index + 1) + " of " + WALLPAPERS.length + " · right-click a tile to set as wallpaper";
    }

    function step(delta) {
      index = (index + delta + WALLPAPERS.length) % WALLPAPERS.length;
      renderLightbox();
    }

    function openLightbox(i) {
      index = i;
      if (!lightbox) {
        lightbox = document.createElement("div");
        lightbox.className = "lightbox";
        const img = document.createElement("img");
        img.alt = "Nature photograph";
        const fallback = document.createElement("div");
        fallback.className = "lb-fallback";
        fallback.style.width = "70%";
        fallback.style.height = "70%";
        fallback.style.borderRadius = "12px";
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "lb-nav lb-prev";
        prev.textContent = "‹";
        const next = document.createElement("button");
        next.type = "button";
        next.className = "lb-nav lb-next";
        next.textContent = "›";
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "lb-close";
        closeBtn.textContent = "✕";
        const caption = document.createElement("div");
        caption.className = "lb-caption";
        const setBtn = document.createElement("button");
        setBtn.type = "button";
        setBtn.className = "accent-btn";
        setBtn.textContent = "Set as wallpaper";
        setBtn.style.position = "absolute";
        setBtn.style.bottom = "46px";
        setBtn.style.left = "50%";
        setBtn.style.transform = "translateX(-50%)";
        setBtn.addEventListener("click", () => applyWallpaper(WALLPAPERS[index].id));

        prev.addEventListener("click", () => step(-1));
        next.addEventListener("click", () => step(1));
        closeBtn.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (e) => {
          if (e.target === lightbox) closeLightbox();
        });

        lightbox.appendChild(img);
        lightbox.appendChild(fallback);
        lightbox.appendChild(prev);
        lightbox.appendChild(next);
        lightbox.appendChild(closeBtn);
        lightbox.appendChild(setBtn);
        lightbox.appendChild(caption);
        body.appendChild(lightbox);
        body.tabIndex = 0;
      }
      lightbox.style.display = "";
      renderLightbox();
      body.focus();
    }

    function closeLightbox() {
      if (lightbox) lightbox.style.display = "none";
    }

    body.tabIndex = 0;
    body.addEventListener("keydown", (e) => {
      if (!lightbox || lightbox.style.display === "none") return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    notify("Photos", "Right-click any photo to set it as your wallpaper.", "🦊");
  },
};
NatureOS.photosApp = photosApp;
})();
