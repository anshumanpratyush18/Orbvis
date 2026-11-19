import { EnergyOrb } from '../effects/EnergyOrb';
import { MagicCircle } from '../effects/MagicCircle';
import { ParticleManipulator } from '../effects/ParticleSystem';
import { HologramRenderer } from '../holograms/HologramRenderer';
import { AirDrawing } from '../drawing/AirDrawing';
import { HandData, GestureResult, AppMode, DrawColor } from '../types';
import { sfx } from '../utils/audio';

export class SceneManager {
  private webglCanvas: HTMLCanvasElement;
  private drawingCanvas: HTMLCanvasElement | null = null;
  private currentMode: AppMode | null = null;

  // Visual modules
  private energyOrb: EnergyOrb | null = null;
  private magicCircle: MagicCircle | null = null;
  private particles: ParticleManipulator | null = null;
  private hologram: HologramRenderer | null = null;
  private airDrawing: AirDrawing | null = null;

  constructor(webglCanvas: HTMLCanvasElement, drawingCanvas?: HTMLCanvasElement) {
    this.webglCanvas = webglCanvas;
    this.drawingCanvas = drawingCanvas || null;
  }

  setDrawingCanvas(canvas: HTMLCanvasElement) {
    this.drawingCanvas = canvas;
    if (this.currentMode === 'air_drawing' && !this.airDrawing) {
      this.airDrawing = new AirDrawing(this.drawingCanvas);
      this.airDrawing.start();
    }
  }

  getAirDrawing(): AirDrawing | null {
    return this.airDrawing;
  }

  switchMode(mode: AppMode) {
    if (mode === this.currentMode) return;
    this.destroyCurrent();
    this.currentMode = mode;
    sfx.playModeSwitch();

    switch (mode) {
      case 'energy_orb':
        this.energyOrb = new EnergyOrb(this.webglCanvas);
        this.energyOrb.start();
        break;

      case 'magic_powers':
        this.magicCircle = new MagicCircle(this.webglCanvas);
        this.magicCircle.start();
        break;

      case 'hologram':
        this.hologram = new HologramRenderer(this.webglCanvas);
        this.hologram.start();
        break;

      case 'particles':
        this.particles = new ParticleManipulator(this.webglCanvas);
        this.particles.start();
        break;

      case 'air_drawing':
        // For drawing, we create / initialize the AirDrawing system
        if (this.drawingCanvas) {
          this.airDrawing = new AirDrawing(this.drawingCanvas);
          this.airDrawing.start();
        }
        break;
    }
  }

  private destroyCurrent() {
    this.energyOrb?.stop();
    this.energyOrb = null;

    this.magicCircle?.stop();
    this.magicCircle = null;

    this.particles?.stop();
    this.particles = null;

    this.hologram?.stop();
    this.hologram = null;

    this.airDrawing?.stop();
    this.airDrawing = null;
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[], handDistance: number, handRotation: number) {
    switch (this.currentMode) {
      case 'energy_orb':
        this.energyOrb?.updateFromHands(hands, gestures, handDistance, handRotation);
        break;

      case 'magic_powers':
        this.magicCircle?.updateFromHands(hands, gestures);
        break;

      case 'hologram':
        this.hologram?.updateFromHands(hands, gestures, handDistance);
        break;

      case 'particles':
        this.particles?.updateFromHands(hands, gestures);
        break;

      case 'air_drawing':
        this.airDrawing?.updateFromHands(hands, gestures);
        break;
    }
  }

  setDrawColor(color: DrawColor) {
    this.airDrawing?.setColor(color);
  }

  clearDrawing() {
    this.airDrawing?.clear();
  }

  undoDrawing() {
    this.airDrawing?.undo();
  }

  resize(width: number, height: number) {
    this.energyOrb?.resize(width, height);
    this.magicCircle?.resize(width, height);
    this.particles?.resize(width, height);
    this.hologram?.resize(width, height);
    this.airDrawing?.resize(width, height);
  }

  destroy() {
    this.destroyCurrent();
  }
}
