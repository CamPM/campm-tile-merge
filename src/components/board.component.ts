import { Component, inject, computed, ElementRef, viewChild, input } from '@angular/core';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-board',
  standalone: true,
  styles: [`
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: inset 0 0 0 0 rgba(255,255,255,0); }
      50% { box-shadow: inset 0 0 6px 1px rgba(255,255,255,0.4); }
    }
    .shape-glow {
      animation: pulse-glow 3s ease-in-out infinite;
    }
    .preview-highlight {
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 8px 1px rgba(255, 255, 255, 0.6);
      z-index: 20;
    }
    .invalid-preview-highlight {
      background-color: rgba(239, 68, 68, 0.4) !important;
      box-shadow: inset 0 0 0 2px rgb(239, 68, 68);
      z-index: 19;
    }
    @keyframes clearing-pulse-anim {
      0% { transform: scale(1); box-shadow: inset 0 0 4px 2px rgba(255, 255, 255, 0.8); }
      50% { transform: scale(1.1); box-shadow: inset 0 0 8px 4px rgba(255, 255, 255, 1); }
      100% { transform: scale(1); box-shadow: inset 0 0 4px 2px rgba(255, 255, 255, 0.8); }
    }
    .clearing-pulse {
      animation: clearing-pulse-anim 0.3s ease-in-out;
      z-index: 30;
    }
    /* REFINED: Use a colored tint (gold) instead of white to prevent "white-out" */
    .potential-clear-highlight {
      background-color: rgba(250, 204, 21, 0.25);
      box-shadow: inset 0 0 8px 2px rgba(251, 191, 36, 0.6);
    }
    /* NEW: Add a pulse/glow to existing blocks in a potential clear line */
    .potential-clear-filled-highlight {
      transform: scale(1.05);
      box-shadow: inset 0 0 10px 3px rgba(255, 255, 255, 0.7);
    }
  `],
  template: `
    <div #boardEl class="relative touch-none select-none p-2 rounded-xl bg-current/10 shadow-2xl backdrop-blur-sm border border-current/5 w-full h-full flex flex-col justify-center">
      
      <!-- Grid Container -->
      <div #gridEl class="grid w-full h-full gap-[1.5%]"
           [style.grid-template-columns]="'repeat(' + game.gridSize() + ', 1fr)'"
           [style.grid-template-rows]="'repeat(' + game.gridSize() + ', 1fr)'">
        
        @for (row of game.board(); track $index; let r = $index) {
          @for (cell of row; track $index; let c = $index) {
            @let isPreview = game.previewCells().has(r + ',' + c);
            @let isInvalidPreview = game.invalidPreviewCells().has(r + ',' + c);
            
            <!-- Cell -->
            <div class="relative w-full h-full transition-all duration-200 flex items-center justify-center overflow-hidden"
                 [class]="getBaseClasses(r, c)"
                 [class.opacity-60]="!cell.filled && isPreview"
                 [class.preview-highlight]="!cell.filled && isPreview"
                 [class.invalid-preview-highlight]="!cell.filled && isInvalidPreview"
                 [class.shape-glow]="cell.filled && !isPotentialClear(r, c)"
                 [class.potential-clear-highlight]="!cell.filled && isPotentialClear(r, c)"
                 [class.potential-clear-filled-highlight]="cell.filled && isPotentialClear(r, c)"
                 [class.clearing-pulse]="cell.filled && isClearing(r, c)"
                 [style.background-color]="cell.filled ? (game.currentSkinId() === 'iron' ? '#D1D5DB' : cell.color) : (isPreview ? game.previewCells().get(r + ',' + c) : (isInvalidPreview ? game.invalidPreviewCells().get(r + ',' + c) : ''))">
               
               <!-- Cell Content / Inner Style -->
               @if(cell.filled && game.currentSkinId() === 'toy') {
                 <!-- Toy Brick Stud -->
                 <div class="w-[60%] h-[60%] rounded-full bg-white/20 shadow-sm border border-black/5"></div>
               }
               
               <!-- Iron Block Style -->
               @if(cell.filled && game.currentSkinId() === 'iron') {
                 <!-- Bevel -->
                 <div class="absolute inset-0 border-t-2 border-l-2 border-white/70 border-b-2 border-r-2 border-black/25"></div>
                 <!-- Streaks & Noise Texture -->
                 <div class="absolute inset-[2px]" style="background-image: linear-gradient(90deg, rgba(255,255,255,.07) 50%, transparent 50%), linear-gradient(rgba(0,0,0,.04) 50%, transparent 50%); background-size: 8px 8px, 100% 4px;"></div>
               }

               <!-- Bomb Highlight Overlay -->
               @if (isBombTarget(r, c)) {
                 <div class="absolute inset-0 bg-red-500/50 animate-pulse z-10"></div>
               }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class BoardComponent {
  game = inject(GameService);
  boardEl = viewChild<ElementRef>('boardEl');
  gridEl = viewChild<ElementRef>('gridEl');
  bombHover = input<{r: number, c: number} | null>(null);

  // Computed helper for base cell styles
  getBaseClasses(r: number, c: number) {
    const skin = this.game.currentSkin();
    const cell = this.game.board()[r][c];
    
    let classes = `${skin.cellStyle} `;
    
    if (!cell.filled) {
      // High visibility for empty cells: Darker/clearer background opacity
      // Use white/black with opacity instead of current to ensure contrast against board bg
      const isDark = this.game.currentTheme().isDark;
      
      // Adjusted for better contrast on light themes
      const bgClass = isDark ? 'bg-white/10' : 'bg-slate-900/5'; 
      const borderClass = isDark ? 'border-white/20' : 'border-slate-900/20';
      
      classes += `${bgClass} border-2 ${borderClass} shadow-inner `; 
    } else {
      classes += 'shadow-sm ';
    }
    
    return classes;
  }

  isBombTarget(r: number, c: number): boolean {
    const target = this.bombHover();
    if (!target) return false;
    
    // Check if r,c is within 3x3 of target
    return Math.abs(target.r - r) <= 1 && Math.abs(target.c - c) <= 1;
  }

  isPotentialClear(r: number, c: number): boolean {
    const clears = this.game.potentialClearLines();
    return clears.rows.includes(r) || clears.cols.includes(c);
  }

  isClearing(r: number, c: number): boolean {
      return this.game.clearedLines().some(clear => 
          (clear.type === 'row' && clear.indices.includes(r)) ||
          (clear.type === 'col' && clear.indices.includes(c))
      );
  }

  // Public method to get bounding rect for drag calculations
  getBounds(): DOMRect | null {
    const el = this.boardEl();
    return el ? el.nativeElement.getBoundingClientRect() : null;
  }
  
  // NEW: Public method to get the grid's bounding rect for precise snapping
  getGridBounds(): DOMRect | null {
    const el = this.gridEl();
    return el ? el.nativeElement.getBoundingClientRect() : null;
  }
}
