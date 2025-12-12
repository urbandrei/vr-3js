import * as THREE from 'three';
import { PlayerState } from './PlayerStateMachine.js';

// Tiny avatar scale - eye height ~8cm
const EYE_HEIGHT = 0.08;
const MOVE_SPEED = 0.5; // Scaled down for tiny size

export class LocalPlayer {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.velocity = new THREE.Vector3();
    this.moveSpeed = MOVE_SPEED;

    this.keys = { w: false, a: false, s: false, d: false };
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.isPointerLocked = false;
    this.isBeingHeld = false; // When VR player picks us up
    this.currentState = PlayerState.WALKING;

    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  requestPointerLock() {
    document.body.requestPointerLock();
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.w = true; break;
      case 'KeyA': this.keys.a = true; break;
      case 'KeyS': this.keys.s = true; break;
      case 'KeyD': this.keys.d = true; break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.w = false; break;
      case 'KeyA': this.keys.a = false; break;
      case 'KeyS': this.keys.s = false; break;
      case 'KeyD': this.keys.d = false; break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked) return;

    const sensitivity = 0.002;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= e.movementX * sensitivity;
    this.euler.x -= e.movementY * sensitivity;

    // Clamp vertical look
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  update(deltaTime) {
    // Don't move if being held by VR player
    if (this.isBeingHeld) return;

    // Don't process movement during ragdoll/recovery - position comes from physics
    if (this.currentState === PlayerState.RAGDOLL ||
        this.currentState === PlayerState.RECOVERING) {
      return;
    }

    // Get camera's forward and right directions (horizontal only)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Apply movement based on keys
    if (this.keys.w) {
      this.camera.position.addScaledVector(forward, this.moveSpeed * deltaTime);
    }
    if (this.keys.s) {
      this.camera.position.addScaledVector(forward, -this.moveSpeed * deltaTime);
    }
    if (this.keys.a) {
      this.camera.position.addScaledVector(right, -this.moveSpeed * deltaTime);
    }
    if (this.keys.d) {
      this.camera.position.addScaledVector(right, this.moveSpeed * deltaTime);
    }

    // Keep at tiny avatar eye height
    this.camera.position.y = EYE_HEIGHT;
  }

  isCurrentlyMoving() {
    return this.keys.w || this.keys.a || this.keys.s || this.keys.d;
  }

  getState() {
    return {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      rotation: this.euler.y,
      isMoving: this.isCurrentlyMoving()
    };
  }

  setPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  setBeingHeld(held, position) {
    this.isBeingHeld = held;
    if (held) {
      this.currentState = PlayerState.HELD;
      if (position) {
        this.camera.position.set(position.x, position.y, position.z);
      }
    }
  }

  // Update position from physics during ragdoll - keeps camera upright
  updateFromPhysics(physicsState) {
    if (!physicsState) return;

    // Update camera position from physics body, offset for eye height
    this.camera.position.set(
      physicsState.position.x,
      physicsState.position.y + EYE_HEIGHT,
      physicsState.position.z
    );
    // Camera orientation stays player-controlled (upright) - don't apply physics rotation
  }

  // Called when ragdoll state is received from host
  setRagdollState(physicsState) {
    this.currentState = PlayerState.RAGDOLL;
    this.isBeingHeld = false;
    this.updateFromPhysics(physicsState);
  }

  // Called when transitioning to recovery
  setRecovering() {
    this.currentState = PlayerState.RECOVERING;
    // Reset camera to ground level immediately
    this.camera.position.y = EYE_HEIGHT;
  }

  // Called when recovery is complete
  setWalking() {
    this.currentState = PlayerState.WALKING;
    // Reset camera to proper eye height
    this.camera.position.y = EYE_HEIGHT;
  }

  getCurrentState() {
    return this.currentState;
  }
}
