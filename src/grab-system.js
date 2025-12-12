import * as THREE from 'three';

const GRAB_DISTANCE = 0.1; // 10cm reach for grabbing

export class GrabSystem {
  constructor(grabbableObjects) {
    this.grabbableObjects = grabbableObjects;

    // Per-hand grabbing state (keyed by hand index)
    this.grabbedObjects = new Map();      // handIndex -> object
    this.grabOffsets = new Map();         // handIndex -> Vector3
    this.grabRotationOffsets = new Map(); // handIndex -> Quaternion
    this.positionHistories = new Map();   // handIndex -> array
    this.rotationHistories = new Map();   // handIndex -> array

    this._maxPositionHistory = 10; // frames to average
    this._maxRotationHistory = 10;

    // Network callbacks
    this.onGrab = null;
    this.onRelease = null;
  }

  update(handTrackers) {
    for (let handIndex = 0; handIndex < handTrackers.length; handIndex++) {
      const tracker = handTrackers[handIndex];
      tracker.update();

      // Handle grab start for THIS hand
      if (tracker.pinchStarted && !this.grabbedObjects.has(handIndex)) {
        const pinchPos = tracker.getPinchPosition();

        // Find closest grabbable object within reach (not already held by other hand)
        let closest = null;
        let closestDistance = GRAB_DISTANCE;

        for (const obj of this.grabbableObjects) {
          if (!obj.userData.grabbable) continue;

          // Skip if already held by another hand
          if (this.isObjectHeld(obj)) continue;

          const distance = pinchPos.distanceTo(obj.position);
          if (distance < closestDistance) {
            closest = obj;
            closestDistance = distance;
          }
        }

        if (closest) {
          // Store grabbed object for this hand
          this.grabbedObjects.set(handIndex, closest);

          // Clear history on new grab
          this.positionHistories.set(handIndex, []);
          this.rotationHistories.set(handIndex, []);

          // Get initial hand orientation
          const handQuat = tracker.getPinchOrientation();

          // Store position offset in hand's local coordinate frame
          // This way when hand rotates, offset rotates with it (orbits around pinch point)
          const grabOffset = new THREE.Vector3().subVectors(closest.position, pinchPos);
          grabOffset.applyQuaternion(handQuat.clone().invert());
          this.grabOffsets.set(handIndex, grabOffset);

          // Store rotation offset: objectQuat = handQuat * offset, so offset = handQuat^-1 * objectQuat
          const grabRotationOffset = new THREE.Quaternion().copy(handQuat).invert().multiply(closest.quaternion);
          this.grabRotationOffsets.set(handIndex, grabRotationOffset);

          // Visual feedback
          if (closest.material?.emissive) {
            closest.material.emissive.setHex(0x222222);
          }

          // Network callback (pass object and hand index for player detection)
          if (this.onGrab && closest.userData.networkId) {
            this.onGrab(closest.userData.networkId, closest, handIndex);
          }
        }
      }

      // Handle grab release for THIS hand
      if (tracker.pinchEnded && this.grabbedObjects.has(handIndex)) {
        const releasedObject = this.grabbedObjects.get(handIndex);

        // Restore visual
        if (releasedObject.material?.emissive) {
          releasedObject.material.emissive.setHex(0x000000);
        }

        // Network callback (pass object and hand index for player detection)
        if (this.onRelease && releasedObject.userData.networkId) {
          this.onRelease(releasedObject.userData.networkId, {
            x: releasedObject.position.x,
            y: releasedObject.position.y,
            z: releasedObject.position.z
          }, releasedObject, handIndex);
        }

        // Clear state for this hand
        this.grabbedObjects.delete(handIndex);
        this.grabOffsets.delete(handIndex);
        this.grabRotationOffsets.delete(handIndex);
        this.positionHistories.delete(handIndex);
        this.rotationHistories.delete(handIndex);
      }
    }

    // Update all grabbed objects position/rotation and track for velocity
    const now = performance.now() / 1000;
    for (const [handIndex, grabbedObject] of this.grabbedObjects) {
      const tracker = handTrackers[handIndex];
      if (!tracker) continue;

      const pinchPos = tracker.getPinchPosition();
      const handQuat = tracker.getPinchOrientation();
      const grabOffset = this.grabOffsets.get(handIndex);
      const grabRotationOffset = this.grabRotationOffsets.get(handIndex);

      if (!grabOffset || !grabRotationOffset) continue;

      // Update position - rotate offset from hand-local to world space
      // This makes the object orbit around the pinch point when hand rotates
      const rotatedOffset = grabOffset.clone().applyQuaternion(handQuat);
      grabbedObject.position.copy(pinchPos).add(rotatedOffset);

      // Update rotation: objectQuat = handQuat * offset
      grabbedObject.quaternion.copy(handQuat).multiply(grabRotationOffset);

      // Track position history for throw velocity calculation
      const posHistory = this.positionHistories.get(handIndex) || [];
      posHistory.push({
        pos: grabbedObject.position.clone(),
        time: now
      });
      if (posHistory.length > this._maxPositionHistory) {
        posHistory.shift();
      }
      this.positionHistories.set(handIndex, posHistory);

      // Track rotation history for angular velocity calculation
      const rotHistory = this.rotationHistories.get(handIndex) || [];
      rotHistory.push({
        quat: grabbedObject.quaternion.clone(),
        time: now
      });
      if (rotHistory.length > this._maxRotationHistory) {
        rotHistory.shift();
      }
      this.rotationHistories.set(handIndex, rotHistory);
    }
  }

