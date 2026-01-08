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
  templateUrl: './app.component.html',
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
      // Deprecated, now in shop. Kept empty if referenced by HTML before update propagates? 
      // Safest to remove logic but keep method if needed, but I removed button in HTML.
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