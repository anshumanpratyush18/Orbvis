import * as THREE from 'three';
import { HandData, GestureResult } from '../types';
import { orbVertexShader, orbFragmentShader } from '../shaders/orbShaders';
import { sfx } from '../utils/audio';

interface OrbConfig {
  radius: number;
  intensity: number;
  rotation: number;
}

export class EnergyOrb {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Visual Groups
  private orbGroup: THREE.Group;
  private coreMesh: THREE.Mesh;
  private coreMat: THREE.ShaderMaterial;
  private innerMesh: THREE.Mesh;
  private rings: THREE.Mesh[] = [];
  private arcs: THREE.Line[] = [];

  // Particles
  private particleSystem: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private particleBaseRadii: Float32Array;
  private NUM_PARTICLES = 4000;

  // Shockwave Ring
  private shockwaveMesh: THREE.Mesh;
  private shockwaveMat: THREE.MeshBasicMaterial;

  // State
  private config: OrbConfig = { radius: 1.4, intensity: 1.2, rotation: 0 };
  private targetRadius = 1.4;
  private targetIntensity = 1.2;
  private exploding = false;
  private explosionProgress = 0;
  private animFrame = 0;
  private arcTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.orbGroup = new THREE.Group();
    this.scene.add(this.orbGroup);

