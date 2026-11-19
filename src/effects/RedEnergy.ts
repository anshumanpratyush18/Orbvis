import * as THREE from 'three';

export class RedEnergyVortex {
  private group: THREE.Group;
  private points: THREE.Points;
  private count = 1200;
  private positions: Float32Array;
  private velocities: Float32Array;
  private baseColors: Float32Array;
  private targetPos = new THREE.Vector3(0, 0, 0);
  private isExploding = false;
  private explosionTimer = 0;

  constructor(parent: THREE.Group | THREE.Scene) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.baseColors = new Float32Array(this.count * 3);

    const cCrimson = new THREE.Color(0xff1744);
    const cDeepRed = new THREE.Color(0xb71c1c);
    const cChaosPurple = new THREE.Color(0xd500f9);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 0.6;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      const pick = Math.random();
      const col = pick < 0.5 ? cCrimson : pick < 0.85 ? cDeepRed : cChaosPurple;
      this.baseColors[i * 3] = col.r;
      this.baseColors[i * 3 + 1] = col.g;
      this.baseColors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.baseColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  setTarget(x: number, y: number, z: number) {
    this.targetPos.set(x, y, z);
  }

  triggerBurst() {
    this.isExploding = true;
    this.explosionTimer = 0;
  }

  update(delta: number) {
    const pos = this.positions;
    const tx = this.targetPos.x;
    const ty = this.targetPos.y;
    const tz = this.targetPos.z;

    if (this.isExploding) {
      this.explosionTimer += delta;
      if (this.explosionTimer > 0.8) {
        this.isExploding = false;
      }
    }

    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let x = pos[ix];
      let y = pos[iy];
      let z = pos[iz];

      const dx = x - tx;
      const dy = y - ty;
      const dz = z - tz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

      if (this.isExploding) {
        pos[ix] += (dx / dist) * 0.12;
        pos[iy] += (dy / dist) * 0.12;
        pos[iz] += (dz / dist) * 0.12;
      } else {
        // Swirling chaos tendril around fingertip / palm
        const angle = Math.atan2(dy, dx) + 0.05 + (i % 3) * 0.02;
        const targetR = 0.35 + Math.sin(i * 0.2) * 0.15;

        pos[ix] += (tx + Math.cos(angle) * targetR - x) * 0.1;
        pos[iy] += (ty + Math.sin(angle) * targetR - y) * 0.1;
        pos[iz] += (tz + Math.sin(i) * 0.15 - z) * 0.1;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.group.remove(this.points);
  }
}
