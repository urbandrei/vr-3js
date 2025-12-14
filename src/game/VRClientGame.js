import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from '../scene.js';
import { setupXRSession } from '../xr-session.js';
import { HandTracker } from '../hand-tracking.js';
import { GrabSystem } from '../grab-system.js';
import { networkManager } from '../network/NetworkManager.js';
import { vrClientManager } from '../network/VRClientManager.js';
import { RemotePlayer } from '../player/RemotePlayer.js';
import { extractHandData, extractVRHeadData } from '../utils/HandDataExtractor.js';
import { gameState } from './GameState.js';

/**
 * VR Client Game - VR player as a client (not hosting)
 * Sends hand tracking to host, receives physics results
 */
export class VRClientGame {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
  }

  async start() {
    this.lobbyUI.hide();
    gameState.setMode('vr-client');

    // Initialize Three.js with XR
    gameState.renderer = createRenderer(true);
    gameState.camera = createCamera();
    const sceneData = createScene();
    gameState.scene = sceneData.scene;
    gameState.grabbables = sceneData.grabbables;
    gameState.clock = new THREE.Clock();

    // Create visual blocks and objects (positions synced from host)
    this._createBlockMeshes();
    this._createCameraMesh();

    // Setup WebXR and hands
    const hands = setupXRSession(gameState.renderer, gameState.scene);
    gameState.handTrackers = [
      new HandTracker(hands[0], 'left'),
      new HandTracker(hands[1], 'right')
    ];

    // Setup grab system (local visual feedback, requests go to host)
    gameState.grabSystem = new GrabSystem(gameState.grabbables);

    // Initialize VR client networking
    vrClientManager.initialize();

    // Setup network callbacks
    this._setupNetworkCallbacks();

    // Setup grab callbacks (send to host)
    this._setupGrabCallbacks();

    // Create game HUD
    gameState.gameHUD = this.lobbyUI.createGameHUD('VR Client', true);

    // Setup VR button
    this._setupVRButton();

    // Handle window resize
    this._setupResizeHandler();

    // Start animation loop
    gameState.renderer.setAnimationLoop(() => this.update());
  }

  _setupNetworkCallbacks() {
    vrClientManager.onPlayersUpdated = (players) => {
      this._updateRemotePlayers(players);
    };

    vrClientManager.onObjectsUpdated = (objects) => {
      this._updateObjectsFromNetwork(objects);
    };

    vrClientManager.onGrabResponse = (objectId, granted, handIndex) => {
      if (granted) {
        gameState.grabSystem.confirmGrab(objectId, handIndex);
      } else {
        gameState.grabSystem.cancelGrab(objectId, handIndex);
      }
    };

    vrClientManager.onPlayerPhysicsUpdated = (physicsStates) => {
      physicsStates.forEach((state) => {
        const player = gameState.remotePlayers.get(state.id);
        if (player) {
          player.updatePhysicsState(state);
        }
      });
    };

    vrClientManager.onRagdollTriggered = (data) => {
      const player = gameState.remotePlayers.get(data.playerId);
      if (player) {
        player.startRagdoll(data.impulse);
      }
    };

    vrClientManager.onRagdollRecovery = (data) => {
      const player = gameState.remotePlayers.get(data.playerId);
      if (player) {
        player.setRecovering();
      }
    };
  }

  _setupGrabCallbacks() {
    // When VR user tries to grab, send request to host
    gameState.grabSystem.onGrab = (objectId, grabbedObject, handIndex) => {
      vrClientManager.requestGrab(objectId, handIndex);
    };

    // When VR user releases, send to host
    gameState.grabSystem.onRelease = (objectId, position, releasedObject, handIndex) => {
      const velocity = gameState.grabSystem.getObjectVelocity(handIndex);
      const angularVelocity = gameState.grabSystem.getObjectAngularVelocity(handIndex);

      vrClientManager.releaseObject(
        objectId,
        { x: position.x, y: position.y, z: position.z },
        velocity ? { x: velocity.x, y: velocity.y, z: velocity.z } : null,
        angularVelocity ? { x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z } : null,
        handIndex
      );
    };
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

  update() {
    const delta = gameState.clock.getDelta();

    // Update hand tracking and grab system
    gameState.grabSystem.update(gameState.handTrackers);

    // Gather hand data and send to host
    const handData = extractHandData(gameState.handTrackers);
    if (handData) {
      vrClientManager.setHandData(handData);
    }

    // Send head position to host
    const xrCamera = gameState.renderer.xr.getCamera();
    const headData = extractVRHeadData(xrCamera);
    if (headData) {
      vrClientManager.setHeadData(headData);
    }

    // Update grabbed objects position (local visual only)
    this._updateGrabbedObjects();

    // Update remote players (PC players)
    gameState.remotePlayers.forEach((player) => {
      player.update(delta);
    });

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
  }

  _updateGrabbedObjects() {
    const grabbingHands = gameState.grabSystem.getGrabbingHandIndices();

    for (const handIndex of grabbingHands) {
      const grabbedId = gameState.grabSystem.getGrabbedObjectId(handIndex);
      if (!grabbedId) continue;

      const pos = gameState.grabSystem.getGrabbedObjectPosition(handIndex);
      if (!pos) continue;

      // Send position update to host
      vrClientManager.sendObjectUpdate(grabbedId, pos, null);

      // Update local visual for grabbed player
      if (grabbedId.startsWith('player_')) {
        const playerId = grabbedId.replace('player_', '');
        const remotePlayer = gameState.remotePlayers.get(playerId);
        if (remotePlayer) {
          remotePlayer.setPosition(pos.x, pos.y, pos.z);
        }
      }
    }
  }

  _updateRemotePlayers(players) {
    // Create/update avatars for PC players
    players.forEach((playerData, playerId) => {
      if (!gameState.remotePlayers.has(playerId)) {
        const avatar = new RemotePlayer(playerId, gameState.scene);
        gameState.remotePlayers.set(playerId, avatar);
        gameState.grabbables.push(avatar.mesh);
      }
      gameState.remotePlayers.get(playerId).updateFromState(playerData);
    });

    // Remove disconnected players
    gameState.remotePlayers.forEach((avatar, playerId) => {
      if (!players.has(playerId)) {
        const index = gameState.grabbables.indexOf(avatar.mesh);
        if (index > -1) {
          gameState.grabbables.splice(index, 1);
        }
        avatar.dispose();
        gameState.remotePlayers.delete(playerId);
      }
    });
  }

  _updateObjectsFromNetwork(objects) {
    objects.forEach((objData, objId) => {
      // Skip objects we're holding locally
      const locallyHeld = gameState.grabSystem?.isObjectHeldById(objId);
      if (locallyHeld) return;

      const mesh = gameState.grabbables.find(g => g.userData.networkId === objId);
      if (mesh && objData.position) {
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
      }
    });
  }

  _createBlockMeshes() {
    // Create visual blocks at default positions (will be synced from host)
    const blockPositions = [
      { id: 'block_test1', pos: new THREE.Vector3(0.3, 0, -0.3) },
      { id: 'block_test2', pos: new THREE.Vector3(-0.3, 0, -0.3) }
    ];

    blockPositions.forEach(({ id, pos }) => {
      const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        roughness: 0.5,
        metalness: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      mesh.userData.networkId = id;
      mesh.userData.grabbable = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      gameState.scene.add(mesh);
      gameState.grabbables.push(mesh);
    });
  }

  _createCameraMesh() {
    // Create visual camera object (will be synced from host)
    const cameraGroup = new THREE.Group();

    // Camera body
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    cameraGroup.add(body);

    // Lens
    const lensGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.04, 16);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.2,
      metalness: 0.8
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.07;
    cameraGroup.add(lens);

    cameraGroup.position.set(0.5, 0.3, 0);
    cameraGroup.userData.networkId = 'camera_main';
    cameraGroup.userData.grabbable = true;

    gameState.scene.add(cameraGroup);
    gameState.grabbables.push(cameraGroup);
  }
}
