import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsConfig } from './PhysicsConfig.js';
import { debugLog } from '../utils/DebugDisplay.js';

export class CollisionHandler {
  constructor(physicsWorld, handPhysics) {
    this.physicsWorld = physicsWorld;
    this.handPhysics = handPhysics; // { left: VRHandPhysics, right: VRHandPhysics }

    // Callback for ragdoll triggers
    this.onPlayerRagdoll = null; // (playerId, impulse, velocity, sourceType, sourceId) => {}

    // Callback to check if player is held (skip collisions for held players)
    this.isPlayerHeld = null; // (playerId) => boolean

    // Callback to check if block is held by a specific hand (skip collision if held by hitting hand)
    this.isBlockHeldByHand = null; // (blockId, handIndex) => boolean

    // Objects with temporarily disabled hand collision (re-enable after delay)
    this.pendingReenables = new Map(); // object -> timeoutId

    // Setup collision listener
    this.setupCollisionListener();
  }

  setupCollisionListener() {
    this.physicsWorld.world.addEventListener('beginContact', (event) => {
      this.handleCollision(event);
    });
  }

  handleCollision(event) {
    const bodyA = event.bodyA;
    const bodyB = event.bodyB;

    // Identify what collided
    const idA = this.physicsWorld.getBodyId(bodyA);
    const idB = this.physicsWorld.getBodyId(bodyB);

    if (!idA || !idB) return;

    // Check for hand-player collision (ID format: hand_{handedness}_{finger})
    if (idA.startsWith('hand_') && idB.startsWith('player_')) {
      this.handleHandPlayerCollision(idA, idB, bodyA, bodyB);
    } else if (idB.startsWith('hand_') && idA.startsWith('player_')) {
      this.handleHandPlayerCollision(idB, idA, bodyB, bodyA);
    }
    // Check for hand-block collision
    else if (idA.startsWith('hand_') && idB.startsWith('block_')) {
      this.handleHandBlockCollision(idA, idB, bodyA, bodyB);
    } else if (idB.startsWith('hand_') && idA.startsWith('block_')) {
      this.handleHandBlockCollision(idB, idA, bodyB, bodyA);
    }
    // Check for player-player collision
    else if (idA.startsWith('player_') && idB.startsWith('player_')) {
      this.handlePlayerPlayerCollision(idA, idB, bodyA, bodyB);
    }
  }

  // Parse hand ID to extract handedness and finger name
  // ID format: hand_{handedness}_{finger} (e.g., "hand_left_thumb")
  parseHandId(handId) {
    const parts = handId.split('_');
    if (parts.length >= 3) {
      return {
        handedness: parts[1],  // 'left' or 'right'
        finger: parts[2]       // 'thumb', 'index', 'middle', 'ring', 'pinky'
      };
    }
    // Fallback for old format (hand_left or hand_right)
    return {
      handedness: parts[1] || 'unknown',
      finger: null
    };
  }

  handleHandPlayerCollision(handId, playerId, handBody, playerBody) {
    const playerIdStr = playerId.replace('player_', '');

    // Skip collision if player is currently held (prevents freeze from continuous collisions)
    if (this.isPlayerHeld && this.isPlayerHeld(playerIdStr)) {
      // Player is held, skip collision (don't log every frame - too noisy)
      return;
    }

    // Parse hand ID to get handedness (new format: hand_left_thumb)
    const { handedness, finger } = this.parseHandId(handId);
    const handPhysics = this.handPhysics[handedness];

    if (!handPhysics || !handPhysics.isActive) return;

    debugLog(`Collision: ${handedness}/${finger} -> ${playerIdStr}`);

    // Get impact force from hand velocity
    const impactForce = handPhysics.getImpactForce();

    if (impactForce >= PhysicsConfig.forces.ragdollThreshold) {
      // Calculate impulse direction
      const velocity = handPhysics.getVelocity();
      const impulse = velocity.clone().multiplyScalar(
        handPhysics.virtualMass * PhysicsConfig.forces.impulseMultiplier
      );

      // Add upward component for satisfying arc
      impulse.y += Math.abs(impulse.length()) * PhysicsConfig.forces.upwardImpulseBoost;

      if (this.onPlayerRagdoll) {
        this.onPlayerRagdoll(playerIdStr, impulse, velocity, 'hand', handId);
      }
    }
  }

