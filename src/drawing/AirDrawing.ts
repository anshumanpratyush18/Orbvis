import { HandData, GestureResult, DrawColor, DRAW_COLORS } from '../types';
import { sfx } from '../utils/audio';

interface DrawPoint {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
  alpha: number;
}

export class AirDrawing {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: DrawPoint[][] = [];
  private currentStroke: DrawPoint[] = [];
  private isDrawing = false;
  private currentColor: DrawColor = 'cyan';
  private animFrame = 0;
  private lastTipPos: { x: number; y: number } | null = null;
  private lastGestureTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize(window.innerWidth, window.innerHeight);
  }

  getColorHex(id: DrawColor): string {
    const found = DRAW_COLORS.find(c => c.id === id);
    return found ? found.hex : '#00e5ff';
  }

  setColor(c: DrawColor) {
    this.currentColor = c;
    sfx.playModeSwitch();
  }

  getCurrentColor(): DrawColor {
    return this.currentColor;
  }

  clear() {
    this.strokes = [];
    this.currentStroke = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  undo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  updateFromHands(hands: HandData[], gestures: GestureResult[]) {
    if (hands.length === 0) {
      if (this.currentStroke.length > 0) {
        this.strokes.push([...this.currentStroke]);
        this.currentStroke = [];
      }
      this.isDrawing = false;
      this.lastTipPos = null;
      return;
    }

    const hand = hands[0];
    const g0 = gestures[0]?.gesture ?? 'none';
    const g1 = gestures[1]?.gesture ?? 'none';
    const indexTip = hand.landmarks[8];
    const now = performance.now();

    // Screen coordinates (mirrored webcam X)
    const x = (1.0 - indexTip.x) * this.canvas.width;
    const y = indexTip.y * this.canvas.height;
    this.lastTipPos = { x, y };

    // Gestures:
    // 1. Double Peace Sign: Clear all
    if (g0 === 'peace' && g1 === 'peace') {
      if (now - this.lastGestureTime > 800) {
        this.clear();
        this.lastGestureTime = now;
      }
      return;
    }

    // 2. Closed Fist: Undo last stroke
    if (g0 === 'closed_fist') {
      if (now - this.lastGestureTime > 600) {
        this.undo();
        this.lastGestureTime = now;
      }
      this.endCurrentStroke();
      return;
    }

    // 3. Thumbs Up: Cycle through neon colors
    if (g0 === 'thumbs_up') {
      if (now - this.lastGestureTime > 700) {
        const colors: DrawColor[] = ['cyan', 'red', 'purple', 'green', 'yellow', 'white'];
        const currentIdx = colors.indexOf(this.currentColor);
        this.setColor(colors[(currentIdx + 1) % colors.length]);
        this.lastGestureTime = now;
      }
      this.endCurrentStroke();
      return;
    }

    // 4. Pointing: DRAW!
    if (g0 === 'pointing') {
      const hex = this.getColorHex(this.currentColor);
      // Z distance affects line thickness (closer to camera = thicker)
      const depthSize = Math.max(3, Math.min(14, 6 - indexTip.z * 25));

      if (!this.isDrawing) {
        this.isDrawing = true;
        this.currentStroke = [];
        sfx.playDrawingStroke();
      }

      this.currentStroke.push({
        x,
        y,
        z: indexTip.z,
        color: hex,
        size: depthSize,
        alpha: 1.0,
      });
    } else {
      this.endCurrentStroke();
    }
  }

  private endCurrentStroke() {
    if (this.isDrawing && this.currentStroke.length > 0) {
      this.strokes.push([...this.currentStroke]);
      this.currentStroke = [];
    }
    this.isDrawing = false;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const drawLineStrip = (stroke: DrawPoint[]) => {
      if (stroke.length < 2) return;

      const color = stroke[0].color;
      const size = stroke[0].size;

      // Pass 1: Outer Neon Glow
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const xc = (stroke[i].x + stroke[i - 1].x) / 2;
        const yc = (stroke[i].y + stroke[i - 1].y) / 2;
        this.ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, xc, yc);
      }
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size * 3.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 24;
      this.ctx.globalAlpha = 0.35;
      this.ctx.stroke();
      this.ctx.restore();

      // Pass 2: Main Vibrant Stroke
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const xc = (stroke[i].x + stroke[i - 1].x) / 2;
        const yc = (stroke[i].y + stroke[i - 1].y) / 2;
        this.ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, xc, yc);
      }
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.globalAlpha = 0.95;
      this.ctx.stroke();
      this.ctx.restore();

      // Pass 3: Bright White Core
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const xc = (stroke[i].x + stroke[i - 1].x) / 2;
        const yc = (stroke[i].y + stroke[i - 1].y) / 2;
        this.ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, xc, yc);
      }
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = Math.max(1.5, size * 0.3);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.globalAlpha = 0.9;
      this.ctx.stroke();
      this.ctx.restore();
    };

    // Render all saved strokes
    this.strokes.forEach(drawLineStrip);
    // Render current active stroke
    drawLineStrip(this.currentStroke);

    // Glowing Cursor indicator at index fingertip
    if (this.lastTipPos) {
      const activeColor = this.getColorHex(this.currentColor);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.lastTipPos.x, this.lastTipPos.y, this.isDrawing ? 10 : 6, 0, Math.PI * 2);
      this.ctx.fillStyle = activeColor;
      this.ctx.shadowColor = activeColor;
      this.ctx.shadowBlur = 18;
      this.ctx.globalAlpha = this.isDrawing ? 0.95 : 0.6;
      this.ctx.fill();

      // Crosshairs
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(this.lastTipPos.x, this.lastTipPos.y, 14, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.animFrame = requestAnimationFrame(() => this.render());
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  start() {
    if (!this.animFrame) {
      this.render();
    }
  }

  stop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = 0;
    }
  }
}
