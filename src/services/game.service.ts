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
}

export interface ColorTheme {
  id: string;
  name: string;
  colors: string[];
  bgStyle: string; // Tailwind classes for background
  isDark: boolean;
  cost: number;
}

export interface BlockSkin {
  id: string;
  name: string;
  cellStyle: string; // Tailwind classes for cells
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
  previewCells = signal<Map<string, string>>(new Map()); // Key "r,c" -> color
  availableShapes = signal<Shape[]>([]);
  
  draggedShape = signal<Shape | null>(null);
  draggedShapeOriginId = signal<number | null>(null);
  
  // --- Power Ups ---
  bombMode = signal(false);
  
  // --- Animation Triggers ---
  clearedLines = signal<{indices: number[], type: 'row' | 'col'}[]>([]);
  themeCycleTrigger = signal(false);

  // --- Store Data ---
  
  // 1. Grids
  gridOptions: GridOption[] = [
    { size: 6, name: '6x6 Small', cost: 250 },
    { size: 8, name: '8x8 Classic', cost: 0 },
    { size: 10, name: '10x10 Large', cost: 1000 },
    { size: 12, name: '12x12 Expert', cost: 2000 },
  ];

  // 2. Sound Packs
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

  // 3. Block Skins (Textures)
  blockSkins: BlockSkin[] = [
    { id: 'classic', name: 'Classic', cellStyle: 'rounded-md border border-white/20 shadow-sm', cost: 0 },
    { id: 'tetris', name: 'Tetris', cellStyle: 'rounded-none border-t-4 border-l-4 border-white/40 border-b-4 border-r-4 border-black/20', cost: 1500 },
    { id: 'toy', name: 'Toy Bricks', cellStyle: 'rounded-[2px] shadow-md border-b-2 border-black/10', cost: 1500 },
    { id: 'voxel', name: 'Block Game', cellStyle: 'rounded-none border-2 border-white/10 ring-2 ring-black/10 ring-inset', cost: 1500 },
  ];

  // 4. Themes (Colors)
  // Prices Rounded to Nice Numbers
  themes: ColorTheme[] = [
    { id: 'clean', name: 'Clean White', colors: ['#60a5fa', '#94a3b8', '#3b82f6', '#cbd5e1'], bgStyle: 'bg-white text-slate-800', isDark: false, cost: 0 },
    { id: 'ocean', name: 'Ocean Breeze', colors: ['#cbd5e1', '#86efac', '#94a3b8', '#4ade80'], bgStyle: 'bg-sky-100 text-slate-900', isDark: false, cost: 0 },
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
    
    // Sync sound service
    this.sound.setPack(this.currentSoundPackId());
  }

