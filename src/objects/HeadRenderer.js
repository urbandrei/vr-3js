import * as THREE from 'three';

/**
 * Renders a simple geometric head for VR players
 */
export class HeadRenderer {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this._createMesh();
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  _createMesh() {
    // Simple sphere head (~15cm diameter)
    const geometry = new THREE.SphereGeometry(0.075, 16, 12);
    const material = new THREE.MeshStandardMaterial({
      color: 0x88cc88,
      roughness: 0.6,
      metalness: 0.1
    });
    return new THREE.Mesh(geometry, material);
  }

  updateHead(headData) {
    if (!headData) {
      this.mesh.visible = false;
      return;
    }

    this.mesh.visible = true;

    if (headData.position) {
      this.mesh.position.set(
        headData.position.x,
        headData.position.y,
        headData.position.z
      );
    }

    if (headData.rotation) {
      this.mesh.rotation.set(
        headData.rotation.x,
        headData.rotation.y,
        headData.rotation.z
      );
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
