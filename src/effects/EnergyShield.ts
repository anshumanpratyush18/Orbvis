import * as THREE from 'three';

export class EnergyShield {
  public group: THREE.Group;
  private rings: { mesh: THREE.Line | THREE.Mesh; speed: number }[] = [];
  private sparks: THREE.Points;
  private sparkPositions: Float32Array;
  private sparkCount = 300;
  private active = false;
  private targetScale = 0;
  private currentScale = 0;

  constructor() {
    this.group = new THREE.Group();
    this.buildShieldGeometry();
    this.buildSparkField();
    this.group.scale.set(0, 0, 0);
  }

  private buildShieldGeometry() {
    const orangeGold = 0xff9100;
    const brightAmber = 0xffab00;
    const deepOrange = 0xff3d00;

    // Outer Runes Ring
    const outerRadius = 1.35;
    const outerPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      outerPts.push(new THREE.Vector3(Math.cos(a) * outerRadius, Math.sin(a) * outerRadius, 0));
    }
    const outerGeo = new THREE.BufferGeometry().setFromPoints(outerPts);
    const outerMat = new THREE.LineBasicMaterial({
      color: orangeGold,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const outerLine = new THREE.Line(outerGeo, outerMat);
    this.group.add(outerLine);
    this.rings.push({ mesh: outerLine, speed: 0.7 });

    // Inner Concentric Rings
    [0.95, 0.65, 0.35].forEach((r, idx) => {
      const pts: THREE.Vector3[] = [];
      const segs = 60;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? brightAmber : deepOrange,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      this.group.add(line);
      this.rings.push({ mesh: line, speed: idx % 2 === 0 ? -1.1 : 0.85 });
    });

    // Sacred Geometry 1: Two Interlocking Squares (Octagram)
    for (let k = 0; k < 2; k++) {
      const squarePts: THREE.Vector3[] = [];
      const side = 1.1;
      const rot = (k * Math.PI) / 4;
      for (let i = 0; i <= 4; i++) {
        const a = rot + (i * Math.PI) / 2 + Math.PI / 4;
        squarePts.push(new THREE.Vector3(Math.cos(a) * side, Math.sin(a) * side, 0));
      }
      const sGeo = new THREE.BufferGeometry().setFromPoints(squarePts);
      const sMat = new THREE.LineBasicMaterial({
        color: brightAmber,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const sLine = new THREE.Line(sGeo, sMat);
      this.group.add(sLine);
      this.rings.push({ mesh: sLine, speed: 0.5 });
    }

    // Sacred Geometry 2: 12-Spoke Radial Mandala
    const spokes = 12;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0),
        new THREE.Vector3(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0),
      ];
      const spokeGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const spokeMat = new THREE.LineBasicMaterial({
        color: orangeGold,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const spokeLine = new THREE.Line(spokeGeo, spokeMat);
      this.group.add(spokeLine);
      this.rings.push({ mesh: spokeLine, speed: -0.6 });
    }
  }

  private buildSparkField() {
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    for (let i = 0; i < this.sparkCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 1.2;
      this.sparkPositions[i * 3] = Math.cos(a) * r;
      this.sparkPositions[i * 3 + 1] = Math.sin(a) * r;
      this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffab00,
      size: 0.04,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparks = new THREE.Points(geo, mat);
    this.group.add(this.sparks);
  }

  setActive(active: boolean) {
    this.active = active;
    this.targetScale = active ? 1 : 0;
  }

  update(delta: number) {
    this.currentScale += (this.targetScale - this.currentScale) * 0.15;
    this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
    this.group.visible = this.currentScale > 0.01;

    if (!this.group.visible) return;

    this.rings.forEach(r => {
      r.mesh.rotation.z += r.speed * delta;
    });

    // Jitter spark particles
    const pos = this.sparkPositions;
    for (let i = 0; i < this.sparkCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      pos[ix] += (Math.random() - 0.5) * 0.02;
      pos[iy] += (Math.random() - 0.5) * 0.02;

      const d = Math.sqrt(pos[ix] * pos[ix] + pos[iy] * pos[iy]);
      if (d > 1.45 || d < 0.25) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.4 + Math.random() * 0.9;
        pos[ix] = Math.cos(a) * r;
        pos[iy] = Math.sin(a) * r;
        pos[iz] = (Math.random() - 0.5) * 0.15;
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.rings.forEach(r => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
      this.group.remove(r.mesh);
    });
    this.sparks.geometry.dispose();
    (this.sparks.material as THREE.Material).dispose();
    this.group.remove(this.sparks);
  }
}
