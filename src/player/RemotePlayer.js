import * as THREE from 'three';
import { modelLoader } from '../utils/ModelLoader.js';
import { AnimationController } from '../utils/AnimationController.js';
import { PlayerState } from './PlayerStateMachine.js';
import { PhysicsConfig } from '../physics/PhysicsConfig.js';

const MODEL_URL = './models/player.glb';
const TARGET_HEIGHT = 0.12; // 12cm tall
const MOVEMENT_THRESHOLD = 0.001;

export class RemotePlayer {
  constructor(playerId, scene) {
    this.playerId = playerId;
    this.scene = scene;

    this.targetPosition = new THREE.Vector3(0, 0, 2);
    this.targetRotation = 0;
    this.previousPosition = new THREE.Vector3(0, 0, 2);
    this.isBeingHeld = false;
    this.isMoving = false;

    this.animationController = null;
    this.modelLoaded = false;

    // Physics state (received from network on clients, driven locally on host)
    this.physicsState = null;
    this.previousPhysicsState = null;
    this.interpolationAlpha = 0;
    this.currentState = PlayerState.WALKING;

    // Ragdoll blend weight (0 = animation, 1 = physics)
    this.ragdollBlendWeight = 0;
    this.ragdollBlendSpeed = PhysicsConfig.animation.blendSpeed;

    // Create group immediately for grabbable reference
    this.mesh = new THREE.Group();
    this.mesh.userData.grabbable = true;
    this.mesh.userData.networkId = 'player_' + playerId;
    this.mesh.userData.isPlayer = true;
    this.mesh.userData.playerId = playerId;
    this.scene.add(this.mesh);

    // Load model asynchronously
    this.loadModel();
  }

  async loadModel() {
    try {
      const gltf = await modelLoader.load(MODEL_URL);

      const model = gltf.scene;

      // Calculate scale to achieve target height
      const box = new THREE.Box3().setFromObject(model);
      const modelHeight = box.max.y - box.min.y;
      const scale = TARGET_HEIGHT / modelHeight;
      model.scale.setScalar(scale);

      // Recalculate bounding box after scaling
      box.setFromObject(model);

      // Offset model so feet are at y=0
      model.position.y = -box.min.y;

      this.mesh.add(model);

      // Setup animation controller
      if (gltf.animations && gltf.animations.length > 0) {
        this.animationController = new AnimationController(model, gltf.animations);
        console.log(`Loaded ${gltf.animations.length} animations for player ${this.playerId}:`,
          gltf.animations.map(a => a.name));
      }

      this.modelLoaded = true;
    } catch (error) {
      console.error(`Failed to load model for player ${this.playerId}:`, error);
      this.createFallbackAvatar();
    }
  }

