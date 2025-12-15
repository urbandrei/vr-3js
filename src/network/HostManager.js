import { networkManager } from './NetworkManager.js';
import { MessageTypes } from './MessageTypes.js';

/**
 * Simplified HostManager - manages VR client connections and relays hand/head data
 * No physics, no grabbing, no PC players
 */
class HostManager {
  constructor() {
    this.players = new Map();
    this.vrHandData = null;
    this.vrHeadData = null;
    // Default camera position - host is authoritative
    this.cameraObjectData = {
      position: { x: 0, y: 1.0, z: -0.5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    };
    this.stateUpdateInterval = null;
  }

  initialize() {
    networkManager.on(MessageTypes.PLAYER_JOIN, (data) => this.onPlayerJoin(data));
    networkManager.on(MessageTypes.PLAYER_LEAVE, (data) => this.onPlayerLeave(data));

    // Broadcast world state at 20Hz (reduced from 60Hz to prevent WebRTC congestion)
    this.stateUpdateInterval = setInterval(() => this.broadcastWorldState(), 1000 / 20);
  }

  onPlayerJoin(data) {
    console.log('Player joined:', data.playerId);
    this.players.set(data.playerId, {
      id: data.playerId,
      type: 'vr'
    });
  }

  onPlayerLeave(data) {
    console.log('Player left:', data.playerId);
    this.players.delete(data.playerId);
  }

  updateVRHands(handData) {
    this.vrHandData = handData;
  }

  updateVRHead(headData) {
    this.vrHeadData = headData;
  }

  updateCameraObject(cameraData) {
    this.cameraObjectData = cameraData;
  }

  getHostStats() {
    return {
      playerCount: this.players.size,
      hasVRHandData: this.vrHandData !== null,
      hasVRHeadData: this.vrHeadData !== null
    };
  }

  broadcastWorldState() {
    // Send full state to Camera clients (they need everything to render the scene)
    networkManager.sendToCameraClients({
      type: MessageTypes.WORLD_STATE,
      timestamp: Date.now(),
      vrHead: this.vrHeadData,
      vrHands: this.vrHandData,
      cameraObject: this.cameraObjectData
    });
  }

  cleanup() {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
    }
    this.players.clear();
  }
}

export const hostManager = new HostManager();
