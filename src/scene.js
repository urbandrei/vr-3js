import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x505050);

  // Floor for spatial reference
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grabbables array - PC players will be added here dynamically
  const grabbables = [];

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 4, 2);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  return { scene, grabbables };
}

export function createRenderer(enableXR = true) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  if (enableXR) {
    renderer.xr.enabled = true;
  }
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.6, 2);
  return camera;
}
