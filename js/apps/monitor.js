// monitor.js - lightweight system monitor with live process table & resource meters

const MonitorApp = (function() {
  function open() {
    let timer = null;

    WM.createWindow({
      id: 'monitor',
      title: 'System Monitor',
      width: 560,
      height: 380,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><polyline points="6 10 9 13 12 7 15 11 18 8"></polyline></svg>',
      render: (bodyEl) => {
        timer = initMonitor(bodyEl);
      },
      onClose: () => {
        if (timer) clearInterval(timer);
      }
    });
  }

  function initMonitor(container) {
    const processes = [
      { pid: 104, name: 'moonwm', cpu: 4.2, mem: '34 MB' },
      { pid: 142, name: 'panel', cpu: 1.8, mem: '18 MB' },
      { pid: 215, name: 'moonterm', cpu: 0.9, mem: '22 MB' },
      { pid: 288, name: 'fs-daemon', cpu: 0.2, mem: '8 MB' },
      { pid: 310, name: 'theme-engine', cpu: 0.1, mem: '6 MB' },
      { pid: 340, name: 'sandbox', cpu: 2.5, mem: '45 MB' }
    ];

    container.innerHTML = `
      <div class="monitor-app">
        <div class="monitor-metrics">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">CPU Cores (real)</span>
              <span class="metric-value" id="cores-val-text">—</span>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" id="cores-bar-fill" style="width: 0%"></div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Device Memory (real)</span>
              <span class="metric-value" id="mem-val-text">—</span>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" id="mem-bar-fill" style="width: 0%"></div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">JS Heap (live)</span>
              <span class="metric-value" id="heap-val-text">—</span>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" id="heap-bar-fill" style="width: 0%"></div>
            </div>
          </div>
        </div>

        <div class="monitor-table-wrapper">
          <div class="monitor-table-title">moonOS Processes</div>
          <table class="process-table">
            <thead>
              <tr>
                <th style="width: 60px">PID</th>
                <th>Name</th>
                <th style="width: 80px">CPU %</th>
                <th style="width: 90px">Memory</th>
              </tr>
            </thead>
            <tbody id="proc-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    const coresText = container.querySelector('#cores-val-text');
    const coresBar = container.querySelector('#cores-bar-fill');
    const memText = container.querySelector('#mem-val-text');
    const memBar = container.querySelector('#mem-bar-fill');
    const heapText = container.querySelector('#heap-val-text');
    const heapBar = container.querySelector('#heap-bar-fill');
    const tbody = container.querySelector('#proc-tbody');

    function renderProcesses() {
      tbody.innerHTML = processes.map(p => `
        <tr>
          <td>${p.pid}</td>
          <td>${p.name}</td>
          <td>${p.cpu.toFixed(1)}%</td>
          <td>${p.mem}</td>
        </tr>
      `).join('');
    }

    function tick() {
      // real CPU core count (static per device)
      const cores = navigator.hardwareConcurrency || 0;
      coresText.textContent = cores ? cores + ' cores' : 'n/a';
      coresBar.style.width = cores ? Math.min(100, (cores / 16) * 100) + '%' : '0%';

      // real device memory (Chromium-based browsers)
      const devMem = navigator.deviceMemory || 0;
      memText.textContent = devMem ? devMem + ' GB' : 'n/a';
      memBar.style.width = devMem ? Math.min(100, (devMem / 16) * 100) + '%' : '0%';

      // live JS heap of this tab (Chromium)
      const heapMB = (performance.memory && performance.memory.usedJSHeapSize)
        ? performance.memory.usedJSHeapSize / 1048576
        : 0;
      heapText.textContent = heapMB ? heapMB.toFixed(1) + ' MB' : 'n/a';
      heapBar.style.width = heapMB ? Math.min(100, (heapMB / 512) * 100) + '%' : '0%';

      // moonOS process table keeps its gentle simulated activity
      processes.forEach(p => {
        const delta = (Math.random() * 0.8) - 0.4;
        p.cpu = Math.max(0.1, p.cpu + delta);
      });

      renderProcesses();
    }

    renderProcesses();
    return setInterval(tick, 1000);
  }

  return {
    open
  };
})();
