// Object type identification utilities

export const ObjectType = {
  PLAYER: 'player',
  CAMERA: 'camera',
  BLOCK: 'block',
  OTHER: 'other'
};

export function getObjectType(obj) {
  if (!obj?.userData) return ObjectType.OTHER;
  if (obj.userData.isPlayer) return ObjectType.PLAYER;
  if (obj.userData.isPlaceableCamera) return ObjectType.CAMERA;
  if (obj.userData.isTestBlock) return ObjectType.BLOCK;
  return ObjectType.OTHER;
}

export function isPlayer(obj) {
  return obj?.userData?.isPlayer === true;
}

export function isCamera(obj) {
  return obj?.userData?.isPlaceableCamera === true;
}

export function isBlock(obj) {
  return obj?.userData?.isTestBlock === true;
}

export function getNetworkId(obj) {
  return obj?.userData?.networkId || null;
}

export function getPlayerId(obj) {
  return obj?.userData?.playerId || null;
}
