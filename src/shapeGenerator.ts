/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cell, Shape } from '../types';

// Let's define the shape library
export const SHAPES_DATABASE: { [key: string]: number[][] } = {
  // Dots
  'dot_1x1': [[1]],
  
  // Duos
  'duo_h': [[1, 1]],
  'duo_v': [[1], [1]],

  // Trios
  'trio_h': [[1, 1, 1]],
  'trio_v': [[1], [1], [1]],
  'trio_l': [[1, 1], [1, 0]],

  // Quads
  'quad_square': [[1, 1], [1, 1]],
  'quad_line_h': [[1, 1, 1, 1]],
  'quad_line_v': [[1], [1], [1], [1]],
  'quad_l': [[1, 1, 1], [1, 0, 0]],
  'quad_j': [[1, 1, 1], [0, 0, 1]],
  'quad_t': [[1, 1, 1], [0, 1, 0]],
  'quad_z': [[0, 1], [1, 1], [1, 0]],
  'quad_s': [[1, 0], [1, 1], [0, 1]],

  // Giant pieces
  'giant_line_h': [[1, 1, 1, 1, 1]],
  'giant_line_v': [[1], [1], [1], [1], [1]],
  'giant_square_3x3': [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ],
  'giant_corner': [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0]
  ]
};

// Colors of standard shapes to assign randomly pointing to CSS custom properties
export const SHAPE_COLORS = [
  'var(--block-color-1)',
  'var(--block-color-2)',
  'var(--block-color-3)',
  'var(--block-color-4)',
  'var(--block-color-5)',
  'var(--block-color-6)',
  'var(--block-color-7)',
  'var(--block-color-8)'
];

/**
 * Calculates current board density as a decimal between 0 and 1
 */
export function getBoardDensity(board: Cell[][]): number {
  const size = board.length;
  if (size === 0) return 0;
  let filledCells = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].filled) {
        filledCells++;
      }
    }
  }
  return filledCells / (size * size);
}

/**
 * Flood-fill algorithm to analyze isolated blank gaps of size 1 or 2
 */
export function analyzeEmptyGapsOfSize1Or2(board: Cell[][]): { hasSize1Gap: boolean; hasSize2Gap: boolean } {
  const size = board.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  let hasSize1Gap = false;
  let hasSize2Gap = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c].filled && !visited[r][c]) {
        // Run customized flood fill to find island count
        const island: [number, number][] = [];
        const queue: [number, number][] = [[r, c]];
        visited[r][c] = true;

        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          island.push([currR, currC]);

          // Stop counting if island is already too large to optimize
          if (island.length > 3) {
            break;
          }

          // Directions: Up, Down, Left, Right
          const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
          ];

          for (const [dr, dc] of directions) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (!board[nr][nc].filled && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }
        }

        if (island.length === 1) {
          hasSize1Gap = true;
        } else if (island.length === 2) {
          hasSize2Gap = true;
        }
      }
    }
  }

  return { hasSize1Gap, hasSize2Gap };
}

/**
 * Generates a clean random shape based on board status and safety conditions.
 */
