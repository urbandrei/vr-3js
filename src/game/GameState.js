import * as THREE from 'three';

/**
 * Simplified game state container
 */
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // Game mode
    this.mode = null; // 'host' | 'vr-client' | null
    this.isInGame = false;

    // Core Three.js objects
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.clock = null;

    // VR specific
    this.handTrackers = [];

    // UI
    this.lobbyUI = null;
    this.gameHUD = null;
  }

  setMode(mode) {
    this.mode = mode;
    this.isInGame = mode !== null;
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.reset();
  }
}

// Singleton instance
export const gameState = new GameState();
