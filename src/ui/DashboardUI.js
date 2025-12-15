/**
 * Simplified Dashboard UI for the host - displays VR connection status
 */
export class DashboardUI {
  constructor() {
    this.container = null;
    this.playersPanel = null;
    this.networkPanel = null;
    this.eventLog = null;
    this.errorLog = null;

    this.maxLogEntries = 50;
    this.createUI();
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'dashboard';
    this.container.innerHTML = `
      <div class="dashboard-header">
        <h1>VR Game Host Dashboard</h1>
        <div class="header-status">
          <span id="dash-room-code" class="room-code-display"></span>
          <span id="dash-status" class="status-indicator status-waiting">Waiting for VR client...</span>
          <span id="dash-uptime">Uptime: 0:00</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel panel-players">
          <h2>VR Client <span id="player-count">(0)</span></h2>
          <div id="players-list" class="panel-content"></div>
        </div>

        <div class="panel panel-network">
          <h2>Network</h2>
          <div class="panel-content">
            <div class="stat-row">
              <span class="stat-label">VR Client:</span>
              <span id="stat-vr-client" class="stat-value">Not connected</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">VR Latency:</span>
              <span id="stat-vr-latency" class="stat-value">--</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Messages/s:</span>
              <span id="stat-msg-rate" class="stat-value">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Bandwidth:</span>
              <span id="stat-bandwidth" class="stat-value">0 KB/s</span>
            </div>
          </div>
        </div>

        <div class="panel panel-events">
          <h2>Event Log</h2>
          <div id="event-log" class="panel-content log-content"></div>
        </div>

        <div class="panel panel-errors">
          <h2>Errors</h2>
          <div id="error-log" class="panel-content log-content"></div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #dashboard {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #0f0f1a;
        font-family: 'SF Mono', 'Consolas', monospace;
        color: #e0e0e0;
        overflow: auto;
        padding: 20px;
        box-sizing: border-box;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #2a2a3a;
      }

      .dashboard-header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #fff;
      }

      .header-status {
        display: flex;
        gap: 20px;
        align-items: center;
        font-size: 13px;
      }

      .status-indicator {
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 500;
      }

      .status-waiting {
        background: #3d3d00;
        color: #ffd700;
      }

      .status-active {
        background: #003d00;
        color: #4ade80;
      }

      #dash-uptime {
        color: #888;
      }

      .room-code-display {
        background: #1a4a1a;
        color: #4ade80;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 3px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        max-width: 1000px;
      }

      .panel {
        background: #1a1a2e;
        border-radius: 8px;
        border: 1px solid #2a2a3a;
        overflow: hidden;
      }

      .panel h2 {
        margin: 0;
        padding: 12px 15px;
        font-size: 13px;
        font-weight: 600;
        background: #252538;
        border-bottom: 1px solid #2a2a3a;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .panel h2 span {
        font-weight: normal;
        color: #666;
      }

      .panel-content {
        padding: 12px 15px;
        max-height: 200px;
        overflow-y: auto;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #252538;
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: #888;
      }

      .stat-value {
        font-weight: 500;
        color: #4ade80;
      }

      .player-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        margin-bottom: 6px;
        background: #252538;
        border-radius: 4px;
        font-size: 12px;
      }

      .player-item .player-id {
        font-weight: 500;
      }

      .player-item .player-type {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        background: #5b21b6;
        color: #c4b5fd;
      }

      .log-content {
        font-size: 11px;
        max-height: 180px;
      }

      .log-entry {
        padding: 4px 0;
        border-bottom: 1px solid #252538;
        display: flex;
        gap: 10px;
      }

      .log-entry:last-child {
        border-bottom: none;
      }

      .log-time {
        color: #666;
        flex-shrink: 0;
      }

      .log-msg {
        color: #e0e0e0;
      }

      .log-entry.error .log-msg {
        color: #f87171;
      }

      .log-entry.warn .log-msg {
        color: #fbbf24;
      }

      .empty-state {
        color: #555;
        text-align: center;
        padding: 20px;
        font-size: 12px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.container);

    this.playersPanel = document.getElementById('players-list');
    this.eventLog = document.getElementById('event-log');
    this.errorLog = document.getElementById('error-log');

    // Initialize empty states
    this.playersPanel.innerHTML = '<div class="empty-state">No VR client connected</div>';
    this.eventLog.innerHTML = '<div class="empty-state">No events yet</div>';
    this.errorLog.innerHTML = '<div class="empty-state">No errors</div>';
  }

  updatePlayers(players, vrClientId) {
    document.getElementById('player-count').textContent = `(${players.size})`;

    if (players.size === 0) {
      this.playersPanel.innerHTML = '<div class="empty-state">No VR client connected</div>';
      document.getElementById('dash-status').textContent = 'Waiting for VR client...';
      document.getElementById('dash-status').className = 'status-indicator status-waiting';
      return;
    }

    document.getElementById('dash-status').textContent = 'VR Connected';
    document.getElementById('dash-status').className = 'status-indicator status-active';

    let html = '';
    players.forEach((player, playerId) => {
      html += `
        <div class="player-item">
          <span class="player-id">${playerId.substring(0, 12)}</span>
          <span class="player-type">VR</span>
        </div>
      `;
    });

    this.playersPanel.innerHTML = html;
  }

  updateNetworkStats(stats) {
    const vrClient = stats.vrClientId;
    document.getElementById('stat-vr-client').textContent = vrClient
      ? vrClient.substring(0, 12)
      : 'Not connected';
    document.getElementById('stat-vr-latency').textContent = stats.vrLatency
      ? `${stats.vrLatency}ms`
      : '--';
    document.getElementById('stat-msg-rate').textContent = stats.messageRate || 0;
    document.getElementById('stat-bandwidth').textContent = `${(stats.bandwidth || 0).toFixed(1)} KB/s`;
  }

  updateUptime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('dash-uptime').textContent = `Uptime: ${mins}:${secs.toString().padStart(2, '0')}`;
  }

  logEvent(message) {
    this._addLogEntry(this.eventLog, message, 'info');
  }

  logError(message) {
    this._addLogEntry(this.errorLog, message, 'error');
  }

  logWarning(message) {
    this._addLogEntry(this.eventLog, message, 'warn');
  }

  _addLogEntry(container, message, type) {
    // Remove empty state if present
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-msg">${message}</span>
    `;

    container.insertBefore(entry, container.firstChild);

    // Limit entries
    while (container.children.length > this.maxLogEntries) {
      container.removeChild(container.lastChild);
    }
  }

  setRoomCode(code) {
    const el = document.getElementById('dash-room-code');
    if (el) {
      el.textContent = `Room: ${code}`;
    }
  }

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'block';
  }
}
