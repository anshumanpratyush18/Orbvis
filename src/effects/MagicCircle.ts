import * as THREE from 'three';
import { HandData, GestureResult } from '../types';
import { EnergyShield } from './EnergyShield';
import { RedEnergyVortex } from './RedEnergy';
import { LightningEffect } from './Lightning';
import { sfx } from '../utils/audio';

export class MagicCircle {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrame = 0;

  // Shields for each hand (Doctor Strange)
  private shields: EnergyShield[] = [];
  // Red chaos energy vortexes (Wanda)
  private redEnergies: RedEnergyVortex[] = [];
  // Lightning between hands
  private lightning: LightningEffect;

  // Portal background effect
  private portalGroup: THREE.Group;
  private portalRings: THREE.Line[] = [];

  private lastGesture0 = 'none';

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.z = 5.2;
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

    // Setup 2 shields for 2 hands
    for (let i = 0; i < 2; i++) {
      const shield = new EnergyShield();
      this.shields.push(shield);
      this.scene.add(shield.group);

      const redVortex = new RedEnergyVortex(this.scene);
      this.redEnergies.push(redVortex);
    }

    this.lightning = new LightningEffect(this.scene, 0xff1744);
    this.setupPortal();
  }

  private setupPortal() {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(0, 0, -1);

    // Deep portal outer ring
    for (let r = 1.8; r <= 2.4; r += 0.3) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xff6d00,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      this.portalGroup.add(line);
      this.portalRings.push(line);
    }
    this.scene.add(this.portalGroup);
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[]) {
    // If no hands detected, hide active hand attachments
    if (hands.length === 0) {
      this.shields.forEach(s => s.setActive(false));
      this.lightning.clear();
      return;
    }

    const handPositions: THREE.Vector3[] = [];

    hands.forEach((hand, i) => {
      if (i >= this.shields.length) return;
      const palm = hand.landmarks[9];
      const indexTip = hand.landmarks[8];

      // Convert webcam normalized coords (0..1) to 3D world space
      // Webcam x is mirrored: (1 - palm.x) or (palm.x - 0.5) * -7
      const worldX = (palm.x - 0.5) * -7.5;
      const worldY = (palm.y - 0.5) * -5.0;
      const worldZ = 0;

      const handPos = new THREE.Vector3(worldX, worldY, worldZ);
      handPositions.push(handPos);

      // Position shield & red chaos energy
      this.shields[i].group.position.copy(handPos);
      this.redEnergies[i].setTarget(worldX, worldY, worldZ);

      const gesture = gestures[i]?.gesture ?? 'none';

      // Open palm / Peace / Pointing activates Doctor Strange magical shield
      const shouldActivateShield = gesture === 'open_palm' || gesture === 'peace' || gesture === 'pointing';
      this.shields[i].setActive(shouldActivateShield);

      // Closed fist charges energy burst
      if (gesture === 'closed_fist' && this.lastGesture0 !== 'closed_fist') {
        this.redEnergies[i].triggerBurst();
        sfx.playLightning();
      }

      // Fingertip spark trail if pointing
      if (gesture === 'pointing') {
        const tipX = (indexTip.x - 0.5) * -7.5;
        const tipY = (indexTip.y - 0.5) * -5.0;
        this.redEnergies[i].setTarget(tipX, tipY, worldZ);
      }
    });

    if (gestures[0]) {
      this.lastGesture0 = gestures[0].gesture;
    }

    // Connect hands with Wanda red lightning arcs if two hands are detected
    if (hands.length >= 2 && handPositions.length >= 2) {
      this.lightning.updateArcs(handPositions[0], handPositions[1], 4);
      if (Math.random() < 0.25) {
        sfx.playLightning();
      }
    } else {
      this.lightning.clear();
    }
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update shields
    this.shields.forEach(s => s.update(delta));

    // Update red chaos energy
    this.redEnergies.forEach(re => re.update(delta));

    // Spin portal rings
    this.portalRings.forEach((ring, idx) => {
      ring.rotation.z += (idx % 2 === 0 ? 0.3 : -0.4) * delta;
    });

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
    this.shields.forEach(s => s.dispose());
    this.redEnergies.forEach(re => re.dispose());
    this.lightning.dispose();
    this.renderer.dispose();
  }
}
