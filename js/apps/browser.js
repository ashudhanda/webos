(function () {
"use strict";
var store = NatureOS.store;
var notify = NatureOS.notify;
const LINKS = [
  { label: "🌲 Wikipedia: Forest", url: "https://en.wikipedia.org/wiki/Forest" },
  { label: "🦊 Wikipedia: Red fox", url: "https://en.wikipedia.org/wiki/Red_fox" },
  { label: "📚 MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web" },
  { label: "🛠 Hack Club", url: "https://hackclub.com/" },
  { label: "🌍 Wikipedia: Biome", url: "https://en.wikipedia.org/wiki/Biome" },
  { label: "🍃 Wikipedia: Leaf", url: "https://en.wikipedia.org/wiki/Leaf" },
];

function normalize(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return "https://" + trimmed;
  return "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(trimmed);
}

const browserApp = {
  id: "browser",
  name: "Browser",
  icon: "🍃",
  tagline: "Web",
  keywords: ["browser", "web", "internet", "wikipedia"],
  width: 900,
  height: 600,
  mount(body) {
    const root = document.createElement("div");
    root.className = "app app-col";

    const bar = document.createElement("div");
    bar.className = "browser-bar";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "icon-btn";
    back.textContent = "‹";
    const forward = document.createElement("button");
    forward.type = "button";
    forward.className = "icon-btn";
    forward.textContent = "›";
    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "icon-btn";
    reload.textContent = "⟳";
    const field = document.createElement("input");
    field.className = "url-field";
    field.spellcheck = false;
    field.placeholder = "Search or enter a website";
    const go = document.createElement("button");
    go.type = "button";
    go.className = "accent-btn";
    go.textContent = "Go";
    const openExternal = document.createElement("button");
    openExternal.type = "button";
    openExternal.className = "ghost-btn";
    openExternal.textContent = "↗";
    openExternal.title = "Open in a real browser tab";
    bar.appendChild(back);
    bar.appendChild(forward);
    bar.appendChild(reload);
    bar.appendChild(field);
    bar.appendChild(go);
    bar.appendChild(openExternal);

    const chips = document.createElement("div");
    chips.className = "chips";
    LINKS.forEach((link) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.textContent = link.label;
      c.addEventListener("click", () => navigate(link.url));
      chips.appendChild(c);
    });

    const frame = document.createElement("iframe");
    frame.className = "browser-frame";
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");

    const note = document.createElement("div");
    note.className = "browser-note";
    note.textContent =
      "Some sites (Google, YouTube, X, Instagram) refuse to load inside frames for security reasons. Use ↗ to open those in a real tab.";

    root.appendChild(bar);
    root.appendChild(chips);
    root.appendChild(frame);
    root.appendChild(note);
    body.appendChild(root);

    const history = [];
    let cursor = -1;

    function load(url) {
      field.value = url;
      frame.src = url;
      store.set("browserUrl", url);
      back.disabled = cursor <= 0;
      forward.disabled = cursor >= history.length - 1;
    }

    function navigate(raw) {
      const url = normalize(raw);
      if (!url) return;
      history.splice(cursor + 1);
      history.push(url);
      cursor = history.length - 1;
      load(url);
    }

    back.addEventListener("click", () => {
      if (cursor <= 0) return;
      cursor -= 1;
      load(history[cursor]);
    });
    forward.addEventListener("click", () => {
      if (cursor >= history.length - 1) return;
      cursor += 1;
      load(history[cursor]);
    });
    reload.addEventListener("click", () => {
      frame.src = frame.src;
      notify("Reloading", field.value, "🍃");
    });
    go.addEventListener("click", () => navigate(field.value));
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") navigate(field.value);
    });
    openExternal.addEventListener("click", () => {
      const url = normalize(field.value);
      if (url) window.open(url, "_blank", "noopener");
    });

    navigate(store.get("browserUrl") || LINKS[0].url);
  },
};
NatureOS.browserApp = browserApp;
})();
