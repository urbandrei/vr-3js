import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from '../scene.js';
import { setupXRSession } from '../xr-session.js';
import { HandTracker } from '../hand-tracking.js';
import { vrClientManager } from '../network/VRClientManager.js';
import { extractHandData, extractVRHeadData } from '../utils/HandDataExtractor.js';
import { gameState } from './GameState.js';
import { HandSegmentRenderer } from '../objects/HandSegmentRenderer.js';
import { GrabbableCamera } from '../objects/GrabbableCamera.js';

/**
 * VR Client Game - VR player as a client (not hosting)
 * Sends hand tracking to host, displays hands in VR
 */
export class VRClientGame {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
    this.handSegmentRenderer = null;
    this.grabbableCamera = null;
  }

  async start() {
    this.lobbyUI.hide();
    gameState.setMode('vr-client');

    // Initialize Three.js with XR
    gameState.renderer = createRenderer(true);
    gameState.camera = createCamera();
    const sceneData = createScene();
    gameState.scene = sceneData.scene;
    gameState.clock = new THREE.Clock();

    // Setup WebXR and hands (hide default smooth hands)
    const { hands } = setupXRSession(gameState.renderer, gameState.scene, false);
    gameState.handTrackers = [
      new HandTracker(hands[0], 'left'),
      new HandTracker(hands[1], 'right')
    ];

    // Create hand segment renderer (shows collision body shapes)
    this.handSegmentRenderer = new HandSegmentRenderer(gameState.scene);

    // Create grabbable camera
    this.grabbableCamera = new GrabbableCamera(gameState.scene);

    // Send initial camera position to host
    vrClientManager.sendCameraUpdate(this.grabbableCamera.getTransform());

    // Initialize VR client networking
    vrClientManager.initialize();

    // Create game HUD
    gameState.gameHUD = this.lobbyUI.createGameHUD('VR Client', true);

    // Setup VR button
    this._setupVRButton();

    // Handle window resize
    this._setupResizeHandler();

    // Start animation loop
    gameState.renderer.setAnimationLoop(() => this.update());
  }

  _setupVRButton() {
    const vrButton = document.createElement('button');
    vrButton.textContent = 'Enter VR';
    vrButton.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:15px 30px;font-size:18px;z-index:1000;';
    document.body.appendChild(vrButton);

    vrButton.onclick = async () => {
      try {
        const session = await navigator.xr.requestSession('immersive-vr', {
          requiredFeatures: ['hand-tracking'],
          optionalFeatures: ['local-floor', 'bounded-floor']
        });
        gameState.renderer.xr.setSession(session);
        vrButton.style.display = 'none';
      } catch (err) {
        console.error('Failed to start VR:', err);
        try {
          const session = await navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'hand-tracking']
          });
          gameState.renderer.xr.setSession(session);
          vrButton.style.display = 'none';
        } catch (e) {
          alert('Could not start VR: ' + e.message);
        }
      }
    };
  }

  _setupResizeHandler() {
    window.addEventListener('resize', () => {
      if (!gameState.camera || !gameState.renderer) return;
      gameState.camera.aspect = window.innerWidth / window.innerHeight;
      gameState.camera.updateProjectionMatrix();
      gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _updateCameraGrab() {
    if (!this.grabbableCamera) return;

    for (const tracker of gameState.handTrackers) {
      if (!tracker.hasValidData()) continue;

      // Check for grab start
      if (tracker.pinchStarted && !this.grabbableCamera.isHeld) {
        const pinchPos = tracker.getPinchPosition();
        if (this.grabbableCamera.isWithinGrabRange(pinchPos)) {
          const pinchRot = tracker.getPinchOrientation();
          this.grabbableCamera.grab(tracker.handedness, pinchRot);
        }
      }

      // Update position while held
      if (this.grabbableCamera.isHeld &&
          this.grabbableCamera.holdingHand === tracker.handedness) {
        if (tracker.isPinching) {
          const pinchPos = tracker.getPinchPosition();
          const pinchRot = tracker.getPinchOrientation();
          this.grabbableCamera.updatePosition(pinchPos, pinchRot);

          // Send update to host
          vrClientManager.sendCameraUpdate(this.grabbableCamera.getTransform());
        }
      }

      // Check for release
      if (tracker.pinchEnded &&
          this.grabbableCamera.holdingHand === tracker.handedness) {
        this.grabbableCamera.release();
        // Send final position
        vrClientManager.sendCameraUpdate(this.grabbableCamera.getTransform());
      }
    }
  }

  update() {
    // Update hand trackers
    gameState.handTrackers.forEach(tracker => tracker.update());

    // Update camera grabbing
    this._updateCameraGrab();

    // Gather hand data and send to host
    const handData = extractHandData(gameState.handTrackers);
    if (handData) {
      vrClientManager.setHandData(handData);

      // Update hand segment visualization (shows collision bodies)
      this.handSegmentRenderer.updateHands(handData);
    }

    // Send head position to host
    const xrCamera = gameState.renderer.xr.getCamera();
    const headData = extractVRHeadData(xrCamera);
    if (headData) {
      vrClientManager.setHeadData(headData);
    }

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}
