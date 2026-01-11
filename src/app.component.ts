import { Component, inject, signal, viewChild, effect } from '@angular/core';
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
    .invalid-drag {
      filter: grayscale(0.5) sepia(1) hue-rotate(-60deg) saturate(5);
      opacity: 0.9;
    }
  `]
})
export class AppComponent {
  game = inject(GameService);
  sound = inject(SoundService);
  
  boardComp = viewChild(BoardComponent);
  
  showStore = signal(false);
  showHelp = signal(false);
  
  // Drag logic
  dragTransform = signal('translate(0px, 0px)');
  dragCellSize = signal(0);
  dragStartOffset = signal({ x: 0, y: 0 });
  isPlacementValid = signal(true);
  
  // Visibility Offset: How far up (px) the LOGIC point is from the finger
  readonly DRAG_Y_OFFSET = 45; 
  
  // Visual Lift: How far up (px) the VISUAL shape floats above the LOGIC point
  // This creates a small gap so the dragged shape doesn't cover the grid highlight
  readonly VISUAL_LIFT = 15;

  // Bomb logic
  bombHoverPos = signal<{r: number, c: number} | null>(null);

  // Track the last valid drop anchor
  private lastValidAnchor: {r: number, c: number} | null = null;

  constructor() {
    // Manage Global Listeners based on state
    effect(() => {
      const isBombing = this.game.bombMode();
      const isDragging = this.game.draggedShape() !== null;

      if (isBombing || isDragging) {
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
      } else {
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        this.bombHoverPos.set(null);
      }
    });
  }

  // --- Dragging ---

  startDrag(evt: PointerEvent, shape: Shape) {
    evt.preventDefault();
    this.game.draggedShape.set(shape);
    this.game.draggedShapeOriginId.set(shape.id);
    this.sound.playPickUp();

    // Calculate cell size for the dragged ghost to match board exactly
    const boardBounds = this.boardComp()?.getBounds();
    if (boardBounds) {
      this.dragCellSize.set(boardBounds.width / this.game.gridSize());
    }

    // Calculate offset of pointer within the grabbed shape container
    const targetEl = evt.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();
    const offsetX = evt.clientX - rect.left;
    const offsetY = evt.clientY - rect.top;
    this.dragStartOffset.set({ x: offsetX, y: offsetY });


    // Immediate update so it jumps to position
    this.updateDragState(evt.clientX, evt.clientY);
  }

  // --- Global Event Handlers ---

  onPointerMove = (evt: PointerEvent) => {
    evt.preventDefault();
    this.updateDragState(evt.clientX, evt.clientY);
  }

  onPointerUp = (evt: PointerEvent) => {
    evt.preventDefault();
    
    // Handle Drag Drop
    if (this.game.draggedShape()) {
      this.finalizeDrop();
    }
    
    // Handle Bomb Click
    if (this.game.bombMode()) {
       const target = this.bombHoverPos();
       if (target) {
         this.game.useBomb(target.r, target.c);
         this.bombHoverPos.set(null);
       }
    }
  };

  // --- Core Logic ---

  private updateDragState(x: number, y: number) {
    // 1. Handle Bomb Hover
    if (this.game.bombMode()) {
      // No offset for bomb, user points directly at target
      this.dragTransform.set(`translate(${x}px, ${y}px)`);
      this.checkGridIntersection(x, y, true); // true = isBomb
      return;
    }

    // 2. Handle Shape Drag
    const shape = this.game.draggedShape();
    if (shape) {
      // Logic Point: Where the game calculates placement
      // Moved up from finger so finger doesn't obscure the target area
      const logicY = y - this.DRAG_Y_OFFSET;
      
      // Visual Point: Where the shape is drawn. Based on initial grab point.
      const offset = this.dragStartOffset();
      const visualX = x - offset.x;
      const visualY = y - offset.y - this.VISUAL_LIFT;
      
      this.dragTransform.set(`translate(${visualX}px, ${visualY}px)`);
      this.checkGridIntersection(x, logicY, false);
    }
  }

  private finalizeDrop() {
    const shape = this.game.draggedShape();

    if (this.lastValidAnchor && shape) {
       this.game.placeShape(shape, this.lastValidAnchor.r, this.lastValidAnchor.c);
       // sound.playDrop() is handled in game.placeShape
    } else {
       this.sound.playReturn();
    }

    // Cleanup
    this.game.draggedShape.set(null);
    this.game.draggedShapeOriginId.set(null);
    this.game.clearPreview();
    this.lastValidAnchor = null;
    this.isPlacementValid.set(true);
  }

  // Calculate grid intersection and update state
  private checkGridIntersection(x: number, y: number, isBomb: boolean) {
    const board = this.boardComp();
    if (!board) return;
    const bounds = board.getBounds();
    if (!bounds) return;

    // Expand bounds check slightly to allow "edge" placement leniency
    const HIT_PADDING = 40; 
    if (x >= bounds.left - HIT_PADDING && 
        x <= bounds.right + HIT_PADDING && 
        y >= bounds.top - HIT_PADDING && 
        y <= bounds.bottom + HIT_PADDING) {
          
      const size = this.game.gridSize();
      const col = Math.floor(((x - bounds.left) / bounds.width) * size);
      const row = Math.floor(((y - bounds.top) / bounds.height) * size);

      // Note: Row/Col can be -1 or size due to padding. logic must handle it.

      if (isBomb) {
        if (row >= 0 && row < size && col >= 0 && col < size) {
          this.bombHoverPos.set({r: row, c: col});
        } else {
          this.bombHoverPos.set(null);
        }
      } else {
         const shape = this.game.draggedShape()!;
         // Center the shape's logic on finger
         const rOffset = Math.floor(shape.matrix.length / 2);
         const cOffset = Math.floor(shape.matrix[0].length / 2);
         const targetR = row - rOffset;
         const targetC = col - cOffset;

         // Check if this specific anchor is valid in game logic
         if (this.game.canPlace(shape.matrix, targetR, targetC)) {
           this.game.updatePreview(shape, targetR, targetC);
           this.lastValidAnchor = {r: targetR, c: targetC};
           this.isPlacementValid.set(true);
         } else {
           this.game.updateInvalidPreview(shape, targetR, targetC);
           this.lastValidAnchor = null;
           this.isPlacementValid.set(false);
         }
      }
      return;
    }
    
    // Pointer is off the board
    this.game.clearPreview();
    this.isPlacementValid.set(false);
    if (isBomb) this.bombHoverPos.set(null);
    else this.lastValidAnchor = null;
  }

  // Fullscreen toggle
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      document.exitFullscreen().catch(e => console.log(e));
    }
  }
}
