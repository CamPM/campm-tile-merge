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
  `],
  template: `
    <div #boardEl class="relative touch-none select-none p-2 rounded-xl bg-current/10 shadow-2xl backdrop-blur-sm border border-current/5 w-full h-full flex flex-col justify-center">
      
      <!-- Grid Container -->
      <div class="grid w-full h-full gap-[1.5%]"
           [style.grid-template-columns]="'repeat(' + game.gridSize() + ', 1fr)'"
           [style.grid-template-rows]="'repeat(' + game.gridSize() + ', 1fr)'">
        
        @for (row of game.board(); track $index; let r = $index) {
          @for (cell of row; track $index; let c = $index) {
            @let isPreview = game.previewCells().has(r + ',' + c);
            
            <!-- Cell -->
            <div class="relative w-full h-full transition-all duration-200 flex items-center justify-center overflow-hidden"
                 [class]="getBaseClasses(r, c)"
                 [class.opacity-60]="!cell.filled && isPreview"
                 [class.preview-highlight]="!cell.filled && isPreview"
                 [class.shape-glow]="cell.filled"
                 [style.background-color]="cell.filled ? cell.color : (isPreview ? game.previewCells().get(r + ',' + c) : '')">
               
               <!-- Cell Content / Inner Style -->
               @if(cell.filled && game.currentSkinId() === 'toy') {
                 <!-- Toy Brick Stud -->
                 <div class="w-[60%] h-[60%] rounded-full bg-white/20 shadow-sm border border-black/5"></div>
               }
               
               <!-- Minecraft / Voxel Style Overlays -->
               @if(cell.filled && game.currentSkinId() === 'voxel') {
                 <!-- Outer Bevel (Light Top/Left, Dark Bottom/Right) -->
                 <div class="absolute inset-0 border-t-4 border-l-4 border-white/40 border-b-4 border-r-4 border-black/20"></div>
                 <!-- Inner Surface Noise/Detail -->
                 <div class="absolute inset-[4px] border border-black/10 bg-gradient-to-br from-white/10 to-transparent"></div>
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

  // Public method to get bounding rect for drag calculations
  getBounds(): DOMRect | null {
    const el = this.boardEl();
    return el ? el.nativeElement.getBoundingClientRect() : null;
  }
}