  createFallbackAvatar() {
    const scale = 0.07;
    const bodyColor = 0x00ffcc;
    const skinColor = 0xffcc88;
    const eyeColor = 0x333333;

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: eyeColor });

    // Torso
    const torsoGeometry = new THREE.CapsuleGeometry(0.25 * scale, 0.4 * scale, 4, 8);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 0.65 * scale;
    this.mesh.add(torso);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2 * scale, 12, 12);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.05 * scale;
    this.mesh.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.04 * scale, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.07 * scale, 1.08 * scale, 0.15 * scale);
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.07 * scale, 1.08 * scale, 0.15 * scale);
    this.mesh.add(rightEye);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.08 * scale, 0.3 * scale, 4, 6);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.35 * scale, 0.65 * scale, 0);
    leftArm.rotation.z = 0.3;
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.35 * scale, 0.65 * scale, 0);
    rightArm.rotation.z = -0.3;
    this.mesh.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.1 * scale, 0.35 * scale, 4, 6);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.12 * scale, 0.2 * scale, 0);
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.12 * scale, 0.2 * scale, 0);
    this.mesh.add(rightLeg);

    this.modelLoaded = true;
  }

  updateFromState(state) {
    this.previousPosition.copy(this.targetPosition);
    this.targetPosition.set(state.position.x, 0, state.position.z);
    this.targetRotation = state.rotation;
  }

  // Update physics state from network (client-side)
  updatePhysicsState(physicsState) {
    this.previousPhysicsState = this.physicsState;
    this.physicsState = physicsState;
    this.interpolationAlpha = 0;

    // Handle state transitions
    if (physicsState.state !== this.currentState) {
      this.onStateChange(physicsState.state);
    }
  }

  onStateChange(newState) {
    const oldState = this.currentState;
    this.currentState = newState;

    switch (newState) {
      case PlayerState.RAGDOLL:
        this.animationController?.play('falling');
        break;
      case PlayerState.RECOVERING:
        this.animationController?.play('getup');
        break;
      case PlayerState.WALKING:
        this.animationController?.play('idle');
        this.ragdollBlendWeight = 0;
        break;
      case PlayerState.HELD:
        this.animationController?.play('idle');
        break;
    }
  }

  // Called immediately when ragdoll is triggered (client feedback)
  startRagdoll(impulse) {
    this.currentState = PlayerState.RAGDOLL;
    this.animationController?.play('falling');
  }

  // Update with physics interpolation (client-side)
  updateWithPhysics(deltaTime) {
    const isRagdoll = this.currentState === PlayerState.RAGDOLL;
    const isRecovering = this.currentState === PlayerState.RECOVERING;

    // Update ragdoll blend weight
    const targetBlend = isRagdoll ? 1.0 : 0.0;
    this.ragdollBlendWeight = THREE.MathUtils.lerp(
      this.ragdollBlendWeight,
      targetBlend,
      this.ragdollBlendSpeed * deltaTime
    );

    if ((isRagdoll || isRecovering) && this.physicsState) {
      // Interpolate physics position
      this.interpolationAlpha += deltaTime * 20; // 20Hz network update rate
      this.interpolationAlpha = Math.min(this.interpolationAlpha, 1);

      if (this.previousPhysicsState && this.physicsState) {
        // Calculate mesh offset (physics body is centered, mesh feet at y=0)
        const meshOffset = PhysicsConfig.player.height / 2;

        // Lerp position
        const prevPos = new THREE.Vector3(
          this.previousPhysicsState.position.x,
          this.previousPhysicsState.position.y - meshOffset,
          this.previousPhysicsState.position.z
        );
        const currPos = new THREE.Vector3(
          this.physicsState.position.x,
          this.physicsState.position.y - meshOffset,
          this.physicsState.position.z
        );

        this.mesh.position.lerpVectors(prevPos, currPos, this.interpolationAlpha);

        // Slerp rotation (quaternion)
        if (this.ragdollBlendWeight > 0.1) {
          const prevQuat = new THREE.Quaternion(
            this.previousPhysicsState.rotation.x,
            this.previousPhysicsState.rotation.y,
            this.previousPhysicsState.rotation.z,
            this.previousPhysicsState.rotation.w
          );
          const currQuat = new THREE.Quaternion(
            this.physicsState.rotation.x,
            this.physicsState.rotation.y,
            this.physicsState.rotation.z,
            this.physicsState.rotation.w
          );
          this.mesh.quaternion.slerpQuaternions(prevQuat, currQuat, this.interpolationAlpha);
        }
      } else if (this.physicsState) {
        // No previous state, use current directly
        const meshOffset = PhysicsConfig.player.height / 2;
        this.mesh.position.set(
          this.physicsState.position.x,
          this.physicsState.position.y - meshOffset,
          this.physicsState.position.z
        );

        if (this.ragdollBlendWeight > 0.1) {
          this.mesh.quaternion.set(
            this.physicsState.rotation.x,
            this.physicsState.rotation.y,
            this.physicsState.rotation.z,
            this.physicsState.rotation.w
          );
        }
      }
    }

    // Update animation
    this.animationController?.update(deltaTime);

    // Check for recovery animation completion
    if (isRecovering && this.animationController?.isAnimationComplete('getup')) {
      this.currentState = PlayerState.WALKING;
      this.animationController?.play('idle');
      this.ragdollBlendWeight = 0;
      // Reset rotation to upright
      this.mesh.quaternion.set(0, 0, 0, 1);
    }
  }

  update(deltaTime) {
    // If in ragdoll/recovering state, use physics-based update
    if (this.currentState === PlayerState.RAGDOLL || this.currentState === PlayerState.RECOVERING) {
      this.updateWithPhysics(deltaTime);
      return;
    }

    if (this.isBeingHeld) {
      // Still update animations while held
      if (this.animationController) {
        if (this.isMoving) {
          this.animationController.play('idle');
          this.isMoving = false;
        }
        this.animationController.update(deltaTime);
      }
      return;
    }

    // Normal walking state - smooth interpolation
    this.mesh.position.lerp(this.targetPosition, 10 * deltaTime);

    // Smooth rotation interpolation
    const currentY = this.mesh.rotation.y;
    const diff = this.targetRotation - currentY;
    let normalizedDiff = diff;
    while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
    while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
    this.mesh.rotation.y += normalizedDiff * 10 * deltaTime;

    // Detect movement for animation
    const distanceToTarget = this.mesh.position.distanceTo(this.targetPosition);
    const wasMoving = this.isMoving;
    this.isMoving = distanceToTarget > MOVEMENT_THRESHOLD;

    // Update animation based on movement state
    if (this.animationController) {
      if (this.isMoving && !wasMoving) {
        this.animationController.play('run');
      } else if (!this.isMoving && wasMoving) {
        this.animationController.play('idle');
      }
      this.animationController.update(deltaTime);
    }
  }

  setBeingHeld(held) {
    this.isBeingHeld = held;
    if (held) {
      this.currentState = PlayerState.HELD;
    } else if (this.currentState === PlayerState.HELD) {
      this.currentState = PlayerState.WALKING;
    }
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setState(state) {
    if (state !== this.currentState) {
      this.onStateChange(state);
    }
  }

  getAnimationController() {
    return this.animationController;
  }

  dispose() {
    this.scene.remove(this.mesh);

    if (this.animationController) {
      this.animationController.dispose();
    }

    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
