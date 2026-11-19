import * as THREE from 'three';
import { HandData, GestureResult } from '../types';
import { sfx } from '../utils/audio';

export class ParticleManipulator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrame = 0;

  private COUNT = 5000;
  private positions: Float32Array;
  private velocities: Float32Array;
  private baseColors: Float32Array;
  private points: THREE.Points;

  // Energy Beam connecting hands
  private beamLine: THREE.Line;
  private beamGlow: THREE.Line;
  private beamGeo: THREE.BufferGeometry;

  // Shockwave state
  private shockwaves: { x: number; y: number; radius: number; strength: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.z = 6.0;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.positions = new Float32Array(this.COUNT * 3);
    this.velocities = new Float32Array(this.COUNT * 3);
    this.baseColors = new Float32Array(this.COUNT * 3);

    this.initParticles();
    this.initEnergyBeam();
  }

  private initParticles() {
    const cBlue = new THREE.Color(0x00e5ff);
    const cRed = new THREE.Color(0xff1744);
    const cPurple = new THREE.Color(0xd500f9);
    const cGreen = new THREE.Color(0x00e676);

    for (let i = 0; i < this.COUNT; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 11;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      const pick = Math.random();
      const col = pick < 0.4 ? cBlue : pick < 0.7 ? cPurple : pick < 0.9 ? cRed : cGreen;
      this.baseColors[i * 3] = col.r;
      this.baseColors[i * 3 + 1] = col.g;
      this.baseColors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.baseColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  private initEnergyBeam() {
    const pts = [new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)];
    this.beamGeo = new THREE.BufferGeometry().setFromPoints(pts);

    // Inner bright core
    const matCore = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.beamLine = new THREE.Line(this.beamGeo, matCore);
    this.scene.add(this.beamLine);

    // Outer cyan electric glow
    const matGlow = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 3,
    });
    this.beamGlow = new THREE.Line(this.beamGeo.clone(), matGlow);
    this.scene.add(this.beamGlow);
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[]) {
    const handCenters = hands.map((h, i) => ({
      x: (h.landmarks[9].x - 0.5) * -8.5,
      y: (h.landmarks[9].y - 0.5) * -5.8,
      gesture: gestures[i]?.gesture ?? 'none',
    }));

    // Update Shockwaves
    for (let s = this.shockwaves.length - 1; s >= 0; s--) {
      this.shockwaves[s].radius += 0.25;
      this.shockwaves[s].strength *= 0.94;
      if (this.shockwaves[s].strength < 0.01) {
        this.shockwaves.splice(s, 1);
      }
    }

    // Check for repulsion / explosion triggers
    handCenters.forEach(hc => {
      if (hc.gesture === 'open_palm') {
        if (Math.random() < 0.08) {
          this.shockwaves.push({ x: hc.x, y: hc.y, radius: 0.2, strength: 0.15 });
        }
      }
    });

    // Particle dynamics loop
    const pos = this.positions;
    const vel = this.velocities;

    for (let i = 0; i < this.COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let px = pos[ix];
      let py = pos[iy];

      // Influence from hands
      handCenters.forEach(hc => {
        const dx = hc.x - px;
        const dy = hc.y - py;
        const distSq = dx * dx + dy * dy + 0.15;
        const dist = Math.sqrt(distSq);

        if (hc.gesture === 'closed_fist') {
          // Intense Black-Hole Gravitational Attraction
          const force = 0.0035 / distSq;
          vel[ix] += dx * force;
          vel[iy] += dy * force;
          // Add swirl
          vel[ix] += -dy * 0.008;
          vel[iy] += dx * 0.008;
        } else if (hc.gesture === 'open_palm') {
          // Repel outward
          const force = 0.0028 / distSq;
          vel[ix] -= dx * force;
          vel[iy] -= dy * force;
        } else if (hc.gesture === 'pinch') {
          // Orbit tight ring around pinch point
          const targetR = 0.6;
          const orbitForce = (dist - targetR) * 0.01;
          vel[ix] += (dx / dist) * orbitForce - dy * 0.015;
          vel[iy] += (dy / dist) * orbitForce + dx * 0.015;
        }
      });

      // Apply shockwave ripples
      this.shockwaves.forEach(sw => {
        const dx = px - sw.x;
        const dy = py - sw.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const waveDist = Math.abs(dist - sw.radius);
        if (waveDist < 0.5) {
          const force = (1.0 - waveDist / 0.5) * sw.strength;
          vel[ix] += (dx / (dist || 1)) * force;
          vel[iy] += (dy / (dist || 1)) * force;
        }
      });

      // Fluid friction & dampening
      vel[ix] *= 0.975;
      vel[iy] *= 0.975;
      vel[iz] *= 0.975;

      // Integrate velocity
      pos[ix] += vel[ix];
      pos[iy] += vel[iy];
      pos[iz] += vel[iz];

      // Screen boundary bounce
      if (Math.abs(pos[ix]) > 6.5) vel[ix] *= -0.8;
      if (Math.abs(pos[iy]) > 4.5) vel[iy] *= -0.8;
      if (Math.abs(pos[iz]) > 2.0) vel[iz] *= -0.8;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Connect hands with animated jagged lightning energy beam
    if (hands.length >= 2) {
      const h1 = hands[0].landmarks[8];
      const h2 = hands[1].landmarks[8];
      const p1 = new THREE.Vector3((h1.x - 0.5) * -8.5, (h1.y - 0.5) * -5.8, 0);
      const p2 = new THREE.Vector3((h2.x - 0.5) * -8.5, (h2.y - 0.5) * -5.8, 0);

      const steps = 16;
      const ptsCore: THREE.Vector3[] = [];
      const ptsGlow: THREE.Vector3[] = [];

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const mid = new THREE.Vector3().lerpVectors(p1, p2, t);
        const envelope = Math.sin(t * Math.PI) * 0.4;
        
        const jitterX = (Math.random() - 0.5) * envelope;
        const jitterY = (Math.random() - 0.5) * envelope;
        
        ptsCore.push(new THREE.Vector3(mid.x + jitterX * 0.5, mid.y + jitterY * 0.5, mid.z));
        ptsGlow.push(new THREE.Vector3(mid.x + jitterX, mid.y + jitterY, mid.z));
      }

      this.beamLine.geometry.setFromPoints(ptsCore);
      this.beamGlow.geometry.setFromPoints(ptsGlow);

      (this.beamLine.material as THREE.LineBasicMaterial).opacity = 0.95;
      (this.beamGlow.material as THREE.LineBasicMaterial).opacity = 0.65;
    } else {
      (this.beamLine.material as THREE.LineBasicMaterial).opacity = 0;
      (this.beamGlow.material as THREE.LineBasicMaterial).opacity = 0;
    }
  }

  animate() {
    this.renderer.render(this.scene, this.camera);
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  start() {
    if (!this.animFrame) {
      this.animate();
    }
  }

  stop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = 0;
    }
    this.renderer.dispose();
  }
}