  // Check if any hand is holding this object
  isObjectHeld(obj) {
    for (const grabbedObj of this.grabbedObjects.values()) {
      if (grabbedObj === obj) return true;
    }
    return false;
  }

  // Check if a specific hand is holding an object (by networkId or object reference)
  isObjectHeldByHand(objOrId, handIndex) {
    const grabbedObj = this.grabbedObjects.get(handIndex);
    if (!grabbedObj) return false;

    if (typeof objOrId === 'string') {
      return grabbedObj.userData.networkId === objOrId;
    }
    return grabbedObj === objOrId;
  }

  // Get which hand is holding an object (returns handIndex or -1)
  getHoldingHand(obj) {
    for (const [handIndex, grabbedObj] of this.grabbedObjects) {
      if (grabbedObj === obj) return handIndex;
    }
    return -1;
  }

  // Get grabbed object ID for a specific hand
  getGrabbedObjectId(handIndex) {
    if (handIndex === undefined) {
      // Legacy: return first grabbed object if any
      for (const obj of this.grabbedObjects.values()) {
        return obj.userData.networkId || null;
      }
      return null;
    }
    const obj = this.grabbedObjects.get(handIndex);
    return obj?.userData.networkId || null;
  }

  getGrabbedObjectPosition(handIndex) {
    if (handIndex === undefined) {
      // Legacy: return first grabbed object position
      for (const obj of this.grabbedObjects.values()) {
        return {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z
        };
      }
      return null;
    }
    const obj = this.grabbedObjects.get(handIndex);
    if (!obj) return null;
    return {
      x: obj.position.x,
      y: obj.position.y,
      z: obj.position.z
    };
  }

  // Get all hands currently grabbing (returns array of hand indices)
  getGrabbingHandIndices() {
    return Array.from(this.grabbedObjects.keys());
  }

  // Calculate object velocity from position history for a specific hand
  getObjectVelocity(handIndex) {
    const posHistory = this.positionHistories.get(handIndex);
    if (!posHistory || posHistory.length < 2) {
      return new THREE.Vector3();
    }

    // Average velocity from recent position samples
    const velocity = new THREE.Vector3();
    let validSamples = 0;

    for (let i = 1; i < posHistory.length; i++) {
      const prev = posHistory[i - 1];
      const curr = posHistory[i];
      const dt = curr.time - prev.time;

      if (dt > 0) {
        velocity.add(
          new THREE.Vector3()
            .subVectors(curr.pos, prev.pos)
            .divideScalar(dt)
        );
        validSamples++;
      }
    }

    if (validSamples > 0) {
      velocity.divideScalar(validSamples);
    }

    return velocity;
  }

  // Calculate angular velocity from rotation history for a specific hand
  getObjectAngularVelocity(handIndex) {
    const rotHistory = this.rotationHistories.get(handIndex);
    if (!rotHistory || rotHistory.length < 2) {
      return new THREE.Vector3();
    }

    // Use last two samples for angular velocity
    const prev = rotHistory[rotHistory.length - 2];
    const curr = rotHistory[rotHistory.length - 1];
    const dt = curr.time - prev.time;

    if (dt <= 0) {
      return new THREE.Vector3();
    }

    // Calculate relative rotation: dq = curr * prev^-1
    const dq = new THREE.Quaternion()
      .copy(curr.quat)
      .multiply(new THREE.Quaternion().copy(prev.quat).invert());

    // Convert quaternion to axis-angle
    // For small rotations: angular_velocity ≈ 2 * (qx, qy, qz) / dt
    // This is an approximation that works well for small time steps
    const angularVelocity = new THREE.Vector3(
      2 * dq.x / dt,
      2 * dq.y / dt,
      2 * dq.z / dt
    );

    // Handle quaternion sign ambiguity (q and -q represent same rotation)
    if (dq.w < 0) {
      angularVelocity.negate();
    }

    return angularVelocity;
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
