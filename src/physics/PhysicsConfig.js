// Centralized physics configuration for easy tuning

export const PhysicsConfig = {
  // World settings
  gravity: -9.82,
  fixedTimeStep: 1 / 60,
  maxSubSteps: 3,

  // Collision groups (bitmasks)
  collisionGroups: {
    PLAYER: 1,
    VR_HAND: 2,
    ENVIRONMENT: 4
  },

  // Player physics body
  player: {
    mass: 0.5,           // 500g
    height: 0.10,        // 10cm (scaled for tiny avatar)
    radius: 0.025,       // 2.5cm radius
    linearDamping: 0.4,  // Air resistance during ragdoll
    angularDamping: 0.6, // Prevent excessive spinning
    friction: 0.3,
    restitution: 0.2     // Slight bounce
  },

  // VR hand physics
  hand: {
    radius: 0.05,        // 5cm sphere (palm-sized)
    virtualMass: 5.0,    // 5kg for momentum calculations
    velocityHistoryLength: 5  // Frames for velocity smoothing
  },

  // Force thresholds
  forces: {
    ragdollThreshold: 2.0,       // Force to trigger ragdoll (~0.4 m/s at 5kg)
    chainReactionThreshold: 1.5, // Force for player-player ragdoll
    recoveryVelocity: 0.05,      // 5cm/s to start recovery
    recoveryFrames: 30,          // Frames below threshold before recovery
    minRagdollTime: 0.5,         // Minimum ragdoll duration (seconds)
    impulseMultiplier: 0.8,      // Transfer 80% of momentum
    upwardImpulseBoost: 0.3      // Add upward component for arc
  },

  // Animation
  animation: {
    blendSpeed: 4.0,      // Ragdoll blend transition speed
    crossfadeDuration: 0.2 // Animation crossfade duration
  }
};
