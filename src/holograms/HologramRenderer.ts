import * as THREE from 'three';
import { HandData, GestureResult } from '../types';
import { HolographicHumanFigure } from './HumanModel';
import { hologramVertexShader, hologramFragmentShader } from '../shaders/hologramShaders';
import { sfx } from '../utils/audio';

export class HologramRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrame = 0;

  private modelGroup: THREE.Group;
  private humanFigure: HolographicHumanFigure;
  private hologramMat: THREE.ShaderMaterial;
  private scanLaser: THREE.Mesh;
  private scanLaserY = 0;
  private scanSpeed = 1.6;

  // Interaction targets
  private targetRotY = 0;
  private targetRotX = 0;
  private targetScale = 1.2;
  private currentScale = 1.2;
  private targetPosX = 0;
  private targetPosY = -0.6;
  private glitchTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0, 0.2, 5.0);
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

    this.setupHologramShader();
    this.setupModel();
    this.setupScanLaser();
    this.setupHoloPlatform();
  }

  private setupHologramShader() {
    this.hologramMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.85 },
        uGlitch: { value: 0 },
        uScanY: { value: 0 },
        uColor: { value: new THREE.Color(0x00e5ff) },
      },
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private setupModel() {
    this.modelGroup = new THREE.Group();
    this.humanFigure = new HolographicHumanFigure(this.hologramMat);
    this.modelGroup.add(this.humanFigure.group);

    // Initial position & scale
    this.modelGroup.position.set(0, -0.6, 0);
    this.modelGroup.scale.setScalar(1.2);
    this.scene.add(this.modelGroup);
  }

  private setupScanLaser() {
    // Horizontal glowing laser plane that passes through the hologram
    const geo = new THREE.PlaneGeometry(2.4, 0.04);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.scanLaser = new THREE.Mesh(geo, mat);
    this.scanLaser.position.z = 0.05;
    this.scene.add(this.scanLaser);
  }

  private setupHoloPlatform() {
    // Holographic emitter disc on floor
    const discGroup = new THREE.Group();
    discGroup.position.y = -1.9;

    // Rings
    [0.6, 1.0, 1.4, 1.8].forEach((r, idx) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0x00e5ff : 0x0077c2,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      discGroup.add(new THREE.Line(geo, mat));
    });

    // Hologram grid floor
    const grid = new THREE.GridHelper(5, 16, 0x00e5ff, 0x003366);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).blending = THREE.AdditiveBlending;
    discGroup.add(grid);

    this.scene.add(discGroup);
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[], handDistance: number) {
    if (hands.length === 0) return;

    const g0 = gestures[0]?.gesture ?? 'none';
    const g1 = gestures[1]?.gesture ?? 'none';
    const h0 = hands[0].landmarks[9];

    // Pointing / Open palm: Rotate hologram with hand movement
    if (g0 === 'pointing' || g0 === 'open_palm') {
      this.targetRotY = (h0.x - 0.5) * -Math.PI * 2.5;
      this.targetRotX = (h0.y - 0.5) * 0.8;
    }

    // Pinch: Zoom in / scale up
    if (g0 === 'pinch') {
      this.targetScale = Math.min(2.4, this.targetScale + 0.025);
      sfx.playPinch();
    } else if (g0 === 'closed_fist') {
      // Fist: Zoom out
      this.targetScale = Math.max(0.6, this.targetScale - 0.025);
    }

    // Two hands: Reposition hologram in 3D space
    if (hands.length >= 2) {
      const h1 = hands[1].landmarks[9];
      const midX = (h0.x + h1.x) / 2;
      const midY = (h0.y + h1.y) / 2;

      this.targetPosX = (midX - 0.5) * -4.0;
      this.targetPosY = (midY - 0.5) * -3.0 - 0.6;

      // Distance between hands also scales
      if (g0 !== 'pinch' && g1 !== 'pinch') {
        this.targetScale = 0.6 + handDistance * 1.5;
        this.targetScale = Math.max(0.5, Math.min(2.6, this.targetScale));
      }
    }
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Lerp rotation & position
    this.modelGroup.rotation.y += (this.targetRotY - this.modelGroup.rotation.y) * 0.08;
    this.modelGroup.rotation.x += (this.targetRotX - this.modelGroup.rotation.x) * 0.08;
    this.currentScale += (this.targetScale - this.currentScale) * 0.08;
    this.modelGroup.scale.setScalar(this.currentScale);

    this.modelGroup.position.x += (this.targetPosX - this.modelGroup.position.x) * 0.08;
    this.modelGroup.position.y += (this.targetPosY - this.modelGroup.position.y) * 0.08;

    // Idle subtle rotation when no hands
    this.modelGroup.rotation.y += delta * 0.12;

    // Laser scanning animation up and down the human model
    this.scanLaserY += this.scanSpeed * delta;
    if (this.scanLaserY > 1.8) {
      this.scanSpeed = -Math.abs(this.scanSpeed);
    } else if (this.scanLaserY < -1.4) {
      this.scanSpeed = Math.abs(this.scanSpeed);
    }
    this.scanLaser.position.y = this.scanLaserY;

    // Update hologram shader uniforms
    this.hologramMat.uniforms.uTime.value = time;
    this.hologramMat.uniforms.uScanY.value = this.scanLaserY;

    // Occasional holographic glitch
    this.glitchTimer += delta;
    if (this.glitchTimer > 3.5 + Math.random() * 2) {
      this.hologramMat.uniforms.uGlitch.value = 0.8;
      setTimeout(() => {
        if (this.hologramMat?.uniforms) {
          this.hologramMat.uniforms.uGlitch.value = 0.0;
        }
      }, 120);
      this.glitchTimer = 0;
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
