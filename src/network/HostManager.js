import { networkManager } from './NetworkManager.js';
import { MessageTypes } from './MessageTypes.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { VRHandPhysics } from '../physics/VRHandPhysics.js';
import { PlayerPhysicsBody } from '../physics/PlayerPhysicsBody.js';
import { CollisionHandler } from '../physics/CollisionHandler.js';
import { PlayerStateMachine, PlayerState } from '../player/PlayerStateMachine.js';

class HostManager {
  constructor() {
    this.players = new Map();
    this.objects = new Map();
    this.vrHandData = null;
    this.vrHeadData = null;
    this.heldPlayerId = null;

    // Physics system
    this.physicsWorld = null;
    this.handPhysics = { left: null, right: null };
    this.playerPhysics = new Map();
    this.playerStateMachines = new Map();
    this.collisionHandler = null;
    this.physicsInitialized = false;

    this.stateUpdateInterval = null;
    this.handUpdateInterval = null;

    // Callback for when player physics body is created
    this.onPlayerPhysicsCreated = null;
  }

  initialize() {
    networkManager.on(MessageTypes.PLAYER_JOIN, (data) => this.onPlayerJoin(data));
    networkManager.on(MessageTypes.PLAYER_LEAVE, (data) => this.onPlayerLeave(data));
    networkManager.on(MessageTypes.PLAYER_STATE, (data) => this.onPlayerState(data));
    networkManager.on(MessageTypes.GRAB_REQUEST, (data) => this.onGrabRequest(data));
    networkManager.on(MessageTypes.OBJECT_RELEASE, (data) => this.onObjectRelease(data));
    networkManager.on(MessageTypes.OBJECT_UPDATE, (data) => this.onObjectUpdate(data));

    // Broadcast world state at 20Hz
    this.stateUpdateInterval = setInterval(() => this.broadcastWorldState(), 50);

    // Broadcast hand tracking at 30Hz
    this.handUpdateInterval = setInterval(() => this.broadcastHandTracking(), 33);
  }

  initializePhysics() {
    if (this.physicsInitialized) return;

    this.physicsWorld = new PhysicsWorld();

    // Create VR hand physics bodies
    this.handPhysics.left = new VRHandPhysics(this.physicsWorld, 'left');
    this.handPhysics.right = new VRHandPhysics(this.physicsWorld, 'right');

    // Setup collision handler
    this.collisionHandler = new CollisionHandler(this.physicsWorld, this.handPhysics);
    this.collisionHandler.onPlayerRagdoll = (playerId, impulse, velocity, sourceType, sourceId) => {
      this.triggerPlayerRagdoll(playerId, impulse, velocity, sourceType, sourceId);
    };

    this.physicsInitialized = true;
    console.log('Physics system initialized');
  }

  onPlayerJoin(data) {
    console.log('Player joined:', data.playerId);
    this.players.set(data.playerId, {
      id: data.playerId,
      position: { x: 0, y: 0.08, z: 0.5 },
      rotation: 0,
      type: 'pc',
      state: PlayerState.WALKING
    });

    // Create physics body for player if physics is initialized
    if (this.physicsInitialized) {
      this.createPlayerPhysics(data.playerId);
    }

    // Send current world state to new player
    this.sendInitialState(data.playerId);
  }

  createPlayerPhysics(playerId, animationController = null) {
    if (!this.physicsWorld) return;

    const physicsBody = new PlayerPhysicsBody(this.physicsWorld, playerId);
    this.playerPhysics.set(playerId, physicsBody);

    const stateMachine = new PlayerStateMachine(playerId, physicsBody, animationController);
    stateMachine.onStateChange = (pid, oldState, newState, data) => {
      this.onPlayerStateChange(pid, oldState, newState, data);
    };
    this.playerStateMachines.set(playerId, stateMachine);

    // Set initial position
    const player = this.players.get(playerId);
    if (player) {
      physicsBody.setPosition(player.position.x, 0, player.position.z);
    }

    if (this.onPlayerPhysicsCreated) {
      this.onPlayerPhysicsCreated(playerId, physicsBody, stateMachine);
    }

    return { physicsBody, stateMachine };
  }

