import { Component, inject, signal, viewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, Shape } from './services/game.service';
import { SoundService } from './services/sound.service';
import { BoardComponent } from './components/board.component';
import { ShapeComponent } from './components/shape.component';
import { IconBtnComponent, ModalComponent } from './components/ui-components';
import { StoreComponent } from './components/store.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BoardComponent, ShapeComponent, IconBtnComponent, StoreComponent, ModalComponent],
  template: `
    <div class="h-full w-full flex flex-col items-center justify-between p-4 relative"
         [class]="game.currentTheme().bgStyle">
      
      <!-- Header -->
      <div class="w-full max-w-md flex justify-between items-start pt-2 z-10">
        <div class="flex flex-col">
          <h1 class="text-3xl font-black italic tracking-tighter drop-shadow-lg text-transparent bg-clip-text"
              [class]="game.currentTheme().isDark ? 'bg-gradient-to-br from-white to-white/60' : 'bg-gradient-to-br from-slate-900 to-slate-600'">
            TILE MERGE
          </h1>
          <div class="flex gap-4 text-sm font-medium opacity-80 mt-1">
            <div class="flex items-center gap-1">
              <span class="text-yellow-400">★</span> {{ game.highScore() }}
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-400">$</span> {{ game.currency() }}
            </div>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button (click)="showHelp.set(true)" class="p-2 rounded-full bg-current/10 hover:bg-current/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12ZM128 32a96 96 0 1 0 96 96a96.11 96.11 0 0 0-96-96Zm0 168a72 72 0 1 1 72-72a72.08 72.08 0 0 1-72 72Zm0-128a32 32 0 0 0-8 63v1a8 8 0 0 0 16 0v-1a16 16 0 1 1 16-16a16 16 0 0 1-16 16v1a8 8 0 0 0 16 0v-1a32 32 0 1 0-32-32Z"/></svg>
          </button>
          <button (click)="sound.toggleMute()" class="p-2 rounded-full bg-current/10 hover:bg-current/20 transition-colors">
             @if (sound.muted()) {
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M53.92 34.62a8 8 0 1 0-11.84 10.76L81.47 80H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h40l60.2 51.6a16 16 0 0 0 26.41-12.12v-58.46l54.81 63.36a8 8 0 1 0 12.16-10.52ZM150.6 157.09l-22.11-25.56l-.1-.13l-1.46-1.7l-4.22-4.88l-29-33.5l-12.24-14.15V40.48a16 16 0 0 1 26.41-12.12l10.83 9.28a8 8 0 0 1-10.38 12.12l-10.86-9.31v77.37Zm30.71-33.41l11.45 13.23a80 80 0 0 0 0-97.82a8 8 0 1 0-12.52 10.82a64 64 0 0 1 1.07 73.77Zm24.49 28.3l11.66 13.48a112 112 0 0 0-1.87-142.92a8 8 0 1 0-12.38 10.18a96 96 0 0 1 2.59 119.26Z"/></svg>
             } @else {
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M155 25.48a16 16 0 0 0-16.37-2.36L80 50.48H40a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h40l58.63 27.36A16 16 0 0 0 164 159.52V32a16 16 0 0 0-9-14.52Zm-9 134l-50-23.33a8 8 0 0 0-3.41-.77H40V66.48h52.59a8 8 0 0 0 3.41-.77L146 42.38Zm76.28-100.2a8 8 0 0 0-11.31 11.31a47.9 47.9 0 0 1 0 67.82a8 8 0 0 0 5.65 13.66a8 8 0 0 0 5.66-2.35a63.9 63.9 0 0 0 0-90.44Zm33.94-34a8 8 0 0 0-11.31 11.31a95.89 95.89 0 0 1 0 135.52a8 8 0 0 0 5.66 13.66a8 8 0 0 0 5.65-2.35a111.9 111.9 0 0 0 0-158.14Z"/></svg>
             }
          </button>
          <button (click)="toggleFullscreen()" class="p-2 rounded-full bg-current/10 hover:bg-current/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M216 48v40a8 8 0 0 1-16 0V56h-32a8 8 0 0 1 0-16h40a8 8 0 0 1 8 8ZM88 200H56v-32a8 8 0 0 0-16 0v40a8 8 0 0 0 8 8h40a8 8 0 0 0 0-16Zm128-40a8 8 0 0 0-8 8v32h-32a8 8 0 0 0 0 16h40a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8ZM48 88a8 8 0 0 0 8-8V56h32a8 8 0 0 0 0-16H48a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8Z"/></svg>
          </button>
          <button (click)="showStore.set(true)" class="p-2 rounded-full bg-current/10 hover:bg-current/20 transition-colors text-yellow-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M222.14 58.87A8 8 0 0 0 216 56H54.68L49.79 29.14A16 16 0 0 0 34.05 16H16a8 8 0 0 0 0 16h18.05l31.36 172.48a24 24 0 0 0 23.65 19.52h118.72a24 24 0 0 0 23.62-19.71l20-136a8 8 0 0 0-9.26-9.42ZM210.15 72L193.68 184H89.26l-18.47-112ZM112 112a12 12 0 1 1-12 12a12 12 0 0 1 12-12Zm56 0a12 12 0 1 1-12 12a12 12 0 0 1 12-12Z"/></svg>
          </button>
        </div>
      </div>
    
      <!-- Score Board (Center Large) -->
      <div class="flex flex-col items-center justify-center z-0 transition-all text-current">
        <div class="text-6xl font-bold drop-shadow-xl"
             [class.scale-125]="game.score() > 0 && game.score() % 100 === 0">
          {{ game.score() }}
        </div>
        @if (game.comboMultiplier() > 1) {
          <div class="text-xl font-black text-yellow-400 bg-black/20 px-2 py-0.5 rounded animate-pulse">
            x{{ game.comboMultiplier() }} COMBO
          </div>
        }
      </div>
    
      <!-- Board Area -->
      <div class="relative z-10 flex-1 flex items-center justify-center w-full">
        <app-board [bombHover]="bombHoverPos()"></app-board>
        
        <!-- Theme Cycle Effect Overlay -->
        @if (game.themeCycleTrigger()) {
          <div class="absolute inset-0 bg-white z-20 pointer-events-none flash-anim"></div>
          <div class="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <h2 class="text-4xl font-black text-yellow-400 drop-shadow-lg pop-in">EXCELLENT!</h2>
          </div>
        }
      </div>
    
      <!-- Hand / Shapes -->
      <div class="w-full max-w-lg h-32 flex items-center justify-around pb-2 px-4 z-20">
        @for (shape of game.availableShapes(); track shape.id) {
           <div class="relative w-20 h-20 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                (pointerdown)="startDrag($event, shape)"
                [class.opacity-0]="game.draggedShapeOriginId() === shape.id">
              <div class="pointer-events-none transform scale-[0.6]">
                 <app-shape [matrix]="shape.matrix" [color]="shape.color" [cellSize]="25"></app-shape>
              </div>
           </div>
        }
      </div>
    
      <!-- Controls / Powerups -->
      <div class="w-full max-w-sm flex justify-center gap-6 mb-4 z-20">
        <app-icon-btn (action)="game.rotateHand()" [badge]="50">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M208 112h-36.32l16.37-18.2a8 8 0 1 0-11.9-10.72L149.8 112.4a8 8 0 0 0 0 10.71l26.35 29.31a8 8 0 1 0 11.9-10.72L171.68 128H208a40 40 0 0 1 0 80H48a8 8 0 0 0 0 16h160a56 56 0 0 0 0-112Z"/></svg>
        </app-icon-btn>
        <app-icon-btn (action)="game.activateBomb()" [badge]="200" [disabled]="game.bombMode()" [class.animate-pulse]="game.bombMode()" [class.ring-2]="game.bombMode()" class="ring-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M228.49 84.49a12 12 0 0 1-17 0L192 64.91V88a8 8 0 0 1-16 0V56a8 8 0 0 1 8-8h32a8 8 0 0 1 0 16h-23.09l19.58 19.58a12 12 0 0 1 0 16.91ZM128 56a72 72 0 1 0 72 72a72.08 72.08 0 0 0-72-72Zm0 128a56 56 0 1 1 56-56a56.06 56.06 0 0 1-56 56Zm-8-144V24a8 8 0 0 1 16 0v16a8 8 0 0 1-16 0Zm68.23 20.44l11.32-11.31a8 8 0 0 1 11.31 11.31l-11.31 11.32a8 8 0 0 1-11.32-11.32ZM56.44 60.44l-11.31-11.31a8 8 0 0 1 11.31-11.31l11.32 11.31a8 8 0 0 1-11.32 11.31Z"/></svg>
        </app-icon-btn>
        <app-icon-btn (action)="game.refreshHand()" [badge]="100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h26.79a87.64 87.64 0 1 0 16.63 75.3a8 8 0 1 1 15.65-3.32a103.65 103.65 0 1 1-20-88H216a8 8 0 0 1 8-8Z"/></svg>
        </app-icon-btn>
      </div>
    
      <!-- Drag Layer -->
      @if (game.draggedShape()) {
        <div class="fixed top-0 left-0 pointer-events-none z-50 transition-none"
             [style.transform]="dragTransform()">
            <div class="transform -translate-x-1/2 -translate-y-24">
               <app-shape [matrix]="game.draggedShape()!.matrix" 
                          [color]="game.draggedShape()!.color"
                          [cellSize]="dragCellSize()"></app-shape>
            </div>
        </div>
      }
    
      <!-- Floating Bomb Icon -->
      @if (game.bombMode() && bombHoverPos()) {
         <div class="fixed top-0 left-0 pointer-events-none z-50 text-red-500 transition-transform duration-75"
              [style.transform]="dragTransform()">
            <svg class="w-12 h-12 -ml-6 -mt-6 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M228.49 84.49a12 12 0 0 1-17 0L192 64.91V88a8 8 0 0 1-16 0V56a8 8 0 0 1 8-8h32a8 8 0 0 1 0 16h-23.09l19.58 19.58a12 12 0 0 1 0 16.91ZM128 56a72 72 0 1 0 72 72a72.08 72.08 0 0 0-72-72Zm0 128a56 56 0 1 1 56-56a56.06 56.06 0 0 1-56 56Zm-8-144V24a8 8 0 0 1 16 0v16a8 8 0 0 1-16 0Zm68.23 20.44l11.32-11.31a8 8 0 0 1 11.31 11.31l-11.31 11.32a8 8 0 0 1-11.32-11.32ZM56.44 60.44l-11.31-11.31a8 8 0 0 1 11.31-11.31l11.32 11.31a8 8 0 0 1-11.32 11.31Z"/></svg>
         </div>
      }
    
      <!-- Modals -->
      @if (showStore()) {
        <app-store (close)="showStore.set(false)"></app-store>
      }
      
      @if (showHelp()) {
        <app-modal title="How to Play" (close)="showHelp.set(false)">
          <div class="flex flex-col gap-4 text-white/90 text-sm overflow-y-auto max-h-[60vh]">
            <section>
              <h3 class="font-bold text-yellow-400 mb-1">Scoring</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><span class="font-bold">Placement:</span> +1 point per block cell placed.</li>
                <li><span class="font-bold">Lines:</span> +10 per line. Bonus for Multi-Lines!</li>
                <li><span class="font-bold">Combos:</span> Consecutive clears increase your multiplier.</li>
                <li><span class="font-bold">Combo Reset:</span> You must clear a line every 3 moves to maintain your streak!</li>
              </ul>
            </section>
            
            <section>
              <h3 class="font-bold text-yellow-400 mb-1">Power Ups</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><span class="font-bold">Rotate (50):</span> Rotates shapes in hand.</li>
                <li><span class="font-bold">Bomb (200):</span> Destroys 3x3 area.</li>
                <li><span class="font-bold">Refresh (100):</span> New shapes.</li>
              </ul>
            </section>
    
            <section>
              <h3 class="font-bold text-yellow-400 mb-1">Earning Coins</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><span class="font-bold">Score to Coins:</span> You earn 20% of your score as coins!</li>
                <li><span class="font-bold">Combos:</span> Higher combos = More points = More coins!</li>
              </ul>
            </section>
    
            <section>
              <h3 class="font-bold text-yellow-400 mb-1">Shop</h3>
              <p>Buy <strong>Themes</strong>, <strong>Skins</strong>, <strong>Sounds</strong> & <strong>Grids</strong>!</p>
            </section>
            
            <div class="mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/50">
              Tile Merge v0.07
            </div>
          </div>
        </app-modal>
      }
      
      @if (game.bombMode() && !bombHoverPos()) {
        <div class="absolute top-20 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce z-40">
          TAP BOARD TO EXPLODE!
        </div>
      }
    
      <!-- Game Over Screen -->
      @if (game.gameOver()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md pop-in">
          <div class="flex flex-col items-center p-8 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
             <h2 class="text-4xl font-black text-white mb-2 italic">GAME OVER</h2>
             
             <div class="w-full bg-white/5 rounded-xl p-4 mb-6 flex flex-col gap-2">
               <div class="flex justify-between items-center text-lg">
                 <span class="text-white/60">Score</span>
                 <span class="font-bold text-white">{{ game.score() }}</span>
               </div>
               <div class="h-px bg-white/10 w-full"></div>
               <div class="flex justify-between items-center text-lg">
                 <span class="text-white/60">Best</span>
                 <span class="font-bold text-yellow-400">{{ game.highScore() }}</span>
               </div>
             </div>
      
             <button (click)="game.resetGame()" 
                     class="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h26.79a87.64 87.64 0 1 0 16.63 75.3a8 8 0 1 1 15.65-3.32a103.65 103.65 0 1 1-20-88H216a8 8 0 0 1 8-8Z"/></svg>
               Try Again
             </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
  `]
})
export class AppComponent {
  game = inject(GameService);
  sound = inject(SoundService);
  
