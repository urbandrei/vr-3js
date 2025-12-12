import * as THREE from 'three';
import { createScene, createRenderer, createCamera } from './scene.js';
import { setupXRSession } from './xr-session.js';
import { HandTracker } from './hand-tracking.js';
import { GrabSystem, PCGrabSystem } from './grab-system.js';
import { networkManager } from './network/NetworkManager.js';
import { hostManager } from './network/HostManager.js';
import { clientManager } from './network/ClientManager.js';
import { LocalPlayer } from './player/LocalPlayer.js';
import { RemotePlayer } from './player/RemotePlayer.js';
import { VRHostAvatar } from './player/VRHostAvatar.js';
import { LobbyUI } from './ui/LobbyUI.js';
import { PlayerState } from './player/PlayerStateMachine.js';
import { TestBlock } from './physics/TestBlock.js';

// Game state
let isHost = false;
let isInGame = false;
let renderer, camera, scene, grabbables;
let handTrackers = [];
let grabSystem;
let pcGrabSystem;
let localPlayer;
let remotePlayers = new Map();
let vrHostAvatar;
let lobbyUI;
let clock;
let gameHUD;
let testBlocks = [];

// Initialize lobby
function initLobby() {
  lobbyUI = new LobbyUI();

  lobbyUI.onHostGame = async () => {
    try {
      lobbyUI.setStatus('Creating room...');
      const roomCode = await networkManager.createRoom();
      lobbyUI.showRoomCode(roomCode);
      lobbyUI.setStatus('Room created! Click Enter VR to start hosting.');
      isHost = true;
    } catch (err) {
      lobbyUI.setStatus('Failed to create room: ' + err.message);
    }
  };

  lobbyUI.onJoinGame = async (roomCode) => {
    try {
      lobbyUI.setStatus('Connecting to ' + roomCode + '...');
      await networkManager.joinRoom(roomCode);
      lobbyUI.setStatus('Connected! Starting game...');
      isHost = false;
      startClientGame(roomCode);
    } catch (err) {
      lobbyUI.setStatus('Failed to join: ' + err.message);
    }
  };

  lobbyUI.onEnterVR = () => {
    startHostGame();
  };
}

