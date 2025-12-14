import * as THREE from 'three';

// Physics validation and safety utilities

export const MAX_LINEAR_VELOCITY = 20;  // m/s - reasonable throw speed
export const MAX_ANGULAR_VELOCITY = 50; // rad/s - reasonable spin

export function isValidVector(v) {
  return v && isFinite(v.x) && isFinite(v.y) && isFinite(v.z);
}

export function isValidNumber(n) {
  return typeof n === 'number' && isFinite(n);
}

export function clampVelocity(velocity, maxSpeed = MAX_LINEAR_VELOCITY) {
  if (!isValidVector(velocity)) {
    return new THREE.Vector3();
  }
  const clamped = velocity.clone();
  const speed = clamped.length();
  if (speed > maxSpeed) {
    clamped.multiplyScalar(maxSpeed / speed);
  }
  return clamped;
}

export function safeApplyLinearVelocity(body, velocity, maxSpeed = MAX_LINEAR_VELOCITY) {
  if (!body || !velocity) return false;

  try {
    if (!isValidVector(velocity)) return false;

    const speed = velocity.length();
    if (speed < 0.1) return false; // Too slow to apply

    const clamped = clampVelocity(velocity, maxSpeed);
    body.velocity.set(clamped.x, clamped.y, clamped.z);
    return true;
  } catch (e) {
    console.warn('Failed to apply linear velocity:', e);
    return false;
  }
}

export function safeApplyAngularVelocity(body, angularVelocity, maxSpeed = MAX_ANGULAR_VELOCITY) {
  if (!body || !angularVelocity) return false;

  try {
    if (!isValidVector(angularVelocity)) return false;

    const speed = angularVelocity.length();
    if (speed < 0.1) return false; // Too slow to apply

    const clamped = clampVelocity(angularVelocity, maxSpeed);
    body.angularVelocity.set(clamped.x, clamped.y, clamped.z);
    return true;
  } catch (e) {
    console.warn('Failed to apply angular velocity:', e);
    return false;
  }
}

export function safeApplyImpulse(body, impulse, point) {
  if (!body || !impulse) return false;

  try {
    if (!isValidVector(impulse)) return false;
    if (point && !isValidVector(point)) return false;

    body.applyImpulse(impulse, point || body.position);
    return true;
  } catch (e) {
    console.warn('Failed to apply impulse:', e);
    return false;
  }
}
