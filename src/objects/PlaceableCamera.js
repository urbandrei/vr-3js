import * as THREE from 'three';

/**
 * Creates a wireframe frustum indicator showing the camera's field of view
 */
function createFrustumIndicator(fov = 60, aspect = 16/9, near = 0.02, far = 0.5) {
  const halfFovRad = (fov / 2) * Math.PI / 180;
  const halfHeight = Math.tan(halfFovRad) * far;
  const halfWidth = halfHeight * aspect;

  // Frustum corners at far plane (camera looks down -Z)
  const topLeft = new THREE.Vector3(-halfWidth, halfHeight, -far);
  const topRight = new THREE.Vector3(halfWidth, halfHeight, -far);
  const bottomLeft = new THREE.Vector3(-halfWidth, -halfHeight, -far);
  const bottomRight = new THREE.Vector3(halfWidth, -halfHeight, -far);
  const origin = new THREE.Vector3(0, 0, 0);

  // Lines from origin to corners + rectangle at far plane
  const vertices = new Float32Array([
    // Four lines from origin to corners
    origin.x, origin.y, origin.z, topLeft.x, topLeft.y, topLeft.z,
    origin.x, origin.y, origin.z, topRight.x, topRight.y, topRight.z,
    origin.x, origin.y, origin.z, bottomLeft.x, bottomLeft.y, bottomLeft.z,
    origin.x, origin.y, origin.z, bottomRight.x, bottomRight.y, bottomRight.z,
    // Rectangle at far plane
    topLeft.x, topLeft.y, topLeft.z, topRight.x, topRight.y, topRight.z,
    topRight.x, topRight.y, topRight.z, bottomRight.x, bottomRight.y, bottomRight.z,
    bottomRight.x, bottomRight.y, bottomRight.z, bottomLeft.x, bottomLeft.y, bottomLeft.z,
    bottomLeft.x, bottomLeft.y, bottomLeft.z, topLeft.x, topLeft.y, topLeft.z,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.LineDashedMaterial({
    color: 0x00ffff,
    dashSize: 0.02,
    gapSize: 0.01,
    linewidth: 1,
  });

  const frustum = new THREE.LineSegments(geometry, material);
  frustum.computeLineDistances();

  return frustum;
}

/**
 * PlaceableCamera - A VR-grabbable camera object that stays in place when released
 */
export class PlaceableCamera {
  constructor(scene, id, position = new THREE.Vector3(0, 0.3, 0)) {
    this.id = id;
    this.scene = scene;
    this.isHeld = false;

    // Create camera body mesh (box shape resembling a camera)
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.10);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.7
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.copy(position);

    // Add lens indicator (small cylinder on front)
    const lensGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.02, 16);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.9
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.06;
    this.mesh.add(lens);

    // Add recording indicator light
    const indicatorGeometry = new THREE.SphereGeometry(0.005, 8, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    this.indicator.position.set(0.03, 0.02, 0.04);
    this.mesh.add(this.indicator);

    // Set up grabbable properties
    this.mesh.userData.grabbable = true;
    this.mesh.userData.networkId = `camera_${id}`;
    this.mesh.userData.isPlaceableCamera = true;

    // Create internal camera for view calculations (looks down -Z of mesh)
    this.viewCamera = new THREE.PerspectiveCamera(60, 16/9, 0.01, 50);

    // Create and add frustum indicator
    this.frustumIndicator = createFrustumIndicator(60, 16/9, 0.02, 0.5);
    this.mesh.add(this.frustumIndicator);

    // Add mesh to scene
    scene.add(this.mesh);

    // Blink the indicator
    this.blinkTime = 0;
  }

  /**
   * Called when grabbed or released
   */
  setHeld(held) {
    this.isHeld = held;
  }

  /**
   * Update camera state
   */
  update(deltaTime = 0.016) {
    // Update internal view camera to match mesh world transform
    this.mesh.getWorldPosition(this.viewCamera.position);
    this.mesh.getWorldQuaternion(this.viewCamera.quaternion);

    // Blink recording indicator
    this.blinkTime += deltaTime;
    if (this.blinkTime > 1) this.blinkTime = 0;
    this.indicator.material.color.setHex(this.blinkTime < 0.5 ? 0xff0000 : 0x330000);
  }

  /**
   * Get camera transform data for network broadcast
   */
  getTransformData() {
    const pos = this.viewCamera.position;
    const quat = this.viewCamera.quaternion;
    return {
      position: { x: pos.x, y: pos.y, z: pos.z },
      quaternion: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      fov: this.viewCamera.fov
    };
  }

  /**
   * Get the internal camera for rendering
   */
  getCamera() {
    return this.viewCamera;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
