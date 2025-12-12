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

  // Player physics body (box collider)
  player: {
    mass: 0.5,           // 500g
    height: 0.12,        // 12cm tall
    width: 0.06,         // 6cm wide
    depth: 0.06,         // 6cm deep
    linearDamping: 0.4,  // Air resistance during ragdoll
    angularDamping: 0.99, // High damping to minimize spinning
    friction: 0.3,
    restitution: 0.3     // Slight bounce
  },

  // Test block physics (can rotate freely)
  block: {
    angularDamping: 0.3,  // Lower damping for realistic tumbling
    restitution: 0.4,     // Slightly more bounce than players
    // Self-righting behavior
    stableThreshold: 0.05,    // Velocity below this = stable (m/s)
    stableTimeRequired: 1.0,  // Seconds of stability before righting
    rightingDuration: 0.5,    // Seconds for righting animation
    tiltThreshold: 15         // Degrees from upright to trigger righting
  },

  // VR hand physics
  hand: {
    radius: 0.05,              // 5cm sphere (legacy, for reference)
    fingertipRadius: 0.015,    // 1.5cm per fingertip
    virtualMass: 0.5,          // 0.5kg for momentum calculations (gentle throws)
    velocityHistoryLength: 12, // Frames for velocity smoothing (increased for stability)
    nearPinchThreshold: 0.04   // 4cm - disable thumb/index collision when preparing to pinch
  },

  // Force thresholds
  forces: {
    ragdollThreshold: 2.0,       // Force to trigger ragdoll (~0.4 m/s at 5kg)
    chainReactionThreshold: 1.5, // Force for player-player ragdoll
    recoveryVelocity: 0.05,      // 5cm/s to start recovery
    recoveryFrames: 30,          // Frames below threshold before recovery
    minRagdollTime: 0.5,         // Minimum ragdoll duration (seconds)
    impulseMultiplier: 0.2,      // Transfer 20% of momentum (gentle throws)
    upwardImpulseBoost: 0.05     // Minimal upward arc
  },

  // Animation
  animation: {
    blendSpeed: 4.0,      // Ragdoll blend transition speed
    crossfadeDuration: 0.2 // Animation crossfade duration
  }
};
