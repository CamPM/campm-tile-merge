import { Injectable, signal, computed } from '@angular/core';
import { SoundService, SoundPackId } from './sound.service';

export interface Cell {
  filled: boolean;
  color?: string;
  id?: number;
}

export interface Shape {
  id: number;
  matrix: number[][];
  color: string;
  area: number; // Added for backfill calculations
}

export interface ColorTheme {
  id: string;
  name:string;
  colors: string[];
  bgStyle: string;
  isDark: boolean;
  cost: number;
}

export interface BlockSkin {
  id: string;
  name: string;
  cellStyle: string;
  cost: number;
}

export interface GridOption {
  size: GridSize;
  name: string;
  cost: number;
}

export interface SoundPack {
  id: SoundPackId;
  name: string;
  description: string;
  cost: number;
}

export type GridSize = 6 | 8 | 10 | 12;

interface BoardState {
  density: number;
  combo: number;
  lineGaps: { rows: Map<number, number>, cols: Map<number, number> };
  totalEmpty: number;
  emptyCells: {r: number, c: number}[];
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // --- Game State ---
  gridSize = signal<GridSize>(8);
  board = signal<Cell[][]>([]);
  score = signal(0);
  highScore = signal(0);
  currency = signal(100);
  gameOver = signal(false);
  
  // --- Scoring & Combo ---
  comboMultiplier = signal(1);
  movesSinceLastClear = signal(0);

  // --- Preview & Drag ---
  previewCells = signal<Map<string, string>>(new Map());
  invalidPreviewCells = signal<Map<string, string>>(new Map());
  availableShapes = signal<Shape[]>([]);
  
  draggedShape = signal<Shape | null>(null);
  draggedShapeOriginId = signal<number | null>(null);
  
  // --- Power Ups ---
  bombMode = signal(false);
  
  // --- Animation Triggers ---
  clearedLines = signal<{indices: number[], type: 'row' | 'col'}[]>([]);
  themeCycleTrigger = signal(false);
  potentialClearLines = signal<{ rows: number[], cols: number[] }>({ rows: [], cols: [] });

  // --- Store Data ---
  gridOptions: GridOption[] = [
    { size: 6, name: '6x6 Small', cost: 250 },
    { size: 8, name: '8x8 Classic', cost: 0 },
    { size: 10, name: '10x10 Large', cost: 1000 },
    { size: 12, name: '12x12 Expert', cost: 2000 },
  ];

  soundPacks: SoundPack[] = [
    { id: 'classic', name: 'Classic Chill', description: 'Relaxing lo-fi beats & soft thuds.', cost: 0 },
    { id: 'wood', name: 'Woodblock', description: 'Organic, snappy wooden textures.', cost: 750 },
    { id: 'bubble', name: 'Bubble Pop', description: 'Fun, soapy popping sounds.', cost: 750 },
    { id: 'glass', name: 'Crystal Glass', description: 'Elegant, high-pitched chimes.', cost: 750 },
    { id: 'mech', name: 'Mechanical', description: 'Clicky, tactile switch sounds.', cost: 750 },
    { id: 'nature', name: 'Nature', description: 'Water drops and organic rustles.', cost: 750 },
    { id: 'retro', name: '8-Bit Retro', description: 'Old school arcade bleeps.', cost: 750 },
    { id: 'scifi', name: 'Sci-Fi', description: 'Futuristic zaps and lasers.', cost: 750 },
  ];

  blockSkins: BlockSkin[] = [
    { id: 'classic', name: 'Classic', cellStyle: 'rounded-md border border-white/20 shadow-sm', cost: 0 },
    { id: 'tetris', name: 'Tetris', cellStyle: 'rounded-none border-t-4 border-l-4 border-white/40 border-b-4 border-r-4 border-black/20', cost: 1500 },
    { id: 'toy', name: 'Toy Bricks', cellStyle: 'rounded-[2px] shadow-md border-b-2 border-black/10', cost: 1500 },
    { id: 'iron', name: 'Iron Block', cellStyle: 'rounded-none', cost: 2500 }, // Style handled in board component for complexity
  ];

