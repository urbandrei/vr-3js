import * as THREE from 'three';
import { PhysicsConfig } from '../physics/PhysicsConfig.js';

export const PlayerState = {
  WALKING: 'walking',
  HELD: 'held',
  RAGDOLL: 'ragdoll',
  RECOVERING: 'recovering'
};

export class PlayerStateMachine {
  constructor(playerId, physicsBody, animationController) {
    this.playerId = playerId;
    this.physicsBody = physicsBody;
    this.animationController = animationController;

    this.state = PlayerState.WALKING;

    // Ragdoll tracking
    this.ragdollTimer = 0;
    this.recoveryCounter = 0;
    this.ragdollImpulse = new THREE.Vector3();

    // Callbacks
    this.onStateChange = null; // (playerId, oldState, newState, data) => {}
  }

  getState() {
    return this.state;
  }

  canTransitionTo(newState) {
    // Define valid transitions
    const validTransitions = {
      [PlayerState.WALKING]: [PlayerState.HELD, PlayerState.RAGDOLL],
      [PlayerState.HELD]: [PlayerState.WALKING, PlayerState.RAGDOLL],
      [PlayerState.RAGDOLL]: [PlayerState.RECOVERING],
      [PlayerState.RECOVERING]: [PlayerState.WALKING, PlayerState.RAGDOLL]
    };

    return validTransitions[this.state]?.includes(newState) ?? false;
  }

  transition(newState, data = {}) {
    if (!this.canTransitionTo(newState)) {
      console.warn(`Invalid state transition: ${this.state} -> ${newState}`);
      return false;
    }

    const oldState = this.state;
    this.state = newState;

    // Exit old state
    this.onExit(oldState);

    // Enter new state
    this.onEnter(newState, data);

    // Notify listeners
    if (this.onStateChange) {
      this.onStateChange(this.playerId, oldState, newState, data);
    }

    return true;
  }

  onEnter(state, data) {
    switch (state) {
      case PlayerState.RAGDOLL:
        this.ragdollTimer = 0;
        this.recoveryCounter = 0;

        // Switch physics to dynamic
        this.physicsBody.setMode('dynamic');

        // Apply impulse if provided
        if (data.impulse) {
          this.ragdollImpulse.copy(data.impulse);
          this.physicsBody.applyImpulse(data.impulse);
        }

        // Play falling animation
        this.animationController?.play('falling');
        break;

      case PlayerState.RECOVERING:
        // Play get up animation
        this.animationController?.play('getup');
        break;

      case PlayerState.WALKING:
        // Switch physics to kinematic
        this.physicsBody.setMode('kinematic');

        // Play idle animation
        this.animationController?.play('idle');
        break;

      case PlayerState.HELD:
        // Switch physics to kinematic (no collision while held)
        this.physicsBody.setMode('kinematic');

        // Play idle animation
        this.animationController?.play('idle');
        break;
    }
  }

  onExit(state) {
    // Cleanup if needed
    switch (state) {
      case PlayerState.RAGDOLL:
        this.ragdollImpulse.set(0, 0, 0);
        break;
    }
  }

  update(deltaTime) {
    switch (this.state) {
      case PlayerState.RAGDOLL:
        this.updateRagdoll(deltaTime);
        break;

      case PlayerState.RECOVERING:
        this.updateRecovering(deltaTime);
        break;
    }
  }

  updateRagdoll(deltaTime) {
    this.ragdollTimer += deltaTime;

    // Check if minimum ragdoll time has passed
    if (this.ragdollTimer < PhysicsConfig.forces.minRagdollTime) {
      return;
    }

    // Check velocity for recovery
    const speed = this.physicsBody.getSpeed();

    if (speed < PhysicsConfig.forces.recoveryVelocity) {
      this.recoveryCounter++;

      if (this.recoveryCounter >= PhysicsConfig.forces.recoveryFrames) {
        this.transition(PlayerState.RECOVERING);
      }
    } else {
      // Reset counter if moving again
      this.recoveryCounter = 0;
    }
  }

  updateRecovering(deltaTime) {
    // Wait for getup animation to complete
    if (this.animationController?.isAnimationComplete('getup')) {
      this.transition(PlayerState.WALKING);
    }
  }

  // External triggers
  triggerRagdoll(impulse, velocity) {
    if (this.state === PlayerState.WALKING || this.state === PlayerState.HELD) {
      return this.transition(PlayerState.RAGDOLL, { impulse, velocity });
    }
    return false;
  }

  triggerHeld() {
    if (this.state === PlayerState.WALKING) {
      return this.transition(PlayerState.HELD);
    }
    return false;
  }

  triggerRelease(throwVelocity = null) {
    if (this.state === PlayerState.HELD) {
      // Check if thrown with enough force
      if (throwVelocity) {
        const throwForce = throwVelocity.length() * PhysicsConfig.hand.virtualMass;
        if (throwForce >= PhysicsConfig.forces.ragdollThreshold) {
          const impulse = throwVelocity.clone().multiplyScalar(
            PhysicsConfig.hand.virtualMass * PhysicsConfig.forces.impulseMultiplier
          );
          impulse.y += Math.abs(impulse.length()) * PhysicsConfig.forces.upwardImpulseBoost;
          return this.transition(PlayerState.RAGDOLL, { impulse, velocity: throwVelocity });
        }
      }
      return this.transition(PlayerState.WALKING);
    }
    return false;
  }

  // Force transition for network sync
  forceState(state, data = {}) {
    const oldState = this.state;
    this.state = state;
    this.onExit(oldState);
    this.onEnter(state, data);
  }
}
