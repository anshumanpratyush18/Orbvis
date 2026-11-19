export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  score: number;
  center?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number };
}

export type GestureType = 
  | 'open_palm'
  | 'closed_fist'
  | 'pinch'
  | 'pointing'
  | 'peace'
  | 'thumbs_up'
  | 'none';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  hand: 'Left' | 'Right';
  pinchDistance?: number;
  rotation?: number;
}

export type AppMode = 
  | 'energy_orb'
  | 'magic_powers'
  | 'hologram'
  | 'air_drawing'
  | 'particles';

export interface TrackingState {
  hands: HandData[];
  gestures: GestureResult[];
  fps: number;
  isTracking: boolean;
  handDistance: number;
  handRotation: number;
}

export type DrawColor = 'cyan' | 'red' | 'purple' | 'green' | 'yellow' | 'white';

export interface ColorOption {
  id: DrawColor;
  label: string;
  hex: string;
}

export const DRAW_COLORS: ColorOption[] = [
  { id: 'cyan', label: 'Neon Blue', hex: '#00e5ff' },
  { id: 'red', label: 'Crimson Red', hex: '#ff1744' },
  { id: 'purple', label: 'Chaos Purple', hex: '#d500f9' },
  { id: 'green', label: 'Plasma Green', hex: '#00e676' },
  { id: 'yellow', label: 'Solar Yellow', hex: '#ffd600' },
  { id: 'white', label: 'Pure Astral', hex: '#ffffff' },
];

export const LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                               // Palm base
];