// Start game as VR host
async function startHostGame() {
  lobbyUI.hide();

  // Initialize Three.js with XR
  renderer = createRenderer(true);
  camera = createCamera();
  const sceneData = createScene();
  scene = sceneData.scene;
  grabbables = sceneData.grabbables;
  clock = new THREE.Clock();

  // Setup WebXR and hands
  const hands = setupXRSession(renderer, scene);
  handTrackers = [
    new HandTracker(hands[0], 'left'),
    new HandTracker(hands[1], 'right')
  ];

  // Setup grab system
  grabSystem = new GrabSystem(grabbables);

  // Register objects with host manager
  grabbables.forEach(obj => {
    hostManager.registerObject(
      obj.userData.networkId,
      obj.position,
      obj.rotation
    );
  });

  // Initialize host networking
  hostManager.initialize();

  // Initialize physics system
  hostManager.initializePhysics();

  // Setup collision handler callback to check if block is held by a specific hand
  hostManager.collisionHandler.isBlockHeldByHand = (blockId, handIndex) => {
    return grabSystem.isObjectHeldByHand(blockId, handIndex);
  };

  // Create test blocks for physics testing
  const block1 = new TestBlock(
    hostManager.physicsWorld,
    scene,
    'test1',
    new THREE.Vector3(0.3, 0, 0.3)
  );
  const block2 = new TestBlock(
    hostManager.physicsWorld,
    scene,
    'test2',
    new THREE.Vector3(-0.3, 0, 0.3)
  );
  testBlocks.push(block1, block2);

  // Add test blocks to grabbables
  grabbables.push(block1.mesh, block2.mesh);

  // Register test blocks with host manager
  hostManager.registerObject('block_test1', block1.mesh.position, block1.mesh.rotation);
  hostManager.registerObject('block_test2', block2.mesh.position, block2.mesh.rotation);

  // Network callbacks for grab (handles both objects and players)
  // handIndex: 0 = left, 1 = right
  grabSystem.onGrab = (objectId, grabbedObject, handIndex) => {
    if (grabbedObject && grabbedObject.userData.isPlayer) {
      const playerId = grabbedObject.userData.playerId;
      hostManager.pickupPlayer(playerId);
      const remotePlayer = remotePlayers.get(playerId);
      if (remotePlayer) {
        remotePlayer.setBeingHeld(true);
      }
    } else if (grabbedObject && grabbedObject.userData.isTestBlock) {
      // Handle test block grab
      const block = testBlocks.find(b => b.mesh === grabbedObject);
      if (block) {
        block.setHeld(true);
      }
      hostManager.setObjectHeldBy(objectId, 'host');
    } else {
      hostManager.setObjectHeldBy(objectId, 'host');
    }
  };

  // handIndex: 0 = left, 1 = right
  grabSystem.onRelease = (objectId, position, releasedObject, handIndex) => {
    if (releasedObject && releasedObject.userData.isPlayer) {
      const playerId = releasedObject.userData.playerId;

      // Get object's actual velocity from position tracking for this hand
      const throwVelocity = grabSystem.getObjectVelocity(handIndex);

      hostManager.releasePlayer(throwVelocity);

      const remotePlayer = remotePlayers.get(playerId);
      if (remotePlayer) {
        remotePlayer.setBeingHeld(false);
      }
    } else if (releasedObject && releasedObject.userData.isTestBlock) {
      // Handle test block release
      const block = testBlocks.find(b => b.mesh === releasedObject);
      if (block) {
        // Get object's actual velocity and angular velocity from tracking for this hand
        const throwVelocity = grabSystem.getObjectVelocity(handIndex);
        const angularVelocity = grabSystem.getObjectAngularVelocity(handIndex);

        block.setHeld(false);

        // Temporarily disable hand collision to prevent hand pushing the block
        hostManager.collisionHandler.scheduleHandCollisionReenable(block);

        // Apply linear velocity directly to physics body
        if (throwVelocity.length() > 0.1) {
          block.body.velocity.set(throwVelocity.x, throwVelocity.y, throwVelocity.z);
        }

        // Apply angular velocity for spin
        if (angularVelocity.length() > 0.1) {
          block.body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);
        }
      }
      hostManager.releaseObject(objectId);
    } else {
      hostManager.releaseObject(objectId);
      hostManager.updateObjectPosition(objectId, position, { x: 0, y: 0, z: 0 });
    }
  };

  // Setup callback to handle new players joining
  networkManager.on('player_join', () => {
    updateHostRemotePlayers();
  });
  networkManager.on('player_leave', () => {
    updateHostRemotePlayers();
  });

  // Create game HUD
  gameHUD = lobbyUI.createGameHUD(networkManager.roomCode, true);

  // Start XR session
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
      renderer.xr.setSession(session);
      vrButton.style.display = 'none';
    } catch (err) {
      console.error('Failed to start VR:', err);
      try {
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'hand-tracking']
        });
        renderer.xr.setSession(session);
        vrButton.style.display = 'none';
      } catch (e) {
        alert('Could not start VR: ' + e.message);
      }
    }
  };

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  isInGame = true;
  renderer.setAnimationLoop(() => updateHostGame());
}

