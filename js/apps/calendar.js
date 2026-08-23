(function () {
"use strict";
var notify = NatureOS.notify;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SEASON_NOTE = {
  0: "Deep winter — bare canopy, tracks in snow.",
  1: "Late winter — first sap runs in the maples.",
  2: "Early spring — buds break, birds return.",
  3: "Spring — dawn chorus at its loudest.",
  4: "Late spring — full leaf-out overhead.",
  5: "Early summer — deep green shade below.",
  6: "Midsummer — long light, quiet noons.",
  7: "Late summer — berries and mushrooms.",
  8: "Early autumn — first colour in the crowns.",
  9: "Autumn — leaf fall and rutting deer.",
  10: "Late autumn — mist, moss, bare branches.",
  11: "Winter — owls calling across cold air.",
};

const calendarApp = {
  id: "calendar",
  name: "Calendar",
  icon: "📅",
  tagline: "Dates",
  keywords: ["calendar", "month", "date", "schedule"],
  width: 560,
  height: 500,
  mount(body) {
    const today = new Date();
    let view = new Date(today.getFullYear(), today.getMonth(), 1);

    const root = document.createElement("div");
    root.className = "cal";

    const head = document.createElement("div");
    head.className = "cal-head";
    const label = document.createElement("div");
    label.className = "cal-month";
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "8px";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "icon-btn";
    prev.textContent = "‹";
    const todayBtn = document.createElement("button");
    todayBtn.type = "button";
    todayBtn.className = "ghost-btn";
    todayBtn.textContent = "Today";
    const next = document.createElement("button");
    next.type = "button";
    next.className = "icon-btn";
    next.textContent = "›";
    controls.appendChild(prev);
    controls.appendChild(todayBtn);
    controls.appendChild(next);
    head.appendChild(label);
    head.appendChild(controls);

    const grid = document.createElement("div");
    grid.className = "cal-grid";

    const foot = document.createElement("div");
    foot.style.marginTop = "12px";
    foot.style.fontSize = "12px";
    foot.style.opacity = "0.7";

    root.appendChild(head);
    root.appendChild(grid);
    root.appendChild(foot);
    body.appendChild(root);

    function render() {
      const year = view.getFullYear();
      const month = view.getMonth();
      label.textContent = MONTHS[month] + " " + year;
      foot.textContent = "🌿 " + SEASON_NOTE[month];

      grid.innerHTML = "";
      DOW.forEach((d) => {
        const c = document.createElement("div");
        c.className = "cal-dow";
        c.textContent = d;
        grid.appendChild(c);
      });

      const first = new Date(year, month, 1).getDay();
      const days = new Date(year, month + 1, 0).getDate();
      const prevDays = new Date(year, month, 0).getDate();

      for (let i = first - 1; i >= 0; i -= 1) {
        const c = document.createElement("div");
        c.className = "cal-day pad";
        c.textContent = String(prevDays - i);
        grid.appendChild(c);
      }

      for (let d = 1; d <= days; d += 1) {
        const date = new Date(year, month, d);
        const c = document.createElement("button");
        c.type = "button";
        const isToday =
          d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        c.className = "cal-day" + (isToday ? " today" : "") + (weekend ? " weekend" : "");
        c.textContent = String(d);
        c.addEventListener("click", () => {
          notify(
            date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
            SEASON_NOTE[month],
            "📅",
          );
        });
        grid.appendChild(c);
      }

      const filled = first + days;
      const trailing = (7 - (filled % 7)) % 7;
      for (let i = 1; i <= trailing; i += 1) {
        const c = document.createElement("div");
        c.className = "cal-day pad";
        c.textContent = String(i);
        grid.appendChild(c);
      }
    }

    prev.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      render();
    });
    next.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      render();
    });
    todayBtn.addEventListener("click", () => {
      view = new Date(today.getFullYear(), today.getMonth(), 1);
      render();
    });

    render();
  },
};
NatureOS.calendarApp = calendarApp;
})();
