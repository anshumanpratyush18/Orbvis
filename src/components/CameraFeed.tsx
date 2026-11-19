import React, { useEffect, useRef } from 'react';
import { HandData } from '../types';
import { HandTracker } from '../tracking/HandTracker';

interface CameraFeedProps {
  videoSource: HTMLVideoElement | null;
  hands: HandData[];
  tracker: HandTracker | null;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ videoSource, hands, tracker }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && videoSource?.srcObject) {
      videoRef.current.srcObject = videoSource.srcObject;
      videoRef.current.play().catch(() => {});
    }
  }, [videoSource]);

  // Render skeleton overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tracker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    tracker.drawSkeleton(ctx, hands, canvas.width, canvas.height);
  }, [hands, tracker]);

  return (
    <div className="camera-feed-container">
      {/* Reticle Brackets */}
      <div className="reticle-corner top-left" />
      <div className="reticle-corner top-right" />
      <div className="reticle-corner bottom-left" />
      <div className="reticle-corner bottom-right" />

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video-elem"
      />

      {/* Hand Skeleton Overlay Canvas */}
      <canvas
        ref={canvasRef}
        width={240}
        height={135}
        className="camera-skeleton-canvas"
      />

      {/* Header telemetry */}
      <div className="camera-feed-header">
        <div className="live-pill">
          <span className="live-dot" /> LIVE VISION
        </div>
        <div className="camera-hand-badges">
          {hands.map((h, i) => (
            <span
              key={i}
              className={`hand-tag ${h.handedness.toLowerCase()}`}
            >
              {h.handedness === 'Right' ? 'R-HAND' : 'L-HAND'}
            </span>
          ))}
          {hands.length === 0 && <span className="hand-tag none">NO HANDS</span>}
        </div>
      </div>
    </div>
  );
};
