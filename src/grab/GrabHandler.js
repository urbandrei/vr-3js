import { ObjectType, getObjectType, getPlayerId } from '../utils/ObjectTypes.js';
import {
  safeApplyLinearVelocity,
  safeApplyAngularVelocity,
  MAX_LINEAR_VELOCITY,
  MAX_ANGULAR_VELOCITY
} from '../utils/SafePhysics.js';

/**
 * Unified grab/release handler for VR host
 * Manages object state transitions and network synchronization
 */
export class GrabHandler {
  constructor(hostManager, testBlocks, placeableCamera) {
    this.hostManager = hostManager;
    this.testBlocks = testBlocks;
    this.placeableCamera = placeableCamera;
    this.remotePlayers = new Map();
  }

  setRemotePlayers(remotePlayers) {
    this.remotePlayers = remotePlayers;
  }

  findBlock(mesh) {
    return this.testBlocks.find(b => b.mesh === mesh);
  }

  /**
   * Handle object grab
   * @param {string} objectId - Network ID of grabbed object
   * @param {Object} grabbedObject - The Three.js mesh
   * @param {number} handIndex - 0 = left, 1 = right
   */
  handleGrab(objectId, grabbedObject, handIndex) {
    if (!grabbedObject) return;

    const type = getObjectType(grabbedObject);

    switch (type) {
      case ObjectType.PLAYER:
        this._handlePlayerGrab(grabbedObject);
        break;

      case ObjectType.CAMERA:
        this._handleCameraGrab(objectId);
        break;

      case ObjectType.BLOCK:
        this._handleBlockGrab(objectId, grabbedObject);
        break;

      default:
        this.hostManager.setObjectHeldBy(objectId, 'host');
    }
  }

  /**
   * Handle object release
   * @param {string} objectId - Network ID of released object
   * @param {Object} position - Release position {x, y, z}
   * @param {Object} releasedObject - The Three.js mesh
   * @param {number} handIndex - 0 = left, 1 = right
   * @param {Function} getVelocity - Function to get throw velocity
   * @param {Function} getAngularVelocity - Function to get angular velocity
   */
  handleRelease(objectId, position, releasedObject, handIndex, getVelocity, getAngularVelocity) {
    if (!releasedObject) return;

    const type = getObjectType(releasedObject);

    switch (type) {
      case ObjectType.PLAYER:
        this._handlePlayerRelease(releasedObject, getVelocity);
        break;

      case ObjectType.CAMERA:
        this._handleCameraRelease(objectId);
        break;

      case ObjectType.BLOCK:
        this._handleBlockRelease(objectId, releasedObject, handIndex, getVelocity, getAngularVelocity);
        break;

      default:
        this.hostManager.releaseObject(objectId);
        this.hostManager.updateObjectPosition(objectId, position, { x: 0, y: 0, z: 0 });
    }
  }

  _handlePlayerGrab(grabbedObject) {
    const playerId = getPlayerId(grabbedObject);
    if (!playerId) return;

    this.hostManager.pickupPlayer(playerId);

    const remotePlayer = this.remotePlayers.get(playerId);
    if (remotePlayer) {
      remotePlayer.setBeingHeld(true);
    }
  }

  _handlePlayerRelease(releasedObject, getVelocity) {
    const playerId = getPlayerId(releasedObject);
    if (!playerId) return;

    const throwVelocity = getVelocity ? getVelocity() : null;
    this.hostManager.releasePlayer(throwVelocity);

    const remotePlayer = this.remotePlayers.get(playerId);
    if (remotePlayer) {
      remotePlayer.setBeingHeld(false);
    }
  }

  _handleCameraGrab(objectId) {
    if (this.placeableCamera) {
      this.placeableCamera.setHeld(true);
    }
    this.hostManager.setObjectHeldBy(objectId, 'host');
  }

  _handleCameraRelease(objectId) {
    if (this.placeableCamera) {
      this.placeableCamera.setHeld(false);
    }
    this.hostManager.releaseObject(objectId);
  }

  _handleBlockGrab(objectId, grabbedObject) {
    const block = this.findBlock(grabbedObject);
    if (block) {
      // Cancel any pending collision reenable from previous throw
      this.hostManager.collisionHandler.cancelPendingReenable(block);
      block.setHeld(true);
    }
    this.hostManager.setObjectHeldBy(objectId, 'host');
  }

  _handleBlockRelease(objectId, releasedObject, handIndex, getVelocity, getAngularVelocity) {
    const block = this.findBlock(releasedObject);

    if (block) {
      const throwVelocity = getVelocity ? getVelocity() : null;
      const angularVelocity = getAngularVelocity ? getAngularVelocity() : null;

      block.setHeld(false);

      // Temporarily disable hand collision to prevent hand pushing the block
      this.hostManager.collisionHandler.scheduleHandCollisionReenable(block);

      // Apply velocities with validation
      if (block.body) {
        safeApplyLinearVelocity(block.body, throwVelocity, MAX_LINEAR_VELOCITY);
        safeApplyAngularVelocity(block.body, angularVelocity, MAX_ANGULAR_VELOCITY);
      }
    }

    this.hostManager.releaseObject(objectId);
  }
}
