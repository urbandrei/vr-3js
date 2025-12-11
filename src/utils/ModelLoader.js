import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
    this.loading = new Map();
  }

  async load(url) {
    // Return cached model (cloned)
    if (this.cache.has(url)) {
      return this.cloneGltf(this.cache.get(url));
    }

    // Wait for in-progress load
    if (this.loading.has(url)) {
      await this.loading.get(url);
      return this.cloneGltf(this.cache.get(url));
    }

    // Start new load
    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });

    this.loading.set(url, loadPromise);
    await loadPromise;
    this.loading.delete(url);

    return this.cloneGltf(this.cache.get(url));
  }

  cloneGltf(gltf) {
    const clone = {
      scene: gltf.scene.clone(true),
      animations: gltf.animations
    };

    // Find all skinned meshes and bones in the clone
    const skinnedMeshes = [];
    const cloneBones = {};

    clone.scene.traverse((node) => {
      if (node.isBone) {
        cloneBones[node.name] = node;
      }
      if (node.isSkinnedMesh) {
        skinnedMeshes.push(node);
      }
    });

    // Re-bind skeleton for each skinned mesh
    skinnedMeshes.forEach((mesh) => {
      const skeleton = mesh.skeleton;
      const orderedBones = skeleton.bones.map((bone) => cloneBones[bone.name]);
      mesh.bind(new THREE.Skeleton(orderedBones, skeleton.boneInverses), mesh.bindMatrix);
    });

    return clone;
  }
}

export const modelLoader = new ModelLoader();