    this.setupCore();
    this.setupRings();
    this.setupParticles();
    this.setupElectricalArcs();
    this.setupShockwave();
    this.setupLights();
  }

  private setupCore() {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.2 },
        uRadius: { value: 1.0 },
        uColorA: { value: new THREE.Color(0xff1744) }, // Red
        uColorB: { value: new THREE.Color(0x00b0ff) }, // Blue
      },
      vertexShader: orbVertexShader,
      fragmentShader: orbFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.coreMesh = new THREE.Mesh(geo, this.coreMat);
    this.orbGroup.add(this.coreMesh);

    // Inner glowing sun
    const innerGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.orbGroup.add(this.innerMesh);
  }

  private setupRings() {
    const ringConfigs = [
      { radius: 1.28, tube: 0.016, color: 0x00e5ff, speed: 0.9, axis: new THREE.Vector3(1, 0.2, 0) },
      { radius: 1.48, tube: 0.014, color: 0xff1744, speed: -1.3, axis: new THREE.Vector3(0, 1, 0.3) },
      { radius: 1.68, tube: 0.012, color: 0xd500f9, speed: 0.7, axis: new THREE.Vector3(0.6, 0.6, 0.4) },
      { radius: 1.88, tube: 0.010, color: 0x00e676, speed: -0.85, axis: new THREE.Vector3(-0.4, 0.8, 0.4) },
    ];

    ringConfigs.forEach(cfg => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 120);
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.userData = { speed: cfg.speed, axis: cfg.axis.normalize() };
      this.orbGroup.add(ring);
      this.rings.push(ring);
    });
  }

  private setupParticles() {
    const geo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.NUM_PARTICLES * 3);
    this.particleVelocities = new Float32Array(this.NUM_PARTICLES * 3);
    this.particleBaseRadii = new Float32Array(this.NUM_PARTICLES);
    const colors = new Float32Array(this.NUM_PARTICLES * 3);

    const cBlue = new THREE.Color(0x00e5ff);
    const cRed = new THREE.Color(0xff1744);
    const cPurple = new THREE.Color(0xd500f9);

    for (let i = 0; i < this.NUM_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.3 + Math.random() * 1.6;
      this.particleBaseRadii[i] = r;

      this.particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      this.particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.particlePositions[i * 3 + 2] = r * Math.cos(phi);

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      const pick = Math.random();
      const col = pick < 0.45 ? cBlue : pick < 0.8 ? cRed : cPurple;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  private setupElectricalArcs() {
    for (let i = 0; i < 4; i++) {
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j < 12; j++) {
        pts.push(new THREE.Vector3());
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x80d8ff : 0xff5252,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      this.orbGroup.add(line);
      this.arcs.push(line);
    }
  }

  private updateElectricalArcs() {
    this.arcTimer++;
    if (this.arcTimer % 2 !== 0) return;

    this.arcs.forEach((arc) => {
      const pts: THREE.Vector3[] = [];
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);
      const theta2 = theta1 + (Math.random() - 0.5) * 1.2;
      const phi2 = phi1 + (Math.random() - 0.5) * 1.2;

      const r = 1.02;
      const start = new THREE.Vector3(r * Math.sin(phi1) * Math.cos(theta1), r * Math.sin(phi1) * Math.sin(theta1), r * Math.cos(phi1));
      const end = new THREE.Vector3(r * Math.sin(phi2) * Math.cos(theta2), r * Math.sin(phi2) * Math.sin(theta2), r * Math.cos(phi2));

      const steps = 10;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cur = new THREE.Vector3().lerpVectors(start, end, t);
        cur.normalize().multiplyScalar(r + Math.sin(t * Math.PI) * 0.15 + (Math.random() - 0.5) * 0.06);
        pts.push(cur);
      }
      arc.geometry.setFromPoints(pts);
    });
  }

  private setupShockwave() {
    const geo = new THREE.RingGeometry(0.1, 0.25, 64);
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shockwaveMesh = new THREE.Mesh(geo, this.shockwaveMat);
    this.scene.add(this.shockwaveMesh);
  }

  private setupLights() {
    const amb = new THREE.AmbientLight(0x051025, 1.5);
    this.scene.add(amb);

    const blueLight = new THREE.PointLight(0x00b0ff, 4, 12);
    blueLight.position.set(2, 2, 3);
    this.scene.add(blueLight);

    const redLight = new THREE.PointLight(0xff1744, 4, 12);
    redLight.position.set(-2, -2, 3);
    this.scene.add(redLight);
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[], handDistance: number, handRotation: number) {
    const gesture0 = gestures[0]?.gesture ?? 'none';
    const gesture1 = gestures[1]?.gesture ?? 'none';

    // Both hands: expand / compress orb
    if (hands.length >= 2) {
      // handDistance is typically between ~0.3 and 1.8
      this.targetRadius = 0.6 + handDistance * 1.6;
      this.targetRadius = Math.max(0.4, Math.min(3.2, this.targetRadius));
    }

    // Pinch: change orb intensity
    if (gesture0 === 'pinch' || gesture1 === 'pinch') {
      this.targetIntensity = Math.min(this.targetIntensity + 0.05, 3.0);
      sfx.playPinch();
    } else {
      this.targetIntensity = Math.max(this.targetIntensity - 0.015, 0.8);
    }

    // Hand rotation: rotate orb
    if (hands.length >= 1) {
      this.config.rotation = handRotation;
    }

    // Double open palm or single open palm with high movement: Energy explosion!
    const isDoubleOpenPalm = gesture0 === 'open_palm' && gesture1 === 'open_palm';
    if ((isDoubleOpenPalm || (gesture0 === 'open_palm' && hands.length === 1)) && !this.exploding) {
      this.triggerExplosion();
    }
  }

  private triggerExplosion() {
    this.exploding = true;
    this.explosionProgress = 0;
    this.shockwaveMesh.scale.set(0.1, 0.1, 0.1);
    this.shockwaveMat.opacity = 0.95;
    sfx.playExplosion();
  }

  private animateParticles(delta: number, time: number) {
    const pos = this.particlePositions;
    const targetR = this.config.radius;

    for (let i = 0; i < this.NUM_PARTICLES; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let x = pos[ix];
      let y = pos[iy];
      let z = pos[iz];
      const dist = Math.sqrt(x * x + y * y + z * z) || 0.001;

      if (this.exploding) {
        // High velocity explosion outward
        const speed = (0.15 + (1 - this.explosionProgress) * 0.25);
        pos[ix] += (x / dist) * speed + this.particleVelocities[ix] * 4;
        pos[iy] += (y / dist) * speed + this.particleVelocities[iy] * 4;
        pos[iz] += (z / dist) * speed + this.particleVelocities[iz] * 4;
      } else {
        // Swirling vortex around the core orb
        const orbitR = targetR * (this.particleBaseRadii[i] / 1.5) + Math.sin(time * 2.0 + i) * 0.1;
        const angle = Math.atan2(y, x) + (0.015 + (i % 5) * 0.005);
        const elev = Math.asin(Math.max(-1, Math.min(1, z / dist)));

        pos[ix] += (orbitR * Math.cos(elev) * Math.cos(angle) - x) * 0.06;
        pos[iy] += (orbitR * Math.cos(elev) * Math.sin(angle) - y) * 0.06;
        pos[iz] += (orbitR * Math.sin(elev) - z) * 0.06;
      }
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Smooth lerping
    this.config.radius += (this.targetRadius - this.config.radius) * 0.1;
    this.config.intensity += (this.targetIntensity - this.config.intensity) * 0.08;

    // Scale orb group
    const s = this.config.radius;
    this.orbGroup.scale.setScalar(s);
    this.orbGroup.rotation.y += delta * 0.4;
    this.orbGroup.rotation.z += (this.config.rotation - this.orbGroup.rotation.z) * 0.05;

    // Update shaders
    this.coreMat.uniforms.uTime.value = time;
    this.coreMat.uniforms.uIntensity.value = this.config.intensity;

    // Animate concentric rings
    this.rings.forEach(ring => {
      ring.rotateOnAxis(ring.userData.axis, ring.userData.speed * delta);
    });

    // Electrical arcs
    this.updateElectricalArcs();

    // Animate particles
    this.animateParticles(delta, time);

    // Shockwave expansion
    if (this.exploding) {
      this.explosionProgress += delta * 1.2;
      const waveScale = this.explosionProgress * 8.0;
      this.shockwaveMesh.scale.set(waveScale, waveScale, waveScale);
      this.shockwaveMat.opacity = Math.max(0, 1.0 - this.explosionProgress);

      if (this.explosionProgress >= 1.0) {
        this.exploding = false;
        this.shockwaveMat.opacity = 0;
      }
    }

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
