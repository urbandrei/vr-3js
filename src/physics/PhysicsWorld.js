import * as CANNON from 'cannon-es';
import { PhysicsConfig } from './PhysicsConfig.js';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, PhysicsConfig.gravity, 0)
    });

    // Use sweep and prune broadphase for better performance with small objects
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Allow sleeping for performance
    this.world.allowSleep = true;

    // Collision groups
    this.COLLISION_GROUPS = PhysicsConfig.collisionGroups;

    // Setup materials
    this.setupMaterials();

    // Create floor
    this.createFloor();

    // Bodies registry
    this.bodies = new Map();

    // Collision event callbacks
    this.onCollision = null;
  }

  setupMaterials() {
    this.playerMaterial = new CANNON.Material('player');
    this.handMaterial = new CANNON.Material('hand');
    this.groundMaterial = new CANNON.Material('ground');

    // Player-Hand contact
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.playerMaterial,
      this.handMaterial,
      {
        friction: 0.5,
        restitution: 0.1
      }
    ));

    // Player-Ground contact
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.playerMaterial,
      this.groundMaterial,
      {
        friction: 0.6,
        restitution: 0.2
      }
    ));

    // Player-Player contact
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.playerMaterial,
      this.playerMaterial,
      {
        friction: 0.4,
        restitution: 0.3
      }
    ));
  }

  createFloor() {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      material: this.groundMaterial,
      collisionFilterGroup: this.COLLISION_GROUPS.ENVIRONMENT,
      collisionFilterMask: this.COLLISION_GROUPS.PLAYER
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
    this.groundBody = groundBody;
  }

  step(deltaTime) {
    this.world.step(
      PhysicsConfig.fixedTimeStep,
      deltaTime,
      PhysicsConfig.maxSubSteps
    );
  }

  addBody(id, body) {
    this.bodies.set(id, body);
    this.world.addBody(body);
  }

  removeBody(id) {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
    }
  }

  getBody(id) {
    return this.bodies.get(id);
  }

  getBodyId(body) {
    for (const [id, b] of this.bodies) {
      if (b === body) return id;
    }
    return null;
  }

  // Setup collision event listener
  setupCollisionListener(callback) {
    this.onCollision = callback;
    this.world.addEventListener('beginContact', (event) => {
      if (this.onCollision) {
        this.onCollision(event);
      }
    });
  }
}