  themes: ColorTheme[] = [
    // Updated default 1: White BG, Darker Grey & Sky Blue bricks for better visibility
    { id: 'clean', name: 'Clean White', colors: ['#64748b', '#0ea5e9', '#475569', '#0284c7'], bgStyle: 'bg-white text-slate-800', isDark: false, cost: 0 },
    // Updated default 2: Sky Blue BG, Darker Grey & Green bricks
    { id: 'ocean', name: 'Ocean Breeze', colors: ['#64748b', '#22c55e', '#475569', '#16a34a'], bgStyle: 'bg-sky-100 text-slate-900', isDark: false, cost: 0 },
    { id: 'dark', name: 'Dark Mode', colors: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'], bgStyle: 'bg-slate-900 text-white', isDark: true, cost: 500 },
    { id: 'forest', name: 'Forest', colors: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981'], bgStyle: 'bg-emerald-900 text-emerald-50', isDark: true, cost: 1000 },
    { id: 'sunset', name: 'Sunset', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c'], bgStyle: 'bg-orange-950 text-orange-50', isDark: true, cost: 1500 },
    { id: 'lavender', name: 'Lavender', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea'], bgStyle: 'bg-purple-50 text-purple-900', isDark: false, cost: 2000 },
    { id: 'candy', name: 'Candy', colors: ['#f9a8d4', '#f472b6', '#ec4899', '#db2777'], bgStyle: 'bg-pink-50 text-pink-900', isDark: false, cost: 2500 },
    { id: 'mint', name: 'Mint', colors: ['#6ee7b7', '#34d399', '#10b981', '#059669'], bgStyle: 'bg-teal-50 text-teal-900', isDark: false, cost: 3000 },
    { id: 'royal', name: 'Royal', colors: ['#fde047', '#facc15', '#eab308', '#ca8a04'], bgStyle: 'bg-indigo-950 text-yellow-50', isDark: true, cost: 3500 },
    { id: 'charcoal', name: 'Charcoal', colors: ['#71717a', '#52525b', '#3f3f46', '#27272a'], bgStyle: 'bg-zinc-900 text-zinc-100', isDark: true, cost: 4000 },
    { id: 'matrix', name: 'Matrix', colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d'], bgStyle: 'bg-black text-green-500 font-mono', isDark: true, cost: 5000 },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#22d3ee', '#e879f9', '#f472b6', '#818cf8'], bgStyle: 'bg-slate-950 text-cyan-400', isDark: true, cost: 6000 },
    { id: 'coffee', name: 'Coffee', colors: ['#d6d3d1', '#a8a29e', '#78716c', '#57534e'], bgStyle: 'bg-stone-900 text-stone-200', isDark: true, cost: 7500 },
    { id: 'vampire', name: 'Vampire', colors: ['#f87171', '#ef4444', '#dc2626', '#b91c1c'], bgStyle: 'bg-neutral-950 text-red-500', isDark: true, cost: 8000 },
    { id: 'ice', name: 'Ice', colors: ['#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee'], bgStyle: 'bg-sky-50 text-sky-900', isDark: false, cost: 9000 },
    { id: 'mono', name: 'Monochrome', colors: ['#000000', '#111111', '#222222', '#333333'], bgStyle: 'bg-white text-black', isDark: false, cost: 10000 },
  ];

  // --- Active Selections ---
  currentThemeId = signal('clean');
  currentSkinId = signal('classic');
  currentSoundPackId = signal<SoundPackId>('classic');
  
  // Computed objects
  currentTheme = computed(() => this.themes.find(t => t.id === this.currentThemeId()) || this.themes[0]);
  currentSkin = computed(() => this.blockSkins.find(s => s.id === this.currentSkinId()) || this.blockSkins[0]);

  // --- Ownership ---
  ownedThemes = signal<string[]>(['clean', 'ocean']);
  ownedSkins = signal<string[]>(['classic']);
  ownedGrids = signal<number[]>([8]);
  ownedSoundPacks = signal<string[]>(['classic']);

  constructor(private sound: SoundService) {
    this.loadState();
    this.initBoard();
    this.refillShapes();
    this.sound.setPack(this.currentSoundPackId());
  }

  private loadState() {
    const savedBest = localStorage.getItem('blockBlastBest');
    if (savedBest) this.highScore.set(parseInt(savedBest, 10));
    const savedCurrency = localStorage.getItem('blockBlastCurrency');
    if (savedCurrency) this.currency.set(parseInt(savedCurrency, 10));
    const savedThemes = localStorage.getItem('blockBlastOwnedThemes');
    if (savedThemes) this.ownedThemes.set(JSON.parse(savedThemes));
    const savedSkins = localStorage.getItem('blockBlastOwnedSkins');
    if (savedSkins) this.ownedSkins.set(JSON.parse(savedSkins));
    const savedGrids = localStorage.getItem('blockBlastOwnedGrids');
    if (savedGrids) this.ownedGrids.set(JSON.parse(savedGrids));
    const savedSounds = localStorage.getItem('blockBlastOwnedSounds');
    if (savedSounds) this.ownedSoundPacks.set(JSON.parse(savedSounds));
    const savedThemeId = localStorage.getItem('blockBlastThemeId');
    if (savedThemeId && this.ownedThemes().includes(savedThemeId)) this.currentThemeId.set(savedThemeId);
    const savedSkinId = localStorage.getItem('blockBlastSkinId');
    if (savedSkinId && this.ownedSkins().includes(savedSkinId)) this.currentSkinId.set(savedSkinId);
    const savedSoundId = localStorage.getItem('blockBlastSoundId');
    if (savedSoundId && this.ownedSoundPacks().includes(savedSoundId)) this.currentSoundPackId.set(savedSoundId as SoundPackId);
    const savedGrid = localStorage.getItem('blockBlastGridSize');
    if (savedGrid) {
      const size = parseInt(savedGrid, 10);
      if (this.ownedGrids().includes(size)) this.gridSize.set(size as GridSize);
    }
  }

  initBoard() {
    const size = this.gridSize();
    const newBoard = Array(size).fill(null).map(() => Array(size).fill({ filled: false }));
    this.board.set(newBoard);
  }

  setGridSize(size: GridSize) {
    if (!this.ownedGrids().includes(size)) return;
    this.gridSize.set(size);
    localStorage.setItem('blockBlastGridSize', size.toString());
    this.resetGame();
  }
  
  resetGame() {
    this.initBoard();
    this.score.set(0);
    this.comboMultiplier.set(1);
    this.movesSinceLastClear.set(0);
    this.gameOver.set(false);
    this.bombMode.set(false);
    this.clearedLines.set([]);
    this.themeCycleTrigger.set(false);
    this.clearPreview();
    this.refillShapes();
  }

  // --- "Generous-Fit" Shape Generation ---
  private POOL_TINY_FILLERS = [[[1]]];
  private POOL_SMALL_FILLERS = [[[1, 1]], [[1], [1]]];
  private POOL_LINEAR_3 = [[[1,1,1]], [[1],[1],[1]]];
  private POOL_MULTI_LINE = [[[1, 1, 1], [0, 1, 0]], [[0, 1, 0], [1, 1, 1]], [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]], [[1, 1], [1, 0]], [[1, 1], [0, 1]]];
  private POOL_LARGE_BLOCKS = [[[1, 1], [1, 1]], [[1, 1, 1], [1, 1, 1]], [[1,1,1],[1,1,1],[1,1,1]]];
  private POOL_AWKWARD = [[[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
  private POOL_STANDARD = [...this.POOL_SMALL_FILLERS, ...this.POOL_LINEAR_3, ...this.POOL_MULTI_LINE, ...this.POOL_LARGE_BLOCKS, ...this.POOL_AWKWARD];

  private getShapeArea = (matrix: number[][]): number => matrix.reduce((s, r) => s + r.reduce((c, v) => c + v, 0), 0);

  refillShapes() {
    const theme = this.currentTheme();
    const matrices = this.generateShapeSet();
    let candidates = matrices.map(m => this.createShape(m, theme));

    // Multi-Grid Validation: Check if all 3 pieces can be placed.
    if (!this.areAllShapesPlaceable(candidates, this.board())) {
        // If not, re-roll the largest piece into a 1x1.
        let largestShapeIndex = -1;
        let maxArea = 0;
        candidates.forEach((shape, index) => {
            if (shape.area > maxArea) {
                maxArea = shape.area;
                largestShapeIndex = index;
            }
        });
        
        if (largestShapeIndex !== -1) {
            candidates[largestShapeIndex] = this.createShape([[1]], theme);
        }
    }

    // Final failsafe to prevent game over from a bad roll.
    if(this.countPlaceable(candidates, this.board()) === 0) {
        candidates[0] = this.createShape([[1]], theme);
    }
    
    this.availableShapes.set(candidates);
  }

  private generateShapeSet(): number[][][] {
    const state = this.analyzeBoard();
    const matrices: number[][][] = [];

    // "Solver" Logic: Always guarantee one "Key" piece.
    const keyPiece = this.findKeyPiece(state, 2); // Find gaps of 1 or 2
    if (keyPiece) {
        matrices.push(keyPiece);
    }

    // The 55% "Safety Net" Logic
    if (state.density >= 0.55) {
        // --- Phase 2: "The Rescue" (>= 55% Full) ---
        const survivalPool = [
            ...this.POOL_TINY_FILLERS,
            ...this.POOL_SMALL_FILLERS,
            ...this.POOL_LINEAR_3
        ];
        // Ensure 2 out of 3 pieces are small/linear
        while (matrices.length < 2) {
            matrices.push(this.getRandomFrom(survivalPool));
        }
        // The third piece can be from a slightly wider pool for variety
        if (matrices.length < 3) {
            matrices.push(this.getRandomFrom([...survivalPool, ...this.POOL_MULTI_LINE]));
        }

    } else {
        // --- Phase 1: "Expansion" (< 55% Full) ---
        const buildPool = [
            ...this.POOL_MULTI_LINE,      // L-blocks
            [[1, 1], [1, 1]],            // 2x2
            ...this.POOL_LINEAR_3,        // 3x1
            ...this.POOL_LARGE_BLOCKS
        ];
        // Fill the rest of the hand with builder pieces
        while (matrices.length < 3) {
            matrices.push(this.getRandomFrom(buildPool));
        }
    }
    
    // Fallback if no key piece was found.
    while (matrices.length < 3) {
        matrices.push(this.getRandomFrom(this.POOL_STANDARD));
    }

    return matrices.slice(0, 3);
  }
  
  private findKeyPiece(state: BoardState, maxGapSize: number): number[][] | null {
    const targetGaps: number[] = [];
    state.lineGaps.rows.forEach(gapSize => {
      if (gapSize > 0 && gapSize <= maxGapSize) targetGaps.push(gapSize);
    });
    state.lineGaps.cols.forEach(gapSize => {
      if (gapSize > 0 && gapSize <= maxGapSize) targetGaps.push(gapSize);
    });

    if (targetGaps.length === 0) return null;

    // Prioritize filling the smallest available gaps
    const smallestGap = Math.min(...targetGaps);

    switch (smallestGap) {
      case 1: return [[1]];
      case 2: return this.getRandomFrom(this.POOL_SMALL_FILLERS);
      default: return null;
    }
  }

  private analyzeBoard(): BoardState {
    const board = this.board();
    const size = this.gridSize();
    const emptyCells: { r: number, c: number }[] = [];
    const lineGaps = { rows: new Map<number, number>(), cols: new Map<number, number>() };

    for(let i = 0; i < size; i++) {
        let rowEmpty = 0;
        let colEmpty = 0;
        for(let j = 0; j < size; j++) {
            if (!board[i][j].filled) rowEmpty++;
            if (!board[j][i].filled) colEmpty++;
            if (!board[i][j].filled) emptyCells.push({r: i, c: j});
        }
        if (rowEmpty > 0) lineGaps.rows.set(i, rowEmpty);
        if (colEmpty > 0) lineGaps.cols.set(i, colEmpty);
    }
    
    const totalFilled = (size * size) - emptyCells.length;
    return {
      density: totalFilled / (size * size),
      combo: this.comboMultiplier(),
      lineGaps,
      totalEmpty: emptyCells.length,
      emptyCells
    };
  }
  
  private findWinningPiece(emptyCells: {r: number, c: number}[]): number[][] | null {
    if (emptyCells.length === 0) return null;
    const minR = Math.min(...emptyCells.map(c => c.r));
    const maxR = Math.max(...emptyCells.map(c => c.r));
    const minC = Math.min(...emptyCells.map(c => c.c));
    const maxC = Math.max(...emptyCells.map(c => c.c));

    const height = maxR - minR + 1;
    const width = maxC - minC + 1;

    if (height > 5 || width > 5) return null;

    const matrix: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
    let cellCount = 0;
    for(const cell of emptyCells) {
      matrix[cell.r - minR][cell.c - minC] = 1;
      cellCount++;
    }
    
    if (this.getShapeArea(matrix) === cellCount) {
        return matrix;
    }
    return null;
  }

  private areAllShapesPlaceable(shapes: Shape[], board: Cell[][]): boolean {
    return shapes.every(shape => {
        for (let r = 0; r < this.gridSize(); r++) {
            for (let c = 0; c < this.gridSize(); c++) {
                if (this.canPlaceOnBoard(board, shape.matrix, r, c, this.gridSize())) {
                    return true; // Found a spot for this shape, check next shape
                }
            }
        }
        return false; // No spot found for this shape
    });
  }

  private countPlaceable(shapes: Shape[], board: Cell[][]): number {
    return shapes.filter(shape => {
        for (let r = 0; r < this.gridSize(); r++) {
            for (let c = 0; c < this.gridSize(); c++) {
                if (this.canPlaceOnBoard(board, shape.matrix, r, c, this.gridSize())) {
                    return true;
                }
            }
        }
        return false;
    }).length;
  }

  private createShape(matrix: number[][], theme: ColorTheme): Shape {
    return {
      id: Math.random(),
      matrix: matrix,
      color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
      area: this.getShapeArea(matrix)
    };
  }

  private getRandomFrom = (pool: number[][][]): number[][] => pool[Math.floor(Math.random() * pool.length)];
  
  private canPlaceOnBoard(board: Cell[][], matrix: number[][], row: number, col: number, size: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[0].length; c++) {
        if (matrix[r][c] === 1) {
          const targetR = row + r, targetC = col + c;
          if (targetR < 0 || targetR >= size || targetC < 0 || targetC >= size || board[targetR][targetC].filled) return false;
        }
      }
    }
    return true;
  }

  private simulatePlace(board: Cell[][], matrix: number[][], row: number, col: number): Cell[][] {
    const newBoard = board.map(r => r.map(c => ({...c})));
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[0].length; c++) {
        if (matrix[r][c] === 1) { newBoard[row + r][col + c].filled = true; }
      }
    }
    return newBoard;
  }

  canPlace = (shape: number[][], row: number, col: number): boolean => this.canPlaceOnBoard(this.board(), shape, row, col, this.gridSize());
  
  updatePreview(shape: Shape, row: number, col: number) {
    const newPreview = new Map<string, string>();
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) newPreview.set(`${row + r},${col + c}`, shape.color);
      }
    }
    this.previewCells.set(newPreview);
    this.invalidPreviewCells.set(new Map()); // Clear invalid preview
    this.checkPotentialClears(shape, row, col);
  }
  
  updateInvalidPreview(shape: Shape, row: number, col: number) {
    const newInvalidPreview = new Map<string, string>();
    const invalidColor = '#ef4444'; // Red-500 from Tailwind

    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          const targetR = row + r;
          const targetC = col + c;
          if (targetR >= 0 && targetR < this.gridSize() && targetC >= 0 && targetC < this.gridSize()) {
              newInvalidPreview.set(`${targetR},${targetC}`, invalidColor);
          }
        }
      }
    }
    this.invalidPreviewCells.set(newInvalidPreview);
    this.previewCells.set(new Map()); // Clear valid preview
    this.potentialClearLines.set({ rows: [], cols: [] }); // Clear potential clears
  }

  private checkPotentialClears(shape: Shape, row: number, col: number) {
    const simBoard = this.simulatePlace(this.board(), shape.matrix, row, col);
    const size = this.gridSize();
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];
    for (let r = 0; r < size; r++) if (simBoard[r].every(cell => cell.filled)) rowsToClear.push(r);
    for (let c = 0; c < size; c++) if (simBoard.every(row => row[c].filled)) colsToClear.push(c);
    this.potentialClearLines.set({ rows: rowsToClear, cols: colsToClear });
  }

  clearPreview() {
    this.previewCells.set(new Map());
    this.invalidPreviewCells.set(new Map());
    this.potentialClearLines.set({ rows: [], cols: [] });
  }

  placeShape(shape: Shape, row: number, col: number) {
    const currentBoard = this.board().map(row => [...row]); 
    let placementPoints = 0;
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          currentBoard[row + r][col + c] = { filled: true, color: shape.color, id: Math.random() };
          placementPoints++;
        }
      }
    }

    this.board.set(currentBoard);
    this.sound.playDrop();
    const hand = this.availableShapes().filter(s => s.id !== shape.id);
    this.availableShapes.set(hand);
    this.clearPreview(); 
    
    const linesWereCleared = this.checkLines(placementPoints);
    if (!linesWereCleared) {
      if (hand.length === 0) {
        setTimeout(() => this.refillShapes(), 100);
      } else {
        this.checkGameOver(hand);
      }
    }
  }

  private checkLines(placementPoints: number): boolean {
    const board = this.board();
    const size = this.gridSize();
    const rowsToClear: number[] = [], colsToClear: number[] = [];

    for (let r = 0; r < size; r++) if (board[r].every(cell => cell.filled)) rowsToClear.push(r);
    for (let c = 0; c < size; c++) if (board.every(row => row[c].filled)) colsToClear.push(c);
    
    const totalLines = rowsToClear.length + colsToClear.length;
    
    if (totalLines > 0) {
      this.comboMultiplier.update(m => m + 1);
      this.movesSinceLastClear.set(0);
    } else {
      this.movesSinceLastClear.update(m => m + 1);
      if (this.movesSinceLastClear() >= 3) {
        this.comboMultiplier.set(1);
      }
    }
    
    let linePoints = 0;
    if (totalLines > 0) {
      this.sound.playClear(totalLines);
      linePoints = totalLines * 10 + (totalLines >= 2 ? totalLines * 10 : 0);
      
      this.clearedLines.set([{indices: rowsToClear, type: 'row'}, {indices: colsToClear, type: 'col'}]);
      setTimeout(() => {
        const nextBoard = this.board().map(r => r.map(c => ({...c})));
        rowsToClear.forEach(r => { for(let c=0; c<size; c++) nextBoard[r][c] = { filled: false }; });
        colsToClear.forEach(c => { for(let r=0; r<size; r++) nextBoard[r][c] = { filled: false }; });
        
        // BOARD CLEAR LOGIC: Check if the board is now empty after the clear.
        const wasNotEmpty = this.board().flat().some(cell => cell.filled);
        const isNowEmpty = nextBoard.flat().every(cell => !cell.filled);

        if (wasNotEmpty && isNowEmpty) {
          this.triggerThemeCycle();
        }

        this.board.set(nextBoard);
        this.clearedLines.set([]);
        const hand = this.availableShapes();
        if (hand.length === 0) this.refillShapes();
        else this.checkGameOver(hand);
      }, 350);
    }
    
    const totalMoveScore = (placementPoints + linePoints) * this.comboMultiplier();
    this.addScore(totalMoveScore);
    if (totalMoveScore > 0) this.addCurrency(Math.floor(totalMoveScore * 0.2));
    return totalLines > 0;
  }

  checkGameOver(currentHand: Shape[]) {
    if (currentHand.length === 0) return;
    if (this.countPlaceable(currentHand, this.board()) === 0) {
      this.sound.playError();
      this.gameOver.set(true);
    }
  }

  addScore(points: number) {
    this.score.update(s => {
      const newScore = s + points;
      if (newScore > this.highScore()) {
        this.highScore.set(newScore);
        localStorage.setItem('blockBlastBest', newScore.toString());
      }
      return newScore;
    });
  }

  addCurrency(amount: number) {
    this.currency.update(c => {
      const newVal = c + amount;
      localStorage.setItem('blockBlastCurrency', newVal.toString());
      return newVal;
    });
  }

  triggerThemeCycle() {
    this.themeCycleTrigger.set(true);
    setTimeout(() => this.themeCycleTrigger.set(false), 2000);
    const bonusScore = 500;
    this.addScore(bonusScore);
    this.addCurrency(Math.floor(bonusScore * 0.2));
    
    const owned = this.ownedThemes();
    if (owned.length > 1) {
       const idx = owned.indexOf(this.currentThemeId());
       const nextId = owned[(idx + 1) % owned.length];
       this.currentThemeId.set(nextId);
       localStorage.setItem('blockBlastThemeId', nextId);
       this.refillShapes();
    }
  }

  rotateHand() {
    if (this.currency() < 50) return;
    this.addCurrency(-50);
    this.sound.playPowerUp();
    const rotated = this.availableShapes().map(s => ({ ...s, matrix: s.matrix[0].map((_, i) => s.matrix.map(r => r[i]).reverse()) }));
    this.availableShapes.set(rotated);
  }

  refreshHand() {
    if (this.currency() < 100) return;
    this.addCurrency(-100);
    this.sound.playPowerUp();
    this.refillShapes();
  }
  
  activateBomb() {
    if (this.currency() < 200) return;
    this.bombMode.set(true);
  }

  useBomb(row: number, col: number) {
    if (!this.bombMode()) return;
    this.addCurrency(-200);
    this.sound.playPowerUp();
    
    const board = this.board().map(r => [...r]);
    const size = this.gridSize();
    for(let r = row - 1; r <= row + 1; r++) {
      for(let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size) board[r][c] = { filled: false };
      }
    }
    
    this.board.set(board);
    this.bombMode.set(false);
    this.checkLines(0);
    this.bombMode.set(false);
  }

  buyTheme(id: string) {
    if (this.ownedThemes().includes(id)) {
      this.currentThemeId.set(id);
      localStorage.setItem('blockBlastThemeId', id);
      this.refillShapes();
      return;
    }
    const theme = this.themes.find(t => t.id === id);
    if (!theme || this.currency() < theme.cost) return;
    this.addCurrency(-theme.cost);
    this.ownedThemes.update(o => [...o, id]);
    localStorage.setItem('blockBlastOwnedThemes', JSON.stringify(this.ownedThemes()));
    this.currentThemeId.set(id);
    localStorage.setItem('blockBlastThemeId', id);
    this.refillShapes();
  }

  buySkin(id: string) {
    if (this.ownedSkins().includes(id)) {
      this.currentSkinId.set(id);
      localStorage.setItem('blockBlastSkinId', id);
      return;
    }
    const skin = this.blockSkins.find(s => s.id === id);
    if (!skin || this.currency() < skin.cost) return;
    this.addCurrency(-skin.cost);
    this.ownedSkins.update(o => [...o, id]);
    localStorage.setItem('blockBlastOwnedSkins', JSON.stringify(this.ownedSkins()));
    this.currentSkinId.set(id);
    localStorage.setItem('blockBlastSkinId', id);
  }

  buyGrid(size: number) {
    if (this.ownedGrids().includes(size)) {
      this.setGridSize(size as GridSize);
      return;
    }
    const grid = this.gridOptions.find(g => g.size === size);
    if (!grid || this.currency() < grid.cost) return;
    this.addCurrency(-grid.cost);
    this.ownedGrids.update(o => [...o, size]);
    localStorage.setItem('blockBlastOwnedGrids', JSON.stringify(this.ownedGrids()));
    this.setGridSize(size as GridSize);
  }

  buySoundPack(id: SoundPackId) {
    if (this.ownedSoundPacks().includes(id)) {
      this.currentSoundPackId.set(id);
      this.sound.setPack(id);
      localStorage.setItem('blockBlastSoundId', id);
      this.sound.playPickUp(); 
      return;
    }
    const pack = this.soundPacks.find(s => s.id === id);
    if (!pack || this.currency() < pack.cost) return;
    this.addCurrency(-pack.cost);
    this.ownedSoundPacks.update(o => [...o, id]);
    localStorage.setItem('blockBlastOwnedSounds', JSON.stringify(this.ownedSoundPacks()));
    this.currentSoundPackId.set(id);
    this.sound.setPack(id);
    localStorage.setItem('blockBlastSoundId', id);
    this.sound.playPickUp();
  }
}