export function generateRandomShape(
  board: Cell[][],
  forcedShapeKey?: string,
  excludeSmall?: boolean
): Shape {
  const density = getBoardDensity(board);
  const size = board.length;
  const { hasSize1Gap, hasSize2Gap } = analyzeEmptyGapsOfSize1Or2(board);

  let shapeKey = forcedShapeKey;

  if (!shapeKey) {
    // 1. SOLVER LOGIC: If a gap of 1 or 2 blank cells exists, grant the player a line modifier piece! But respect excludeSmall!
    if (hasSize1Gap && Math.random() < 0.45 && !excludeSmall) {
      shapeKey = 'dot_1x1';
    } else if (hasSize2Gap && Math.random() < 0.40 && !excludeSmall) {
      shapeKey = Math.random() < 0.5 ? 'duo_h' : 'duo_v';
    } 
    // 2. SAFETY NET CHECKPOINT: board density >= 55% enters Rescue Mode (small shapes and short segments only!)
    else if (density >= 0.55) {
      let rescuePool = ['dot_1x1', 'duo_h', 'duo_v', 'trio_h', 'trio_v', 'trio_l'];
      if (excludeSmall) {
        rescuePool = ['trio_h', 'trio_v', 'trio_l'];
      }
      shapeKey = rescuePool[Math.floor(Math.random() * rescuePool.length)];
    } 
    // 3. THREAT PIECES PREFERENTIAL WEIGHT (under 45% filled, baseline 3x3 square and T/L shapes +25%)
    else if (density < 0.45 && Math.random() < 0.25) {
      const threatPool = ['giant_square_3x3', 'trio_l', 'quad_l', 'quad_j', 'quad_t', 'giant_corner'];
      shapeKey = threatPool[Math.floor(Math.random() * threatPool.length)];
    }
    // Otherwise, generate randomly from standard database
    else {
      let keys = Object.keys(SHAPES_DATABASE);
      // Gating Giant 1x5/5x1 segments completely on 6x6 and 8x8 grids
      if (size <= 8) {
        keys = keys.filter(k => k !== 'giant_line_h' && k !== 'giant_line_v');
      }
      if (excludeSmall) {
        keys = keys.filter(k => k !== 'dot_1x1' && k !== 'duo_h' && k !== 'duo_v');
      }

      let chosenKey = keys[Math.floor(Math.random() * keys.length)];

      // Modest spawn probability gating for giant lines on 10x10 and 12x12
      if (size >= 10 && (chosenKey === 'giant_line_v' || chosenKey === 'giant_line_h') && Math.random() > 0.30) {
        const remainingKeys = keys.filter(k => k !== 'giant_line_h' && k !== 'giant_line_v');
        chosenKey = remainingKeys[Math.floor(Math.random() * remainingKeys.length)];
      }

      shapeKey = chosenKey;
    }
  }

  const cells = SHAPES_DATABASE[shapeKey] || [[1]];
  const color = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];

  // Clean name conversion
  const name = shapeKey
    .replace('_', ' ')
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.substring(1))
    .join(' ');

  return {
    id: `shape_${Math.random().toString(36).substring(2, 9)}`,
    cells,
    color,
    name
  };
}

/**
 * Validates if a specific shape can fit onto the board at a given cell.
 */