  boardComp = viewChild(BoardComponent);
  
  showStore = signal(false);
  showHelp = signal(false);
  
  // Drag logic
  dragPos = signal({ x: 0, y: 0 });
  dragTransform = signal('translate(0px, 0px)');
  dragCellSize = signal(0);
  lastPreviewPos = { r: -1, c: -1 };
  
  // Bomb logic
  bombHoverPos = signal<{r: number, c: number} | null>(null);

  constructor() {
    effect(() => {
      if (this.game.bombMode()) {
        window.addEventListener('pointermove', this.onPointerMove);
      } else {
        window.removeEventListener('pointermove', this.onPointerMove);
        this.bombHoverPos.set(null);
      }
    });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
     if (!this.game.bombMode()) return;
     
     const boardRect = this.boardComp()?.getBounds();
     if (!boardRect) return;
     
     if (event.clientX >= boardRect.left && event.clientX <= boardRect.right &&
         event.clientY >= boardRect.top && event.clientY <= boardRect.bottom) {
           
        const size = this.game.gridSize();
        const cellSize = boardRect.width / size;
        const col = Math.floor((event.clientX - boardRect.left) / cellSize);
        const row = Math.floor((event.clientY - boardRect.top) / cellSize);
        
        this.game.useBomb(row, col);
     }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  toggleGridSize() {
      // Deprecated, now in shop
  }

  startDrag(event: PointerEvent, shape: Shape) {
    if (this.game.bombMode()) return;
    
    event.preventDefault(); // Prevent scroll
    this.game.draggedShape.set(shape);
    this.game.draggedShapeOriginId.set(shape.id);
    this.lastPreviewPos = { r: -1, c: -1 };
    
    // Calculate cell size based on board width
    const boardRect = this.boardComp()?.getBounds();
    if (boardRect) {
       this.dragCellSize.set(boardRect.width / this.game.gridSize());
    } else {
       this.dragCellSize.set(30); // Fallback
    }

    this.updateDragPos(event.clientX, event.clientY);
    this.sound.playPickUp();
    
    // Add global listeners
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerMove = (event: PointerEvent) => {
    event.preventDefault();
    this.updateDragPos(event.clientX, event.clientY);

    // BOMB MODE LOGIC
    if (this.game.bombMode()) {
       const boardRect = this.boardComp()?.getBounds();
       if (boardRect &&
           event.clientX >= boardRect.left && event.clientX <= boardRect.right &&
           event.clientY >= boardRect.top && event.clientY <= boardRect.bottom) {
             
          const size = this.game.gridSize();
          const cellSize = boardRect.width / size;
          const col = Math.floor((event.clientX - boardRect.left) / cellSize);
          const row = Math.floor((event.clientY - boardRect.top) / cellSize);
          this.bombHoverPos.set({r: row, c: col});
       } else {
          this.bombHoverPos.set(null);
       }
       return;
    }
    
    // DRAG MODE LOGIC
    const shape = this.game.draggedShape();
    if (shape) {
      const pos = this.getGridPosFromCoords(event.clientX, event.clientY, shape);
      
      // Update preview if position changed
      if (pos) {
         if (pos.row !== this.lastPreviewPos.r || pos.col !== this.lastPreviewPos.c) {
            this.game.updatePreview(shape, pos.row, pos.col);
            this.lastPreviewPos = { r: pos.row, c: pos.col };
         }
      } else {
         if (this.lastPreviewPos.r !== -1) {
             this.game.clearPreview();
             this.lastPreviewPos = { r: -1, c: -1 };
         }
      }
    }
  }

  updateDragPos(x: number, y: number) {
    this.dragPos.set({ x, y });
    this.dragTransform.set(`translate(${x}px, ${y}px)`);
  }

  onPointerUp = (event: PointerEvent) => {
    if (this.game.bombMode()) return; // Bomb uses Click

    const shape = this.game.draggedShape();
    let placed = false;
    if (shape) {
      const pos = this.getGridPosFromCoords(event.clientX, event.clientY, shape);
      if (pos && this.game.canPlace(shape.matrix, pos.row, pos.col)) {
        this.game.placeShape(shape, pos.row, pos.col);
        placed = true;
      } else {
        // Just return to hand
      }
    }
    
    if (!placed && shape) {
       this.sound.playReturn();
    }
    
    this.game.draggedShape.set(null);
    this.game.draggedShapeOriginId.set(null);
    this.game.clearPreview();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  // Helper to extract common grid logic
  getGridPosFromCoords(x: number, y: number, shape: Shape): { row: number, col: number } | null {
    const boardRect = this.boardComp()?.getBounds();
    if (!boardRect) return null;

    const cellSize = this.dragCellSize();
    
    const shapePixelWidth = shape.matrix[0].length * cellSize;
    
    const shapeLeftX = x - (shapePixelWidth / 2);
    const shapeTopY = y - 100; // Visual offset matching HTML offset
    
    const relativeX = shapeLeftX - boardRect.left;
    const relativeY = shapeTopY - boardRect.top;
    
    const col = Math.round(relativeX / cellSize);
    const row = Math.round(relativeY / cellSize);
    
    return { row, col };
  }
}