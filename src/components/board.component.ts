import { Component, inject, computed, ElementRef, viewChild, input } from '@angular/core';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-board',
  standalone: true,
  template: `
    <div #boardEl class="relative touch-none select-none p-2 rounded-xl bg-current/10 shadow-2xl backdrop-blur-sm border border-current/5"
         [style.width]="'min(95vw, 400px)'"
         [style.height]="'min(95vw, 400px)'">
      
      <!-- Grid Container -->
      <div class="grid w-full h-full gap-1.5"
           [style.grid-template-columns]="'repeat(' + game.gridSize() + ', 1fr)'"
           [style.grid-template-rows]="'repeat(' + game.gridSize() + ', 1fr)'">
        
        @for (row of game.board(); track $index; let r = $index) {
          @for (cell of row; track $index; let c = $index) {
            <!-- Cell -->
            <div class="relative w-full h-full transition-all duration-200 flex items-center justify-center overflow-hidden"
                 [class]="getBaseClasses(r, c)"
                 [class.opacity-60]="!cell.filled && game.previewCells().has(r + ',' + c)"
                 [style.background-color]="cell.filled ? cell.color : (game.previewCells().get(r + ',' + c) || '')">
               
               <!-- Cell Content / Inner Style -->
               @if(cell.filled && game.currentSkinId() === 'toy') {
                 <!-- Toy Brick Stud -->
                 <div class="w-[60%] h-[60%] rounded-full bg-white/20 shadow-sm border border-black/5"></div>
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
      // High visibility for empty cells
      classes += 'bg-current/20 border-2 border-current/10 shadow-inner '; 
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