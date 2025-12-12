import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PhysicsConfig } from './PhysicsConfig.js';

export class VRHandPhysics {
  constructor(physicsWorld, handedness) {
    this.physicsWorld = physicsWorld;
    this.handedness = handedness;

    // Virtual mass for momentum calculations
    this.virtualMass = PhysicsConfig.hand.virtualMass;

    // Track if hand data is valid
    this.isActive = false;

    // Fingertip joint indices in the joints array
    this.fingertipIndices = {
      thumb: 4,
      index: 9,
      middle: 14,
      ring: 19,
      pinky: 24
    };

    // Per-fingertip physics bodies
    this.fingertipBodies = new Map();

    // Per-finger velocity tracking
    this.fingertipVelocities = new Map();
    this.fingertipPrevPositions = new Map();
    this.fingertipHasValidPrev = new Map();

    // Create fingertip bodies
    this.createFingertipBodies();
  }

  createFingertipBodies() {
    const radius = PhysicsConfig.hand.fingertipRadius;

    for (const [name, index] of Object.entries(this.fingertipIndices)) {
      const shape = new CANNON.Sphere(radius);
      const body = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.KINEMATIC,
        shape: shape,
        material: this.physicsWorld.handMaterial,
        collisionFilterGroup: this.physicsWorld.COLLISION_GROUPS.VR_HAND,
        collisionFilterMask: this.physicsWorld.COLLISION_GROUPS.PLAYER,
        collisionResponse: true
      });

      // Start at a position far away (inactive)
      body.position.set(0, -100, 0);

      this.physicsWorld.addBody(`hand_${this.handedness}_${name}`, body);
      this.fingertipBodies.set(name, body);
      this.fingertipVelocities.set(name, new THREE.Vector3());
      this.fingertipPrevPositions.set(name, new THREE.Vector3());
      this.fingertipHasValidPrev.set(name, false);
    }
  }

  update(joints, pinchDistance, deltaTime) {
    if (!joints || joints.length < 25) {
      this.isActive = false;
      // Move all bodies away when inactive
      for (const body of this.fingertipBodies.values()) {
        body.position.set(0, -100, 0);
      }
      // Reset velocity tracking
      for (const name of Object.keys(this.fingertipIndices)) {
        this.fingertipHasValidPrev.set(name, false);
        this.fingertipVelocities.get(name)?.set(0, 0, 0);
      }
      return;
    }

    this.isActive = true;

    // Determine if near pinch (disable thumb/index collision)
    const nearPinchThreshold = PhysicsConfig.hand.nearPinchThreshold;
    const nearPinch = pinchDistance < nearPinchThreshold;

    for (const [name, index] of Object.entries(this.fingertipIndices)) {
      const joint = joints[index];
      const body = this.fingertipBodies.get(name);
      const prevPos = this.fingertipPrevPositions.get(name);
      const velocity = this.fingertipVelocities.get(name);

      if (!joint) {
        // Joint not available
        body.position.set(0, -100, 0);
        this.fingertipHasValidPrev.set(name, false);
        velocity.set(0, 0, 0);
        continue;
      }

      // Disable thumb/index when near pinch (preparing to grab)
      if (nearPinch && (name === 'thumb' || name === 'index')) {
        body.position.set(0, -100, 0);
        this.fingertipHasValidPrev.set(name, false);
        velocity.set(0, 0, 0);
        continue;
      }

      // Calculate velocity from position change
      if (this.fingertipHasValidPrev.get(name) && deltaTime > 0) {
        velocity.set(
          (joint.x - prevPos.x) / deltaTime,
          (joint.y - prevPos.y) / deltaTime,
          (joint.z - prevPos.z) / deltaTime
        );

        // Clear velocity if nearly stationary
        if (velocity.length() < 0.01) {
          velocity.set(0, 0, 0);
        }
      }

      // Update previous position
      prevPos.set(joint.x, joint.y, joint.z);
      this.fingertipHasValidPrev.set(name, true);

      // Update physics body position
      body.position.set(joint.x, joint.y, joint.z);
    }
  }

  // Get velocity for a specific fingertip
  getFingertipVelocity(fingerName) {
    return this.fingertipVelocities.get(fingerName)?.clone() || new THREE.Vector3();
  }

  // Get the maximum velocity across all active fingertips
  getVelocity() {
    let maxVelocity = new THREE.Vector3();
    let maxSpeed = 0;

    for (const velocity of this.fingertipVelocities.values()) {
      const speed = velocity.length();
      if (speed > maxSpeed) {
        maxSpeed = speed;
        maxVelocity = velocity.clone();
      }
    }

    return maxVelocity;
  }

  getSpeed() {
    return this.getVelocity().length();
  }

  getMomentum() {
    return this.getVelocity().multiplyScalar(this.virtualMass);
  }

  getImpactForce() {
    return this.getMomentum().length();
  }

  // Get physics body for a specific fingertip
  getFingertipBody(fingerName) {
    return this.fingertipBodies.get(fingerName);
  }

  reset() {
    for (const [name] of this.fingertipBodies) {
      this.fingertipBodies.get(name).position.set(0, -100, 0);
      this.fingertipVelocities.get(name).set(0, 0, 0);
      this.fingertipPrevPositions.get(name).set(0, 0, 0);
      this.fingertipHasValidPrev.set(name, false);
    }
    this.isActive = false;
  }

  dispose() {
    for (const [name] of this.fingertipBodies) {
      this.physicsWorld.removeBody(`hand_${this.handedness}_${name}`);
    }
    this.fingertipBodies.clear();
    this.fingertipVelocities.clear();
    this.fingertipPrevPositions.clear();
    this.fingertipHasValidPrev.clear();
  }
}
