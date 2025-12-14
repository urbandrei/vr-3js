/**
 * Dashboard UI for the host - displays game state, players, physics stats, etc.
 */
export class DashboardUI {
  constructor() {
    this.container = null;
    this.playersPanel = null;
    this.physicsPanel = null;
    this.networkPanel = null;
    this.objectsPanel = null;
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
          <span id="dash-status" class="status-indicator status-waiting">Waiting for players...</span>
          <span id="dash-uptime">Uptime: 0:00</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel panel-players">
          <h2>Players <span id="player-count">(0)</span></h2>
          <div id="players-list" class="panel-content"></div>
        </div>

        <div class="panel panel-physics">
          <h2>Physics Stats</h2>
          <div class="panel-content">
            <div class="stat-row">
              <span class="stat-label">Bodies:</span>
              <span id="stat-bodies" class="stat-value">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Step Time:</span>
              <span id="stat-step-time" class="stat-value">0ms</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Collisions:</span>
              <span id="stat-collisions" class="stat-value">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Update Rate:</span>
              <span id="stat-update-rate" class="stat-value">0 Hz</span>
            </div>
          </div>
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

        <div class="panel panel-objects">
          <h2>Objects <span id="object-count">(0)</span></h2>
          <div id="objects-list" class="panel-content"></div>
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

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto auto;
        gap: 15px;
        max-width: 1400px;
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

      .panel-events, .panel-errors {
        grid-column: span 1;
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

      .player-item, .object-item {
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
      }

      .player-type.vr {
        background: #5b21b6;
        color: #c4b5fd;
      }

      .player-type.pc {
        background: #1e40af;
        color: #93c5fd;
      }

      .player-item .player-pos {
        color: #666;
        font-size: 11px;
      }

      .player-item .player-state {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
      }

      .state-walking { background: #065f46; color: #6ee7b7; }
      .state-held { background: #7c2d12; color: #fdba74; }
      .state-ragdoll { background: #7f1d1d; color: #fca5a5; }
      .state-recovering { background: #713f12; color: #fcd34d; }

      .object-item .object-id {
        font-weight: 500;
      }

      .object-item .object-status {
        color: #666;
        font-size: 11px;
      }

      .object-status.held {
        color: #fbbf24;
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
    this.objectsPanel = document.getElementById('objects-list');
    this.eventLog = document.getElementById('event-log');
    this.errorLog = document.getElementById('error-log');

    // Initialize empty states
    this.playersPanel.innerHTML = '<div class="empty-state">No players connected</div>';
    this.objectsPanel.innerHTML = '<div class="empty-state">No objects</div>';
    this.eventLog.innerHTML = '<div class="empty-state">No events yet</div>';
    this.errorLog.innerHTML = '<div class="empty-state">No errors</div>';
  }

  updatePlayers(players, vrClientId) {
    document.getElementById('player-count').textContent = `(${players.size})`;

    if (players.size === 0) {
      this.playersPanel.innerHTML = '<div class="empty-state">No players connected</div>';
      document.getElementById('dash-status').textContent = 'Waiting for players...';
      document.getElementById('dash-status').className = 'status-indicator status-waiting';
      return;
    }

    document.getElementById('dash-status').textContent = 'Active';
    document.getElementById('dash-status').className = 'status-indicator status-active';

    let html = '';
    players.forEach((player, playerId) => {
      const isVR = playerId === vrClientId;
      const type = isVR ? 'vr' : 'pc';
      const pos = player.position || { x: 0, y: 0, z: 0 };
      const state = player.state || 'walking';

      html += `
        <div class="player-item">
          <div>
            <span class="player-id">${playerId.substring(0, 12)}</span>
            <span class="player-type ${type}">${type}</span>
          </div>
          <span class="player-pos">(${pos.x?.toFixed(2) || 0}, ${pos.y?.toFixed(2) || 0}, ${pos.z?.toFixed(2) || 0})</span>
          <span class="player-state state-${state}">${state}</span>
        </div>
      `;
    });

    this.playersPanel.innerHTML = html;
  }

  updateObjects(objects) {
    document.getElementById('object-count').textContent = `(${objects.size})`;

    if (objects.size === 0) {
      this.objectsPanel.innerHTML = '<div class="empty-state">No objects</div>';
      return;
    }

    let html = '';
    objects.forEach((obj, objId) => {
      const heldBy = obj.heldBy;
      const status = heldBy ? `held: ${heldBy.substring(0, 8)}` : 'free';
      const statusClass = heldBy ? 'held' : '';

      html += `
        <div class="object-item">
          <span class="object-id">${objId}</span>
          <span class="object-status ${statusClass}">${status}</span>
        </div>
      `;
    });

    this.objectsPanel.innerHTML = html;
  }

  updatePhysicsStats(stats) {
    document.getElementById('stat-bodies').textContent = stats.bodyCount || 0;
    document.getElementById('stat-step-time').textContent = `${(stats.stepTime || 0).toFixed(2)}ms`;
    document.getElementById('stat-collisions').textContent = stats.collisionCount || 0;
    document.getElementById('stat-update-rate').textContent = `${stats.updateRate || 0} Hz`;
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

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'block';
  }
}
