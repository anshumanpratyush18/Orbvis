import { useEffect, useRef, useState, useCallback } from 'react';
import { HandTracker } from './tracking/HandTracker';
import { GestureRecognizer } from './tracking/GestureRecognition';
import { SceneManager } from './scenes/SceneManager';
import { HUD } from './components/HUD';
import { CameraFeed } from './components/CameraFeed';
import { ModeSelector } from './components/ModeSelector';
import { AirDrawingControls } from './components/AirDrawingControls';
import { GestureGuide } from './components/GestureGuide';
import { TrackingState, AppMode, HandData, GestureResult, DrawColor } from './types';
import { sfx } from './utils/audio';
import { captureVisionScreenshot } from './utils/screenshot';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<AppMode>('energy_orb');
  const [tracking, setTracking] = useState<TrackingState>({
    hands: [],
    gestures: [],
    fps: 0,
    isTracking: false,
    handDistance: 0,
    handRotation: 0,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [drawColor, setDrawColor] = useState<DrawColor>('cyan');

  // DOM Refs
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Engine Refs
  const trackerRef = useRef<HandTracker | null>(null);
  const recognizerRef = useRef<GestureRecognizer>(new GestureRecognizer());
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const videoSourceRef = useRef<HTMLVideoElement | null>(null);

  // FPS tracking
  const fpsDataRef = useRef({ frames: 0, lastTime: performance.now(), currentFps: 0 });
  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;

  const calculateFPS = useCallback(() => {
    fpsDataRef.current.frames++;
    const now = performance.now();
    const elapsed = now - fpsDataRef.current.lastTime;
    if (elapsed >= 500) {
      fpsDataRef.current.currentFps = Math.round((fpsDataRef.current.frames * 1000) / elapsed);
      fpsDataRef.current.frames = 0;
      fpsDataRef.current.lastTime = now;
    }
    return fpsDataRef.current.currentFps;
  }, []);

  // Initialize SceneManager
  useEffect(() => {
    if (webglCanvasRef.current && !sceneManagerRef.current) {
      const sm = new SceneManager(
        webglCanvasRef.current,
        drawingCanvasRef.current || undefined
      );
      sceneManagerRef.current = sm;
      sm.switchMode('energy_orb');
    }

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (webglCanvasRef.current) {
        webglCanvasRef.current.width = w;
        webglCanvasRef.current.height = h;
      }
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.width = w;
        drawingCanvasRef.current.height = h;
      }
      sceneManagerRef.current?.resize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneManagerRef.current?.destroy();
      sceneManagerRef.current = null;
    };
  }, []);

  // Mode Switch effect
  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    sceneManagerRef.current?.switchMode(newMode);
  }, []);

  // Initialize MediaPipe and Webcam
  useEffect(() => {
    const tracker = new HandTracker();
    trackerRef.current = tracker;

    (async () => {
      try {
        await tracker.initialize();
        const video = await tracker.startCamera();
        videoSourceRef.current = video;

        // Connect drawing canvas to scene manager
        if (drawingCanvasRef.current && sceneManagerRef.current) {
          sceneManagerRef.current.setDrawingCanvas(drawingCanvasRef.current);
        }

        tracker.onHands((hands: HandData[]) => {
          const gestures: GestureResult[] = recognizerRef.current.recognizeAll(hands);
          const handDistance = recognizerRef.current.getHandDistance(hands);
          const handRotation = hands[0] ? recognizerRef.current.getHandRotation(hands[0]) : 0;
          const fps = calculateFPS();

          // Feed into Three.js SceneManager
          sceneManagerRef.current?.updateFromHands(hands, gestures, handDistance, handRotation);

          setTracking({
            hands,
            gestures,
            fps,
            isTracking: hands.length > 0,
            handDistance,
            handRotation,
          });
        });

        tracker.start();
        setIsInitializing(false);
      } catch (err) {
        console.error('VisionX Tracker initialization error:', err);
        setCameraError(err instanceof Error ? err.message : 'Failed to initialize camera or AI vision');
        setIsInitializing(false);
      }
    })();

    return () => {
      tracker.stop();
    };
  }, [calculateFPS]);

  // Keyboard Shortcuts (1..5, m, h, c)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1':
          handleModeChange('energy_orb');
          break;
        case '2':
          handleModeChange('magic_powers');
          break;
        case '3':
          handleModeChange('hologram');
          break;
        case '4':
          handleModeChange('air_drawing');
          break;
        case '5':
          handleModeChange('particles');
          break;
        case 'm':
        case 'M':
          setIsMuted(sfx.toggleMute());
          break;
        case 'h':
        case 'H':
          setShowGuide(prev => !prev);
          break;
        case 'c':
        case 'C':
          handleScreenshot();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleModeChange]);

  const handleScreenshot = async () => {
    sfx.playPinch();
    await captureVisionScreenshot(
      [webglCanvasRef.current, drawingCanvasRef.current],
      `visionx-${mode}`
    );
  };

  const handleColorSelect = (c: DrawColor) => {
    setDrawColor(c);
    sceneManagerRef.current?.setDrawColor(c);
  };

  const handleClearDrawing = () => {
    sceneManagerRef.current?.clearDrawing();
  };

  const handleUndoDrawing = () => {
    sceneManagerRef.current?.undoDrawing();
  };

  const handleToggleMute = () => {
    const nextMuted = sfx.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="visionx-container">
      {/* Background Matrix Grid */}
      <div className="cyber-grid" />
      <div className="cyber-vignette" />

      {/* Main 3D WebGL Canvas */}
      <canvas ref={webglCanvasRef} className="webgl-canvas" />

      {/* 2D Air Drawing Layer */}
      <canvas
        ref={drawingCanvasRef}
        className={`air-drawing-canvas ${mode === 'air_drawing' ? 'active' : ''}`}
      />

      {/* Futuristic HUD Bar */}
      <HUD
        tracking={tracking}
        mode={mode}
        onScreenshot={handleScreenshot}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleHelp={() => setShowGuide(prev => !prev)}
        showHelp={showGuide}
      />

      {/* Live Webcam Feed with Skeletal Overlay */}
      <CameraFeed
        videoSource={videoSourceRef.current}
        hands={tracking.hands}
        tracker={trackerRef.current}
      />

      {/* Air Drawing Controls (Visible in air_drawing mode) */}
      {mode === 'air_drawing' && (
        <AirDrawingControls
          currentColor={drawColor}
          onSelectColor={handleColorSelect}
          onClear={handleClearDrawing}
          onUndo={handleUndoDrawing}
        />
      )}

      {/* Bottom Mode Selector Dock */}
      <ModeSelector
        currentMode={mode}
        onSelectMode={handleModeChange}
      />

      {/* Gesture Guide Modal */}
      {showGuide && (
        <GestureGuide
          mode={mode}
          onClose={() => setShowGuide(false)}
        />
      )}

      {/* Splash / Initialization Overlay */}
      {isInitializing && (
        <div className="system-overlay">
          <div className="splash-card">
            <div className="splash-logo">VISION<span className="accent-red">X</span></div>
            <div className="splash-subtitle">INITIALIZING HOLOGRAPHIC REALITY SYSTEM</div>
            <div className="cyber-loader">
              <div className="cyber-loader-bar" />
            </div>
            <p className="splash-status">Loading MediaPipe Tasks Vision & Neural Hand Landmarkers...</p>
          </div>
        </div>
      )}

      {/* Camera / Permission Error Overlay */}
      {cameraError && (
        <div className="system-overlay error">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>INITIALIZATION FAILURE</h2>
            <p className="error-msg">{cameraError}</p>
            <div className="error-guidance">
              • Ensure your laptop webcam is not blocked or in use by another app.<br />
              • Check browser permissions (click camera icon in address bar to allow).<br />
              • Running locally on <code>localhost</code> or HTTPS is required for webcam access.
            </div>
            <button className="cyber-retry-btn" onClick={() => window.location.reload()}>
              ↻ REINITIALIZE SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