// Update loop for VR host
function updateHostGame() {
  const delta = clock.getDelta();

  // Update hand tracking and grab system
  grabSystem.update(handTrackers);

  // Gather hand data for network sync
  const handData = {};
  if (handTrackers[0].hasValidData()) {
    handData.left = handTrackers[0].getJointData();
  }
  if (handTrackers[1].hasValidData()) {
    handData.right = handTrackers[1].getJointData();
  }

  // Update physics with hand data
  if (Object.keys(handData).length > 0) {
    hostManager.updatePhysics(delta, handData);
    hostManager.updateVRHands(handData);
  } else {
    hostManager.updatePhysics(delta, null);
  }

  // Send head position
  const xrCamera = renderer.xr.getCamera();
  if (xrCamera) {
    hostManager.updateVRHead({
      position: {
        x: xrCamera.position.x,
        y: xrCamera.position.y,
        z: xrCamera.position.z
      },
      rotation: {
        x: xrCamera.rotation.x,
        y: xrCamera.rotation.y,
        z: xrCamera.rotation.z
      }
    });
  }

  // Update object positions for all grabbed objects (by VR host - supports two hands)
  const grabbingHands = grabSystem.getGrabbingHandIndices();
  for (const handIndex of grabbingHands) {
    const grabbedId = grabSystem.getGrabbedObjectId(handIndex);
    if (grabbedId) {
      const pos = grabSystem.getGrabbedObjectPosition(handIndex);
      if (pos) {
        if (grabbedId.startsWith('player_')) {
          hostManager.updateHeldPlayerPosition(pos);
          const playerId = grabbedId.replace('player_', '');
          const remotePlayer = remotePlayers.get(playerId);
          if (remotePlayer) {
            remotePlayer.setPosition(pos.x, pos.y, pos.z);
          }
        } else if (grabbedId.startsWith('block_')) {
          // Sync held test block position to physics
          const block = testBlocks.find(b => b.mesh.userData.networkId === grabbedId);
          if (block) {
            block.setPosition(pos.x, pos.y, pos.z);
          }
          hostManager.updateObjectPosition(grabbedId, pos, { x: 0, y: 0, z: 0 });
        } else {
          hostManager.updateObjectPosition(grabbedId, pos, { x: 0, y: 0, z: 0 });
        }
      }
    }
  }

  // Update scene objects from network state
  const networkObjects = hostManager.objects;
  networkObjects.forEach((objData, objId) => {
    if (objData.heldBy === 'host') return;
    const mesh = grabbables.find(g => g.userData.networkId === objId);
    if (mesh && objData.heldBy) {
      mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
    }
  });

  // Update test blocks - sync between mesh and physics, handle self-righting
  testBlocks.forEach(block => {
    if (block.isHeld) {
      block.syncToPhysics();   // Mesh drives physics when held
    } else {
      block.update(delta);     // Handle self-righting behavior
      block.syncFromPhysics(); // Physics drives mesh when free
    }
  });

  // Update remote player avatars
  updateHostRemotePlayers();

  // Update players - sync from physics if ragdolling
  remotePlayers.forEach((player, playerId) => {
    const stateMachine = hostManager.getPlayerStateMachine(playerId);
    const physicsBody = hostManager.getPlayerPhysicsBody(playerId);

    if (stateMachine && physicsBody) {
      if (stateMachine.state === PlayerState.RAGDOLL || stateMachine.state === PlayerState.RECOVERING) {
        // Sync mesh from physics during ragdoll
        physicsBody.syncToMesh(player.mesh);
      }
    }

    player.update(delta);
  });

  // Update player count
  lobbyUI.updateHUDPlayers(networkManager.getPlayerCount());

  // Render
  renderer.render(scene, camera);
}

// Start game as PC client
function startClientGame(roomCode) {
  lobbyUI.hide();

  // Initialize Three.js WITHOUT XR
  renderer = createRenderer(false);
  camera = createCamera();
  const sceneData = createScene();
  scene = sceneData.scene;
  grabbables = sceneData.grabbables;
  clock = new THREE.Clock();

  // Setup local player
  localPlayer = new LocalPlayer(camera, scene);
  localPlayer.setPosition(0, 0.08, 0.5);

  // Setup PC grab system
  pcGrabSystem = new PCGrabSystem(camera, grabbables, scene);
  pcGrabSystem.onGrabRequest = (objectId) => {
    clientManager.requestGrab(objectId);
  };
  pcGrabSystem.onRelease = (objectId, position) => {
    clientManager.releaseObject(objectId, position, { x: 0, y: 0, z: 0 });
  };

  // Create VR host avatar
  vrHostAvatar = new VRHostAvatar(scene);

  // Initialize client networking
  clientManager.initialize();

  // Handle network updates
  clientManager.onPlayersUpdated = (players) => {
    updateRemotePlayers(players);
  };

  clientManager.onObjectsUpdated = (objects) => {
    updateObjectsFromNetwork(objects);
  };

  clientManager.onVRHandsUpdated = (handData) => {
    vrHostAvatar.updateHands(handData);
  };

  clientManager.onGrabResponse = (objectId, granted) => {
    if (granted) {
      pcGrabSystem.onGrabGranted(objectId);
    } else {
      pcGrabSystem.onGrabDenied(objectId);
    }
  };

  // Handle being picked up by VR player
  clientManager.onPickedUp = () => {
    localPlayer.setBeingHeld(true);
  };

  clientManager.onReleased = (throwVelocity) => {
    localPlayer.setBeingHeld(false);
    // Note: throw velocity is handled by host physics
  };

  clientManager.onPositionUpdate = (position) => {
    localPlayer.setPosition(position.x, position.y, position.z);
  };

  // Handle physics updates from host
  clientManager.onPlayerPhysicsUpdated = (physicsStates) => {
    physicsStates.forEach((state) => {
      const player = remotePlayers.get(state.id);
      if (player) {
        player.updatePhysicsState(state);
      }
    });
  };

  // Handle ragdoll triggered
  clientManager.onRagdollTriggered = (data) => {
    const player = remotePlayers.get(data.playerId);
    if (player) {
      player.startRagdoll(data.impulse);
    }
  };

  // Handle ragdoll recovery
  clientManager.onRagdollRecovery = (data) => {
    const player = remotePlayers.get(data.playerId);
    if (player) {
      player.setState(PlayerState.RECOVERING);
    }
  };

  // Handle local player ragdoll physics updates (when WE are ragdolling)
  clientManager.onLocalRagdollUpdate = (physicsState) => {
    if (physicsState.position) {
      localPlayer.setRagdollState(physicsState);
    }
  };

  // Handle local player recovery
  clientManager.onLocalRecovery = () => {
    localPlayer.setRecovering();
  };

  // Handle local player back to walking
  clientManager.onLocalWalking = () => {
    localPlayer.setWalking();
  };

  // Create game HUD
  gameHUD = lobbyUI.createGameHUD(roomCode, false);

  // Instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:white;font-family:sans-serif;text-align:center;z-index:100;';
  instructions.innerHTML = 'Click to start<br>WASD to move, Mouse to look<br>Click objects to grab';
  document.body.appendChild(instructions);

  document.addEventListener('click', () => {
    localPlayer.requestPointerLock();
    instructions.style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
  }, { once: true });

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  isInGame = true;
  function animate() {
    requestAnimationFrame(animate);
    updateClientGame();
  }
  animate();
}

