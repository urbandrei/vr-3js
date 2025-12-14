import { networkManager } from './NetworkManager.js';
import { MessageTypes } from './MessageTypes.js';

/**
 * Network manager for VR client - handles VR-specific high-frequency updates
 */
class VRClientManager {
  constructor() {
    this.players = new Map();
    this.objects = new Map();
    this.localHandData = null;
    this.localHeadData = null;

    // Callbacks for game state updates
    this.onPlayersUpdated = null;
    this.onObjectsUpdated = null;
    this.onGrabResponse = null;

    // Physics callbacks
    this.onPlayerPhysicsUpdated = null;
    this.onRagdollTriggered = null;
    this.onRagdollRecovery = null;

    // Intervals for high-frequency updates
    this.handUpdateInterval = null;
    this.headUpdateInterval = null;

    // Movement-based throttling
    this.lastSentHandData = null;
    this.movementThreshold = 0.002; // 2mm threshold for hand movement
    this.forceUpdateCounter = 0;
    this.forceUpdateInterval = 10; // Force update every 10 ticks (~333ms at 30Hz)
  }

  initialize() {
    networkManager.on('initial_state', (data) => this.onInitialState(data));
    networkManager.on(MessageTypes.WORLD_STATE, (data) => this.onWorldState(data));
    networkManager.on(MessageTypes.GRAB_RESPONSE, (data) => this.handleGrabResponse(data));
    networkManager.on(MessageTypes.RAGDOLL_TRIGGERED, (data) => this.handleRagdollTriggered(data));
    networkManager.on(MessageTypes.RAGDOLL_RECOVERY, (data) => this.handleRagdollRecovery(data));
    networkManager.on('disconnected', () => this.onDisconnected());

    // Send hand tracking at 30Hz (33ms) - reduced from 60Hz for performance
    this.handUpdateInterval = setInterval(() => this.sendHandTracking(), 33);

    // Send head tracking at 30Hz (33ms)
    this.headUpdateInterval = setInterval(() => this.sendHeadTracking(), 33);
  }

  onInitialState(data) {
    console.log('VR Client received initial state');
    data.players.forEach(p => this.players.set(p.id, p));
    data.objects.forEach(o => this.objects.set(o.id, o));

    if (this.onPlayersUpdated) this.onPlayersUpdated(this.players);
    if (this.onObjectsUpdated) this.onObjectsUpdated(this.objects);
  }

  onWorldState(data) {
    // Handle full state vs delta updates
    if (data.isFullState) {
      // Full state: clear and rebuild
      this.players.clear();
      data.players.forEach(p => {
        this.players.set(p.id, p);
      });

      this.objects.clear();
      data.objects.forEach(o => this.objects.set(o.id, o));
    } else {
      // Delta update: merge changes
      data.players?.forEach(p => {
        this.players.set(p.id, p);
      });

      data.objects?.forEach(o => this.objects.set(o.id, o));
    }

    if (this.onPlayersUpdated) this.onPlayersUpdated(this.players);
    if (this.onObjectsUpdated) this.onObjectsUpdated(this.objects);

    // Handle player physics states
    if (data.playerPhysics && this.onPlayerPhysicsUpdated) {
      this.onPlayerPhysicsUpdated(data.playerPhysics);
    }
  }

  handleGrabResponse(data) {
    if (this.onGrabResponse) {
      this.onGrabResponse(data.objectId, data.granted, data.handIndex);
    }
  }

  handleRagdollTriggered(data) {
    if (this.onRagdollTriggered) {
      this.onRagdollTriggered(data);
    }
  }

  handleRagdollRecovery(data) {
    if (this.onRagdollRecovery) {
      this.onRagdollRecovery(data);
    }
  }

  onDisconnected() {
    console.log('VR Client disconnected from host');
    this.cleanup();
  }

  // Set local hand data from hand trackers
  setHandData(handData) {
    this.localHandData = handData;
  }

  // Set local head data from XR camera
  setHeadData(headData) {
    this.localHeadData = headData;
  }

  // Check if hand position has changed enough to warrant sending
  _hasHandMoved(newData, oldData) {
    if (!oldData || !newData) return true;

    const checkHand = (newHand, oldHand) => {
      if (!newHand || !oldHand || !newHand.joints || !oldHand.joints) return true;
      // Check first fingertip (thumb) as representative
      const newPos = newHand.joints[0];
      const oldPos = oldHand.joints[0];
      if (!newPos || !oldPos) return true;

      const dx = Math.abs(newPos.x - oldPos.x);
      const dy = Math.abs(newPos.y - oldPos.y);
      const dz = Math.abs(newPos.z - oldPos.z);
      return dx > this.movementThreshold ||
             dy > this.movementThreshold ||
             dz > this.movementThreshold;
    };

    // Check if either hand moved or pinch state changed
    const leftChanged = checkHand(newData.left, oldData.left) ||
                        (newData.left?.pinching !== oldData.left?.pinching);
    const rightChanged = checkHand(newData.right, oldData.right) ||
                         (newData.right?.pinching !== oldData.right?.pinching);

    return leftChanged || rightChanged;
  }

  sendHandTracking() {
    if (!this.localHandData) return;

    // Increment force update counter
    this.forceUpdateCounter++;
    const forceUpdate = this.forceUpdateCounter >= this.forceUpdateInterval;
    if (forceUpdate) {
      this.forceUpdateCounter = 0;
    }

    // Only send if hands moved or it's a force update
    if (forceUpdate || this._hasHandMoved(this.localHandData, this.lastSentHandData)) {
      networkManager.sendToHost({
        type: MessageTypes.VR_HAND_TRACKING,
        hands: this.localHandData,
        timestamp: Date.now()
      });
      this.lastSentHandData = JSON.parse(JSON.stringify(this.localHandData)); // Deep copy
    }
  }

  sendHeadTracking() {
    if (!this.localHeadData) return;

    networkManager.sendToHost({
      type: MessageTypes.VR_HEAD_TRACKING,
      head: this.localHeadData,
      timestamp: Date.now()
    });
  }

  // Request to grab an object (VR can grab players too)
  requestGrab(objectId, handIndex) {
    networkManager.sendToHost({
      type: MessageTypes.VR_GRAB_REQUEST,
      objectId,
      handIndex
    });
  }

  // Release an object
  releaseObject(objectId, position, velocity, angularVelocity, handIndex) {
    networkManager.sendToHost({
      type: MessageTypes.VR_RELEASE,
      objectId,
      position,
      velocity,
      angularVelocity,
      handIndex
    });
  }

  // Update position of a grabbed object
  sendObjectUpdate(objectId, position, rotation) {
    networkManager.sendToHost({
      type: MessageTypes.OBJECT_UPDATE,
      objectId,
      position,
      rotation
    });
  }

  getPlayers() {
    return this.players;
  }

  getObjects() {
    return this.objects;
  }

  cleanup() {
    if (this.handUpdateInterval) {
      clearInterval(this.handUpdateInterval);
      this.handUpdateInterval = null;
    }
    if (this.headUpdateInterval) {
      clearInterval(this.headUpdateInterval);
      this.headUpdateInterval = null;
    }
  }
}

export const vrClientManager = new VRClientManager();
