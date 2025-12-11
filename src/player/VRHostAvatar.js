import * as THREE from 'three';

const HAND_JOINTS = [
  'wrist',
  'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
  'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'
];

export class VRHostAvatar {
  constructor(scene) {
    this.scene = scene;

    this.leftHand = this.createHandMesh();
    this.rightHand = this.createHandMesh();

    this.scene.add(this.leftHand.group);
    this.scene.add(this.rightHand.group);

    this.head = this.createHeadMesh();
    this.scene.add(this.head);

    this.visible = false;
  }

  createHandMesh() {
    const group = new THREE.Group();
    const joints = {};
    const bones = [];

    // Create spheres for each joint
    const jointGeometry = new THREE.SphereGeometry(0.008, 8, 8);
    const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xff6644 });

    HAND_JOINTS.forEach(jointName => {
      const sphere = new THREE.Mesh(jointGeometry, jointMaterial);
      sphere.visible = false;
      group.add(sphere);
      joints[jointName] = sphere;
    });

    // Create cylinders for bones (connecting joints)
    const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xff8866 });

    const boneConnections = [
      ['wrist', 'thumb-metacarpal'],
      ['thumb-metacarpal', 'thumb-phalanx-proximal'],
      ['thumb-phalanx-proximal', 'thumb-phalanx-distal'],
      ['thumb-phalanx-distal', 'thumb-tip'],
      ['wrist', 'index-finger-metacarpal'],
      ['index-finger-metacarpal', 'index-finger-phalanx-proximal'],
      ['index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate'],
      ['index-finger-phalanx-intermediate', 'index-finger-phalanx-distal'],
      ['index-finger-phalanx-distal', 'index-finger-tip'],
      ['wrist', 'middle-finger-metacarpal'],
      ['middle-finger-metacarpal', 'middle-finger-phalanx-proximal'],
      ['middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate'],
      ['middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal'],
      ['middle-finger-phalanx-distal', 'middle-finger-tip'],
      ['wrist', 'ring-finger-metacarpal'],
      ['ring-finger-metacarpal', 'ring-finger-phalanx-proximal'],
      ['ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate'],
      ['ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal'],
      ['ring-finger-phalanx-distal', 'ring-finger-tip'],
      ['wrist', 'pinky-finger-metacarpal'],
      ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal'],
      ['pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate'],
      ['pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal'],
      ['pinky-finger-phalanx-distal', 'pinky-finger-tip'],
    ];

    boneConnections.forEach(([from, to]) => {
      const boneGeometry = new THREE.CylinderGeometry(0.004, 0.004, 1, 8);
      const bone = new THREE.Mesh(boneGeometry, boneMaterial);
      bone.visible = false;
      bone.userData = { from, to };
      group.add(bone);
      bones.push(bone);
    });

    return { group, joints, bones };
  }

  createHeadMesh() {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6644 })
    );
    head.visible = false;

    // Add "visor" to indicate VR headset
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    visor.position.z = 0.1;
    head.add(visor);

    return head;
  }

  updateHands(handData) {
    if (!handData) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);

    if (handData.left) {
      this.updateHandMesh(this.leftHand, handData.left);
    }

    if (handData.right) {
      this.updateHandMesh(this.rightHand, handData.right);
    }
  }

  updateHandMesh(hand, data) {
    // Update joint positions
    if (data.joints) {
      HAND_JOINTS.forEach((jointName, index) => {
        const joint = hand.joints[jointName];
        const jointData = data.joints[index];

        if (joint && jointData) {
          joint.position.set(jointData.x, jointData.y, jointData.z);
          joint.visible = true;
        }
      });

      // Update bones
      hand.bones.forEach(bone => {
        const fromJoint = hand.joints[bone.userData.from];
        const toJoint = hand.joints[bone.userData.to];

        if (fromJoint && toJoint && fromJoint.visible && toJoint.visible) {
          const from = fromJoint.position;
          const to = toJoint.position;

          // Position bone at midpoint
          bone.position.copy(from).add(to).multiplyScalar(0.5);

          // Scale bone to distance
          const distance = from.distanceTo(to);
          bone.scale.y = distance;

          // Orient bone to point from->to
          bone.lookAt(to);
          bone.rotateX(Math.PI / 2);

          bone.visible = true;
        }
      });
    }
  }

  updateHead(headData) {
    if (!headData) {
      this.head.visible = false;
      return;
    }

    this.head.visible = true;
    this.head.position.set(headData.position.x, headData.position.y, headData.position.z);

    if (headData.rotation) {
      this.head.rotation.set(headData.rotation.x, headData.rotation.y, headData.rotation.z);
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.leftHand.group.visible = visible;
    this.rightHand.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.leftHand.group);
    this.scene.remove(this.rightHand.group);
    this.scene.remove(this.head);
  }
}
