import * as THREE from 'three';

/**
 * Centralized game state container
 * Replaces scattered global variables in main.js
 */
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // Game mode
    this.mode = null; // 'host' | 'client' | null
    this.isInGame = false;

    // Core Three.js objects
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.clock = null;

    // Game objects
    this.grabbables = [];
    this.testBlocks = [];
    this.remotePlayers = new Map();
    this.placeableCamera = null;

    // VR Host specific
    this.handTrackers = [];
    this.grabSystem = null;
    this.grabHandler = null;

    // PC Client specific
    this.localPlayer = null;
    this.pcGrabSystem = null;
    this.vrHostAvatar = null;

    // UI
    this.lobbyUI = null;
    this.gameHUD = null;
  }

  isHost() {
    return this.mode === 'host';
  }

  isClient() {
    return this.mode === 'client';
  }

  setMode(mode) {
    this.mode = mode;
    this.isInGame = mode !== null;
  }

  // Cleanup methods
  disposeRemotePlayers() {
    this.remotePlayers.forEach(player => {
      if (player.dispose) player.dispose();
    });
    this.remotePlayers.clear();
  }

  disposeTestBlocks() {
    this.testBlocks.forEach(block => {
      if (block.dispose) block.dispose();
    });
    this.testBlocks = [];
  }

  dispose() {
    this.disposeRemotePlayers();
    this.disposeTestBlocks();

    if (this.placeableCamera?.dispose) {
      this.placeableCamera.dispose();
    }

    if (this.localPlayer?.dispose) {
      this.localPlayer.dispose();
    }

    if (this.vrHostAvatar?.dispose) {
      this.vrHostAvatar.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.reset();
  }
}

// Singleton instance
export const gameState = new GameState();
