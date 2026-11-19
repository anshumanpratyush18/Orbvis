import React from 'react';
import { DrawColor, DRAW_COLORS } from '../types';

interface AirDrawingControlsProps {
  currentColor: DrawColor;
  onSelectColor: (color: DrawColor) => void;
  onClear: () => void;
  onUndo: () => void;
}

export const AirDrawingControls: React.FC<AirDrawingControlsProps> = ({
  currentColor,
  onSelectColor,
  onClear,
  onUndo,
}) => {
  return (
    <div className="drawing-toolbar">
      <div className="toolbar-title">NEON PALETTE</div>

      <div className="color-swatches">
        {DRAW_COLORS.map(c => {
          const isSelected = currentColor === c.id;
          return (
            <button
              key={c.id}
              className={`swatch-btn ${isSelected ? 'selected' : ''}`}
              style={{
                backgroundColor: c.hex,
                boxShadow: isSelected ? `0 0 16px ${c.hex}` : 'none',
              }}
              onClick={() => onSelectColor(c.id)}
              title={c.label}
            />
          );
        })}
      </div>

      <div className="toolbar-actions">
        <button className="tool-btn" onClick={onUndo} title="Undo Last Stroke (or Closed Fist)">
          ↩ UNDO
        </button>
        <button className="tool-btn danger" onClick={onClear} title="Clear Canvas (or Double Peace)">
          🗑 CLEAR
        </button>
      </div>

      <div className="drawing-hints">
        <span>👆 Point: Draw</span>
        <span>✊ Fist: Undo</span>
        <span>✌️✌️ Peace x2: Clear</span>
        <span>👍 Thumb: Color</span>
      </div>
    </div>
  );
};
