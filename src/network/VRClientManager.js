import { networkManager } from './NetworkManager.js';
import { MessageTypes } from './MessageTypes.js';

/**
 * Simplified VR Client Manager - sends hand/head tracking to host
 * No grabbing, no object/player tracking
 */
class VRClientManager {
  constructor() {
    this.localHandData = null;
    this.localHeadData = null;

    // Intervals for high-frequency updates
    this.handUpdateInterval = null;
    this.headUpdateInterval = null;

    // Movement-based throttling
    this.lastSentHandData = null;
    this.movementThreshold = 0.002; // 2mm threshold for hand movement
    this.forceUpdateCounter = 0;
    this.forceUpdateInterval = 10; // Force update every 10 ticks (~333ms at 30Hz)

    // Camera updates
    this.lastCameraUpdate = 0;
    this.cameraUpdateInterval = 50; // 20Hz
  }

  initialize() {
    networkManager.on('disconnected', () => this.onDisconnected());

    // Send hand tracking at 30Hz (33ms)
    this.handUpdateInterval = setInterval(() => this.sendHandTracking(), 33);

    // Send head tracking at 30Hz (33ms)
    this.headUpdateInterval = setInterval(() => this.sendHeadTracking(), 33);
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

  sendCameraUpdate(transform) {
    const now = Date.now();
    if (now - this.lastCameraUpdate < this.cameraUpdateInterval) return;
    this.lastCameraUpdate = now;

    networkManager.sendToHost({
      type: MessageTypes.CAMERA_UPDATE,
      camera: transform,
      timestamp: now
    });
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
