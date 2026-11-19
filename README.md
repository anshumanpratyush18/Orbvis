# VISIONX // AI-Powered Gesture-Controlled Holographic Reality System

VisionX is a real-time, hand gesture-controlled 3D holographic application built with **React, TypeScript, Three.js, WebGL, custom GLSL shaders**, and **MediaPipe Tasks Vision**.

It transforms any normal laptop webcam into an interactive spatial computing and holographic interface — combining the visual aesthetics of Iron Man HUDs, Doctor Strange mystic arts, and Wanda Maximoff chaos magic.

---

## ⚡ Tech Stack & Architecture

- **Frontend & Runtime:** React 19, TypeScript, Vite
- **Computer Vision:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) HandLandmarker with GPU delegate and 21 3D joint tracking
- **3D Graphics & Shaders:** Three.js, WebGL, custom GLSL shaders (Fresnel rim lighting, energy pulses, holographic scanlines, chromatic glitch)
- **Audio Synthesis:** Zero-dependency procedural Web Audio API sci-fi synthesizer
- **Design:** Dark cyberpunk aesthetic (`#000000`, neon red `#ff1744`, electric blue `#00e5ff`, chaos purple `#d500f9`, plasma green `#00e676`)

### Clean Modular Directory Layout

```
visionx/
├── public/
│   └── wasm/                       # Bundled offline MediaPipe vision WebAssembly files
├── src/
│   ├── components/
│   │   ├── HUD.tsx                 # Real-time telemetry, FPS, gestures, audio, screenshot controls
│   │   ├── CameraFeed.tsx          # Mirrored live video with overlaid hand skeleton canvas
│   │   ├── ModeSelector.tsx        # Bottom dock mode switcher with keyboard shortcuts
│   │   ├── AirDrawingControls.tsx  # Floating neon color palette, undo, and clear controls
│   │   └── GestureGuide.tsx        # Interactive contextual modal cheatsheet for gestures
│   ├── tracking/
│   │   ├── HandTracker.ts          # MediaPipe HandLandmarker wrapper with EMA smoothing & canvas skeleton
│   │   └── GestureRecognition.ts   # Scale-invariant 3D gesture classifier (pinch, fist, palm, etc.)
│   ├── effects/
│   │   ├── EnergyOrb.ts            # Interactive 3D plasma energy orb with rings & shockwaves
│   │   ├── MagicCircle.ts          # Mystic Arts & Wanda magic manager
│   │   ├── EnergyShield.ts         # Doctor Strange sacred geometry mandala shields
│   │   ├── RedEnergy.ts            # Wanda chaos energy swirling particle vortex
│   │   ├── Lightning.ts            # Dynamic electrical arcs & hand-connecting lightning bolts
│   │   └── ParticleSystem.ts       # 5,000+ particle matrix with fluid gravity & repulsion
│   ├── holograms/
│   │   ├── HumanModel.ts           # 3D anatomical human skeleton with joints & wireframe
│   │   └── HologramRenderer.ts     # Holographic scene, laser scan plane & spatial controls
│   ├── drawing/
│   │   └── AirDrawing.ts           # 3D spatial index-finger neon drawing canvas
│   ├── scenes/
│   │   └── SceneManager.ts         # High-level engine coordinator managing all 5 visual modes
│   ├── shaders/
│   │   ├── orbShaders.ts           # Noise-displaced plasma sphere GLSL shader
│   │   ├── hologramShaders.ts      # Scanline, rim lighting, & digital glitch GLSL shader
│   │   └── magicShaders.ts         # Multi-arm mandala & sacred geometry GLSL shader
│   ├── utils/
│   │   ├── audio.ts                # Web Audio API synthesizer for futuristic sound effects
│   │   ├── math.ts                 # Vector math, smoothing, distance & palm size helpers
│   │   └── screenshot.ts           # Multi-canvas composite PNG screenshot exporter
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces, types, landmark indices & constants
│   ├── App.tsx                     # Master reactive application container
│   ├── App.css                     # Cinematic dark cyberpunk stylesheet
│   └── main.tsx                    # React application entrypoint
```

---

## 🎮 5 Core Modules & Gesture Interactions

### 1. Energy Orb (`[Key 1]`)
An interactive 3D energy sphere with pulsing core shaders, 4 rotating concentric rings, animated electric surface arcs, and orbiting particle halos.
- **Both Hands Apart:** Expands the orb diameter smoothly.
- **Both Hands Closer:** Compresses the orb down.
- **Pinch (Thumb + Index):** Amplifies plasma core intensity and brightness.
- **Rotate Hand:** Rotates the orb along your wrist-tilt angle.
- **Open Palms:** Detonates a high-velocity particle explosion and radial shockwave!

### 2. Magic Powers (`[Key 2]`)
Doctor Strange & Wanda Maximoff spell-casting simulation.
- **Open Palm:** Summons dual-layer rotating orange/amber sacred geometry mandala shields on your hands.
- **Closed Fist:** Charges and detonates Wanda's crimson chaos magic burst.
- **Pointing Finger:** Shoots a fiery mystic spark trail from your fingertip.
- **Two Hands Tracked:** Spawns high-voltage jagged red lightning arcs bridging both hands!

### 3. Holographic Human (`[Key 3]`)
A full 3D human anatomical skeleton wireframe hologram with blue laser scanning animation, glowing joint nodes, and an emitter platform.
- **Pointing / Open Palm:** Rotates the 3D hologram in real-time following your hand movement.
- **Pinch In:** Zooms into the anatomical model.
- **Closed Fist:** Zooms out.
- **Two Hands:** Repositions and translates the hologram anywhere in 3D coordinate space.

### 4. Air Drawing (`[Key 4]`)
Spatial neon drawing in mid-air using your index finger.
- **Index Finger Pointing:** Pen Down — draws glowing neon trails with smooth quadratic Bezier curve interpolation.
- **Closed Fist:** Undo the last brush stroke.
- **Double Peace Signs (`✌️ ✌️`):** Clear the entire canvas.
- **Thumbs Up (`👍`):** Cycle through 6 neon colors (*Neon Blue, Crimson Red, Chaos Purple, Plasma Green, Solar Yellow, Pure Astral*).
- **Double Open Palm:** Capture high-resolution PNG screenshot with watermark.

### 5. Particle Manipulation (`[Key 5]`)
A quantum fluid matrix of 5,000+ interactive particles with dynamic inertia and drag.
- **Closed Fist:** Generates black-hole gravitational attraction pulling particles inward into a swirling vortex.
- **Open Palm:** Triggers repulsion shockwaves that scatter particles away like ripples in water.
- **Pinch:** Creates a high-speed orbital particle vortex ring around your pinch point.
- **Two Hands:** Ignites a high-voltage electrical energy bridge beam between both hands.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `1` | Switch to **Energy Orb** mode |
| `2` | Switch to **Magic Powers** mode |
| `3` | Switch to **Holographic Human** mode |
| `4` | Switch to **Air Drawing** mode |
| `5` | Switch to **Particle Matrix** mode |
| `M` | Toggle procedural sci-fi audio effects (Mute/Unmute) |
| `H` | Toggle interactive **Gesture Guide** cheatsheet |
| `C` | Capture high-resolution composite screenshot |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A standard laptop or desktop with a normal webcam (no special depth sensors required)

### Setup & Run
```bash
# Navigate to project directory
cd visionx

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173/`. Grant webcam permission when prompted, position your hands in front of the camera, and experience holographic spatial computing!

### Production Build
```bash
npm run build
npm run preview
```
