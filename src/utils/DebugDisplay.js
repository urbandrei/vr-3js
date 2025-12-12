import * as THREE from 'three';

// Send log to server (survives browser freeze)
function sendToServer(message) {
  try {
    // Use sendBeacon for reliability during crashes
    const data = JSON.stringify({ message });
    navigator.sendBeacon('/api/log', data);
  } catch (e) {
    // Fallback to fetch if sendBeacon fails
    fetch('/api/log', {
      method: 'POST',
      body: JSON.stringify({ message }),
      keepalive: true
    }).catch(() => {});
  }
}

/**
 * 3D Debug Display - Shows debug messages on a floating panel visible in VR
 */
export class DebugDisplay {
  constructor(scene) {
    this.scene = scene;
    this.messages = [];
    this.maxMessages = 15;

    // Create canvas for text rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d');

    // Create texture and material
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Create plane mesh
    const geometry = new THREE.PlaneGeometry(0.6, 0.6);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 1.5, -1); // Position in front of user
    scene.add(this.mesh);

    // Initial render
    this.render();

    // Log creation
    this.log('Debug display initialized');
  }

  log(message, skipServer = false) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    this.messages.push(entry);

    // Send to server FIRST (survives freeze) - unless called from debugLog
    if (!skipServer) {
      sendToServer(message);
    }

    // Also log to console
    console.log('[DebugDisplay]', message);

    // Trim old messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.render();
  }

  error(message, error) {
    const errorStr = error ? `: ${error.message || error}` : '';
    this.log(`ERROR: ${message}${errorStr}`);
  }

  render() {
    const ctx = this.ctx;

    // Clear with semi-transparent dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);

    // Draw title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('DEBUG LOG', 10, 25);

    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(10, 35);
    ctx.lineTo(this.canvas.width - 10, 35);
    ctx.stroke();

    // Draw messages
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffffff';

    const lineHeight = 28;
    const startY = 55;

    this.messages.forEach((msg, i) => {
      // Color errors red
      if (msg.includes('ERROR')) {
        ctx.fillStyle = '#ff4444';
      } else if (msg.includes('WARN')) {
        ctx.fillStyle = '#ffaa00';
      } else {
        ctx.fillStyle = '#ffffff';
      }

      // Truncate long messages
      const maxChars = 45;
      const displayMsg = msg.length > maxChars ? msg.substring(0, maxChars) + '...' : msg;
      ctx.fillText(displayMsg, 10, startY + i * lineHeight);
    });

    // Update texture
    this.texture.needsUpdate = true;
  }

  // Position the debug panel to follow camera
  update(camera) {
    if (!camera) return;

    // Position 1m in front of camera, slightly below eye level
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    this.mesh.position.copy(camera.position).add(direction.multiplyScalar(1.0));
    this.mesh.position.y -= 0.3; // Slightly below eye level
    this.mesh.lookAt(camera.position);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}

// Global singleton for easy access
let debugDisplayInstance = null;

export function initDebugDisplay(scene) {
  debugDisplayInstance = new DebugDisplay(scene);
  return debugDisplayInstance;
}

export function getDebugDisplay() {
  return debugDisplayInstance;
}

export function debugLog(message) {
  // Always send to server first (survives freeze)
  sendToServer(message);

  if (debugDisplayInstance) {
    debugDisplayInstance.log(message, true); // skipServer=true since we already sent
  } else {
    console.log('[Debug]', message);
  }
}

export function debugError(message, error) {
  const errorStr = error ? `: ${error.message || error}` : '';
  const fullMessage = `ERROR: ${message}${errorStr}`;

  // Always send to server first (survives freeze)
  sendToServer(fullMessage);

  if (debugDisplayInstance) {
    debugDisplayInstance.error(message, error);
  } else {
    console.error('[Debug Error]', message, error);
  }
}
