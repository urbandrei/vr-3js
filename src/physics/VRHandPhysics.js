import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PhysicsConfig } from './PhysicsConfig.js';

export class VRHandPhysics {
  constructor(physicsWorld, handedness) {
    this.physicsWorld = physicsWorld;
    this.handedness = handedness;

    // Position tracking
    this.previousPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    this.hasValidPreviousPosition = false;

    // Velocity tracking with history for smoothing
    this.velocity = new THREE.Vector3();
    this.velocityHistory = [];
    this.maxHistoryLength = PhysicsConfig.hand.velocityHistoryLength;

    // Virtual mass for momentum calculations
    this.virtualMass = PhysicsConfig.hand.virtualMass;

    // Create kinematic physics body
    this.body = this.createBody();
    physicsWorld.addBody(`hand_${handedness}`, this.body);

    // Track if hand data is valid
    this.isActive = false;
  }

  createBody() {
    const shape = new CANNON.Sphere(PhysicsConfig.hand.radius);
    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      shape: shape,
      material: this.physicsWorld.handMaterial,
      collisionFilterGroup: this.physicsWorld.COLLISION_GROUPS.VR_HAND,
      collisionFilterMask: this.physicsWorld.COLLISION_GROUPS.PLAYER
    });

    // Start at a position far away (inactive)
    body.position.set(0, -100, 0);

    return body;
  }

  update(wristPosition, deltaTime) {
    if (!wristPosition) {
      this.isActive = false;
      // Move body out of the way when inactive
      this.body.position.set(0, -100, 0);
      return;
    }

    this.isActive = true;

    // Update position tracking
    this.previousPosition.copy(this.currentPosition);
    this.currentPosition.set(wristPosition.x, wristPosition.y, wristPosition.z);

    // Calculate instantaneous velocity
    if (this.hasValidPreviousPosition && deltaTime > 0) {
      const instantVelocity = new THREE.Vector3()
        .subVectors(this.currentPosition, this.previousPosition)
        .divideScalar(deltaTime);

      // Add to history for smoothing
      this.velocityHistory.push(instantVelocity.clone());
      if (this.velocityHistory.length > this.maxHistoryLength) {
        this.velocityHistory.shift();
      }

      // Update smoothed velocity
      this.velocity.set(0, 0, 0);
      for (const v of this.velocityHistory) {
        this.velocity.add(v);
      }
      this.velocity.divideScalar(this.velocityHistory.length);
    }

    this.hasValidPreviousPosition = true;

    // Update physics body position (kinematic follows hand)
    this.body.position.set(
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    );
  }

  getVelocity() {
    return this.velocity.clone();
  }

  getSpeed() {
    return this.velocity.length();
  }

  getMomentum() {
    return this.velocity.clone().multiplyScalar(this.virtualMass);
  }

  getImpactForce() {
    return this.getMomentum().length();
  }

  getPosition() {
    return this.currentPosition.clone();
  }

  reset() {
    this.previousPosition.set(0, 0, 0);
    this.currentPosition.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.velocityHistory = [];
    this.hasValidPreviousPosition = false;
    this.isActive = false;
    this.body.position.set(0, -100, 0);
  }
}
