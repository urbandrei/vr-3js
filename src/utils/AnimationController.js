import * as THREE from 'three';

export class AnimationController {
  constructor(model, animations) {
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    this.currentAction = null;
    this.currentAnimationName = null;
    this.fadeDuration = 0.2;

    // One-shot animations (play once, don't loop)
    this.oneShotAnimations = new Set(['falling', 'getup', 'hit', 'tumble', 'standup']);
    this.currentOneShotComplete = false;

    // Store available animations with normalized names
    animations.forEach((clip) => {
      const name = this.normalizeAnimationName(clip.name);
      const action = this.mixer.clipAction(clip);
      this.actions[name] = action;
    });

    // Listen for animation completion
    this.mixer.addEventListener('finished', (e) => {
      const clipName = e.action.getClip().name;
      const normalizedName = this.normalizeAnimationName(clipName);
      if (this.oneShotAnimations.has(normalizedName)) {
        this.currentOneShotComplete = true;
      }
    });

    // Start with idle if available
    if (this.actions['idle']) {
      this.play('idle', false);
    }
  }

  normalizeAnimationName(name) {
    const lower = name.toLowerCase();

    // Standard animations
    if (lower.includes('idle') || lower.includes('breathing')) {
      return 'idle';
    }
    if (lower.includes('run') || lower.includes('jog')) {
      return 'run';
    }
    if (lower.includes('walk')) {
      return 'walk';
    }

    // Ragdoll animations
    if (lower.includes('fall') || lower.includes('tumble') || lower.includes('dying')) {
      return 'falling';
    }
    if (lower.includes('getup') || lower.includes('standup') || lower.includes('get up') || lower.includes('stand up')) {
      return 'getup';
    }
    if (lower.includes('hit') || lower.includes('impact') || lower.includes('react')) {
      return 'hit';
    }

    return lower;
  }

  play(animationName, crossfade = true) {
    const name = animationName.toLowerCase();
    const action = this.actions[name];

    if (!action) {
      // If animation not found, try fallbacks
      if (name === 'falling' && this.actions['idle']) {
        // No falling animation, just use idle
        return this.play('idle', crossfade);
      }
      if (name === 'getup' && this.actions['idle']) {
        // No getup animation, just use idle
        this.currentOneShotComplete = true; // Mark as complete immediately
        return this.play('idle', crossfade);
      }
      return;
    }

    if (action === this.currentAction) return;

    // Reset one-shot tracking
    this.currentOneShotComplete = false;

    // Configure loop mode based on animation type
    if (this.oneShotAnimations.has(name)) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    }

    if (this.currentAction && crossfade) {
      action.reset();
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(1);
      action.crossFadeFrom(this.currentAction, this.fadeDuration, true);
      action.play();
    } else {
      action.reset();
      action.play();
    }

    this.currentAction = action;
    this.currentAnimationName = name;
  }

  update(deltaTime) {
    this.mixer.update(deltaTime);
  }

  isAnimationComplete(animationName) {
    const name = animationName.toLowerCase();
    // Check if current animation is the requested one and is complete
    if (this.currentAnimationName === name && this.oneShotAnimations.has(name)) {
      return this.currentOneShotComplete;
    }
    // If animation doesn't exist, consider it complete
    if (!this.actions[name]) {
      return true;
    }
    return false;
  }

  setTimeScale(scale) {
    if (this.currentAction) {
      this.currentAction.setEffectiveTimeScale(scale);
    }
  }

  setAnimationWeight(weight) {
    if (this.currentAction) {
      this.currentAction.setEffectiveWeight(weight);
    }
  }

  hasAnimation(animationName) {
    return !!this.actions[animationName.toLowerCase()];
  }

  getAvailableAnimations() {
    return Object.keys(this.actions);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
