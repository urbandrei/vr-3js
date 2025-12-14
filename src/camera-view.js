import * as THREE from 'three';
import { networkManager } from './network/NetworkManager.js';
import { MessageTypes } from './network/MessageTypes.js';
import { RemotePlayer } from './player/RemotePlayer.js';
import { VRHostAvatar } from './player/VRHostAvatar.js';
import { PlayerState } from './player/PlayerStateMachine.js';

/**
 * Camera View Application
 * Displays real-time view from the placeable camera in the VR scene
 * Renders all game objects with full visual fidelity (GLB models, animations, VR hand skeleton)
 */
class CameraViewApp {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.clock = null;
    this.lastUpdate = 0;
    this.isConnected = false;
    this.hasReceivedCameraData = false;

    // Game object representations
    this.remotePlayers = new Map();  // playerId -> RemotePlayer
    this.objectMeshes = new Map();   // objectId -> mesh
    this.vrHostAvatar = null;

    // UI elements
    this.statusEl = document.getElementById('status');

    // Auto-connect on load
    this.autoConnect();
  }

  async autoConnect() {
    this.updateStatus('Connecting to host...', 'waiting');

    try {
      await networkManager.joinRoom();
      this.onConnected();
    } catch (err) {
      console.error('Failed to connect:', err);
      this.updateStatus('No host found - retrying...', 'error');
      // Retry after delay
      setTimeout(() => this.autoConnect(), 3000);
    }
  }

  onConnected() {
    this.updateStatus('Connected - waiting for camera data...', 'waiting');

    // Initialize the 3D scene
    this.initScene();

    // Listen for network updates
    networkManager.on(MessageTypes.WORLD_STATE, (data) => this.onWorldState(data));
    networkManager.on(MessageTypes.HAND_TRACKING, (data) => this.onHandTracking(data));

    // Check for stale connection
    setInterval(() => this.checkConnection(), 1000);

    // Start animation loop
    this.animate();
  }

  initScene() {
    // Create scene matching the VR host scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x505050);

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 4, 2);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Create VR host avatar (full hand skeleton + head with visor)
    this.vrHostAvatar = new VRHostAvatar(this.scene);

    // Create renderer (no XR)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Create camera that will be positioned by network updates
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50);
    this.camera.position.set(0, 0.3, 0);

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  createObjectMesh(objectId) {
    // Create block mesh (test blocks are 12cm x 12cm x 6cm)
    let geometry, material;

    if (objectId.startsWith('block_')) {
      geometry = new THREE.BoxGeometry(0.12, 0.12, 0.06);
      material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    } else if (objectId.startsWith('camera_')) {
      // Don't render the camera itself in the camera view
      return null;
    } else {
      geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.objectMeshes.set(objectId, mesh);
    return mesh;
  }

  onWorldState(data) {
    // Update camera transform
    if (data.cameraTransform) {
      const { position, quaternion, fov } = data.cameraTransform;
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

      if (fov && fov !== this.camera.fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }

      this.lastUpdate = Date.now();

      if (!this.hasReceivedCameraData) {
        this.hasReceivedCameraData = true;
        this.updateStatus('Receiving camera feed', 'connected');
      }
    }

    // Update VR head
    if (data.vrHead && this.vrHostAvatar) {
      this.vrHostAvatar.updateHead(data.vrHead);
    }

    // Update players
    if (data.players) {
      const currentPlayerIds = new Set();

      data.players.forEach(player => {
        currentPlayerIds.add(player.id);

        let remotePlayer = this.remotePlayers.get(player.id);
        if (!remotePlayer) {
          // Create new RemotePlayer with GLB model
          remotePlayer = new RemotePlayer(player.id, this.scene);
          this.remotePlayers.set(player.id, remotePlayer);
        }

        // Update player state from basic player data
        remotePlayer.updateFromState(player);
      });

      // Remove players that left
      this.remotePlayers.forEach((remotePlayer, playerId) => {
        if (!currentPlayerIds.has(playerId)) {
          remotePlayer.dispose();
          this.remotePlayers.delete(playerId);
        }
      });
    }

    // Update physics states (for ragdoll, position accuracy)
    if (data.playerPhysics) {
      data.playerPhysics.forEach(physState => {
        const remotePlayer = this.remotePlayers.get(physState.id);
        if (remotePlayer) {
          // Update physics state for interpolation
          remotePlayer.updatePhysicsState(physState);

          // Map state enum to PlayerState
          if (physState.state !== undefined) {
            remotePlayer.setState(physState.state);
          }
        }
      });
    }

    // Update objects (blocks, etc.)
    if (data.objects) {
      const currentObjectIds = new Set();

      data.objects.forEach(obj => {
        currentObjectIds.add(obj.id);

        let mesh = this.objectMeshes.get(obj.id);
        if (!mesh && !obj.id.startsWith('camera_')) {
          mesh = this.createObjectMesh(obj.id);
        }

        if (mesh && obj.position) {
          mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
          if (obj.rotation) {
            mesh.rotation.set(
              obj.rotation.x || obj.rotation._x || 0,
              obj.rotation.y || obj.rotation._y || 0,
              obj.rotation.z || obj.rotation._z || 0
            );
          }
        }
      });

      // Remove objects that were removed
      this.objectMeshes.forEach((mesh, objId) => {
        if (!currentObjectIds.has(objId)) {
          this.scene.remove(mesh);
          this.objectMeshes.delete(objId);
        }
      });
    }
  }

  onHandTracking(data) {
    if (!data.hands || !this.vrHostAvatar) return;

    // Update VR host hands with full joint data
    this.vrHostAvatar.updateHands(data.hands);
  }

  checkConnection() {
    const now = Date.now();
    const timeSinceUpdate = now - this.lastUpdate;

    if (this.hasReceivedCameraData && timeSinceUpdate > 2000) {
      this.updateStatus('Signal lost - waiting for camera...', 'waiting');
    } else if (this.hasReceivedCameraData) {
      const latency = Math.min(timeSinceUpdate, 999);
      this.updateStatus(`Live (${latency}ms)`, 'connected');
    }
  }

  updateStatus(text, className) {
    this.statusEl.textContent = text;
    this.statusEl.className = className;
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.renderer || !this.scene || !this.camera) return;

    const delta = this.clock.getDelta();

    // Update all remote players (animations, interpolation)
    this.remotePlayers.forEach(remotePlayer => {
      remotePlayer.update(delta);
    });

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the app
new CameraViewApp();
