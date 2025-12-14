/**
 * @deprecated This file is deprecated. Use:
 * - DashboardHost.js for hosting the game (dashboard UI, physics authority)
 * - VRClientGame.js for VR player experience (connects to host as client)
 *
 * The architecture has changed: VR player is now a client, not the host.
 * This file is kept for reference only.
 */

import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from '../scene.js';
import { setupXRSession } from '../xr-session.js';
import { HandTracker } from '../hand-tracking.js';
import { GrabSystem } from '../grab-system.js';
import { networkManager } from '../network/NetworkManager.js';
import { hostManager } from '../network/HostManager.js';
import { RemotePlayer } from '../player/RemotePlayer.js';
import { TestBlock } from '../physics/TestBlock.js';
import { PlaceableCamera } from '../objects/PlaceableCamera.js';
import { PlayerState } from '../player/PlayerStateMachine.js';
import { GrabHandler } from '../grab/GrabHandler.js';
import { extractHandData, extractVRHeadData } from '../utils/HandDataExtractor.js';
import { gameState } from './GameState.js';

/**
 * @deprecated VR Host Game - manages the VR player experience
 * This class is deprecated - use DashboardHost + VRClientGame instead.
 */
export class HostGame {
  constructor(lobbyUI) {
    this.lobbyUI = lobbyUI;
  }

  async start() {
    this.lobbyUI.hide();
    gameState.setMode('host');

    // Initialize Three.js with XR
    gameState.renderer = createRenderer(true);
    gameState.camera = createCamera();
    const sceneData = createScene();
    gameState.scene = sceneData.scene;
    gameState.grabbables = sceneData.grabbables;
    gameState.clock = new THREE.Clock();

    // Setup WebXR and hands
    const hands = setupXRSession(gameState.renderer, gameState.scene);
    gameState.handTrackers = [
      new HandTracker(hands[0], 'left'),
      new HandTracker(hands[1], 'right')
    ];

    // Setup grab system
    gameState.grabSystem = new GrabSystem(gameState.grabbables);

    // Register objects with host manager
    gameState.grabbables.forEach(obj => {
      hostManager.registerObject(
        obj.userData.networkId,
        obj.position,
        obj.rotation
      );
    });

    // Initialize host networking and physics
    hostManager.initialize();
    hostManager.initializePhysics();

    // Setup collision handler callback
    hostManager.collisionHandler.isBlockHeldByHand = (blockId, handIndex) => {
      return gameState.grabSystem.isObjectHeldByHand(blockId, handIndex);
    };

    // Create test blocks
    this._createTestBlocks();

    // Create placeable camera
    gameState.placeableCamera = new PlaceableCamera(
      gameState.scene,
      'main',
      new THREE.Vector3(0.5, 0.3, 0)
    );
    gameState.grabbables.push(gameState.placeableCamera.mesh);

    // Create grab handler
    gameState.grabHandler = new GrabHandler(
      hostManager,
      gameState.testBlocks,
      gameState.placeableCamera
    );

    // Setup grab/release callbacks
    this._setupGrabCallbacks();

    // Setup network callbacks
    this._setupNetworkCallbacks();

    // Create game HUD
    gameState.gameHUD = this.lobbyUI.createGameHUD(networkManager.roomCode, true);

    // Setup VR button
    this._setupVRButton();

    // Handle window resize
    this._setupResizeHandler();

    // Start animation loop
    gameState.renderer.setAnimationLoop(() => this.update());
  }

  _createTestBlocks() {
    const block1 = new TestBlock(
      hostManager.physicsWorld,
      gameState.scene,
      'test1',
      new THREE.Vector3(0.3, 0, -0.3)
    );
    const block2 = new TestBlock(
      hostManager.physicsWorld,
      gameState.scene,
      'test2',
      new THREE.Vector3(-0.3, 0, -0.3)
    );

    gameState.testBlocks.push(block1, block2);
    gameState.grabbables.push(block1.mesh, block2.mesh);

    // Register with host manager
    hostManager.registerObject('block_test1', block1.mesh.position, block1.mesh.rotation);
    hostManager.registerObject('block_test2', block2.mesh.position, block2.mesh.rotation);
  }

  _setupGrabCallbacks() {
    const grabHandler = gameState.grabHandler;
    grabHandler.setRemotePlayers(gameState.remotePlayers);

    gameState.grabSystem.onGrab = (objectId, grabbedObject, handIndex) => {
      grabHandler.handleGrab(objectId, grabbedObject, handIndex);
    };

    gameState.grabSystem.onRelease = (objectId, position, releasedObject, handIndex) => {
      grabHandler.handleRelease(
        objectId,
        position,
        releasedObject,
        handIndex,
        () => gameState.grabSystem.getObjectVelocity(handIndex),
        () => gameState.grabSystem.getObjectAngularVelocity(handIndex)
      );
    };
  }

