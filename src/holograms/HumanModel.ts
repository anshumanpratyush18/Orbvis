import * as THREE from 'three';

export class HolographicHumanFigure {
  public group: THREE.Group;
  private wireMaterial: THREE.MeshBasicMaterial;
  private glowMaterial: THREE.ShaderMaterial;
  private jointNodes: THREE.Mesh[] = [];

  constructor(shaderMat: THREE.ShaderMaterial) {
    this.group = new THREE.Group();
    this.glowMaterial = shaderMat;

    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    this.buildSkeleton();
  }

  private addSegment(geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, this.glowMaterial);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    this.group.add(mesh);

    const wire = new THREE.Mesh(geo.clone(), this.wireMaterial);
    wire.position.set(x, y, z);
    wire.rotation.set(rx, ry, rz);
    this.group.add(wire);

    return mesh;
  }

  private addJointNode(x: number, y: number, z: number, size = 0.05) {
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const joint = new THREE.Mesh(geo, mat);
    joint.position.set(x, y, z);
    this.group.add(joint);
    this.jointNodes.push(joint);
  }

  private buildSkeleton() {
    // Cranium / Skull
    this.addSegment(new THREE.SphereGeometry(0.24, 18, 14), 0, 1.9, 0);
    this.addJointNode(0, 1.9, 0, 0.04);

    // Mandible / Jaw
    this.addSegment(new THREE.BoxGeometry(0.16, 0.1, 0.15), 0, 1.74, 0.04);

    // Cervical Spine / Neck
    this.addSegment(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 10), 0, 1.62, 0);

    // Clavicle / Shoulder Girdle
    const clavGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.76, 8);
    clavGeo.rotateZ(Math.PI / 2);
    this.addSegment(clavGeo, 0, 1.48, 0);

    // Thoracic Spine & Ribcage
    for (let r = 0; r < 5; r++) {
      const ribY = 1.38 - r * 0.1;
      const ribW = 0.26 - r * 0.02;
      const torusGeo = new THREE.TorusGeometry(ribW, 0.02, 8, 24);
      torusGeo.rotateX(Math.PI / 2);
      this.addSegment(torusGeo, 0, ribY, 0);
    }

    // Lumbar Spine
    this.addSegment(new THREE.CylinderGeometry(0.07, 0.09, 0.35, 10), 0, 0.85, -0.02);

    // Pelvis / Hips
    this.addSegment(new THREE.BoxGeometry(0.5, 0.22, 0.25), 0, 0.58, 0);
    this.addJointNode(-0.2, 0.52, 0, 0.06);
    this.addJointNode(0.2, 0.52, 0, 0.06);

    // Left Arm
    this.addJointNode(-0.42, 1.48, 0, 0.06); // Shoulder
    this.addSegment(new THREE.CylinderGeometry(0.055, 0.05, 0.42, 8), -0.46, 1.25, 0, 0, 0, 0.2); // Humerus
    this.addJointNode(-0.52, 1.02, 0, 0.05); // Elbow
    this.addSegment(new THREE.CylinderGeometry(0.045, 0.04, 0.38, 8), -0.6, 0.8, 0, 0, 0, 0.35); // Forearm
    this.addJointNode(-0.7, 0.6, 0, 0.04); // Wrist
    this.addSegment(new THREE.BoxGeometry(0.08, 0.12, 0.03), -0.74, 0.5, 0); // Hand

    // Right Arm
    this.addJointNode(0.42, 1.48, 0, 0.06); // Shoulder
    this.addSegment(new THREE.CylinderGeometry(0.055, 0.05, 0.42, 8), 0.46, 1.25, 0, 0, 0, -0.2); // Humerus
    this.addJointNode(0.52, 1.02, 0, 0.05); // Elbow
    this.addSegment(new THREE.CylinderGeometry(0.045, 0.04, 0.38, 8), 0.6, 0.8, 0, 0, 0, -0.35); // Forearm
    this.addJointNode(0.7, 0.6, 0, 0.04); // Wrist
    this.addSegment(new THREE.BoxGeometry(0.08, 0.12, 0.03), 0.74, 0.5, 0); // Hand

    // Left Leg
    this.addSegment(new THREE.CylinderGeometry(0.09, 0.075, 0.55, 10), -0.18, 0.18, 0, 0, 0, 0.08); // Femur
    this.addJointNode(-0.21, -0.12, 0, 0.06); // Knee
    this.addSegment(new THREE.CylinderGeometry(0.065, 0.055, 0.52, 10), -0.22, -0.42, 0); // Tibia
    this.addJointNode(-0.22, -0.7, 0, 0.05); // Ankle
    this.addSegment(new THREE.BoxGeometry(0.12, 0.07, 0.26), -0.22, -0.76, 0.08); // Foot

    // Right Leg
    this.addSegment(new THREE.CylinderGeometry(0.09, 0.075, 0.55, 10), 0.18, 0.18, 0, 0, 0, -0.08); // Femur
    this.addJointNode(0.21, -0.12, 0, 0.06); // Knee
    this.addSegment(new THREE.CylinderGeometry(0.065, 0.055, 0.52, 10), 0.22, -0.42, 0); // Tibia
    this.addJointNode(0.22, -0.7, 0, 0.05); // Ankle
    this.addSegment(new THREE.BoxGeometry(0.12, 0.07, 0.26), 0.22, -0.76, 0.08); // Foot
  }
}
