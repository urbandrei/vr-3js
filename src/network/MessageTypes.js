export const MessageTypes = {
  // Connection events
  PLAYER_JOIN: 'player_join',
  PLAYER_LEAVE: 'player_leave',

  // State sync
  WORLD_STATE: 'world_state',

  // VR Client -> Host
  VR_CLIENT_JOIN: 'vr_client_join',
  VR_HAND_TRACKING: 'vr_hand_tracking',
  VR_HEAD_TRACKING: 'vr_head_tracking',

  // Camera
  CAMERA_JOIN: 'camera_join',
  CAMERA_UPDATE: 'camera_update'
};
