import React from 'react';
import { AppMode } from '../types';

interface ModeOption {
  id: AppMode;
  label: string;
  icon: string;
  shortcut: string;
  tagline: string;
}

export const APP_MODES: ModeOption[] = [
  { id: 'energy_orb', label: 'Energy Orb', icon: '⚡', shortcut: '1', tagline: 'Pulsing 3D Plasma' },
  { id: 'magic_powers', label: 'Magic Powers', icon: '🔮', shortcut: '2', tagline: 'Strange & Wanda' },
  { id: 'hologram', label: 'Holographic Human', icon: '👤', shortcut: '3', tagline: '3D Skeleton Wireframe' },
  { id: 'air_drawing', label: 'Air Drawing', icon: '✏️', shortcut: '4', tagline: 'Spatial Neon Canvas' },
  { id: 'particles', label: 'Particle Matrix', icon: '✨', shortcut: '5', tagline: 'Quantum Gravity' },
];

interface ModeSelectorProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  return (
    <nav className="mode-selector-dock" aria-label="System Modes">
      {APP_MODES.map(m => {
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            className={`dock-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectMode(m.id)}
            title={`${m.label} (${m.tagline}) [Key: ${m.shortcut}]`}
          >
            <span className="dock-icon">{m.icon}</span>
            <div className="dock-text">
              <span className="dock-label">{m.label}</span>
              <span className="dock-shortcut">[{m.shortcut}]</span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
