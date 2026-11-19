import React from 'react';
import { TrackingState, AppMode } from '../types';
import { sfx } from '../utils/audio';

interface HUDProps {
  tracking: TrackingState;
  mode: AppMode;
  onScreenshot: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleHelp: () => void;
  showHelp: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  tracking,
  mode,
  onScreenshot,
  isMuted,
  onToggleMute,
  onToggleHelp,
  showHelp,
}) => {
  const g0 = tracking.gestures[0]?.gesture ?? 'none';
  const g1 = tracking.gestures[1]?.gesture ?? 'none';
  const isHealthyFps = tracking.fps >= 30;
  const isWarningFps = tracking.fps >= 18 && tracking.fps < 30;

  return (
    <header className="hud-panel">
      {/* Top Header */}
      <div className="hud-header">
        <div className="hud-brand">
          <div className="hud-logo-icon">▲</div>
          <div>
            <div className="hud-title">VISION<span className="accent-red">X</span></div>
            <div className="hud-subtitle">HOLOGRAPHIC GESTURE SYSTEM v2.0</div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="hud-actions">
          <button
            className={`hud-icon-btn ${showHelp ? 'active' : ''}`}
            onClick={onToggleHelp}
            title="Toggle Gesture Guide"
          >
            {showHelp ? '✕ CLOSE GUIDE' : '❓ GESTURE GUIDE'}
          </button>
          <button
            className="hud-icon-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇 MUTED' : '🔊 SFX ON'}
          </button>
          <button
            className="hud-icon-btn primary"
            onClick={onScreenshot}
            title="Capture Screenshot"
          >
            📸 CAPTURE
          </button>
        </div>
      </div>

      <div className="hud-divider" />

      {/* Telemetry Stats Bar */}
      <div className="hud-metrics">
        <div className="metric-box">
          <span className="metric-label">FPS ENGINE</span>
          <span
            className="metric-value"
            style={{
              color: isHealthyFps ? '#00e676' : isWarningFps ? '#ffd600' : '#ff1744',
            }}
          >
            {tracking.fps || '--'}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label">AI TRACKING</span>
          <div className="status-indicator">
            <span
              className={`status-dot ${tracking.isTracking ? 'online' : 'searching'}`}
            />
            <span className="metric-value">
              {tracking.isTracking ? `LOCKED [${tracking.hands.length}/2]` : 'SEARCHING'}
            </span>
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-label">HAND DISTANCE</span>
          <span className="metric-value">
            {tracking.hands.length >= 2 ? `${tracking.handDistance.toFixed(2)}m` : '--'}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label">PRIMARY GESTURE</span>
          <span className="metric-value accent-cyan">
            {g0.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {tracking.hands.length >= 2 && (
          <div className="metric-box">
            <span className="metric-label">SECONDARY GESTURE</span>
            <span className="metric-value accent-purple">
              {g1.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}

        <div className="metric-box">
          <span className="metric-label">ACTIVE MODULE</span>
          <span className="metric-value accent-amber">
            {mode.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
};
