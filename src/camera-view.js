import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from './scene.js';
import { networkManager } from './network/NetworkManager.js';
import { MessageTypes } from './network/MessageTypes.js';
import { HandSegmentRenderer } from './objects/HandSegmentRenderer.js';
import { HeadRenderer } from './objects/HeadRenderer.js';

class CameraView {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.handSegmentRenderer = null;
    this.headRenderer = null;
    this.statusEl = document.getElementById('status');
    this.roomForm = document.getElementById('room-form');
    this.hasCameraData = false;
    this.roomCode = null;
  }

  async start(roomCode) {
    this.roomCode = roomCode;
    // Create Three.js scene (no XR)
    this.renderer = createRenderer(false);
    this.camera = createCamera();
    const sceneData = createScene();
    this.scene = sceneData.scene;

    // Create renderers for hands and head
    this.handSegmentRenderer = new HandSegmentRenderer(this.scene);
    this.headRenderer = new HeadRenderer(this.scene);

    // Connect to host
    this.setStatus('Connecting to host...');
    await this._connectToHost();

    // Setup resize handler
    window.addEventListener('resize', () => this._onResize());

    // Start render loop (standard animation loop, not XR)
    this.renderer.setAnimationLoop(() => this.update());
  }

  async _connectToHost() {
    try {
      await networkManager.joinAsCamera(this.roomCode);
      this.setStatus(`Connected to ${this.roomCode}! Waiting for camera data...`);

      // Listen for world state updates
      networkManager.on(MessageTypes.WORLD_STATE, (data) => {
        this._onWorldState(data);
      });

      networkManager.on('disconnected', () => {
        this.setStatus('Disconnected from host');
      });
    } catch (err) {
      this.setStatus('Failed to connect: ' + err.message);
      console.error('Connection failed:', err);
    }
  }

  _onWorldState(data) {
    // Update hand visualization
    if (data.vrHands) {
      this.handSegmentRenderer.updateHands(data.vrHands);
    }

    // Update head visualization
    if (data.vrHead) {
      this.headRenderer.updateHead(data.vrHead);
    }

    // Update camera position from cameraObject data
    if (data.cameraObject) {
      this._updateCameraFromObject(data.cameraObject);
      if (!this.hasCameraData) {
        this.hasCameraData = true;
        this.setStatus('Camera active');
      }
    }
  }

  _updateCameraFromObject(cameraData) {
    if (cameraData.position) {
      this.camera.position.set(
        cameraData.position.x,
        cameraData.position.y,
        cameraData.position.z
      );
    }
    if (cameraData.rotation) {
      this.camera.quaternion.set(
        cameraData.rotation.x,
        cameraData.rotation.y,
        cameraData.rotation.z,
        cameraData.rotation.w
      );
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setStatus(msg) {
    if (this.statusEl) {
      this.statusEl.textContent = msg;
    }
  }

  update() {
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the camera view after DOM is ready
async function init() {
  const cameraView = new CameraView();
  const roomForm = document.getElementById('room-form');
  const roomInput = document.getElementById('room-code-input');
  const connectBtn = document.getElementById('connect-btn');
  const statusEl = document.getElementById('status');

  // Check for room code in URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoomCode = urlParams.get('room');

  if (urlRoomCode) {
    // Auto-connect with URL room code
    roomForm.classList.add('hidden');
    statusEl.classList.remove('hidden');
    try {
      await cameraView.start(urlRoomCode.toUpperCase());
    } catch (err) {
      console.error('Failed to start camera view:', err);
      statusEl.textContent = 'Failed to connect: ' + err.message;
    }
    return;
  }

  // Wait for user to enter room code
  const connect = async () => {
    const roomCode = roomInput.value.trim().toUpperCase();
    if (!roomCode) {
      alert('Please enter a room code');
      return;
    }

    roomForm.classList.add('hidden');
    statusEl.classList.remove('hidden');
    statusEl.textContent = `Connecting to room ${roomCode}...`;

    try {
      await cameraView.start(roomCode);
    } catch (err) {
      console.error('Failed to start camera view:', err);
      statusEl.textContent = 'Failed to connect: ' + err.message;
      roomForm.classList.remove('hidden');
    }
  };

  connectBtn.addEventListener('click', connect);
  roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') connect();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