  handleHandBlockCollision(handId, blockId, handBody, blockBody) {
    // Validate parameters - handBody and blockBody are required
    if (!handBody || !blockBody) return;

    // Parse hand ID to get handedness (new format: hand_left_thumb)
    const { handedness } = this.parseHandId(handId);
    const handIndex = handedness === 'left' ? 0 : 1;

    // Skip collision if block is currently held by THIS hand
    if (this.isBlockHeldByHand && this.isBlockHeldByHand(blockId, handIndex)) {
      return;
    }

    const handPhysics = this.handPhysics[handedness];
    if (!handPhysics || !handPhysics.isActive) return;

    // Get hand velocity
    const velocity = handPhysics.getVelocity();
    const speed = velocity.length();

    // Validate velocity - skip if invalid
    if (!isFinite(speed)) return;

    // Only apply impulse if hand is moving fast enough
    const minSpeed = 0.3; // 30cm/s minimum to knock a block
    if (speed < minSpeed) return;

    // Clamp extreme velocities to prevent physics crashes
    const MAX_HAND_SPEED = 20; // m/s
    if (speed > MAX_HAND_SPEED) {
      velocity.multiplyScalar(MAX_HAND_SPEED / speed);
    }

    // Calculate impulse based on hand velocity and virtual mass
    const impulseMultiplier = PhysicsConfig.forces.impulseMultiplier;
    const impulse = new CANNON.Vec3(
      velocity.x * handPhysics.virtualMass * impulseMultiplier,
      velocity.y * handPhysics.virtualMass * impulseMultiplier,
      velocity.z * handPhysics.virtualMass * impulseMultiplier
    );

    // Validate impulse before applying
    if (!isFinite(impulse.x) || !isFinite(impulse.y) || !isFinite(impulse.z)) return;

    // Apply impulse to block body at center of mass
    blockBody.applyImpulse(impulse, blockBody.position);

    // Add some angular velocity based on impact point relative to center
    // This makes the block spin realistically when hit off-center
    const handPos = handBody.position;
    const blockPos = blockBody.position;
    const hitOffset = new CANNON.Vec3(
      handPos.x - blockPos.x,
      handPos.y - blockPos.y,
      handPos.z - blockPos.z
    );

    // Cross product of hit offset and impulse gives torque direction
    const torque = hitOffset.cross(impulse);
    torque.scale(0.5, torque); // Reduce angular effect

    // Validate torque before applying
    if (isFinite(torque.x) && isFinite(torque.y) && isFinite(torque.z)) {
      blockBody.angularVelocity.vadd(torque, blockBody.angularVelocity);
    }

    // Wake up the body to ensure physics processes
    blockBody.wakeUp();
  }

  handlePlayerPlayerCollision(playerIdA, playerIdB, bodyA, bodyB) {
    const playerIdStrA = playerIdA.replace('player_', '');
    const playerIdStrB = playerIdB.replace('player_', '');

    // Skip if either player is held
    if (this.isPlayerHeld) {
      if (this.isPlayerHeld(playerIdStrA) || this.isPlayerHeld(playerIdStrB)) {
        return;
      }
    }

    // Get velocities
    const velocityA = new THREE.Vector3(
      bodyA.velocity.x,
      bodyA.velocity.y,
      bodyA.velocity.z
    );
    const velocityB = new THREE.Vector3(
      bodyB.velocity.x,
      bodyB.velocity.y,
      bodyB.velocity.z
    );

    const massA = bodyA.mass || PhysicsConfig.player.mass;
    const massB = bodyB.mass || PhysicsConfig.player.mass;

    const forceA = velocityA.length() * massA;
    const forceB = velocityB.length() * massB;

    // A hits B
    if (forceA >= PhysicsConfig.forces.chainReactionThreshold) {
      const impulse = velocityA.clone().multiplyScalar(
        massA * PhysicsConfig.forces.impulseMultiplier
      );
      impulse.y += Math.abs(impulse.length()) * PhysicsConfig.forces.upwardImpulseBoost * 0.5;

      if (this.onPlayerRagdoll) {
        this.onPlayerRagdoll(playerIdStrB, impulse, velocityA, 'player', playerIdStrA);
      }
    }

    // B hits A
    if (forceB >= PhysicsConfig.forces.chainReactionThreshold) {
      const impulse = velocityB.clone().multiplyScalar(
        massB * PhysicsConfig.forces.impulseMultiplier
      );
      impulse.y += Math.abs(impulse.length()) * PhysicsConfig.forces.upwardImpulseBoost * 0.5;

      if (this.onPlayerRagdoll) {
        this.onPlayerRagdoll(playerIdStrA, impulse, velocityB, 'player', playerIdStrB);
      }
    }
  }

  // Schedule re-enabling hand collision after a delay (used after release)
  scheduleHandCollisionReenable(object, delayMs = 150) {
    // Cancel any existing pending re-enable for this object
    if (this.pendingReenables.has(object)) {
      clearTimeout(this.pendingReenables.get(object));
    }

    // Disable hand collision immediately
    if (object.disableHandCollision) {
      object.disableHandCollision();
    }

    // Schedule re-enable after delay
    const timeoutId = setTimeout(() => {
      if (object.enableHandCollision) {
        object.enableHandCollision();
      }
      this.pendingReenables.delete(object);
    }, delayMs);

    this.pendingReenables.set(object, timeoutId);
  }

  // Cancel pending collision reenable (called when object is grabbed again)
  cancelPendingReenable(object) {
    if (this.pendingReenables.has(object)) {
      clearTimeout(this.pendingReenables.get(object));
      this.pendingReenables.delete(object);
      // Re-enable hand collision immediately since object is being grabbed
      if (object.enableHandCollision) {
        object.enableHandCollision();
      }
    }
  }
}