export function canFitAt(board: Cell[][], shape: Shape, startR: number, startC: number): boolean {
  const boardSize = board.length;
  const shapeRows = shape.cells.length;
  const shapeCols = shape.cells[0].length;

  if (startR + shapeRows > boardSize || startC + shapeCols > boardSize) {
    return false;
  }

  for (let r = 0; r < shapeRows; r++) {
    for (let c = 0; c < shapeCols; c++) {
      if (shape.cells[r][c] === 1) {
        if (board[startR + r][startC + c].filled) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validates if a specific shape can fit ANYWHERE on the board.
 */
export function canFitAnywhere(board: Cell[][], shape: Shape | null): boolean {
  if (!shape) return true; // Empty card fits trivially
  const boardSize = board.length;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (canFitAt(board, shape, r, c)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Backtracking validation to see if all standard non-null items in a shape hand 
 * can fit SIMULTANEOUSLY on the current board in arbitrary placement order.
 */
export function checkConcurrentFit(board: Cell[][], shapes: (Shape | null)[]): boolean {
  // Extract non-null shapes
  const activeShapes = shapes.filter((s): s is Shape => s !== null);
  if (activeShapes.length === 0) return true;

  // Clone current board structure to support simulation
  const size = board.length;
  const simulateBoard = (currBoard: boolean[][], shape: Shape, r: number, c: number): boolean[][] | null => {
    const sRows = shape.cells.length;
    const sCols = shape.cells[0].length;

    if (r + sRows > size || c + sCols > size) return null;

    // Direct simulation overlay
    const nextBoard = currBoard.map(row => [...row]);
    for (let sr = 0; sr < sRows; sr++) {
      for (let sc = 0; sc < sCols; sc++) {
        if (shape.cells[sr][sc] === 1) {
          if (nextBoard[r + sr][c + sc]) {
            return null; // Overlap detected
          }
          nextBoard[r + sr][c + sc] = true;
        }
      }
    }
    return nextBoard;
  };

  // Check recursive solver for placement combinations of active shapes
  const checkPlacements = (currBoard: boolean[][], indicesLeft: number[]): boolean => {
    if (indicesLeft.length === 0) return true;

    // Try placing the first remaining index at any cell
    const shapeIdx = indicesLeft[0];
    const shape = activeShapes[shapeIdx];

    // Optimize search bounds
    const sRows = shape.cells.length;
    const sCols = shape.cells[0].length;

    for (let r = 0; r <= size - sRows; r++) {
      for (let c = 0; c <= size - sCols; c++) {
        const nextBoard = simulateBoard(currBoard, shape, r, c);
        if (nextBoard) {
          // Recurse to see if rest of indices can fit
          if (checkPlacements(nextBoard, indicesLeft.slice(1))) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Prepare standard flat grid state
  const initialGrid: boolean[][] = board.map(row => row.map(cell => cell.filled));

  // We should try all sequence permutations of shapes to guarantee layout ordering
  const permutations: number[][] = [];
  const getPermutations = (arr: number[], memo: number[] = []) => {
    if (arr.length === 0) {
      permutations.push(memo);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        getPermutations(curr.slice(), memo.concat(next));
      }
    }
  };

  const indices = activeShapes.map((_, i) => i);
  getPermutations(indices);

  // Check if any ordering successfully permits placing all active shapes
  for (const perm of permutations) {
    if (checkPlacements(initialGrid, perm)) {
      return true;
    }
  }

  return false;
}

/**
 * Absolute failsafe hand provider.
 * 1) Generates 3 shapes.
 * 2) Evaluates if they can fit concurrently.
 * 3) If not, morphs the largest piece into a 1x1 dot and evaluates again.
 * 4) If still impossible, replaces card slot 0 with a 1x1 dot failsafe piece.
 */
export function generateVerifiedHand(
  board: Cell[][],
  combo?: number,
  movesSinceLastClear?: number
): (Shape | null)[] {
  const density = getBoardDensity(board);
  const isBailout = density >= 0.65 || (combo !== undefined && combo >= 3 && movesSinceLastClear !== undefined && movesSinceLastClear === 2);

  // Generate 3 standard shapes
  let smallBlockCount = 0;
  const hand: (Shape | null)[] = [];

  for (let i = 0; i < 3; i++) {
    const forceExcludeSmall = !isBailout && smallBlockCount >= 1;
    const shape = generateRandomShape(board, undefined, forceExcludeSmall);

    // Count cells of the shape to see if it qualifies as a 1x1 or 1x2 block
    const activeCellCount = shape.cells.flat().filter(c => c === 1).length;
    const rows = shape.cells.length;
    const cols = shape.cells[0].length;
    const isSmall = activeCellCount <= 2 && (rows <= 2 && cols <= 2);

    if (isSmall) {
      smallBlockCount++;
    }

    hand.push(shape);
  }

  // Try verifying concurrent layout safety
  if (checkConcurrentFit(board, hand)) {
    return hand;
  }

  // FAILSAFE STEP 1: Morph the largest shape in hand to a 1x1 dot!
  let largestIdx = 0;
  let maxCellsCount = 0;

  hand.forEach((s, idx) => {
    if (s) {
      const activeCells = s.cells.flat().filter(c => c === 1).length;
      if (activeCells > maxCellsCount) {
        maxCellsCount = activeCells;
        largestIdx = idx;
      }
    }
  });

  // Downgrade that largest piece
  hand[largestIdx] = {
    id: `fail_downgrade_${Math.random().toString(36).substring(2, 9)}`,
    cells: [[1]],
    color: 'var(--block-color-1)', // Adaptable theme-accent blue
    name: '1x1 Pocket Lifeline'
  };

  // Re-verify concurrent safety
  if (checkConcurrentFit(board, hand)) {
    return hand;
  }

  // FAILSAFE STEP 2: Force first slot to be a 1x1 dot unconditionally if still impossible!
  hand[0] = {
    id: `fail_absolute_${Math.random().toString(36).substring(2, 9)}`,
    cells: [[1]],
    color: 'var(--block-color-2)', // Adaptable theme-accent green/emerald
    name: '1x1 Absolute Failsafe'
  };

  return hand;
}

/**
 * Rotates a 2D matrix 90 degrees clockwise (column-mapping matrix inversion sequence)
 */
export function rotateMatrixClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }

  return rotated;
}
