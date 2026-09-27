// paint.js - Paint: a small drawing studio. Brush + eraser + shapes
// (line, rectangle, circle), color palette + custom picker, brush size,
// undo stack, clear, and PNG download. All pointer-event based so it
// works with mouse and touch.

const PaintApp = (function() {
  const PALETTE = ['#000000', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
  const UNDO_LIMIT = 25;

  function open() {
    WM.createWindow({
      id: 'paint',
      title: 'Paint',
      width: 720,
      height: 600,
      minWidth: 560,
      minHeight: 480,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><circle cx="11" cy="11" r="2"></circle></svg>',
      render: (bodyEl) => {
        initPaint(bodyEl);
      }
    });
  }

  function initPaint(container) {
    container.innerHTML = `
      <div class="paint-app">
        <div class="paint-toolbar">
          <div class="paint-tools">
            <button class="paint-tool active" data-tool="brush" title="Brush">🖌️</button>
            <button class="paint-tool" data-tool="eraser" title="Eraser">🧽</button>
            <button class="paint-tool" data-tool="line" title="Line">📏</button>
            <button class="paint-tool" data-tool="rect" title="Rectangle">▭</button>
            <button class="paint-tool" data-tool="circle" title="Circle">⚪</button>
          </div>
          <div class="paint-palette">
            ${PALETTE.map(c => `<button class="paint-swatch" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}
            <input type="color" class="paint-custom" value="#3b82f6" title="Custom color" />
          </div>
          <div class="paint-size-wrap">
            <span>Size</span>
            <input type="range" class="paint-size" min="1" max="40" value="5" />
          </div>
          <div class="paint-actions">
            <button class="paint-undo" title="Undo">↩ Undo</button>
            <button class="paint-clear" title="Clear canvas">🗑 Clear</button>
            <button class="paint-save" title="Download PNG">⬇ Save</button>
          </div>
        </div>
        <div class="paint-canvas-wrap">
          <canvas class="paint-canvas"></canvas>
        </div>
      </div>
    `;

    const canvas = container.querySelector('.paint-canvas');
    const wrap = container.querySelector('.paint-canvas-wrap');
    const ctx = canvas.getContext('2d');

    // fixed internal resolution, CSS scales it
    canvas.width = 960;
    canvas.height = 640;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let tool = 'brush';
    let color = '#000000';
    let size = 5;
    let drawing = false;
    let startX = 0, startY = 0;
    let snapshot = null;
    const undoStack = [];

    function pushUndo() {
      try {
        undoStack.push(canvas.toDataURL());
        if (undoStack.length > UNDO_LIMIT) undoStack.shift();
      } catch (e) {}
    }

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height)
      };
    }

    function strokeStyle() {
      return tool === 'eraser' ? '#ffffff' : color;
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = pos(e);
      drawing = true;
      startX = p.x;
      startY = p.y;
      pushUndo();
      if (tool === 'brush' || tool === 'eraser') {
        ctx.strokeStyle = strokeStyle();
        ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 0.1, p.y + 0.1);
        ctx.stroke();
      } else {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      if (tool === 'brush' || tool === 'eraser') {
        ctx.strokeStyle = strokeStyle();
        ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.beginPath();
        if (tool === 'line') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(p.x, p.y);
        } else if (tool === 'rect') {
          ctx.rect(startX, startY, p.x - startX, p.y - startY);
        } else if (tool === 'circle') {
          const r = Math.hypot(p.x - startX, p.y - startY);
          ctx.arc(startX, startY, r, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    });

    function endStroke(e) {
      if (!drawing) return;
      drawing = false;
      snapshot = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);

    container.querySelectorAll('.paint-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tool = btn.getAttribute('data-tool');
      });
    });

    container.querySelectorAll('.paint-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        color = sw.getAttribute('data-color');
        container.querySelectorAll('.paint-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      });
    });
    container.querySelector('.paint-swatch').classList.add('active');

    container.querySelector('.paint-custom').addEventListener('input', (e) => {
      color = e.target.value;
      container.querySelectorAll('.paint-swatch').forEach(s => s.classList.remove('active'));
    });

    container.querySelector('.paint-size').addEventListener('input', (e) => {
      size = parseInt(e.target.value, 10) || 5;
    });

    container.querySelector('.paint-undo').addEventListener('click', () => {
      const prev = undoStack.pop();
      if (!prev) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = prev;
    });

    container.querySelector('.paint-clear').addEventListener('click', () => {
      pushUndo();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    container.querySelector('.paint-save').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'moonos-drawing-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (window.Notify) Notify.show('Drawing saved as PNG', 'success');
    });
  }

  return { open };
})();

window.PaintApp = PaintApp;
