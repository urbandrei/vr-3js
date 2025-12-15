import * as THREE from 'three';

const GRAB_RADIUS = 0.08; // 8cm grab radius

export class GrabbableCamera {
  constructor(scene) {
    this.scene = scene;
    this.isHeld = false;
    this.holdingHand = null; // 'left' or 'right'

    // Reusable quaternions for relative grab
    this._grabOffsetQuat = new THREE.Quaternion();
    this._tempQuat = new THREE.Quaternion();

    // Create camera mesh group
    this.mesh = this._createMesh();

    // Initial position (in front of VR player, at chest height)
    this.mesh.position.set(0, 1.0, -0.5);

    scene.add(this.mesh);
  }

  _createMesh() {
    const group = new THREE.Group();

    // Camera body (box: 6cm x 4cm x 3cm)
    const bodyGeom = new THREE.BoxGeometry(0.06, 0.04, 0.03);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Lens (cylinder: radius 1.5cm, length 2cm)
    const lensGeom = new THREE.CylinderGeometry(0.015, 0.018, 0.02, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.8,
      roughness: 0.2
    });
    const lens = new THREE.Mesh(lensGeom, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.025;
    group.add(lens);

    // Lens glass (inner circle)
    const glassGeom = new THREE.CircleGeometry(0.012, 16);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x4466aa,
      metalness: 0.9,
      roughness: 0.1
    });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.z = -0.036;
    group.add(glass);

    // Recording indicator light (small red sphere)
    const indicatorGeom = new THREE.SphereGeometry(0.004, 8, 8);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.indicator = new THREE.Mesh(indicatorGeom, indicatorMat);
    this.indicator.position.set(0.025, 0.015, 0);
    group.add(this.indicator);

    return group;
  }

  // Check if a position is within grab range
  isWithinGrabRange(position) {
    return this.mesh.position.distanceTo(position) < GRAB_RADIUS;
  }

  // Start grabbing with a specific hand
  grab(handedness, handQuaternion) {
    this.isHeld = true;
    this.holdingHand = handedness;

    // Store rotation offset: offset = inverse(hand) * camera
    // This preserves the camera's orientation relative to the hand
    if (handQuaternion) {
      this._tempQuat.copy(handQuaternion).invert();
      this._grabOffsetQuat.copy(this._tempQuat).multiply(this.mesh.quaternion);
    }
  }

  // Release the camera
  release() {
    this.isHeld = false;
    this.holdingHand = null;
  }

  // Update position and rotation while held (relative to grab offset)
  updatePosition(position, handQuaternion) {
    if (!this.isHeld) return;
    this.mesh.position.copy(position);
    if (handQuaternion) {
      // Apply relative rotation: camera = hand * offset
      this.mesh.quaternion.copy(handQuaternion).multiply(this._grabOffsetQuat);
    }
  }

  // Get transform for network transmission
  getTransform() {
    return {
      position: {
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z
      },
      rotation: {
        x: this.mesh.quaternion.x,
        y: this.mesh.quaternion.y,
        z: this.mesh.quaternion.z,
        w: this.mesh.quaternion.w
      }
    };
  }

  // Set transform from network data
  setTransform(transform) {
    if (transform.position) {
      this.mesh.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z
      );
    }
    if (transform.rotation) {
      this.mesh.quaternion.set(
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
        transform.rotation.w
      );
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    // Dispose geometries and materials
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
