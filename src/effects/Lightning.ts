import * as THREE from 'three';

export class LightningEffect {
  private group: THREE.Group;
  private boltLines: THREE.Line[] = [];
  private color: number;
  private maxBolts = 6;

  constructor(scene: THREE.Group | THREE.Scene, color = 0xff1744) {
    this.group = new THREE.Group();
    this.color = color;
    scene.add(this.group);
  }

  generateBolt(start: THREE.Vector3, end: THREE.Vector3, steps = 14, jitter = 0.35): THREE.Line {
    const points: THREE.Vector3[] = [];
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Parabolic envelope: maximum jitter in middle, 0 at endpoints
      const env = Math.sin(t * Math.PI) * jitter * (length * 0.2 + 0.2);
      const pt = new THREE.Vector3().lerpVectors(start, end, t);
      
      if (i > 0 && i < steps) {
        pt.x += (Math.random() - 0.5) * env;
        pt.y += (Math.random() - 0.5) * env;
        pt.z += (Math.random() - 0.5) * env * 0.4;
      }
      points.push(pt);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.85 + Math.random() * 0.15,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    const line = new THREE.Line(geo, mat);
    return line;
  }

  updateArcs(start: THREE.Vector3, end: THREE.Vector3, count = 3) {
    this.clear();
    const actualCount = Math.min(count, this.maxBolts);
    for (let i = 0; i < actualCount; i++) {
      const bolt = this.generateBolt(start, end);
      this.boltLines.push(bolt);
      this.group.add(bolt);
    }
  }

  clear() {
    this.boltLines.forEach(line => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      this.group.remove(line);
    });
    this.boltLines = [];
  }

  dispose() {
    this.clear();
  }
}
