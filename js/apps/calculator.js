(function () {
"use strict";
const KEYS = [
  { label: "AC", type: "fn", act: "clear" },
  { label: "⌫", type: "fn", act: "back" },
  { label: "%", type: "op", act: "%" },
  { label: "÷", type: "op", act: "/" },
  { label: "7", type: "num" },
  { label: "8", type: "num" },
  { label: "9", type: "num" },
  { label: "×", type: "op", act: "*" },
  { label: "4", type: "num" },
  { label: "5", type: "num" },
  { label: "6", type: "num" },
  { label: "−", type: "op", act: "-" },
  { label: "1", type: "num" },
  { label: "2", type: "num" },
  { label: "3", type: "num" },
  { label: "+", type: "op", act: "+" },
  { label: "0", type: "num", wide: true },
  { label: ".", type: "num" },
  { label: "=", type: "eq" },
];

function compute(a, op, b) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    case "%":
      return b === 0 ? NaN : a % b;
    default:
      return b;
  }
}

function display(value) {
  if (!isFinite(value)) return "Error";
  const rounded = Math.round(value * 1e10) / 1e10;
  if (Math.abs(rounded) >= 1e12) return rounded.toExponential(6);
  return String(rounded);
}

const calculatorApp = {
  id: "calculator",
  name: "Calculator",
  icon: "🧮",
  tagline: "Math",
  keywords: ["calculator", "math", "numbers", "sum"],
  width: 340,
  height: 470,
  minWidth: 300,
  minHeight: 420,
  mount(body) {
    let current = "0";
    let stored = null;
    let operator = null;
    let fresh = true;

    const root = document.createElement("div");
    root.className = "calc";

    const disp = document.createElement("div");
    disp.className = "calc-display";
    const expr = document.createElement("div");
    expr.className = "calc-expr";
    const value = document.createElement("div");
    value.className = "calc-value";
    disp.appendChild(expr);
    disp.appendChild(value);

    const grid = document.createElement("div");
    grid.className = "calc-grid";

    root.appendChild(disp);
    root.appendChild(grid);
    body.appendChild(root);

    const buttons = new Map();

    function render() {
      value.textContent = current;
      const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷", "%": "%" };
      expr.textContent = stored === null ? "" : display(stored) + " " + (symbols[operator] || "");
    }

    function inputDigit(d) {
      if (fresh) {
        current = d === "." ? "0." : d;
        fresh = false;
      } else if (d === ".") {
        if (!current.includes(".")) current += ".";
      } else if (current === "0") {
        current = d;
      } else if (current.replace("-", "").replace(".", "").length < 14) {
        current += d;
      }
      render();
    }

    function applyOperator(op) {
      const num = parseFloat(current);
      if (stored !== null && operator && !fresh) {
        const result = compute(stored, operator, num);
        stored = result;
        current = display(result);
      } else {
        stored = num;
      }
      operator = op;
      fresh = true;
      render();
    }

    function equals() {
      if (stored === null || !operator) return;
      const result = compute(stored, operator, parseFloat(current));
      current = display(result);
      stored = null;
      operator = null;
      fresh = true;
      render();
    }

    function clearAll() {
      current = "0";
      stored = null;
      operator = null;
      fresh = true;
      render();
    }

    function backspace() {
      if (fresh) return;
      current = current.length > 1 ? current.slice(0, -1) : "0";
      if (current === "-") current = "0";
      render();
    }

    KEYS.forEach((key) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "calc-key" + (key.type === "op" ? " op" : "") + (key.type === "eq" ? " eq" : "") + (key.wide ? " wide" : "");
      b.textContent = key.label;
      b.addEventListener("click", () => {
        if (key.type === "num") inputDigit(key.label);
        else if (key.type === "op") applyOperator(key.act);
        else if (key.type === "eq") equals();
        else if (key.act === "clear") clearAll();
        else if (key.act === "back") backspace();
      });
      buttons.set(key.act || key.label, b);
      grid.appendChild(b);
    });

    function flash(id) {
      const b = buttons.get(id);
      if (!b) return;
      b.classList.add("pressed");
      setTimeout(() => b.classList.remove("pressed"), 110);
    }

    body.tabIndex = 0;
    body.addEventListener("keydown", (e) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        inputDigit(k);
        flash(k);
      } else if (k === ".") {
        inputDigit(".");
        flash(".");
      } else if (["+", "-", "*", "/", "%"].includes(k)) {
        applyOperator(k);
        flash(k);
      } else if (k === "Enter" || k === "=") {
        e.preventDefault();
        equals();
        flash("=");
      } else if (k === "Backspace") {
        backspace();
        flash("back");
      } else if (k === "Escape" || k.toLowerCase() === "c") {
        clearAll();
        flash("clear");
      }
    });
    setTimeout(() => body.focus(), 50);

    render();
  },
};
NatureOS.calculatorApp = calculatorApp;
})();
