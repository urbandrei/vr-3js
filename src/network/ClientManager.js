import { networkManager } from './NetworkManager.js';
import { MessageTypes } from './MessageTypes.js';

class ClientManager {
  constructor() {
    this.players = new Map();
    this.objects = new Map();
    this.vrHandData = null;
    this.vrHeadData = null;

    // Callbacks
    this.onPlayersUpdated = null;
    this.onObjectsUpdated = null;
    this.onVRHandsUpdated = null;
    this.onGrabResponse = null;
    this.onPickedUp = null;
    this.onReleased = null;
    this.onPositionUpdate = null;

    // Physics callbacks
    this.onPlayerPhysicsUpdated = null;
    this.onRagdollTriggered = null;
    this.onRagdollRecovery = null;

    // Local player ragdoll callbacks (for the player being controlled)
    this.onLocalRagdollUpdate = null;
    this.onLocalRecovery = null;
    this.onLocalWalking = null;

    this.stateUpdateInterval = null;
    this.localPlayerState = null;
    this.isBeingHeld = false;
  }

  initialize() {
    networkManager.on('initial_state', (data) => this.onInitialState(data));
    networkManager.on(MessageTypes.WORLD_STATE, (data) => this.onWorldState(data));
    networkManager.on(MessageTypes.HAND_TRACKING, (data) => this.onHandTracking(data));
    networkManager.on(MessageTypes.GRAB_RESPONSE, (data) => this.handleGrabResponse(data));
    networkManager.on(MessageTypes.PLAYER_PICKUP, (data) => this.handlePickedUp(data));
    networkManager.on(MessageTypes.PLAYER_RELEASE, (data) => this.handleReleased(data));
    networkManager.on(MessageTypes.PLAYER_POSITION, (data) => this.handlePositionUpdate(data));

    // Physics messages
    networkManager.on(MessageTypes.RAGDOLL_TRIGGERED, (data) => this.handleRagdollTriggered(data));
    networkManager.on(MessageTypes.RAGDOLL_RECOVERY, (data) => this.handleRagdollRecovery(data));

    networkManager.on('disconnected', () => this.onDisconnected());

    // Send player state at 20Hz
    this.stateUpdateInterval = setInterval(() => this.sendPlayerState(), 50);
  }

  onInitialState(data) {
    console.log('Received initial state');
    data.players.forEach(p => this.players.set(p.id, p));
    data.objects.forEach(o => this.objects.set(o.id, o));

    if (this.onPlayersUpdated) this.onPlayersUpdated(this.players);
    if (this.onObjectsUpdated) this.onObjectsUpdated(this.objects);
  }

  onWorldState(data) {
    // Update players (excluding self)
    this.players.clear();
    data.players.forEach(p => {
      if (p.id !== networkManager.playerId) {
        this.players.set(p.id, p);
      }
    });

    // Update objects
    this.objects.clear();
    data.objects.forEach(o => this.objects.set(o.id, o));

    // Update VR head
    this.vrHeadData = data.vrHead;

    if (this.onPlayersUpdated) this.onPlayersUpdated(this.players);
    if (this.onObjectsUpdated) this.onObjectsUpdated(this.objects);

    // Handle player physics states
    if (data.playerPhysics) {
      // Find our own physics state
      const myState = data.playerPhysics.find(p => p.id === networkManager.playerId);
      if (myState) {
        // Handle local player state based on physics state
        if (myState.state === 'ragdoll' || myState.state === 'recovering') {
          if (this.onLocalRagdollUpdate) {
            this.onLocalRagdollUpdate(myState);
          }
        } else if (myState.state === 'walking' && this.onLocalWalking) {
          this.onLocalWalking();
        }
      }

      // Update remote players (callback for other players)
      if (this.onPlayerPhysicsUpdated) {
        this.onPlayerPhysicsUpdated(data.playerPhysics);
      }
    }
  }

  onHandTracking(data) {
    this.vrHandData = data.hands;
    if (this.onVRHandsUpdated) this.onVRHandsUpdated(data.hands);
  }

  handleGrabResponse(data) {
    if (this.onGrabResponse) {
      this.onGrabResponse(data.objectId, data.granted);
    }
  }

  handlePickedUp(data) {
    console.log('Being picked up by VR player!');
    this.isBeingHeld = true;
    if (this.onPickedUp) {
      this.onPickedUp();
    }
  }

  handleReleased(data) {
    console.log('Released by VR player!');
    this.isBeingHeld = false;
    if (this.onReleased) {
      this.onReleased(data?.throwVelocity || null);
    }
  }

  handlePositionUpdate(data) {
    if (this.onPositionUpdate && data.position) {
      this.onPositionUpdate(data.position);
    }
  }

  handleRagdollTriggered(data) {
    console.log('Player ragdoll triggered:', data.playerId);

    // Check if this is for us (local player)
    if (data.playerId === networkManager.playerId) {
      // Local player ragdoll - initial trigger (before physics updates arrive)
      if (this.onLocalRagdollUpdate) {
        this.onLocalRagdollUpdate({
          state: 'ragdoll',
          position: null, // Will be updated by physics state
          impulse: data.impulse
        });
      }
    }

    // Also notify for remote players
    if (this.onRagdollTriggered) {
      this.onRagdollTriggered(data);
    }
  }

  handleRagdollRecovery(data) {
    console.log('Player ragdoll recovery:', data.playerId);

    // Check if this is for us (local player)
    if (data.playerId === networkManager.playerId && this.onLocalRecovery) {
      this.onLocalRecovery();
    }

    if (this.onRagdollRecovery) {
      this.onRagdollRecovery(data);
    }
  }

  onDisconnected() {
    console.log('Disconnected from host');
    this.cleanup();
  }

  setLocalPlayerState(state) {
    this.localPlayerState = state;
  }

  sendPlayerState() {
    if (!this.localPlayerState) return;

    networkManager.sendToHost({
      type: MessageTypes.PLAYER_STATE,
      position: this.localPlayerState.position,
      rotation: this.localPlayerState.rotation
    });
  }

  requestGrab(objectId) {
    networkManager.sendToHost({
      type: MessageTypes.GRAB_REQUEST,
      objectId
    });
  }

  releaseObject(objectId, position, rotation) {
    networkManager.sendToHost({
      type: MessageTypes.OBJECT_RELEASE,
      objectId,
      position,
      rotation
    });
  }

  sendObjectUpdate(objectId, position) {
    networkManager.sendToHost({
      type: MessageTypes.OBJECT_UPDATE,
      objectId,
      position
    });
  }

  getPlayers() {
    return this.players;
  }

  getObjects() {
    return this.objects;
  }

  getVRHandData() {
    return this.vrHandData;
  }

  getVRHeadData() {
    return this.vrHeadData;
  }

  cleanup() {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
    }
  }
}

export const clientManager = new ClientManager();
