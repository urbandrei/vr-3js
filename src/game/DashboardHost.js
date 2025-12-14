import * as THREE from 'three';
import { networkManager, PlayerType } from '../network/NetworkManager.js';
import { hostManager } from '../network/HostManager.js';
import { MessageTypes } from '../network/MessageTypes.js';
import { DashboardUI } from '../ui/DashboardUI.js';
import { TestBlock } from '../physics/TestBlock.js';

/**
 * Dashboard Host - headless game host with monitoring UI (no 3D rendering)
 * Receives VR hand data over network, runs physics, broadcasts state
 */
export class DashboardHost {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
    this.dashboardUI = null;
    this.testBlocks = [];

    // Timing
    this.lastUpdateTime = 0;
    this.updateInterval = null;
    this.uptimeInterval = null;
    this.startTime = Date.now();

    // Stats tracking
    this.physicsStepTime = 0;
    this.updateCount = 0;
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
      await networkManager.createRoom();
      this.dashboardUI.logEvent('Room created, waiting for connections...');

      // Initialize host manager
      hostManager.initialize();
      hostManager.initializePhysics();
      this.dashboardUI.logEvent('Physics system initialized');

      // Setup collision handler callback
      hostManager.collisionHandler.isBlockHeldByHand = (blockId, handIndex) => {
        // In dashboard host, blocks aren't held by local hands
        // This would need to be tracked if VR client sends grab state
        return false;
      };

      // Setup network message handlers for VR client
      this._setupNetworkHandlers();

      // Register some default objects (blocks will be created dynamically)
      this._registerDefaultObjects();

