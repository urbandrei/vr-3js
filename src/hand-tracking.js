import * as THREE from 'three';

const THUMB_TIP = 'thumb-tip';
const INDEX_TIP = 'index-finger-tip';

const HAND_JOINTS = [
  'wrist',
  'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
  'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'
];

// Pinch thresholds with hysteresis
const PINCH_START_DISTANCE = 0.02; // 2cm - close enough to grab
const PINCH_END_DISTANCE = 0.05;   // 5cm - far enough to release

export class HandTracker {
  constructor(hand, handedness) {
    this.hand = hand;
    this.handedness = handedness;
    this.isPinching = false;
    this.pinchStarted = false;
    this.pinchEnded = false;

    this.pinchPosition = new THREE.Vector3();

    this._thumbPos = new THREE.Vector3();
    this._indexPos = new THREE.Vector3();
  }

  update() {
    this.pinchStarted = false;
    this.pinchEnded = false;

    const thumbTip = this.hand.joints[THUMB_TIP];
    const indexTip = this.hand.joints[INDEX_TIP];

    if (!thumbTip || !indexTip) {
      return;
    }

    thumbTip.getWorldPosition(this._thumbPos);
    indexTip.getWorldPosition(this._indexPos);

    const distance = this._thumbPos.distanceTo(this._indexPos);

    // Pinch position is midpoint between fingers
    this.pinchPosition.lerpVectors(this._thumbPos, this._indexPos, 0.5);

    const wasPinching = this.isPinching;

    // Hysteresis for stable detection
    if (distance < PINCH_START_DISTANCE) {
      this.isPinching = true;
    } else if (distance > PINCH_END_DISTANCE) {
      this.isPinching = false;
    }

    // Detect transitions
    if (this.isPinching && !wasPinching) {
      this.pinchStarted = true;
    }
    if (!this.isPinching && wasPinching) {
      this.pinchEnded = true;
    }
  }

  getPinchPosition() {
    return this.pinchPosition;
  }

  getJointData() {
    const joints = [];
    const tempPos = new THREE.Vector3();

    for (const jointName of HAND_JOINTS) {
      const joint = this.hand.joints[jointName];
      if (joint) {
        joint.getWorldPosition(tempPos);
        joints.push({ x: tempPos.x, y: tempPos.y, z: tempPos.z });
      } else {
        joints.push(null);
      }
    }

    return {
      joints,
      pinching: this.isPinching
    };
  }

  hasValidData() {
    return this.hand.joints && this.hand.joints[THUMB_TIP] && this.hand.joints[INDEX_TIP];
  }
}
