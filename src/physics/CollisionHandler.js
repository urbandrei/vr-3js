import * as THREE from 'three';
import { PhysicsConfig } from './PhysicsConfig.js';

export class CollisionHandler {
  constructor(physicsWorld, handPhysics) {
    this.physicsWorld = physicsWorld;
    this.handPhysics = handPhysics; // { left: VRHandPhysics, right: VRHandPhysics }

    // Callback for ragdoll triggers
    this.onPlayerRagdoll = null; // (playerId, impulse, velocity, sourceType, sourceId) => {}

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

    // Check for hand-player collision
    if (idA.startsWith('hand_') && idB.startsWith('player_')) {
      this.handleHandPlayerCollision(idA, idB, bodyA, bodyB);
    } else if (idB.startsWith('hand_') && idA.startsWith('player_')) {
      this.handleHandPlayerCollision(idB, idA, bodyB, bodyA);
    }
    // Check for player-player collision
    else if (idA.startsWith('player_') && idB.startsWith('player_')) {
      this.handlePlayerPlayerCollision(idA, idB, bodyA, bodyB);
    }
  }

  handleHandPlayerCollision(handId, playerId, handBody, playerBody) {
    const handedness = handId.replace('hand_', '');
    const handPhysics = this.handPhysics[handedness];

    if (!handPhysics || !handPhysics.isActive) return;

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

      const playerIdStr = playerId.replace('player_', '');

      if (this.onPlayerRagdoll) {
        this.onPlayerRagdoll(playerIdStr, impulse, velocity, 'hand', handId);
      }
    }
  }

  handlePlayerPlayerCollision(playerIdA, playerIdB, bodyA, bodyB) {
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

    const playerIdStrA = playerIdA.replace('player_', '');
    const playerIdStrB = playerIdB.replace('player_', '');

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
}