// Update loop for PC client
function updateClientGame() {
  const delta = clock.getDelta();

  // Update local player movement
  localPlayer.update(delta);

  // Update PC grab system
  pcGrabSystem.update();

  // Send local player state to host
  clientManager.setLocalPlayerState(localPlayer.getState());

  // Send grabbed object position to host
  const grabbedId = pcGrabSystem.getGrabbedObjectId();
  if (grabbedId) {
    const pos = pcGrabSystem.getGrabbedObjectPosition();
    if (pos) {
      clientManager.sendObjectUpdate(grabbedId, pos);
    }
  }

  // Update VR head position
  const vrHead = clientManager.getVRHeadData();
  if (vrHead) {
    vrHostAvatar.updateHead(vrHead);
  }

  // Update remote players
  remotePlayers.forEach((player) => {
    player.update(delta);
  });

  // Render
  renderer.render(scene, camera);
}

// Update remote player avatars (for PC client)
function updateRemotePlayers(players) {
  // Create/update avatars
  players.forEach((playerData, playerId) => {
    if (!remotePlayers.has(playerId)) {
      const avatar = new RemotePlayer(playerId, scene);
      remotePlayers.set(playerId, avatar);
    }
    remotePlayers.get(playerId).updateFromState(playerData);
  });

  // Remove disconnected players
  remotePlayers.forEach((avatar, playerId) => {
    if (!players.has(playerId)) {
      avatar.dispose();
      remotePlayers.delete(playerId);
    }
  });
}

// Update remote player avatars (for VR host)
function updateHostRemotePlayers() {
  const players = hostManager.players;

  // Create/update avatars for PC players
  players.forEach((playerData, playerId) => {
    if (!remotePlayers.has(playerId)) {
      const avatar = new RemotePlayer(playerId, scene);
      remotePlayers.set(playerId, avatar);
      // Add player mesh to grabbables so VR can pick them up
      grabbables.push(avatar.mesh);

      // Create physics body for player if it doesn't exist
      if (!hostManager.getPlayerPhysicsBody(playerId)) {
        hostManager.createPlayerPhysics(playerId, avatar.animationController);
      }

      // Set animation controller on state machine once model loads
      const checkAnimController = setInterval(() => {
        if (avatar.animationController) {
          hostManager.setPlayerAnimationController(playerId, avatar.animationController);
          clearInterval(checkAnimController);
        }
      }, 100);
    }
    remotePlayers.get(playerId).updateFromState(playerData);
  });

  // Remove disconnected players
  remotePlayers.forEach((avatar, playerId) => {
    if (!players.has(playerId)) {
      const index = grabbables.indexOf(avatar.mesh);
      if (index > -1) {
        grabbables.splice(index, 1);
      }
      avatar.dispose();
      remotePlayers.delete(playerId);
    }
  });
}

// Update objects from network state
function updateObjectsFromNetwork(objects) {
  objects.forEach((objData, objId) => {
    const obj = grabbables.find(g => g.userData.networkId === objId);
    if (obj) {
      const locallyHeld = pcGrabSystem && pcGrabSystem.getGrabbedObjectId() === objId;
      if (!locallyHeld) {
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
      }
    }
  });
}

// Start the app
initLobby();
