(function () {
"use strict";
var notify = NatureOS.notify;
const FS = {
  name: "Canopy",
  icon: "🌲",
  type: "folder",
  children: [
    {
      name: "Documents",
      icon: "📁",
      type: "folder",
      children: [
        { name: "Field Notes.txt", icon: "📄", type: "file", size: "4 KB", kind: "Plain Text" },
        { name: "Trail Map.pdf", icon: "🗺️", type: "file", size: "1.2 MB", kind: "PDF Document" },
        { name: "Bird Census.csv", icon: "📊", type: "file", size: "22 KB", kind: "Spreadsheet" },
        {
          name: "Research",
          icon: "📁",
          type: "folder",
          children: [
            { name: "Moss Growth.md", icon: "📝", type: "file", size: "9 KB", kind: "Markdown" },
            { name: "Canopy Density.md", icon: "📝", type: "file", size: "12 KB", kind: "Markdown" },
            { name: "Soil Samples.json", icon: "🧪", type: "file", size: "38 KB", kind: "JSON" },
          ],
        },
      ],
    },
    {
      name: "Pictures",
      icon: "📁",
      type: "folder",
      children: [
        { name: "misty-morning.jpg", icon: "🖼️", type: "file", size: "3.4 MB", kind: "JPEG Image" },
        { name: "red-fox.jpg", icon: "🦊", type: "file", size: "2.8 MB", kind: "JPEG Image" },
        { name: "waterfall.jpg", icon: "🖼️", type: "file", size: "5.1 MB", kind: "JPEG Image" },
        { name: "deer-dawn.jpg", icon: "🦌", type: "file", size: "4.2 MB", kind: "JPEG Image" },
        {
          name: "Seasons",
          icon: "📁",
          type: "folder",
          children: [
            { name: "spring.png", icon: "🌸", type: "file", size: "1.9 MB", kind: "PNG Image" },
            { name: "summer.png", icon: "🌞", type: "file", size: "2.1 MB", kind: "PNG Image" },
            { name: "autumn.png", icon: "🍂", type: "file", size: "2.4 MB", kind: "PNG Image" },
            { name: "winter.png", icon: "❄️", type: "file", size: "1.7 MB", kind: "PNG Image" },
          ],
        },
      ],
    },
    {
      name: "Music",
      icon: "📁",
      type: "folder",
      children: [
        { name: "Rain On Leaves.wav", icon: "🎵", type: "file", size: "18 MB", kind: "Audio" },
        { name: "Dawn Chorus.wav", icon: "🎵", type: "file", size: "24 MB", kind: "Audio" },
        { name: "Distant Thunder.wav", icon: "🎵", type: "file", size: "12 MB", kind: "Audio" },
        { name: "Wind Through Pines.wav", icon: "🎵", type: "file", size: "31 MB", kind: "Audio" },
      ],
    },
    {
      name: "Projects",
      icon: "📁",
      type: "folder",
      children: [
        {
          name: "canopyos",
          icon: "📁",
          type: "folder",
          children: [
            { name: "index.html", icon: "🌐", type: "file", size: "6 KB", kind: "HTML" },
            { name: "main.js", icon: "⚙️", type: "file", size: "14 KB", kind: "JavaScript" },
            { name: "base.css", icon: "🎨", type: "file", size: "11 KB", kind: "Stylesheet" },
            { name: "README.md", icon: "📝", type: "file", size: "3 KB", kind: "Markdown" },
          ],
        },
        { name: "leafmeter", icon: "📁", type: "folder", children: [{ name: "sensor.py", icon: "🐍", type: "file", size: "7 KB", kind: "Python" }] },
        { name: "ideas.txt", icon: "📄", type: "file", size: "2 KB", kind: "Plain Text" },
      ],
    },
    { name: "Trailhead.webloc", icon: "🔗", type: "file", size: "1 KB", kind: "Web Link" },
    { name: "Compass.app", icon: "🧭", type: "file", size: "820 KB", kind: "Application" },
  ],
};

const SIDEBAR = ["Documents", "Pictures", "Music", "Projects"];

function resolve(path) {
  let node = FS;
  for (const part of path) {
    const next = (node.children || []).find((c) => c.name === part);
    if (!next) return node;
    node = next;
  }
  return node;
}

const filesApp = {
  id: "files",
  name: "Finder",
  icon: "🌲",
  tagline: "Files",
  keywords: ["finder", "files", "folders", "documents"],
  width: 780,
  height: 500,
  mount(body) {
    let path = [];
    const history = [];

    const root = document.createElement("div");
    root.className = "app";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    const sTitle = document.createElement("div");
    sTitle.className = "sidebar-title";
    sTitle.textContent = "Favorites";
    sidebar.appendChild(sTitle);

    const homeBtn = document.createElement("button");
    homeBtn.type = "button";
    homeBtn.className = "sidebar-item";
    homeBtn.textContent = "🌲 Canopy";
    homeBtn.addEventListener("click", () => navigate([]));
    sidebar.appendChild(homeBtn);

    const sideButtons = SIDEBAR.map((name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sidebar-item";
      b.textContent = "📁 " + name;
      b.addEventListener("click", () => navigate([name]));
      sidebar.appendChild(b);
      return { name, el: b };
    });

    const main = document.createElement("div");
    main.className = "app app-col";

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "icon-btn";
    back.textContent = "‹";
    back.title = "Back";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "icon-btn";
    up.textContent = "↑";
    up.title = "Enclosing folder";
    const crumb = document.createElement("div");
    crumb.className = "breadcrumb";
    toolbar.appendChild(back);
    toolbar.appendChild(up);
    toolbar.appendChild(crumb);

    const grid = document.createElement("div");
    grid.className = "file-grid app-scroll";

    const status = document.createElement("div");
    status.className = "statusbar";
    const statusLeft = document.createElement("span");
    const statusRight = document.createElement("span");
    status.appendChild(statusLeft);
    status.appendChild(statusRight);

    main.appendChild(toolbar);
    main.appendChild(grid);
    main.appendChild(status);
    root.appendChild(sidebar);
    root.appendChild(main);
    body.appendChild(root);

    back.addEventListener("click", () => {
      if (!history.length) return;
      path = history.pop();
      render();
    });
    up.addEventListener("click", () => {
      if (!path.length) return;
      history.push([...path]);
      path = path.slice(0, -1);
      render();
    });

    function navigate(next) {
      history.push([...path]);
      path = next;
      render();
    }

    function renderCrumb() {
      crumb.innerHTML = "";
      const parts = ["Canopy", ...path];
      parts.forEach((p, i) => {
        if (i > 0) {
          const sep = document.createElement("span");
          sep.textContent = "›";
          crumb.appendChild(sep);
        }
        const b = document.createElement("b");
        b.textContent = p;
        b.style.cursor = "pointer";
        b.addEventListener("click", () => navigate(path.slice(0, i)));
        crumb.appendChild(b);
      });
    }

    function render() {
      const node = resolve(path);
      const children = node.children || [];
      renderCrumb();
      back.disabled = history.length === 0;
      up.disabled = path.length === 0;
      sideButtons.forEach((s) => s.el.classList.toggle("active", path[0] === s.name));
      homeBtn.classList.toggle("active", path.length === 0);

      grid.innerHTML = "";
      children.forEach((child) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "file-tile";
        const icon = document.createElement("span");
        icon.className = "ft-icon";
        icon.textContent = child.icon;
        const name = document.createElement("span");
        name.className = "ft-name";
        name.textContent = child.name;
        const meta = document.createElement("span");
        meta.className = "ft-meta";
        meta.textContent = child.type === "folder" ? (child.children || []).length + " items" : child.size;
        tile.appendChild(icon);
        tile.appendChild(name);
        tile.appendChild(meta);

        tile.addEventListener("click", () => {
          grid.querySelectorAll(".file-tile").forEach((t) => t.classList.remove("selected"));
          tile.classList.add("selected");
          statusRight.textContent =
            child.type === "folder" ? "Folder selected" : child.kind + " · " + child.size;
        });
        tile.addEventListener("dblclick", () => {
          if (child.type === "folder") navigate([...path, child.name]);
          else notify(child.name, "No application is bound to " + child.kind + " yet.", child.icon);
        });
        grid.appendChild(tile);
      });

      const folders = children.filter((c) => c.type === "folder").length;
      statusLeft.textContent = children.length + " items · " + folders + " folders";
      statusRight.textContent = "Canopy Volume · 128 GB free";
    }

    render();
  },
};
NatureOS.filesApp = filesApp;
})();
