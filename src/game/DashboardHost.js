import { networkManager, PlayerType } from '../network/NetworkManager.js';
import { hostManager } from '../network/HostManager.js';
import { MessageTypes } from '../network/MessageTypes.js';
import { DashboardUI } from '../ui/DashboardUI.js';

/**
 * Dashboard Host - host with monitoring UI
 * Receives VR hand data over network, broadcasts state
 */
export class DashboardHost {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
    this.dashboardUI = null;

    // Timing
    this.uptimeInterval = null;
    this.startTime = Date.now();

    // Stats tracking
    this.lastStatsTime = Date.now();
    this.messageCount = 0;
    this.bytesReceived = 0;

    // VR client tracking
    this.vrClientId = null;
    this.lastVRHandTime = 0;
    this.vrLatency = 0;
  }

  async start() {
    this.lobbyUI.hide();

    // Create dashboard UI
    this.dashboardUI = new DashboardUI();
    this.dashboardUI.logEvent('Dashboard host starting...');

    try {
      // Create room as host
      const roomCode = await networkManager.createRoom();
      this.dashboardUI.setRoomCode(roomCode);
      this.dashboardUI.logEvent(`Room created with code: ${roomCode}`);

      // Initialize host manager
      hostManager.initialize();
      this.dashboardUI.logEvent('Host manager initialized');

      // Setup network message handlers for VR client
      this._setupNetworkHandlers();

      // Start uptime counter
      this.uptimeInterval = setInterval(() => {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        this.dashboardUI.updateUptime(uptime);
      }, 1000);

      // Stats update interval
      setInterval(() => this._updateStats(), 1000);

      this.dashboardUI.logEvent('Dashboard host ready');

    } catch (err) {
      console.error('Failed to start dashboard host:', err);
      this.dashboardUI.logError(`Failed to start: ${err.message}`);
      this.lobbyUI.show();
      this.lobbyUI.setStatus('Failed to start host: ' + err.message);
    }
  }

  _setupNetworkHandlers() {
    // Handle VR client joining
    networkManager.on(MessageTypes.VR_CLIENT_JOIN, (data) => {
      if (this.vrClientId) {
        // Already have a VR client, reject
        this.dashboardUI.logWarning(`Rejected VR client ${data.playerId} - already have VR client`);
        return;
      }

      this.vrClientId = data.senderId;
      networkManager.setPlayerType(data.senderId, PlayerType.VR);
      this.dashboardUI.logEvent(`VR client connected: ${data.senderId.substring(0, 12)}`);

      // Update player record
      const player = hostManager.players.get(data.senderId);
      if (player) {
        player.type = 'vr';
      }
    });

    // Handle VR hand tracking data
    networkManager.on(MessageTypes.VR_HAND_TRACKING, (data) => {
      if (data.senderId !== this.vrClientId) return;

      // Calculate latency
      if (data.timestamp) {
        this.vrLatency = Date.now() - data.timestamp;
      }
      this.lastVRHandTime = Date.now();

      // Update host manager with hand data
      hostManager.updateVRHands(data.hands);

      this.messageCount++;
      this.bytesReceived += 150;
    });

    // Handle VR head tracking data
    networkManager.on(MessageTypes.VR_HEAD_TRACKING, (data) => {
      if (data.senderId !== this.vrClientId) return;

      hostManager.updateVRHead(data.head);
      this.messageCount++;
      this.bytesReceived += 100;
    });

    // Handle player join/leave for logging
    networkManager.on(MessageTypes.PLAYER_JOIN, (data) => {
      const type = networkManager.getPlayerType(data.playerId);
      this.dashboardUI.logEvent(`Player joined: ${data.playerId.substring(0, 12)} (${type})`);
    });

    networkManager.on(MessageTypes.PLAYER_LEAVE, (data) => {
      this.dashboardUI.logEvent(`Player left: ${data.playerId.substring(0, 12)}`);

      // Clear VR client if they disconnected
      if (data.playerId === this.vrClientId) {
        this.vrClientId = null;
        this.dashboardUI.logWarning('VR client disconnected');
      }
    });

    // Handle camera view client joining
    networkManager.on(MessageTypes.CAMERA_JOIN, (data) => {
      networkManager.setPlayerType(data.senderId, PlayerType.CAMERA);
      this.dashboardUI.logEvent(`Camera view connected: ${data.senderId.substring(0, 12)}`);
    });

    // Handle camera position updates from VR client
    networkManager.on(MessageTypes.CAMERA_UPDATE, (data) => {
      if (data.senderId !== this.vrClientId) return;
      hostManager.updateCameraObject(data.camera);
    });
  }

  _updateStats() {
    const now = Date.now();
    const elapsed = (now - this.lastStatsTime) / 1000;

    // Calculate rates
    const messageRate = Math.round(this.messageCount / elapsed);
    const bandwidth = this.bytesReceived / 1024 / elapsed;

    this.dashboardUI.updateNetworkStats({
      vrClientId: this.vrClientId,
      vrLatency: this.vrLatency,
      messageRate,
      bandwidth
    });

    this.dashboardUI.updatePlayers(hostManager.players, this.vrClientId);

    // Reset counters
    this.messageCount = 0;
    this.bytesReceived = 0;
    this.lastStatsTime = now;
  }

  stop() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }

    hostManager.cleanup();
    networkManager.disconnect();

    if (this.dashboardUI) {
      this.dashboardUI.hide();
    }
  }
}
