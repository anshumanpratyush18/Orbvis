import React from 'react';
import { AppMode } from '../types';

interface GestureGuideProps {
  mode: AppMode;
  onClose: () => void;
}

export const GestureGuide: React.FC<GestureGuideProps> = ({ mode, onClose }) => {
  const getGuideContent = () => {
    switch (mode) {
      case 'energy_orb':
        return [
          { gesture: '👐 Hands Apart', effect: 'Expand energy orb diameter' },
          { gesture: '🤲 Hands Closer', effect: 'Compress energy orb' },
          { gesture: '👌 Pinch', effect: 'Increase plasma core intensity' },
          { gesture: '🔄 Rotate Hand', effect: 'Spin orb rings along axis' },
          { gesture: '🖐️🖐️ Open Palms', effect: 'Trigger massive plasma shockwave explosion' },
        ];
      case 'magic_powers':
        return [
          { gesture: '🖐️ Open Palm', effect: 'Summon Doctor Strange rotating mandala shield' },
          { gesture: '✊ Closed Fist', effect: 'Charge & detonate Wanda chaos magic burst' },
          { gesture: '👆 Pointing', effect: 'Cast mystic spark stream from fingertip' },
          { gesture: '🙌 Two Hands', effect: 'Connect hands with high-voltage crimson lightning' },
        ];
      case 'hologram':
        return [
          { gesture: '👆 Pointing / Palm', effect: 'Rotate 3D human skeleton in real-time' },
          { gesture: '👌 Pinch In', effect: 'Zoom in / scale anatomical model' },
          { gesture: '✊ Fist', effect: 'Zoom out' },
          { gesture: '👐 Two Hands', effect: 'Reposition model in 3D coordinate space' },
        ];
      case 'air_drawing':
        return [
          { gesture: '👆 Index Pointing', effect: 'Draw neon spatial glowing trails' },
          { gesture: '✊ Closed Fist', effect: 'Undo previous brush stroke' },
          { gesture: '✌️✌️ Double Peace', effect: 'Clear entire drawing canvas' },
          { gesture: '👍 Thumbs Up', effect: 'Cycle through 6 neon colors' },
          { gesture: '👐 Double Palm', effect: 'Capture PNG screenshot' },
        ];
      case 'particles':
        return [
          { gesture: '✊ Closed Fist', effect: 'Black-hole gravitational attraction' },
          { gesture: '🖐️ Open Palm', effect: 'Shockwave pulse (repel 5,000 particles)' },
          { gesture: '👌 Pinch', effect: 'Orbital particle vortex ring' },
          { gesture: '🙌 Two Hands', effect: 'High-voltage electric bridge beam' },
        ];
    }
  };

  const rows = getGuideContent();

  return (
    <div className="gesture-guide-modal" onClick={onClose}>
      <div className="gesture-guide-card" onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">
            <span>NEURAL INTERFACE</span> // GESTURE CONTROLS
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="card-subtitle">
          ACTIVE MODULE: <span className="accent-cyan">{mode.replace('_', ' ').toUpperCase()}</span>
        </div>

        <div className="gesture-table">
          {rows.map((r, i) => (
            <div key={i} className="gesture-row">
              <div className="gesture-col-icon">{r.gesture}</div>
              <div className="gesture-col-desc">{r.effect}</div>
            </div>
          ))}
        </div>

        <div className="card-footer">
          <span>TIPS: KEEP HANDS FULLY IN WEBCAM VIEW • OPTIMAL DISTANCE 0.5m – 1.5m</span>
        </div>
      </div>
    </div>
  );
};
