import * as THREE from 'three';

const GRAB_DISTANCE = 0.1; // 10cm reach for grabbing

export class GrabSystem {
  constructor(grabbableObjects) {
    this.grabbableObjects = grabbableObjects;
    this.grabbedObject = null;
    this.grabbingHand = null;

    this._grabOffset = new THREE.Vector3();

    // Network callbacks
    this.onGrab = null;
    this.onRelease = null;
  }

  update(handTrackers) {
    for (const tracker of handTrackers) {
      tracker.update();

      // Handle grab start
      if (tracker.pinchStarted && !this.grabbedObject) {
        const pinchPos = tracker.getPinchPosition();

        // Find closest grabbable object within reach
        let closest = null;
        let closestDistance = GRAB_DISTANCE;

        for (const obj of this.grabbableObjects) {
          if (!obj.userData.grabbable) continue;

          const distance = pinchPos.distanceTo(obj.position);
          if (distance < closestDistance) {
            closest = obj;
            closestDistance = distance;
          }
        }

        if (closest) {
          this.grabbedObject = closest;
          this.grabbingHand = tracker;

          // Store offset so object doesn't snap to pinch point
          this._grabOffset.subVectors(closest.position, pinchPos);

          // Visual feedback
          if (closest.material.emissive) {
            closest.material.emissive.setHex(0x222222);
          }

          // Network callback (pass object for player detection)
          if (this.onGrab && closest.userData.networkId) {
            this.onGrab(closest.userData.networkId, closest);
          }
        }
      }

      // Handle grab release
      if (tracker.pinchEnded && tracker === this.grabbingHand) {
        if (this.grabbedObject) {
          const releasedObject = this.grabbedObject;

          // Restore visual
          if (releasedObject.material.emissive) {
            releasedObject.material.emissive.setHex(0x000000);
          }

          // Network callback (pass object for player detection)
          if (this.onRelease && releasedObject.userData.networkId) {
            this.onRelease(releasedObject.userData.networkId, {
              x: releasedObject.position.x,
              y: releasedObject.position.y,
              z: releasedObject.position.z
            }, releasedObject);
          }

          this.grabbedObject = null;
          this.grabbingHand = null;
        }
      }
    }

    // Update grabbed object position
    if (this.grabbedObject && this.grabbingHand) {
      const pinchPos = this.grabbingHand.getPinchPosition();
      this.grabbedObject.position.copy(pinchPos).add(this._grabOffset);
    }
  }

  getGrabbedObjectId() {
    return this.grabbedObject?.userData.networkId || null;
  }

  getGrabbedObjectPosition() {
    if (!this.grabbedObject) return null;
    return {
      x: this.grabbedObject.position.x,
      y: this.grabbedObject.position.y,
      z: this.grabbedObject.position.z
    };
  }
}

// PC grab system using mouse/raycast
export class PCGrabSystem {
  constructor(camera, grabbableObjects, scene) {
    this.camera = camera;
    this.grabbableObjects = grabbableObjects;
    this.scene = scene;

    this.grabbedObject = null;
    this.grabDistance = 0;
    this._grabOffset = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.onGrabRequest = null;
    this.onRelease = null;

    this.pendingGrab = null;

    this.setupControls();
  }

  setupControls() {
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onMouseDown(e) {
    if (e.button !== 0) return; // Left click only
    if (this.grabbedObject) return;

    // Cast ray from center of screen
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const intersects = this.raycaster.intersectObjects(this.grabbableObjects);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object.userData.grabbable && hit.object.userData.networkId) {
        this.pendingGrab = hit.object;
        this.grabDistance = hit.distance;

        // Request grab from host
        if (this.onGrabRequest) {
          this.onGrabRequest(hit.object.userData.networkId);
        }
      }
    }
  }

  onMouseUp(e) {
    if (e.button !== 0) return;

    if (this.grabbedObject) {
      const releasedObject = this.grabbedObject;

      // Restore visual
      if (releasedObject.material.emissive) {
        releasedObject.material.emissive.setHex(0x000000);
      }

      // Network callback
      if (this.onRelease && releasedObject.userData.networkId) {
        this.onRelease(releasedObject.userData.networkId, {
          x: releasedObject.position.x,
          y: releasedObject.position.y,
          z: releasedObject.position.z
        });
      }

      this.grabbedObject = null;
    }

    this.pendingGrab = null;
  }

  onGrabGranted(objectId) {
    if (this.pendingGrab && this.pendingGrab.userData.networkId === objectId) {
      this.grabbedObject = this.pendingGrab;

      // Visual feedback
      if (this.grabbedObject.material.emissive) {
        this.grabbedObject.material.emissive.setHex(0x222222);
      }
    }
    this.pendingGrab = null;
  }

  onGrabDenied(objectId) {
    this.pendingGrab = null;
  }

  update() {
    if (this.grabbedObject) {
      // Position object in front of camera at grab distance
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.camera.quaternion);

      this.grabbedObject.position.copy(this.camera.position)
        .add(direction.multiplyScalar(this.grabDistance));
    }
  }

  getGrabbedObjectId() {
    return this.grabbedObject?.userData.networkId || null;
  }

  getGrabbedObjectPosition() {
    if (!this.grabbedObject) return null;
    return {
      x: this.grabbedObject.position.x,
      y: this.grabbedObject.position.y,
      z: this.grabbedObject.position.z
    };
  }
}
