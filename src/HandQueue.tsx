/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shape } from '../types';
import CellBlock from './CellBlock';

interface HandQueueProps {
  hand: (Shape | null)[];
  selectedShapeIndex: number | null;
  selectedThemeId: string;
  selectedSkinId?: string;
  blockNamesEnabled?: boolean;
  onSelectShape: (index: number) => void;
  // Pointer drag hooks passed down to support pointer drag handling from components
  onStartDrag: (event: React.PointerEvent, shape: Shape, index: number) => void;
}

export default function HandQueue({
  hand,
  selectedShapeIndex,
  selectedThemeId,
  selectedSkinId = 'classic',
  blockNamesEnabled = false,
  onSelectShape,
  onStartDrag
}: HandQueueProps) {
  
  // Renders a scaled-down grid representing the shape
  const renderShapePreview = (shape: Shape) => {
    const rows = shape.cells.length;
    const cols = shape.cells[0].length;
    const activeSkin = selectedSkinId;

    return (
      <div 
        className="grid gap-0.5 justify-center items-center p-3 transition-transform"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: '120px',
          maxHeight: '120px'
        }}
      >
        {shape.cells.map((rowArr, r) =>
          rowArr.map((val, c) => {
            if (val === 1) {
              let isSingle = false;
              let isEndCap = false;
              let endCapDir: 'up' | 'down' | 'left' | 'right' | undefined;
              if (activeSkin === 'neko' || activeSkin === 'glass') {
                let filledCount = 0;
                for (let sr = 0; sr < shape.cells.length; sr++) {
                  for (let sc = 0; sc < shape.cells[0].length; sc++) {
                    if (shape.cells[sr][sc] === 1) filledCount++;
                  }
                }
                if (filledCount === 1) {
                  isSingle = true;
                } else {
                  let shapeNeighbors = 0;
                  let neighborDir = '';
                  if (r > 0 && shape.cells[r - 1]?.[c] === 1) { shapeNeighbors++; neighborDir = 'up'; }
                  if (r < shape.cells.length - 1 && shape.cells[r + 1]?.[c] === 1) { shapeNeighbors++; neighborDir = 'down'; }
                  if (c > 0 && shape.cells[r]?.[c - 1] === 1) { shapeNeighbors++; neighborDir = 'left'; }
                  if (c < shape.cells[0].length - 1 && shape.cells[r]?.[c + 1] === 1) { shapeNeighbors++; neighborDir = 'right'; }

                  if (shapeNeighbors === 1) {
                    isEndCap = true;
                    if (neighborDir === 'up') endCapDir = 'down';
                    if (neighborDir === 'down') endCapDir = 'up';
                    if (neighborDir === 'left') endCapDir = 'right';
                    if (neighborDir === 'right') endCapDir = 'left';
                  }
                }
              }

              return (
                <div key={`${r}-${c}`} className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <CellBlock 
                    filled={true} 
                    color={shape.color} 
                    styleId={activeSkin} 
                    isSingle={isSingle}
                    isEndCap={isEndCap}
                    endCapDir={endCapDir}
                  />
                </div>
              );
            } else {
              return (
                <div key={`${r}-${c}`} className="w-5 h-5 sm:w-6 sm:h-6 opacity-0" />
              );
            }
          })
        )}
      </div>
    );
  };

  return (
    <div 
      id="hand-queue-wrapper"
      className="w-full max-w-[420px] mx-auto grid grid-cols-3 gap-3 sm:gap-4 select-none mt-2 px-1"
    >
      {hand.map((shape, idx) => {
        if (!shape) {
          return (
            <div 
              key={`empty-${idx}`}
              className="aspect-square rounded-2xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-panel)] flex items-center justify-center text-[var(--theme-text-muted)] text-xs font-mono font-medium"
            >
              Placed
            </div>
          );
        }

        const isSelected = selectedShapeIndex === idx;

        return (
          <div
            key={shape.id}
            id={`hand-card-${idx}`}
            className={`cursor-grab active:cursor-grabbing relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all bg-[var(--theme-bg-solid)] border ${
              isSelected 
                ? 'scale-[1.03] shadow-lg shadow-[var(--theme-primary)]/5' 
                : 'hover:bg-[var(--theme-bg-panel)]'
            }`}
            style={{ 
              touchAction: 'none', 
              borderColor: isSelected ? 'var(--theme-accent-border)' : 'var(--theme-border)',
              boxShadow: isSelected ? '0 0 0 2px color-mix(in srgb, var(--theme-primary) 35%, transparent)' : undefined
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectShape(idx);
            }}
            // Standard pointer events representing custom mouse coordinate dragging
            onPointerDown={(e) => {
              onStartDrag(e, shape, idx);
            }}
          >
            {/* Pocket slot numbers for editorial elegance */}
            <span className="absolute top-2 left-3 font-mono text-[9px] text-neutral-500 font-bold select-none leading-none">
              SLOT 0{idx + 1}
            </span>

            {/* Shape core block matrix */}
            <div className="transform scale-90 sm:scale-100 flex items-center justify-center">
              {renderShapePreview(shape)}
            </div>

            {/* Small shape helper tags */}
            {blockNamesEnabled && (
              <span className="absolute bottom-2 font-sans font-medium text-[9px] text-neutral-450 leading-none truncate max-w-[90%] text-center">
                {shape.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
