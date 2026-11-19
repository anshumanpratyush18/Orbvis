import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandData, HandLandmark, HAND_CONNECTIONS } from '../types';

type HandTrackerCallback = (hands: HandData[]) => void;

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private animationId = 0;
  private callbacks: HandTrackerCallback[] = [];

  // Exponential Moving Average smoothing state per hand
  private smoothedHands: (HandLandmark[] | null)[] = [null, null];
  private smoothFactor = 0.55; // 0.55 responsiveness vs smoothness

  private lastVideoTime = -1;
  private isRunning = false;

  async initialize(): Promise<void> {
    let vision;
    try {
      vision = await FilesetResolver.forVisionTasks('/wasm');
    } catch {
      vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
    }

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  async startCamera(): Promise<HTMLVideoElement> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      });

      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true;

      await new Promise<void>((resolve, reject) => {
        if (!this.video) return reject(new Error('Video element destroyed'));
        this.video.onloadedmetadata = () => resolve();
        this.video.onerror = () => reject(new Error('Failed to load video stream'));
      });

      await this.video.play();
      return this.video;
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Camera access denied. Please allow camera permissions in your browser.');
        } else if (err.name === 'NotFoundError') {
          throw new Error('No webcam found on this device.');
        } else if (err.name === 'NotReadableError') {
          throw new Error('Camera is already in use by another application.');
        }
      }
      throw err;
    }
  }

  private applySmoothing(raw: HandLandmark[], handIdx: number): HandLandmark[] {
    const prev = this.smoothedHands[handIdx];
    if (!prev || prev.length !== raw.length) {
      this.smoothedHands[handIdx] = raw.map(l => ({ ...l }));
      return raw;
    }

    const alpha = this.smoothFactor;
    const smoothed = raw.map((cur, i) => {
      const p = prev[i];
      return {
        x: p.x + alpha * (cur.x - p.x),
        y: p.y + alpha * (cur.y - p.y),
        z: p.z + alpha * (cur.z - p.z),
      };
    });

    this.smoothedHands[handIdx] = smoothed;
    return smoothed;
  }

  onHands(callback: HandTrackerCallback): void {
    this.callbacks.push(callback);
  }

  start(): void {
    if (!this.handLandmarker || !this.video || this.isRunning) return;
    this.isRunning = true;
    this.detect();
  }

  private detect(): void {
    if (!this.isRunning || !this.video || !this.handLandmarker) return;

    const now = performance.now();
    if (this.video.currentTime !== this.lastVideoTime && this.video.readyState >= 2) {
      this.lastVideoTime = this.video.currentTime;
      const result: HandLandmarkerResult = this.handLandmarker.detectForVideo(this.video, now);

      const hands: HandData[] = result.landmarks.map((rawLm, i) => {
        const raw = rawLm.map(l => ({ x: l.x, y: l.y, z: l.z }));
        const smoothed = this.applySmoothing(raw, i);
        const handedness = (result.handednesses[i]?.[0]?.categoryName ?? (i === 0 ? 'Right' : 'Left')) as 'Left' | 'Right';
        const score = result.handednesses[i]?.[0]?.score ?? 0.9;

        return {
          landmarks: smoothed,
          handedness,
          score,
        };
      });

      if (hands.length === 0) {
        this.smoothedHands = [null, null];
      }

      this.callbacks.forEach(cb => cb(hands));
    }

    this.animationId = requestAnimationFrame(() => this.detect());
  }

  drawSkeleton(ctx: CanvasRenderingContext2D, hands: HandData[], width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    hands.forEach(hand => {
      const isRight = hand.handedness === 'Right';
      const boneColor = isRight ? '#ff1744' : '#00e5ff';
      const jointColor = '#ffffff';

      // Draw bones
      ctx.lineWidth = 2;
      ctx.strokeStyle = boneColor;
      ctx.shadowColor = boneColor;
      ctx.shadowBlur = 8;

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const p1 = hand.landmarks[start];
        const p2 = hand.landmarks[end];
        if (!p1 || !p2) return;

        ctx.beginPath();
        // Mirrored X for webcam overlay
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      });

      // Draw joints
      ctx.shadowBlur = 4;
      hand.landmarks.forEach((lm, idx) => {
        const x = (1 - lm.x) * width;
        const y = lm.y * height;
        const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? boneColor : jointColor;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    if (this.video?.srcObject) {
      (this.video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }

  getVideo(): HTMLVideoElement | null {
    return this.video;
  }
}