      // Start headless update loop (60Hz for physics)
      this.lastUpdateTime = performance.now();
      this.updateInterval = setInterval(() => this._update(), 16);

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
      // Approximate bytes (avoid JSON.stringify overhead on every message)
      // Hand data: ~5 fingertips × 2 hands × 12 bytes + overhead ≈ 150 bytes
      this.bytesReceived += 150;
    });

    // Handle VR head tracking data
    networkManager.on(MessageTypes.VR_HEAD_TRACKING, (data) => {
      if (data.senderId !== this.vrClientId) return;

      hostManager.updateVRHead(data.head);
      this.messageCount++;
      this.bytesReceived += 100; // Approximate head data size
    });

    // Handle VR grab requests
    networkManager.on(MessageTypes.VR_GRAB_REQUEST, (data) => {
      if (data.senderId !== this.vrClientId) return;

      const objectId = data.objectId;
      const handIndex = data.handIndex;

      // Check if it's a player pickup
      if (objectId.startsWith('player_')) {
        const playerId = objectId.replace('player_', '');
        const success = hostManager.pickupPlayer(playerId);

        networkManager.sendTo(data.senderId, {
          type: MessageTypes.GRAB_RESPONSE,
          objectId,
          granted: success,
          handIndex
        });

        if (success) {
          this.dashboardUI.logEvent(`VR grabbed player: ${playerId.substring(0, 8)}`);
        }
      } else if (objectId.startsWith('block_')) {
        // Block grab - update TestBlock physics
        const blockId = objectId.replace('block_', '');
        const block = this.testBlocks.find(b => b.id === blockId);
        const obj = hostManager.objects.get(objectId);
        const granted = block && obj && obj.heldBy === null;

        if (granted) {
          obj.heldBy = 'vr';
          block.setHeld(true);
          this.dashboardUI.logEvent(`VR grabbed: ${objectId}`);
        }

        networkManager.sendTo(data.senderId, {
          type: MessageTypes.GRAB_RESPONSE,
          objectId,
          granted,
          handIndex
        });
      } else {
        // Other object grab
        const obj = hostManager.objects.get(objectId);
        const granted = obj && obj.heldBy === null;

        if (granted) {
          obj.heldBy = 'vr';
          this.dashboardUI.logEvent(`VR grabbed: ${objectId}`);
        }

        networkManager.sendTo(data.senderId, {
          type: MessageTypes.GRAB_RESPONSE,
          objectId,
          granted,
          handIndex
        });
      }
    });

    // Handle object position updates (when VR is holding objects)
    networkManager.on(MessageTypes.OBJECT_UPDATE, (data) => {
      if (data.senderId !== this.vrClientId) return;

      const objectId = data.objectId;
      const position = data.position;

      if (objectId.startsWith('block_')) {
        const blockId = objectId.replace('block_', '');
        const block = this.testBlocks.find(b => b.id === blockId);

        if (block && block.isHeld && position) {
          // Update physics body position
          block.body.position.set(position.x, position.y, position.z);
          if (data.rotation) {
            block.body.quaternion.set(
              data.rotation.x || 0,
              data.rotation.y || 0,
              data.rotation.z || 0,
              data.rotation.w || 1
            );
          }
        }
      }

      // Update host manager object state
      hostManager.updateObjectPosition(objectId, position, data.rotation || { x: 0, y: 0, z: 0 });
    });

    // Handle VR release
    networkManager.on(MessageTypes.VR_RELEASE, (data) => {
      if (data.senderId !== this.vrClientId) return;

      const objectId = data.objectId;

      // Check if it's a player release
      if (objectId.startsWith('player_')) {
        hostManager.releasePlayer(data.velocity);
        this.dashboardUI.logEvent(`VR released player`);
      } else if (objectId.startsWith('block_')) {
        // Block release - update TestBlock physics
        const blockId = objectId.replace('block_', '');
        const block = this.testBlocks.find(b => b.id === blockId);
        const obj = hostManager.objects.get(objectId);

        if (block && obj && obj.heldBy === 'vr') {
          obj.heldBy = null;
          block.setHeld(false);

          // Apply release velocity
          if (data.velocity) {
            block.body.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
          }
          if (data.angularVelocity) {
            block.body.angularVelocity.set(
              data.angularVelocity.x,
              data.angularVelocity.y,
              data.angularVelocity.z
            );
          }

          // Temporarily disable hand collision to prevent pushing
          block.disableHandCollision();
          setTimeout(() => block.enableHandCollision(), 200);

          this.dashboardUI.logEvent(`VR released: ${objectId}`);
        }
      } else {
        // Other object release
        const obj = hostManager.objects.get(objectId);
        if (obj && obj.heldBy === 'vr') {
          obj.heldBy = null;
          obj.position = data.position;
          this.dashboardUI.logEvent(`VR released: ${objectId}`);
        }
      }
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
  }

  _registerDefaultObjects() {
    // Register placeable camera
    hostManager.registerObject('camera_main', { x: 0.5, y: 0.3, z: 0 }, { x: 0, y: 0, z: 0 });

    // Create test blocks with physics (headless mode - no scene)
    const block1 = new TestBlock(
      hostManager.physicsWorld,
      null,  // No scene - headless mode
      'test1',
      { x: 0.3, y: 0, z: -0.3 }
    );
    const block2 = new TestBlock(
      hostManager.physicsWorld,
      null,
      'test2',
      { x: -0.3, y: 0, z: -0.3 }
    );

    this.testBlocks = [block1, block2];

    // Register with host manager for network sync
    hostManager.registerObject('block_test1',
      { x: block1.body.position.x, y: block1.body.position.y, z: block1.body.position.z },
      { x: 0, y: 0, z: 0 }
    );
    hostManager.registerObject('block_test2',
      { x: block2.body.position.x, y: block2.body.position.y, z: block2.body.position.z },
      { x: 0, y: 0, z: 0 }
    );

    this.dashboardUI.logEvent(`Created ${this.testBlocks.length} physics blocks`);
  }

  _update() {
    const now = performance.now();
    const delta = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Get current hand data from network (stored in hostManager)
    const handData = hostManager.vrHandData;

    // Update physics with networked hand data
    const physicsStart = performance.now();
    hostManager.updatePhysics(delta, handData);
    this.physicsStepTime = performance.now() - physicsStart;

    // Update test blocks (self-righting behavior, etc.)
    this.testBlocks.forEach(block => {
      if (!block.isHeld) {
        block.update(delta);
      }

      // Only sync to network if block is moving or held (skip static blocks)
      const velocity = block.body.velocity;
      const angularVelocity = block.body.angularVelocity;
      const isMoving = block.isHeld ||
                       Math.abs(velocity.x) > 0.01 ||
                       Math.abs(velocity.y) > 0.01 ||
                       Math.abs(velocity.z) > 0.01 ||
                       Math.abs(angularVelocity.x) > 0.1 ||
                       Math.abs(angularVelocity.y) > 0.1 ||
                       Math.abs(angularVelocity.z) > 0.1;

      if (isMoving) {
        hostManager.updateObjectPosition(
          `block_${block.id}`,
          {
            x: block.body.position.x,
            y: block.body.position.y,
            z: block.body.position.z
          },
          {
            x: block.body.quaternion.x,
            y: block.body.quaternion.y,
            z: block.body.quaternion.z,
            w: block.body.quaternion.w
          }
        );
      }
    });

    // Update held player position if VR is holding someone
    // (Position updates come from VR_HAND_TRACKING via object updates)

    this.updateCount++;
  }

  _updateStats() {
    const now = Date.now();
    const elapsed = (now - this.lastStatsTime) / 1000;

    // Calculate rates
    const updateRate = Math.round(this.updateCount / elapsed);
    const messageRate = Math.round(this.messageCount / elapsed);
    const bandwidth = this.bytesReceived / 1024 / elapsed;

    // Update dashboard
    this.dashboardUI.updatePhysicsStats({
      bodyCount: hostManager.physicsWorld?.bodies?.size || 0,
      stepTime: this.physicsStepTime,
      collisionCount: 0, // Would need to track in collision handler
      updateRate
    });

    this.dashboardUI.updateNetworkStats({
      vrClientId: this.vrClientId,
      vrLatency: this.vrLatency,
      messageRate,
      bandwidth
    });

    this.dashboardUI.updatePlayers(hostManager.players, this.vrClientId);
    this.dashboardUI.updateObjects(hostManager.objects);

    // Reset counters
    this.updateCount = 0;
    this.messageCount = 0;
    this.bytesReceived = 0;
    this.lastStatsTime = now;
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }

    // Clean up test blocks
    this.testBlocks.forEach(block => block.dispose());
    this.testBlocks = [];

    hostManager.cleanup();
    networkManager.disconnect();

    if (this.dashboardUI) {
      this.dashboardUI.hide();
    }
  }
}
