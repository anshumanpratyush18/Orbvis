import { HandLandmark } from '../types';

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const norm = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + norm * (outMax - outMin);
}

export function dist2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function dist3D(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculatePalmCenter(landmarks: HandLandmark[]): HandLandmark {
  if (landmarks.length < 21) return { x: 0.5, y: 0.5, z: 0 };
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  return {
    x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
    y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
    z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3,
  };
}

export function calculatePalmSize(landmarks: HandLandmark[]): number {
  if (landmarks.length < 21) return 0.2;
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  return dist2D(wrist, middleMcp);
}
