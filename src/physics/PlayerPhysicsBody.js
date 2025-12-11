import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PhysicsConfig } from './PhysicsConfig.js';

export class PlayerPhysicsBody {
  constructor(physicsWorld, playerId) {
    this.physicsWorld = physicsWorld;
    this.playerId = playerId;
    this.mode = 'kinematic'; // 'kinematic' or 'dynamic'

    // Offset from mesh center to physics body center
    this.meshOffset = new THREE.Vector3(0, PhysicsConfig.player.height / 2, 0);

    // Create physics body
    this.body = this.createBody();
    physicsWorld.addBody(`player_${playerId}`, this.body);
  }

  createBody() {
    const config = PhysicsConfig.player;

    // Create capsule shape using cylinder + 2 spheres
    const cylinderHeight = config.height - 2 * config.radius;
    const cylinderShape = new CANNON.Cylinder(
      config.radius,
      config.radius,
      cylinderHeight,
      8
    );

    const sphereShape = new CANNON.Sphere(config.radius);

    const body = new CANNON.Body({
      mass: config.mass,
      type: CANNON.Body.KINEMATIC, // Start kinematic
      material: this.physicsWorld.playerMaterial,
      linearDamping: config.linearDamping,
      angularDamping: config.angularDamping,
      collisionFilterGroup: this.physicsWorld.COLLISION_GROUPS.PLAYER,
      collisionFilterMask:
        this.physicsWorld.COLLISION_GROUPS.PLAYER |
        this.physicsWorld.COLLISION_GROUPS.VR_HAND |
        this.physicsWorld.COLLISION_GROUPS.ENVIRONMENT
    });

    // Add cylinder shape at center
    body.addShape(cylinderShape);

    // Add sphere caps at top and bottom
    const halfCylinderHeight = cylinderHeight / 2;
    body.addShape(sphereShape, new CANNON.Vec3(0, halfCylinderHeight, 0));
    body.addShape(sphereShape, new CANNON.Vec3(0, -halfCylinderHeight, 0));

    return body;
  }

  setMode(mode) {
    if (this.mode === mode) return;

    this.mode = mode;

    if (mode === 'dynamic') {
      this.body.type = CANNON.Body.DYNAMIC;
      this.body.mass = PhysicsConfig.player.mass;
      this.body.updateMassProperties();
      // Wake up the body
      this.body.wakeUp();
    } else {
      this.body.type = CANNON.Body.KINEMATIC;
      // Clear velocities when switching to kinematic
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
  }

  setPosition(x, y, z) {
    // Set physics body position (with offset)
    this.body.position.set(x, y + this.meshOffset.y, z);
  }

  setPositionFromMesh(mesh) {
    this.body.position.set(
      mesh.position.x,
      mesh.position.y + this.meshOffset.y,
      mesh.position.z
    );
  }

  applyImpulse(impulse) {
    if (this.mode === 'dynamic') {
      this.body.applyImpulse(
        new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
        this.body.position
      );
    }
  }

  getVelocity() {
    return new THREE.Vector3(
      this.body.velocity.x,
      this.body.velocity.y,
      this.body.velocity.z
    );
  }

  getSpeed() {
    return this.getVelocity().length();
  }

  getPosition() {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y - this.meshOffset.y,
      this.body.position.z
    );
  }

  getRotation() {
    return {
      x: this.body.quaternion.x,
      y: this.body.quaternion.y,
      z: this.body.quaternion.z,
      w: this.body.quaternion.w
    };
  }

  // Sync mesh position/rotation from physics body (for ragdoll)
  syncToMesh(mesh) {
    if (this.mode === 'dynamic') {
      // Physics drives mesh position
      mesh.position.set(
        this.body.position.x,
        this.body.position.y - this.meshOffset.y,
        this.body.position.z
      );

      // Apply rotation
      mesh.quaternion.set(
        this.body.quaternion.x,
        this.body.quaternion.y,
        this.body.quaternion.z,
        this.body.quaternion.w
      );
    }
  }

  // Sync physics body from mesh position (for walking)
  syncFromMesh(mesh) {
    if (this.mode === 'kinematic') {
      this.body.position.set(
        mesh.position.x,
        mesh.position.y + this.meshOffset.y,
        mesh.position.z
      );
    }
  }

  getState() {
    return {
      position: {
        x: this.body.position.x,
        y: this.body.position.y,
        z: this.body.position.z
      },
      rotation: {
        x: this.body.quaternion.x,
        y: this.body.quaternion.y,
        z: this.body.quaternion.z,
        w: this.body.quaternion.w
      },
      velocity: {
        x: this.body.velocity.x,
        y: this.body.velocity.y,
        z: this.body.velocity.z
      },
      angularVelocity: {
        x: this.body.angularVelocity.x,
        y: this.body.angularVelocity.y,
        z: this.body.angularVelocity.z
      }
    };
  }

  dispose() {
    this.physicsWorld.removeBody(`player_${this.playerId}`);
  }
}
