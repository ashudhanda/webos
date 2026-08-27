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
    let cpuVal = 34;
    let ramVal = 42;

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
              <span class="metric-label">CPU Usage</span>
              <span class="metric-value" id="cpu-val-text">34%</span>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" id="cpu-bar-fill" style="width: 34%"></div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Memory Usage</span>
              <span class="metric-value" id="ram-val-text">1.68 / 4.00 GB (42%)</span>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" id="ram-bar-fill" style="width: 42%"></div>
            </div>
          </div>
        </div>

        <div class="monitor-table-wrapper">
          <div class="monitor-table-title">Active System Processes</div>
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

    const cpuText = container.querySelector('#cpu-val-text');
    const cpuBar = container.querySelector('#cpu-bar-fill');
    const ramText = container.querySelector('#ram-val-text');
    const ramBar = container.querySelector('#ram-bar-fill');
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
      // random walk between 20% and 60%
      const cpuDelta = (Math.random() * 8) - 4;
      cpuVal = Math.min(62, Math.max(18, Math.round(cpuVal + cpuDelta)));

      // ram hovering around 42% +/- 3
      const ramDelta = (Math.random() * 2) - 1;
      ramVal = Math.min(45, Math.max(39, Math.round(ramVal + ramDelta)));
      const ramGb = ((ramVal / 100) * 4).toFixed(2);

      cpuText.textContent = `${cpuVal}%`;
      cpuBar.style.width = `${cpuVal}%`;

      ramText.textContent = `${ramGb} / 4.00 GB (${ramVal}%)`;
      ramBar.style.width = `${ramVal}%`;

      // slight fluctuations in process cpu
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
