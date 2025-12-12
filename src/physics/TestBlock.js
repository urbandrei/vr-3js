import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsConfig } from './PhysicsConfig.js';

export class TestBlock {
  constructor(physicsWorld, scene, id, position) {
    this.id = id;
    this.physicsWorld = physicsWorld;
    this.scene = scene;
    this.isHeld = false;

    // Self-righting state
    this.isRighting = false;
    this.rightingProgress = 0;
    this.stableTimer = 0;
    this.startQuat = new THREE.Quaternion();
    this.targetQuat = new THREE.Quaternion();

    // Create visual mesh (box matching physics dimensions)
    const config = PhysicsConfig.player;
    const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    this.mesh = new THREE.Mesh(geometry, material);

    // Position mesh so bottom is at y=0
    this.mesh.position.copy(position);
    this.mesh.position.y = position.y + config.height / 2;

    // Grabbable properties (same as player)
    this.mesh.userData.grabbable = true;
    this.mesh.userData.networkId = `block_${id}`;
    this.mesh.userData.isPlayer = false;
    this.mesh.userData.isTestBlock = true;

    scene.add(this.mesh);

    // Create physics body (same settings as player)
    this.body = this.createPhysicsBody();
    physicsWorld.addBody(`block_${id}`, this.body);

    // Set initial position
    this.body.position.set(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
  }

  createPhysicsBody() {
    const config = PhysicsConfig.player;

    // Box shape matching player dimensions
    const halfExtents = new CANNON.Vec3(
      config.width / 2,
      config.height / 2,
      config.depth / 2
    );
    const boxShape = new CANNON.Box(halfExtents);

    const blockConfig = PhysicsConfig.block;
    const body = new CANNON.Body({
      mass: config.mass,
      type: CANNON.Body.DYNAMIC, // Start dynamic so they can be knocked over
      material: this.physicsWorld.playerMaterial,
      linearDamping: config.linearDamping,
      angularDamping: blockConfig.angularDamping, // Lower damping for realistic tumbling
      fixedRotation: false, // Allow rotation for realistic physics
      collisionFilterGroup: this.physicsWorld.COLLISION_GROUPS.PLAYER,
      collisionFilterMask:
        this.physicsWorld.COLLISION_GROUPS.PLAYER |
        this.physicsWorld.COLLISION_GROUPS.VR_HAND |
        this.physicsWorld.COLLISION_GROUPS.ENVIRONMENT
    });

    body.addShape(boxShape);

    return body;
  }

  setHeld(held) {
    this.isHeld = held;
    if (held) {
      this.body.type = CANNON.Body.KINEMATIC;
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    } else {
      this.body.type = CANNON.Body.DYNAMIC;
      this.body.mass = PhysicsConfig.player.mass;
      this.body.updateMassProperties();
      this.body.wakeUp();
    }
  }

  // Temporarily disable hand collision (used on release to prevent hand pushing object)
  disableHandCollision() {
    this.body.collisionFilterMask =
      this.physicsWorld.COLLISION_GROUPS.PLAYER |
      this.physicsWorld.COLLISION_GROUPS.ENVIRONMENT;
  }

  // Re-enable hand collision (called after hand separates from object)
  enableHandCollision() {
    this.body.collisionFilterMask =
      this.physicsWorld.COLLISION_GROUPS.PLAYER |
      this.physicsWorld.COLLISION_GROUPS.VR_HAND |
      this.physicsWorld.COLLISION_GROUPS.ENVIRONMENT;
  }

  applyImpulse(impulse) {
    if (this.body.type === CANNON.Body.DYNAMIC) {
      this.body.applyImpulse(
        new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
        this.body.position
      );
    }
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
    this.body.position.set(x, y, z);
  }

  // Sync visual mesh from physics body
  syncFromPhysics() {
    if (!this.isHeld) {
      this.mesh.position.set(
        this.body.position.x,
        this.body.position.y,
        this.body.position.z
      );
      this.mesh.quaternion.set(
        this.body.quaternion.x,
        this.body.quaternion.y,
        this.body.quaternion.z,
        this.body.quaternion.w
      );
    }
  }

  // Sync physics body from visual mesh (when held)
  syncToPhysics() {
    if (this.isHeld) {
      this.body.position.set(
        this.mesh.position.x,
        this.mesh.position.y,
        this.mesh.position.z
      );
      this.body.quaternion.set(
        this.mesh.quaternion.x,
        this.mesh.quaternion.y,
        this.mesh.quaternion.z,
        this.mesh.quaternion.w
      );
    }
  }

  // Update self-righting behavior
  update(deltaTime) {
    if (this.isHeld) {
      this.stableTimer = 0;
      this.isRighting = false;
      return;
    }

    const blockConfig = PhysicsConfig.block;
    const velocity = Math.sqrt(
      this.body.velocity.x ** 2 +
      this.body.velocity.y ** 2 +
      this.body.velocity.z ** 2
    );

    if (this.isRighting) {
      // Check for interruption (movement detected)
      if (velocity > blockConfig.stableThreshold * 2) {
        this.isRighting = false;
        this.stableTimer = 0;
        // Restore dynamic physics
        this.body.type = CANNON.Body.DYNAMIC;
        this.body.mass = PhysicsConfig.player.mass;
        this.body.updateMassProperties();
        this.body.wakeUp();
        return;
      }

      // Progress the righting animation
      this.rightingProgress += deltaTime / blockConfig.rightingDuration;

      if (this.rightingProgress >= 1) {
        // Animation complete
        this.isRighting = false;
        this.mesh.quaternion.copy(this.targetQuat);
        this.body.quaternion.set(
          this.targetQuat.x,
          this.targetQuat.y,
          this.targetQuat.z,
          this.targetQuat.w
        );
        this.body.angularVelocity.set(0, 0, 0);
        // Restore dynamic physics
        this.body.type = CANNON.Body.DYNAMIC;
        this.body.mass = PhysicsConfig.player.mass;
        this.body.updateMassProperties();
        this.body.wakeUp();
      } else {
        // Slerp toward upright
        this.mesh.quaternion.slerpQuaternions(
          this.startQuat,
          this.targetQuat,
          this.rightingProgress
        );
        this.syncToPhysics();
      }
    } else {
      // Check if stable and tilted
      if (velocity < blockConfig.stableThreshold) {
        this.stableTimer += deltaTime;

        const tiltAngle = this.getTiltAngle();
        if (this.stableTimer >= blockConfig.stableTimeRequired &&
            tiltAngle > blockConfig.tiltThreshold) {
          this.startRighting();
        }
      } else {
        this.stableTimer = 0;
      }
    }
  }

  // Get angle (degrees) between block's up vector and world up
  getTiltAngle() {
    const blockUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
    const worldUp = new THREE.Vector3(0, 1, 0);
    const dot = Math.max(-1, Math.min(1, blockUp.dot(worldUp))); // Clamp for safety
    return Math.acos(dot) * (180 / Math.PI);
  }

  // Begin righting animation
  startRighting() {
    this.isRighting = true;
    this.rightingProgress = 0;
    this.startQuat.copy(this.mesh.quaternion);

    // Target: upright, but preserve Y rotation (facing direction)
    const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ');
    this.targetQuat.setFromEuler(new THREE.Euler(0, euler.y, 0, 'YXZ'));

    // Make physics body kinematic during animation to prevent fighting
    this.body.type = CANNON.Body.KINEMATIC;
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.physicsWorld.removeBody(`block_${this.id}`);
  }
}
