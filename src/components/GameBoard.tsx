/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cell, Shape } from '../types';
import CellBlock from './CellBlock';
import { canFitAt } from '../utils/shapeGenerator';

interface GameBoardProps {
  board: Cell[][];
  selectedThemeId: string;
  selectedSkinId?: string;
  draggedShape: Shape | null;
  activePowerUp: 'bomb' | null;
  hoveredRow: number | null;
  hoveredCol: number | null;
  setHoveredCell: (row: number | null, col: number | null) => void;
  onPlaceShapeAt: (row: number, col: number) => void;
  onBombCells: (row: number, col: number) => void;
  blockHighlightEnabled?: boolean;
}

export default function GameBoard({
  board,
  selectedThemeId,
  selectedSkinId = 'classic',
  draggedShape,
  activePowerUp,
  hoveredRow,
  hoveredCol,
  setHoveredCell,
  onPlaceShapeAt,
  onBombCells,
  blockHighlightEnabled = true
}: GameBoardProps) {
  const size = board.length;
  const activeSkin = selectedSkinId;

  // Compute what cell indexes are targeted for dragging shapes or bomb power-ups
  const getCellState = (r: number, c: number) => {
    const isUnderHover = hoveredRow !== null && hoveredCol !== null;

    // 1. If Bomb power-up is active
    if (activePowerUp === 'bomb' && isUnderHover) {
      const dr = Math.abs(r - hoveredRow!);
      const dc = Math.abs(c - hoveredCol!);
      if (dr <= 1 && dc <= 1) {
        return { isBombTarget: true }; // Highlights in custom target indicator zone
      }
    }

    // 2. If a shape is currently dragged over the board
    if (blockHighlightEnabled && draggedShape && isUnderHover) {
      const shapeRows = draggedShape.cells.length;
      const shapeCols = draggedShape.cells[0].length;

      // Let's check if (r, c) falls within the shape's bounds relative to the current hover anchor
      const relativeR = r - hoveredRow!;
      const relativeC = c - hoveredCol!;

      if (relativeR >= 0 && relativeR < shapeRows && relativeC >= 0 && relativeC < shapeCols) {
        if (draggedShape.cells[relativeR][relativeC] === 1) {
          // Check if this specific shape is placable on the grid
          const isValidPlacement = canFitAt(board, draggedShape, hoveredRow!, hoveredCol!);
          if (isValidPlacement) {
            return { isGhostPreview: true, color: draggedShape.color };
          } else {
            return { isInvalidPreview: true }; // Red warning highlight
          }
        }
      }
    }

    return null;
  };

  const handleCellClick = (r: number, c: number) => {
    if (activePowerUp === 'bomb') {
      onBombCells(r, c);
    } else if (draggedShape) {
      const isValid = canFitAt(board, draggedShape, r, c);
      if (isValid) {
        onPlaceShapeAt(r, c);
      }
    }
  };

  return (
    <div 
      id="game-board-container"
      className="w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl bg-[var(--theme-bg-solid)] p-2 sm:p-3 border border-[var(--theme-border)] shadow-2xl transition-all"
    >
      <div 
        id="game-board-grid"
        className="grid gap-1 select-none pointer-events-auto"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          touchAction: 'none' // Prevent screen drag scroll on mobile canvas
        }}
        onMouseLeave={() => setHoveredCell(null, null)}
      >
        {board.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            const cellPreview = getCellState(r, c);
            const isFilled = cell.filled;

            let cellIsSingle = false;
            let cellIsEndCap = false;
            let cellEndCapDir: 'up' | 'down' | 'left' | 'right' | undefined;

            if (isFilled && (activeSkin === 'neko' || activeSkin === 'glass')) {
              let neighbors = 0;
              let neighborDir = '';
              if (r > 0 && board[r - 1][c]?.filled) { neighbors++; neighborDir = 'up'; }
              if (r < size - 1 && board[r + 1][c]?.filled) { neighbors++; neighborDir = 'down'; }
              if (c > 0 && board[r][c - 1]?.filled) { neighbors++; neighborDir = 'left'; }
              if (c < size - 1 && board[r][c + 1]?.filled) { neighbors++; neighborDir = 'right'; }

              if (neighbors === 0) {
                cellIsSingle = true;
              } else if (neighbors === 1) {
                cellIsEndCap = true;
                if (neighborDir === 'up') cellEndCapDir = 'down';
                if (neighborDir === 'down') cellEndCapDir = 'up';
                if (neighborDir === 'left') cellEndCapDir = 'right';
                if (neighborDir === 'right') cellEndCapDir = 'left';
              }
            }

            let previewIsSingle = false;
            let previewIsEndCap = false;
            let previewEndCapDir: 'up' | 'down' | 'left' | 'right' | undefined;

            if (cellPreview?.isGhostPreview && (activeSkin === 'neko' || activeSkin === 'glass') && draggedShape) {
              const relR = r - hoveredRow!;
              const relC = c - hoveredCol!;
              
              let filledCountInShape = 0;
              for (let sr = 0; sr < draggedShape.cells.length; sr++) {
                for (let sc = 0; sc < draggedShape.cells[0].length; sc++) {
                  if (draggedShape.cells[sr][sc] === 1) filledCountInShape++;
                }
              }

              if (filledCountInShape === 1) {
                previewIsSingle = true;
              } else {
                let neighborsShape = 0;
                let ghostNeighborDir = '';
                if (relR > 0 && draggedShape.cells[relR - 1]?.[relC] === 1) { neighborsShape++; ghostNeighborDir = 'up'; }
                if (relR < draggedShape.cells.length - 1 && draggedShape.cells[relR + 1]?.[relC] === 1) { neighborsShape++; ghostNeighborDir = 'down'; }
                if (relC > 0 && draggedShape.cells[relR]?.[relC - 1] === 1) { neighborsShape++; ghostNeighborDir = 'left'; }
                if (relC < draggedShape.cells[0].length - 1 && draggedShape.cells[relR]?.[relC + 1] === 1) { neighborsShape++; ghostNeighborDir = 'right'; }

                if (neighborsShape === 1) {
                  previewIsEndCap = true;
                  if (ghostNeighborDir === 'up') previewEndCapDir = 'down';
                  if (ghostNeighborDir === 'down') previewEndCapDir = 'up';
                  if (ghostNeighborDir === 'left') previewEndCapDir = 'right';
                  if (ghostNeighborDir === 'right') previewEndCapDir = 'left';
                }
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                id={`cell-${r}-${c}`}
                data-cell-r={r}
                data-cell-c={c}
                className="relative aspect-square cursor-pointer transition-transform duration-100 hover:scale-[1.03]"
                onMouseEnter={() => setHoveredCell(r, c)}
                // Also support touch moves
                onTouchStart={(e) => {
                  setHoveredCell(r, c);
                }}
                onClick={() => handleCellClick(r, c)}
              >
                {cellPreview?.isBombTarget ? (
                  <div 
                    className="w-full h-full bg-red-500/20 border-2 border-red-500 rounded-md animate-pulse flex items-center justify-center relative"
                    style={{ 
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.45)',
                      borderColor: '#ef4444'
                    }}
                  >
                    <div className="absolute inset-1 border border-red-400/30 rounded-xs pointer-events-none" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                ) : cellPreview?.isInvalidPreview ? (
                  <CellBlock 
                    filled={false} 
                    styleId={activeSkin} 
                    invalid={true} 
                  />
                ) : cellPreview?.isGhostPreview ? (
                  <CellBlock 
                    filled={true} 
                    color={cellPreview.color} 
                    styleId={activeSkin} 
                    ghost={true} 
                    isSingle={previewIsSingle}
                    isEndCap={previewIsEndCap}
                    endCapDir={previewEndCapDir}
                  />
                ) : isFilled ? (
                  <CellBlock 
                    filled={true} 
                    color={cell.color} 
                    styleId={activeSkin} 
                    flash={cell.flash} 
                    isSingle={cellIsSingle}
                    isEndCap={cellIsEndCap}
                    endCapDir={cellEndCapDir}
                  />
                ) : (
                  <CellBlock 
                    filled={false} 
                    isEmptySlot={true} 
                    styleId={activeSkin} 
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
