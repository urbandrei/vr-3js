// Hand tracking data extraction utilities

// Extract lightweight hand data for network transmission (fingertips only)
export function extractHandData(handTrackers) {
  if (!handTrackers || !Array.isArray(handTrackers)) {
    return null;
  }

  const handData = {};

  // Use getEssentialJointData for network (5 fingertips vs 25 joints = 80% reduction)
  if (handTrackers[0]?.hasValidData?.()) {
    handData.left = handTrackers[0].getEssentialJointData();
  }

  if (handTrackers[1]?.hasValidData?.()) {
    handData.right = handTrackers[1].getEssentialJointData();
  }

  return Object.keys(handData).length > 0 ? handData : null;
}

// Extract full hand data for local processing (all 25 joints)
export function extractFullHandData(handTrackers) {
  if (!handTrackers || !Array.isArray(handTrackers)) {
    return null;
  }

  const handData = {};

  if (handTrackers[0]?.hasValidData?.()) {
    handData.left = handTrackers[0].getJointData();
  }

  if (handTrackers[1]?.hasValidData?.()) {
    handData.right = handTrackers[1].getJointData();
  }

  return Object.keys(handData).length > 0 ? handData : null;
}

export function extractVRHeadData(xrCamera) {
  if (!xrCamera) return null;

  return {
    position: {
      x: xrCamera.position.x,
      y: xrCamera.position.y,
      z: xrCamera.position.z
    },
    rotation: {
      x: xrCamera.rotation.x,
      y: xrCamera.rotation.y,
      z: xrCamera.rotation.z
    }
  };
}