  private loadState() {
    const savedBest = localStorage.getItem('blockBlastBest');
    if (savedBest) this.highScore.set(parseInt(savedBest, 10));
    
    const savedCurrency = localStorage.getItem('blockBlastCurrency');
    if (savedCurrency) this.currency.set(parseInt(savedCurrency, 10));

    // Load Ownership
    const savedThemes = localStorage.getItem('blockBlastOwnedThemes');
    if (savedThemes) this.ownedThemes.set(JSON.parse(savedThemes));

    const savedSkins = localStorage.getItem('blockBlastOwnedSkins');
    if (savedSkins) this.ownedSkins.set(JSON.parse(savedSkins));
    
    const savedGrids = localStorage.getItem('blockBlastOwnedGrids');
    if (savedGrids) this.ownedGrids.set(JSON.parse(savedGrids));

    const savedSounds = localStorage.getItem('blockBlastOwnedSounds');
    if (savedSounds) this.ownedSoundPacks.set(JSON.parse(savedSounds));

    // Load Selections
    const savedThemeId = localStorage.getItem('blockBlastThemeId');
    if (savedThemeId && this.ownedThemes().includes(savedThemeId)) this.currentThemeId.set(savedThemeId);

    const savedSkinId = localStorage.getItem('blockBlastSkinId');
    if (savedSkinId && this.ownedSkins().includes(savedSkinId)) this.currentSkinId.set(savedSkinId);

    const savedSoundId = localStorage.getItem('blockBlastSoundId');
    if (savedSoundId && this.ownedSoundPacks().includes(savedSoundId)) this.currentSoundPackId.set(savedSoundId as SoundPackId);
    
    // Grid Size
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

  // Set grid size (only if owned logic handled in store)
  setGridSize(size: GridSize) {
    if (!this.ownedGrids().includes(size)) return;
    this.gridSize.set(size);
    localStorage.setItem('blockBlastGridSize', size.toString());
    this.resetGame();
  }
  
  resetGame() {
    this.initBoard();
    this.score.set(0);
    this.refillShapes();
    this.gameOver.set(false);
    this.bombMode.set(false);
    this.clearedLines.set([]);
    this.themeCycleTrigger.set(false);
    this.clearPreview();
    this.comboMultiplier.set(1);
    this.movesSinceLastClear.set(0);
  }

  // --- Shape Generation ---
  private SHAPE_TEMPLATES = [
    [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]], 
    [[1, 1], [1, 1]], [[1, 0], [1, 1]], [[0, 1], [1, 1]], 
    [[1, 1, 1], [0, 1, 0]], [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]], 
    [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]], 
    [[1, 1, 1, 1]], [[1], [1], [1], [1]], [[1, 1, 1], [1, 0, 0], [1, 0, 0]]
  ];

  refillShapes() {
    const newShapes: Shape[] = [];
    const theme = this.currentTheme();
    for (let i = 0; i < 3; i++) {
      const template = this.SHAPE_TEMPLATES[Math.floor(Math.random() * this.SHAPE_TEMPLATES.length)];
      const color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
      newShapes.push({
        id: Math.random(),
        matrix: template,
        color: color
      });
    }
    this.availableShapes.set(newShapes);
  }

  // --- Game Logic ---
  canPlace(shape: number[][], row: number, col: number): boolean {
    const board = this.board();
    const size = this.gridSize();
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          const targetR = row + r;
          const targetC = col + c;
          if (targetR < 0 || targetR >= size || targetC < 0 || targetC >= size) return false;
          if (board[targetR][targetC].filled) return false;
        }
      }
    }
    return true;
  }
  
  updatePreview(shape: Shape, row: number, col: number) {
    if (!this.canPlace(shape.matrix, row, col)) {
      if (this.previewCells().size > 0) this.clearPreview();
      return;
    }
    const newPreview = new Map<string, string>();
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          newPreview.set(`${row + r},${col + c}`, shape.color);
        }
      }
    }
    this.previewCells.set(newPreview);
  }

  clearPreview() {
    this.previewCells.set(new Map());
  }

  placeShape(shape: Shape, row: number, col: number) {
    const currentBoard = this.board().map(row => [...row]); 
    let placed = false;
    let placementPoints = 0;

    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          currentBoard[row + r][col + c] = { filled: true, color: shape.color, id: Math.random() };
          placed = true;
          placementPoints++;
        }
      }
    }

    if (placed) {
      this.board.set(currentBoard);
      this.sound.playDrop();
      const hand = this.availableShapes().filter(s => s.id !== shape.id);
      this.availableShapes.set(hand);
      this.clearPreview(); 
      this.checkLines(placementPoints);
      
      if (hand.length === 0) {
        setTimeout(() => this.refillShapes(), 300);
      } else {
        this.checkGameOver(hand);
      }
    }
  }

  checkLines(placementPoints: number) {
    const board = this.board();
    const size = this.gridSize();
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < size; r++) if (board[r].every(cell => cell.filled)) rowsToClear.push(r);
    for (let c = 0; c < size; c++) if (board.every(row => row[c].filled)) colsToClear.push(c);
    
    const totalLines = rowsToClear.length + colsToClear.length;
    
    // Combo Logic
    if (totalLines > 0) {
      this.comboMultiplier.update(m => m + 1);
      this.movesSinceLastClear.set(0);
    } else {
      this.movesSinceLastClear.update(m => m + 1);
      if (this.movesSinceLastClear() >= 3) {
        this.comboMultiplier.set(1);
        this.movesSinceLastClear.set(0);
      }
    }
    
    let linePoints = 0;
    if (totalLines > 0) {
      this.sound.playClear(totalLines);
      
      // Line Score Calculation
      // Base: 10 per line
      linePoints = totalLines * 10;
      
      // Multi-Line Bonus (20+ for 2, 30+ for 3, etc.)
      if (totalLines >= 2) {
         linePoints += (totalLines * 10);
      }

      // Check Full Clear (Theme Cycle)
      let totalFilled = 0;
      let filledInClear = 0;
      for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
          if (board[r][c].filled) {
            totalFilled++;
            if (rowsToClear.includes(r) || colsToClear.includes(c)) filledInClear++;
          }
        }
      }

      if (totalFilled > 0 && totalFilled === filledInClear) {
        this.triggerThemeCycle();
      }
      
      const nextBoard = board.map(r => r.map(c => ({...c})));
      rowsToClear.forEach(r => { for(let c=0; c<size; c++) nextBoard[r][c] = { filled: false }; });
      colsToClear.forEach(c => { for(let r=0; r<size; r++) nextBoard[r][c] = { filled: false }; });
      this.board.set(nextBoard);
    }
    
    // Final Scoring: (Placement + Line Clear) * Multiplier
    const totalMoveScore = (placementPoints + linePoints) * this.comboMultiplier();
    this.addScore(totalMoveScore);
    
    // Currency is 0.2x of total points
    if (totalMoveScore > 0) {
        this.addCurrency(Math.floor(totalMoveScore * 0.2));
    }
  }

  checkGameOver(currentHand: Shape[]) {
    if (currentHand.length === 0) return;
    const size = this.gridSize();
    let canMove = false;
    for (const shape of currentHand) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (this.canPlace(shape.matrix, r, c)) {
            canMove = true;
            break;
          }
        }
        if (canMove) break;
      }
      if (canMove) break;
    }
    if (!canMove) {
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
    // Currency 0.2x of bonus points
    this.addCurrency(Math.floor(bonusScore * 0.2));
    
    // Cycle Themes
    const owned = this.ownedThemes();
    const currentId = this.currentThemeId();
    const idx = owned.indexOf(currentId);
    const nextIdx = (idx + 1) % owned.length;
    const nextId = owned[nextIdx];
    
    this.currentThemeId.set(nextId);
    localStorage.setItem('blockBlastThemeId', nextId);
    this.refillShapes();
  }

  // --- Power Ups ---
  rotateHand() {
    if (this.currency() < 50) return;
    this.addCurrency(-50);
    this.sound.playPowerUp();
    const rotated = this.availableShapes().map(s => {
      const start = s.matrix;
      const end = start[0].map((val, index) => start.map(row => row[index]).reverse());
      return { ...s, matrix: end };
    });
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
        if (r >= 0 && r < size && c >= 0 && c < size) {
          board[r][c] = { filled: false };
        }
      }
    }
    
    this.board.set(board);
    this.bombMode.set(false);
    
    // Bomb doesn't grant standard placement points or simple combo logic, 
    // but clearing lines with bomb should count.
    // For simplicity, we just check lines with 0 placement points.
    this.checkLines(0);
    this.bombMode.set(false);
  }

  // --- Purchasing ---
  buyTheme(id: string) {
    if (this.ownedThemes().includes(id)) {
      this.currentThemeId.set(id);
      localStorage.setItem('blockBlastThemeId', id);
      this.refillShapes();
      return;
    }
    const theme = this.themes.find(t => t.id === id);
    if (!theme) return;
    if (this.currency() >= theme.cost) {
      this.addCurrency(-theme.cost);
      this.ownedThemes.update(o => [...o, id]);
      localStorage.setItem('blockBlastOwnedThemes', JSON.stringify(this.ownedThemes()));
      this.currentThemeId.set(id);
      localStorage.setItem('blockBlastThemeId', id);
      this.refillShapes();
    }
  }

  buySkin(id: string) {
    if (this.ownedSkins().includes(id)) {
      this.currentSkinId.set(id);
      localStorage.setItem('blockBlastSkinId', id);
      return;
    }
    const skin = this.blockSkins.find(s => s.id === id);
    if (!skin) return;
    if (this.currency() >= skin.cost) {
      this.addCurrency(-skin.cost);
      this.ownedSkins.update(o => [...o, id]);
      localStorage.setItem('blockBlastOwnedSkins', JSON.stringify(this.ownedSkins()));
      this.currentSkinId.set(id);
      localStorage.setItem('blockBlastSkinId', id);
    }
  }

  buyGrid(size: number) {
    if (this.ownedGrids().includes(size)) {
      this.setGridSize(size as GridSize);
      return;
    }
    const grid = this.gridOptions.find(g => g.size === size);
    if (!grid) return;
    if (this.currency() >= grid.cost) {
      this.addCurrency(-grid.cost);
      this.ownedGrids.update(o => [...o, size]);
      localStorage.setItem('blockBlastOwnedGrids', JSON.stringify(this.ownedGrids()));
      this.setGridSize(size as GridSize);
    }
  }

  buySoundPack(id: SoundPackId) {
    if (this.ownedSoundPacks().includes(id)) {
      this.currentSoundPackId.set(id);
      this.sound.setPack(id);
      localStorage.setItem('blockBlastSoundId', id);
      this.sound.playPickUp(); // Preview it
      return;
    }
    const pack = this.soundPacks.find(s => s.id === id);
    if (!pack) return;
    if (this.currency() >= pack.cost) {
      this.addCurrency(-pack.cost);
      this.ownedSoundPacks.update(o => [...o, id]);
      localStorage.setItem('blockBlastOwnedSounds', JSON.stringify(this.ownedSoundPacks()));
      this.currentSoundPackId.set(id);
      this.sound.setPack(id);
      localStorage.setItem('blockBlastSoundId', id);
      this.sound.playPickUp(); // Preview
    }
  }
}