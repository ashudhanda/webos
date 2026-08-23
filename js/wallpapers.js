(function () {
"use strict";
var store = NatureOS.store;
var notify = NatureOS.notify;
const U = (id, w) =>
  "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + (w || 2000) + "&q=80";

const WALLPAPERS = [
  { id: "misty-forest", name: "Misty Forest", url: U("1441974231531-c6227db76b6e") },
  { id: "sun-rays", name: "Sun Rays", url: U("1502082553048-f009c37129b9") },
  { id: "deer", name: "Deer at Dawn", url: U("1484406566174-9da000fda645") },
  { id: "fox", name: "Red Fox", url: U("1474511320723-9a56873867b5") },
  { id: "waterfall", name: "Waterfall", url: U("1432405972618-c60b0225b8f9") },
  { id: "mountains", name: "Pine Mountains", url: U("1454496522488-7a8e488e8606") },
  { id: "lake", name: "Still Lake", url: U("1439853949127-fa647821eba0") },
  { id: "autumn", name: "Autumn Forest", url: U("1507371341162-763b5e419408") },
  { id: "night-forest", name: "Night Forest", url: U("1470071459604-3b5ec3a7fe05") },
  { id: "green-leaves", name: "Green Leaves", url: U("1466692476868-aef1dfb1e735") },
  { id: "canopy", name: "Canopy Above", url: U("1425913397330-cf8af2ff40a1") },
  { id: "river", name: "Forest River", url: U("1447752875215-b2761acb3c5d") },
  {
    id: "gradient-emerald",
    name: "Emerald Fade",
    css: "radial-gradient(circle at 20% 15%, #1e6b46 0%, #0d3325 45%, #04140e 100%)",
  },
  {
    id: "gradient-dusk",
    name: "Forest Dusk",
    css: "linear-gradient(160deg, #2a1a3f 0%, #123245 45%, #0a2b25 78%, #051611 100%)",
  },
  {
    id: "gradient-amber",
    name: "Amber Grove",
    css: "linear-gradient(200deg, #5a2c0c 0%, #7d4a12 35%, #23401f 75%, #0b1a0e 100%)",
  },
];

function getWallpaper(id) {
  return WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
}

function wallpaperStyle(wp) {
  return wp.css ? wp.css : "url('" + wp.url + "')";
}

const listeners = new Set();

function onWallpaperChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function applyWallpaper(id, silent) {
  const wp = getWallpaper(id);
  const layer = document.getElementById("wallpaper");
  if (layer) {
    layer.style.backgroundImage = wallpaperStyle(wp);
    layer.style.opacity = "0.35";
    requestAnimationFrame(() => {
      layer.style.opacity = "1";
    });
  }
  store.set("wallpaper", wp.id);
  listeners.forEach((fn) => fn(wp));
  if (!silent) notify("Wallpaper changed", wp.name, "🌄");
  return wp;
}

function randomWallpaper() {
  const current = store.get("wallpaper");
  const pool = WALLPAPERS.filter((w) => w.id !== current);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return applyWallpaper(pick.id);
}

function preloadWallpapers() {
  WALLPAPERS.filter((w) => w.url)
    .slice(0, 6)
    .forEach((w) => {
      const img = new Image();
      img.src = w.url;
    });
}
NatureOS.WALLPAPERS = WALLPAPERS;
NatureOS.getWallpaper = getWallpaper;
NatureOS.wallpaperStyle = wallpaperStyle;
NatureOS.onWallpaperChange = onWallpaperChange;
NatureOS.applyWallpaper = applyWallpaper;
NatureOS.randomWallpaper = randomWallpaper;
NatureOS.preloadWallpapers = preloadWallpapers;
})();
