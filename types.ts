/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Cell {
  filled: boolean;
  color: string;
  styleId: string; // The theme style ID used when it was placed
  flash?: boolean;  // Temporary state for the line clearing flash animation
}

export interface Shape {
  id: string;
  cells: number[][]; // Grid representing the shape (e.g., [[1, 1], [0, 1]])
  color: string;     // Color code (hex string)
  name: string;
}

export interface Theme {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  primaryColor: string;
  bgClass: string;
  boardBg: string;
  cellClass: string;
  soundProfile: string;
  description: string;
}

export type BoardSize = 6 | 8 | 10 | 12;

export interface GameState {
  board: Cell[][];
  size: BoardSize;
  score: number;
  highScore: number;
  currency: number;
  combo: number;
  comboMoveTimer: number; // Max 3 moves without clear, then combo breaks
  hand: (Shape | null)[]; // 3 shapes currently in pocket
  selectedShapeIndex: number | null; // For pointer/click placement
  activePowerUp: 'bomb' | null;     // Current power-up targeted mode
  selectedThemeId: string;
}