  _setupNetworkCallbacks() {
    networkManager.on('player_join', () => this._updateRemotePlayers());
    networkManager.on('player_leave', () => this._updateRemotePlayers());
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

    // Gather hand data
    const handData = extractHandData(gameState.handTrackers);

    // Update physics with hand data
    hostManager.updatePhysics(delta, handData);
    if (handData) {
      hostManager.updateVRHands(handData);
    }

    // Send head position
    const xrCamera = gameState.renderer.xr.getCamera();
    const headData = extractVRHeadData(xrCamera);
    if (headData) {
      hostManager.updateVRHead(headData);
    }

    // Update grabbed objects
    this._updateGrabbedObjects();

    // Update scene objects from network state
    this._updateNetworkObjects();

    // Update test blocks
    this._updateTestBlocks(delta);

    // Update placeable camera
    if (gameState.placeableCamera) {
      gameState.placeableCamera.update(delta);
      hostManager.setCameraTransform(gameState.placeableCamera.getTransformData());
    }

    // Update remote player avatars
    this._updateRemotePlayers();

    // Update players physics state
    this._updatePlayersPhysics(delta);

    // Update HUD
    this.lobbyUI.updateHUDPlayers(networkManager.getPlayerCount());

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

      if (grabbedId.startsWith('player_')) {
        hostManager.updateHeldPlayerPosition(pos);
        const playerId = grabbedId.replace('player_', '');
        const remotePlayer = gameState.remotePlayers.get(playerId);
        if (remotePlayer) {
          remotePlayer.setPosition(pos.x, pos.y, pos.z);
        }
      } else if (grabbedId.startsWith('block_')) {
        const block = gameState.testBlocks.find(b => b.mesh.userData.networkId === grabbedId);
        if (block) {
          block.setPosition(pos.x, pos.y, pos.z);
        }
        hostManager.updateObjectPosition(grabbedId, pos, { x: 0, y: 0, z: 0 });
      } else {
        hostManager.updateObjectPosition(grabbedId, pos, { x: 0, y: 0, z: 0 });
      }
    }
  }

  _updateNetworkObjects() {
    const networkObjects = hostManager.objects;
    networkObjects.forEach((objData, objId) => {
      if (objData.heldBy === 'host') return;
      const mesh = gameState.grabbables.find(g => g.userData.networkId === objId);
      if (mesh && objData.heldBy) {
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
      }
    });
  }

  _updateTestBlocks(delta) {
    gameState.testBlocks.forEach(block => {
      if (block.isHeld) {
        block.syncToPhysics();
      } else {
        block.update(delta);
        block.syncFromPhysics();
      }
      // Sync to network
      hostManager.updateObjectPosition(
        block.mesh.userData.networkId,
        block.mesh.position,
        block.mesh.rotation
      );
    });
  }

  _updateRemotePlayers() {
    const players = hostManager.players;

    // Create/update avatars for PC players
    players.forEach((playerData, playerId) => {
      if (!gameState.remotePlayers.has(playerId)) {
        const avatar = new RemotePlayer(playerId, gameState.scene);
        gameState.remotePlayers.set(playerId, avatar);
        gameState.grabbables.push(avatar.mesh);

        // Create physics body
        if (!hostManager.getPlayerPhysicsBody(playerId)) {
          hostManager.createPlayerPhysics(playerId, avatar.animationController);
        }

        // Set animation controller when loaded
        const checkAnimController = setInterval(() => {
          if (avatar.animationController) {
            hostManager.setPlayerAnimationController(playerId, avatar.animationController);
            clearInterval(checkAnimController);
          }
        }, 100);
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

    // Update grab handler reference
    gameState.grabHandler?.setRemotePlayers(gameState.remotePlayers);
  }

  _updatePlayersPhysics(delta) {
    gameState.remotePlayers.forEach((player, playerId) => {
      const stateMachine = hostManager.getPlayerStateMachine(playerId);
      const physicsBody = hostManager.getPlayerPhysicsBody(playerId);

      if (stateMachine && physicsBody) {
        if (stateMachine.state === PlayerState.RAGDOLL || stateMachine.state === PlayerState.RECOVERING) {
          physicsBody.syncToMesh(player.mesh);
        }
      }

      player.update(delta);
    });
  }
}
