import * as THREE from 'three';

// Hand segment configuration
// WebXR Hand Joint Indices: 0=wrist, 1-4=thumb, 5-9=index, 10-14=middle, 15-19=ring, 20-24=pinky
const FINGER_SEGMENTS = {
  thumb: [[1, 2], [2, 3], [3, 4]],
  index: [[5, 6], [6, 7], [7, 8], [8, 9]],
  middle: [[10, 11], [11, 12], [12, 13], [13, 14]],
  ring: [[15, 16], [16, 17], [17, 18], [18, 19]],
  pinky: [[20, 21], [21, 22], [22, 23], [23, 24]]
};

const PALM_SEGMENTS = [[0, 5], [0, 10], [0, 15], [0, 20]];

const SEGMENT_RADIUS = {
  thumb: 0.008, index: 0.007, middle: 0.007,
  ring: 0.006, pinky: 0.005, palm: 0.015
};

const MIN_SEGMENT_LENGTH = 0.005;

function getAllSegments() {
  const segments = [];
  Object.entries(FINGER_SEGMENTS).forEach(([finger, fingerSegments]) => {
    fingerSegments.forEach(([start, end], index) => {
      segments.push({
        name: `${finger}_${index}`,
        startJoint: start,
        endJoint: end,
        radius: SEGMENT_RADIUS[finger]
      });
    });
  });
  PALM_SEGMENTS.forEach(([start, end], index) => {
    segments.push({
      name: `palm_${index}`,
      startJoint: start,
      endJoint: end,
      radius: SEGMENT_RADIUS.palm
    });
  });
  return segments;
}

/**
 * Renders hand segments as capsules for visualization
 */
export class HandSegmentRenderer {
  /**
   * @param {THREE.Scene} scene - The Three.js scene
   */
  constructor(scene) {
    this.scene = scene;
    this.segments = getAllSegments();

    // Meshes for each hand: 'left' and 'right'
    this.leftHandMeshes = [];
    this.rightHandMeshes = [];

    // Colors for hands
    this.leftColor = 0x4a9eff;  // Blue
    this.rightColor = 0xff6b6b; // Red

    // Create materials
    this.leftMaterial = new THREE.MeshStandardMaterial({
      color: this.leftColor,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });

    this.rightMaterial = new THREE.MeshStandardMaterial({
      color: this.rightColor,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });

    // Create segment meshes for both hands
    this._createHandMeshes(this.leftHandMeshes, this.leftMaterial);
    this._createHandMeshes(this.rightHandMeshes, this.rightMaterial);

    // Reusable objects to avoid GC pressure
    this._startVec = new THREE.Vector3();
    this._endVec = new THREE.Vector3();
    this._midpoint = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._quaternion = new THREE.Quaternion();
  }

  _createHandMeshes(meshArray, material) {
    this.segments.forEach(segment => {
      // Create a capsule geometry (cylinder with hemisphere caps)
      // Default size, will be scaled based on actual segment length
      const geometry = new THREE.CapsuleGeometry(segment.radius, 0.02, 4, 8);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      meshArray.push({
        mesh,
        segment,
        geometry
      });
    });
  }

  /**
   * Update hand segment meshes from joint positions
   * @param {Object} handData - {left: {joints: [...]}, right: {joints: [...]}}
   */
  updateHands(handData) {
    if (handData?.left?.joints) {
      this._updateHandSegments(this.leftHandMeshes, handData.left.joints);
    } else {
      this._hideHand(this.leftHandMeshes);
    }

    if (handData?.right?.joints) {
      this._updateHandSegments(this.rightHandMeshes, handData.right.joints);
    } else {
      this._hideHand(this.rightHandMeshes);
    }
  }

  _updateHandSegments(meshArray, joints) {
    if (!joints || joints.length < 25) {
      this._hideHand(meshArray);
      return;
    }

    meshArray.forEach(({ mesh, segment }) => {
      const startJoint = joints[segment.startJoint];
      const endJoint = joints[segment.endJoint];

      if (!startJoint || !endJoint) {
        mesh.visible = false;
        return;
      }

      // Calculate segment properties using reusable objects
      this._startVec.set(startJoint.x, startJoint.y, startJoint.z);
      this._endVec.set(endJoint.x, endJoint.y, endJoint.z);

      this._midpoint.lerpVectors(this._startVec, this._endVec, 0.5);
      this._direction.subVectors(this._endVec, this._startVec);
      const length = this._direction.length();

      // Skip very short segments
      if (length < MIN_SEGMENT_LENGTH) {
        mesh.visible = false;
        return;
      }

      // Update mesh position
      mesh.position.copy(this._midpoint);

      // Update mesh rotation to align with segment direction
      this._direction.normalize();
      this._quaternion.setFromUnitVectors(this._up, this._direction);
      mesh.quaternion.copy(this._quaternion);

      // Scale the mesh to match segment length
      // Capsule geometry height is along Y axis
      const capsuleHeight = length - segment.radius * 2; // Subtract cap radii
      if (capsuleHeight > 0) {
        mesh.scale.set(1, capsuleHeight / 0.02, 1); // 0.02 is default geometry height
      } else {
        mesh.scale.set(1, 0.5, 1);
      }

      mesh.visible = true;
    });
  }

  _hideHand(meshArray) {
    meshArray.forEach(({ mesh }) => {
      mesh.visible = false;
    });
  }

  /**
   * Clean up
   */
  dispose() {
    const disposeMeshes = (meshArray) => {
      meshArray.forEach(({ mesh, geometry }) => {
        this.scene.remove(mesh);
        geometry.dispose();
      });
    };

    disposeMeshes(this.leftHandMeshes);
    disposeMeshes(this.rightHandMeshes);

    this.leftMaterial.dispose();
    this.rightMaterial.dispose();
  }
}
