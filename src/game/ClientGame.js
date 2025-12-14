import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from '../scene.js';
import { networkManager } from '../network/NetworkManager.js';
import { clientManager } from '../network/ClientManager.js';
import { LocalPlayer } from '../player/LocalPlayer.js';
import { RemotePlayer } from '../player/RemotePlayer.js';
import { VRHostAvatar } from '../player/VRHostAvatar.js';
import { PCGrabSystem } from '../grab-system.js';
import { PlayerState } from '../player/PlayerStateMachine.js';
import { gameState } from './GameState.js';

/**
 * PC Client Game - manages the PC player experience
 */
export class ClientGame {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
  }

  start() {
    this.lobbyUI.hide();
    gameState.setMode('client');

    // Initialize Three.js WITHOUT XR
    gameState.renderer = createRenderer(false);
    gameState.camera = createCamera();
    const sceneData = createScene();
    gameState.scene = sceneData.scene;
    gameState.grabbables = sceneData.grabbables;
    gameState.clock = new THREE.Clock();

    // Create visual blocks and objects (positions synced from host)
    this._createBlockMeshes();
    this._createCameraMesh();

    // Setup local player
    gameState.localPlayer = new LocalPlayer(gameState.camera, gameState.scene);
    gameState.localPlayer.setPosition(0, 0.08, 0.5);

    // Setup PC grab system
    gameState.pcGrabSystem = new PCGrabSystem(gameState.camera, gameState.grabbables, gameState.scene);
    this._setupGrabCallbacks();

    // Create VR host avatar
    gameState.vrHostAvatar = new VRHostAvatar(gameState.scene);

    // Initialize client networking
    clientManager.initialize();

    // Setup network callbacks
    this._setupNetworkCallbacks();

    // Create game HUD
    gameState.gameHUD = this.lobbyUI.createGameHUD(networkManager.roomCode, false);

    // Setup instructions overlay
    this._setupInstructions();

    // Handle window resize
    this._setupResizeHandler();

    // Start animation loop
    this._animate();
  }

  _setupGrabCallbacks() {
    gameState.pcGrabSystem.onGrabRequest = (objectId) => {
      clientManager.requestGrab(objectId);
    };

    gameState.pcGrabSystem.onRelease = (objectId, position) => {
      clientManager.releaseObject(objectId, position, { x: 0, y: 0, z: 0 });
    };
  }

  _setupNetworkCallbacks() {
    clientManager.onPlayersUpdated = (players) => {
      this._updateRemotePlayers(players);
    };

    clientManager.onObjectsUpdated = (objects) => {
      this._updateObjectsFromNetwork(objects);
    };

    clientManager.onVRHandsUpdated = (handData) => {
      if (gameState.vrHostAvatar) {
        gameState.vrHostAvatar.updateHands(handData);
      }
    };

    clientManager.onGrabResponse = (objectId, granted) => {
      if (granted) {
        gameState.pcGrabSystem.onGrabGranted(objectId);
      } else {
        gameState.pcGrabSystem.onGrabDenied(objectId);
      }
    };

    // Player state callbacks
    clientManager.onPickedUp = () => {
      gameState.localPlayer.setBeingHeld(true);
    };

    clientManager.onReleased = (throwVelocity) => {
      gameState.localPlayer.setBeingHeld(false);
    };

    clientManager.onPositionUpdate = (position) => {
      gameState.localPlayer.setPosition(position.x, position.y, position.z);
    };

    // Physics callbacks
    clientManager.onPlayerPhysicsUpdated = (physicsStates) => {
      physicsStates.forEach((state) => {
        const player = gameState.remotePlayers.get(state.id);
        if (player) {
          player.updatePhysicsState(state);
        }
      });
    };

    clientManager.onRagdollTriggered = (data) => {
      const player = gameState.remotePlayers.get(data.playerId);
      if (player) {
        player.startRagdoll(data.impulse);
      }
    };

    clientManager.onRagdollRecovery = (data) => {
      const player = gameState.remotePlayers.get(data.playerId);
      if (player) {
        player.setState(PlayerState.RECOVERING);
      }
    };

    clientManager.onLocalRagdollUpdate = (physicsState) => {
      if (physicsState.position) {
        gameState.localPlayer.setRagdollState(physicsState);
      }
    };

    clientManager.onLocalRecovery = () => {
      gameState.localPlayer.setRecovering();
    };

    clientManager.onLocalWalking = () => {
      gameState.localPlayer.setWalking();
    };
  }

  _setupInstructions() {
    const instructions = document.createElement('div');
    instructions.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:white;font-family:sans-serif;text-align:center;z-index:100;';
    instructions.innerHTML = 'Click to start<br>WASD to move, Mouse to look<br>Click objects to grab';
    document.body.appendChild(instructions);

    document.addEventListener('click', () => {
      gameState.localPlayer.requestPointerLock();
      instructions.style.display = 'none';
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';
    }, { once: true });
  }

  _setupResizeHandler() {
    window.addEventListener('resize', () => {
      if (!gameState.camera || !gameState.renderer) return;
      gameState.camera.aspect = window.innerWidth / window.innerHeight;
      gameState.camera.updateProjectionMatrix();
      gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.update();
  }

  update() {
    const delta = gameState.clock.getDelta();

    // Update local player movement
    gameState.localPlayer.update(delta);

    // Update PC grab system
    gameState.pcGrabSystem.update();

    // Send local player state to host
    clientManager.setLocalPlayerState(gameState.localPlayer.getState());

    // Send grabbed object position
    const grabbedId = gameState.pcGrabSystem.getGrabbedObjectId();
    if (grabbedId) {
      const pos = gameState.pcGrabSystem.getGrabbedObjectPosition();
      if (pos) {
        clientManager.sendObjectUpdate(grabbedId, pos);
      }
    }

    // Update VR head position
    const vrHead = clientManager.getVRHeadData();
    if (vrHead && gameState.vrHostAvatar) {
      gameState.vrHostAvatar.updateHead(vrHead);
    }

    // Update remote players
    gameState.remotePlayers.forEach((player) => {
      player.update(delta);
    });

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
  }

  _updateRemotePlayers(players) {
    // Create/update avatars
    players.forEach((playerData, playerId) => {
      if (!gameState.remotePlayers.has(playerId)) {
        const avatar = new RemotePlayer(playerId, gameState.scene);
        gameState.remotePlayers.set(playerId, avatar);
      }
      gameState.remotePlayers.get(playerId).updateFromState(playerData);
    });

    // Remove disconnected players
    gameState.remotePlayers.forEach((avatar, playerId) => {
      if (!players.has(playerId)) {
        avatar.dispose();
        gameState.remotePlayers.delete(playerId);
      }
    });
  }

  _updateObjectsFromNetwork(objects) {
    objects.forEach((objData, objId) => {
      const obj = gameState.grabbables.find(g => g.userData.networkId === objId);
      if (obj) {
        const locallyHeld = gameState.pcGrabSystem?.getGrabbedObjectId() === objId;
        if (!locallyHeld && objData.position) {
          obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        }
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
