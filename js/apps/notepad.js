(function () {
"use strict";
var store = NatureOS.store;
var uid = NatureOS.uid;
var notify = NatureOS.notify;
const SEED = [
  {
    id: "note-welcome",
    title: "Welcome to the canopy",
    text:
      "Welcome to Notes on CanopyOS.\n\nEverything you type here is saved to this browser automatically. Create a new note with the + button, delete with the trash button, and switch between notes in the sidebar.\n\nTry the Terminal app and type: forest",
    updated: Date.now(),
  },
  {
    id: "note-trail",
    title: "Trail checklist",
    text: "- Water bottle\n- Rain shell\n- Field journal\n- Binoculars\n- Trail mix\n- Compass",
    updated: Date.now() - 86400000,
  },
];

function loadNotes() {
  const saved = store.get("notes");
  if (Array.isArray(saved) && saved.length) return saved;
  store.set("notes", SEED);
  return SEED;
}

function titleFrom(text) {
  const first = text.split("\n").find((l) => l.trim().length);
  return (first || "Untitled note").trim().slice(0, 42);
}

function relative(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

const notesApp = {
  id: "notes",
  name: "Notes",
  icon: "📝",
  tagline: "Writing",
  keywords: ["notes", "notepad", "write", "text"],
  width: 720,
  height: 470,
  mount(body) {
    let notes = loadNotes();
    let activeId = store.get("activeNote") || notes[0].id;
    if (!notes.some((n) => n.id === activeId)) activeId = notes[0].id;
    let saveTimer = null;

    const root = document.createElement("div");
    root.className = "app";

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    const head = document.createElement("div");
    head.className = "toolbar";
    head.style.padding = "0 2px 8px";
    head.style.borderBottom = "none";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "icon-btn";
    addBtn.textContent = "+";
    addBtn.title = "New note";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.textContent = "🗑";
    delBtn.title = "Delete note";
    const count = document.createElement("span");
    count.style.fontSize = "11px";
    count.style.opacity = "0.6";
    head.appendChild(addBtn);
    head.appendChild(delBtn);
    head.appendChild(count);
    sidebar.appendChild(head);

    const list = document.createElement("div");
    list.className = "notes-list";
    sidebar.appendChild(list);

    const main = document.createElement("div");
    main.className = "app app-col";

    const editor = document.createElement("textarea");
    editor.className = "note-editor";
    editor.spellcheck = false;
    editor.placeholder = "Write something under the trees…";

    const footer = document.createElement("div");
    footer.className = "statusbar";
    const fLeft = document.createElement("span");
    const fRight = document.createElement("span");
    footer.appendChild(fLeft);
    footer.appendChild(fRight);

    main.appendChild(editor);
    main.appendChild(footer);
    root.appendChild(sidebar);
    root.appendChild(main);
    body.appendChild(root);

    function persist() {
      store.set("notes", notes);
      store.set("activeNote", activeId);
    }

    function active() {
      return notes.find((n) => n.id === activeId);
    }

    function renderList() {
      list.innerHTML = "";
      count.textContent = notes.length + " notes";
      notes
        .slice()
        .sort((a, b) => b.updated - a.updated)
        .forEach((note) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "note-item" + (note.id === activeId ? " active" : "");
          const t = document.createElement("div");
          t.className = "ni-title";
          t.textContent = note.title || "Untitled note";
          const s = document.createElement("div");
          s.className = "ni-sub";
          s.textContent = relative(note.updated) + " · " + (note.text.trim().split(/\s+/).filter(Boolean).length) + " words";
          b.appendChild(t);
          b.appendChild(s);
          b.addEventListener("click", () => {
            activeId = note.id;
            persist();
            renderList();
            renderEditor();
          });
          list.appendChild(b);
        });
    }

    function updateFooter() {
      const text = editor.value;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const lines = text.split("\n").length;
      fLeft.textContent = words + " words · " + chars + " characters · " + lines + " lines";
      const note = active();
      fRight.textContent = note ? "Saved " + relative(note.updated) : "";
    }

    function renderEditor() {
      const note = active();
      editor.value = note ? note.text : "";
      updateFooter();
    }

    editor.addEventListener("input", () => {
      const note = active();
      if (!note) return;
      note.text = editor.value;
      note.title = titleFrom(editor.value);
      note.updated = Date.now();
      updateFooter();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        persist();
        renderList();
      }, 350);
    });

    addBtn.addEventListener("click", () => {
      const note = { id: uid("note"), title: "Untitled note", text: "", updated: Date.now() };
      notes = [note, ...notes];
      activeId = note.id;
      persist();
      renderList();
      renderEditor();
      editor.focus();
    });

    delBtn.addEventListener("click", () => {
      if (notes.length <= 1) {
        notify("Cannot delete", "Keep at least one note in the grove.", "🍂");
        return;
      }
      const note = active();
      notes = notes.filter((n) => n.id !== activeId);
      activeId = notes[0].id;
      persist();
      renderList();
      renderEditor();
      notify("Note deleted", note ? note.title : "", "🗑");
    });

    renderList();
    renderEditor();
  },
};
NatureOS.notesApp = notesApp;
})();
