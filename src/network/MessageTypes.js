export const MessageTypes = {
  // Connection events
  PLAYER_JOIN: 'player_join',
  PLAYER_LEAVE: 'player_leave',

  // State sync
  PLAYER_STATE: 'player_state',
  WORLD_STATE: 'world_state',
  HAND_TRACKING: 'hand_tracking',

  // Interactions
  GRAB_REQUEST: 'grab_request',
  GRAB_RESPONSE: 'grab_response',
  OBJECT_RELEASE: 'object_release',
  OBJECT_UPDATE: 'object_update',

  // Player pickup (VR picks up PC player)
  PLAYER_PICKUP: 'player_pickup',
  PLAYER_RELEASE: 'player_release',
  PLAYER_POSITION: 'player_position',

  // Physics sync
  PLAYER_PHYSICS_STATE: 'player_physics_state',
  RAGDOLL_TRIGGERED: 'ragdoll_triggered',
  RAGDOLL_RECOVERY: 'ragdoll_recovery'
};