  setPlayerAnimationController(playerId, animationController) {
    const stateMachine = this.playerStateMachines.get(playerId);
    if (stateMachine) {
      stateMachine.animationController = animationController;
    }
  }

  onPlayerLeave(data) {
    console.log('Player left:', data.playerId);
    this.players.delete(data.playerId);

    // Cleanup physics
    const physicsBody = this.playerPhysics.get(data.playerId);
    if (physicsBody) {
      physicsBody.dispose();
      this.playerPhysics.delete(data.playerId);
    }
    this.playerStateMachines.delete(data.playerId);

    // Release any objects held by this player
    this.objects.forEach((obj, id) => {
      if (obj.heldBy === data.playerId) {
        obj.heldBy = null;
      }
    });

    // Release if this player was being held
    if (this.heldPlayerId === data.playerId) {
      this.heldPlayerId = null;
    }
  }

  onPlayerState(data) {
    const player = this.players.get(data.senderId);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;

      // Update physics body position for walking players
      const stateMachine = this.playerStateMachines.get(data.senderId);
      const physicsBody = this.playerPhysics.get(data.senderId);
      if (stateMachine && physicsBody && stateMachine.state === PlayerState.WALKING) {
        physicsBody.setPosition(data.position.x, 0, data.position.z);
      }
    }
  }

  onPlayerStateChange(playerId, oldState, newState, data) {
    // Update player state
    const player = this.players.get(playerId);
    if (player) {
      player.state = newState;
    }

    // Broadcast state change
    if (newState === PlayerState.RAGDOLL) {
      networkManager.broadcast({
        type: MessageTypes.RAGDOLL_TRIGGERED,
        playerId,
        impulse: data.impulse ? { x: data.impulse.x, y: data.impulse.y, z: data.impulse.z } : null,
        sourceType: data.sourceType,
        sourceId: data.sourceId
      });
    } else if (newState === PlayerState.RECOVERING) {
      networkManager.broadcast({
        type: MessageTypes.RAGDOLL_RECOVERY,
        playerId
      });
    }
  }

  onGrabRequest(data) {
    const obj = this.objects.get(data.objectId);
    if (!obj) return;

    const granted = obj.heldBy === null;

    if (granted) {
      obj.heldBy = data.senderId;
    }

    networkManager.sendTo(data.senderId, {
      type: MessageTypes.GRAB_RESPONSE,
      objectId: data.objectId,
      granted
    });
  }

  onObjectRelease(data) {
    const obj = this.objects.get(data.objectId);
    if (obj && obj.heldBy === data.senderId) {
      obj.heldBy = null;
      obj.position = data.position;
      obj.rotation = data.rotation;
    }
  }

  onObjectUpdate(data) {
    const obj = this.objects.get(data.objectId);
    if (obj && obj.heldBy === data.senderId) {
      obj.position = data.position;
    }
  }

  sendInitialState(playerId) {
    const state = {
      type: 'initial_state',
      players: Array.from(this.players.values()),
      objects: Array.from(this.objects.values())
    };
    networkManager.sendTo(playerId, state);
  }

  registerObject(id, position, rotation) {
    this.objects.set(id, {
      id,
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      heldBy: null
    });
  }

  updateObjectPosition(id, position, rotation) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.position = { x: position.x, y: position.y, z: position.z };
      obj.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
    }
  }

  setObjectHeldBy(id, playerId) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.heldBy = playerId;
    }
  }

  releaseObject(id) {
    const obj = this.objects.get(id);
    if (obj) {
      obj.heldBy = null;
    }
  }

  // Physics update - call this from game loop
  updatePhysics(deltaTime, handData) {
    if (!this.physicsInitialized) return;

    // Update hand physics from tracking data
    if (handData?.left?.joints && handData.left.joints[0]) {
      const wrist = handData.left.joints[0];
      this.handPhysics.left.update(wrist, deltaTime);
    } else {
      this.handPhysics.left.update(null, deltaTime);
    }

    if (handData?.right?.joints && handData.right.joints[0]) {
      const wrist = handData.right.joints[0];
      this.handPhysics.right.update(wrist, deltaTime);
    } else {
      this.handPhysics.right.update(null, deltaTime);
    }

    // Step physics world
    this.physicsWorld.step(deltaTime);

    // Update player state machines
    this.playerStateMachines.forEach((sm) => sm.update(deltaTime));
  }

  // Trigger ragdoll on a player
  triggerPlayerRagdoll(playerId, impulse, velocity, sourceType = 'hand', sourceId = null) {
    const stateMachine = this.playerStateMachines.get(playerId);
    if (stateMachine) {
      stateMachine.triggerRagdoll(impulse, velocity);
    }
  }

  // Player pickup methods
  pickupPlayer(playerId) {
    this.heldPlayerId = playerId;

    // Trigger held state
    const stateMachine = this.playerStateMachines.get(playerId);
    if (stateMachine) {
      stateMachine.triggerHeld();
    }

    // Notify the player they're being picked up
    networkManager.sendTo(playerId, {
      type: MessageTypes.PLAYER_PICKUP,
      heldBy: 'host'
    });
  }

  releasePlayer(throwVelocity = null) {
    if (this.heldPlayerId) {
      const playerId = this.heldPlayerId;

      // Trigger release (may cause ragdoll if thrown hard)
      const stateMachine = this.playerStateMachines.get(playerId);
      if (stateMachine) {
        stateMachine.triggerRelease(throwVelocity);
      }

      networkManager.sendTo(playerId, {
        type: MessageTypes.PLAYER_RELEASE,
        throwVelocity: throwVelocity ? { x: throwVelocity.x, y: throwVelocity.y, z: throwVelocity.z } : null
      });

      this.heldPlayerId = null;
    }
  }

  updateHeldPlayerPosition(position) {
    if (this.heldPlayerId) {
      // Update physics body position
      const physicsBody = this.playerPhysics.get(this.heldPlayerId);
      if (physicsBody) {
        physicsBody.setPosition(position.x, position.y, position.z);
      }

      networkManager.sendTo(this.heldPlayerId, {
        type: MessageTypes.PLAYER_POSITION,
        position
      });
    }
  }

  getHeldPlayerId() {
    return this.heldPlayerId;
  }

  getPlayerPhysicsBody(playerId) {
    return this.playerPhysics.get(playerId);
  }

  getPlayerStateMachine(playerId) {
    return this.playerStateMachines.get(playerId);
  }

  updateVRHands(handData) {
    this.vrHandData = handData;
  }

  updateVRHead(headData) {
    this.vrHeadData = headData;
  }

  broadcastWorldState() {
    // Build player physics states
    const playerPhysicsStates = [];
    this.players.forEach((player, playerId) => {
      const sm = this.playerStateMachines.get(playerId);
      const physics = this.playerPhysics.get(playerId);

      if (physics) {
        const physicsState = physics.getState();
        playerPhysicsStates.push({
          id: playerId,
          state: sm ? sm.state : PlayerState.WALKING,
          position: physicsState.position,
          rotation: physicsState.rotation,
          velocity: physicsState.velocity
        });
      }
    });

    const state = {
      type: MessageTypes.WORLD_STATE,
      timestamp: Date.now(),
      players: Array.from(this.players.values()),
      objects: Array.from(this.objects.values()),
      vrHead: this.vrHeadData,
      playerPhysics: playerPhysicsStates
    };
    networkManager.broadcast(state);
  }

  broadcastHandTracking() {
    if (!this.vrHandData) return;

    const message = {
      type: MessageTypes.HAND_TRACKING,
      timestamp: Date.now(),
      hands: this.vrHandData
    };
    networkManager.broadcast(message);
  }

  cleanup() {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
    }
    if (this.handUpdateInterval) {
      clearInterval(this.handUpdateInterval);
    }

    // Cleanup physics
    this.playerPhysics.forEach((body) => body.dispose());
    this.playerPhysics.clear();
    this.playerStateMachines.clear();
  }
}

export const hostManager = new HostManager();
