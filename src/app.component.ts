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
  
  // Visual Lift: How far up (px) the VISUAL shape floats above its snapped position
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
    const gridBounds = this.boardComp()?.getGridBounds();
    if (gridBounds) {
        const size = this.game.gridSize();
        const gapPercent = 0.015; // from CSS `gap-[1.5%]`
        const totalGapSpace = (size - 1) * (gridBounds.width * gapPercent);
        const totalCellSpace = gridBounds.width - totalGapSpace;
        const cellWidth = totalCellSpace / size;
        this.dragCellSize.set(cellWidth);
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
      this.dragTransform.set(`translate(${x}px, ${y}px)`);
      this.updateBombHover(x, y);
      return;
    }

    // 2. Handle Shape Drag
    const shape = this.game.draggedShape();
    if (!shape) return;

    // The logical point for grid calculation is offset from the cursor
    const logicY = y - this.DRAG_Y_OFFSET;

    // Get snapped top-left grid coordinates for the shape
    const placement = this.getSnappedPlacement(x, logicY);

    if (placement) {
        // The shape is over the board area
        // A. Update the preview on the board (ghost cells)
        if (this.game.canPlace(shape.matrix, placement.r, placement.c)) {
            this.game.updatePreview(shape, placement.r, placement.c);
            this.lastValidAnchor = placement;
            this.isPlacementValid.set(true);
        } else {
            this.game.updateInvalidPreview(shape, placement.r, placement.c);
            this.lastValidAnchor = null;
            this.isPlacementValid.set(false);
        }
        
        // B. Calculate the pixel position for the dragged element to snap to
        const gridBounds = this.boardComp()!.getGridBounds()!;
        const size = this.game.gridSize();
        const gapPercent = 0.015;

        const totalGapSpace = (size - 1) * (gridBounds.width * gapPercent);
        const totalCellSpace = gridBounds.width - totalGapSpace;
        const cellWidth = totalCellSpace / size;
        const gapWidth = gridBounds.width * gapPercent;
        const stepWidth = cellWidth + gapWidth;
        
        const snappedPixelX = gridBounds.left + (placement.c * stepWidth);
        const snappedPixelY = gridBounds.top + (placement.r * stepWidth);
        
        // Update the transform so the dragged element snaps to the grid
        this.dragTransform.set(`translate(${snappedPixelX}px, ${snappedPixelY - this.VISUAL_LIFT}px)`);

    } else {
        // The shape is off the board
        // A. Clear any previews
        this.game.clearPreview();
        this.isPlacementValid.set(false);
        this.lastValidAnchor = null;

        // B. The dragged element follows the cursor smoothly
        const offset = this.dragStartOffset();
        const visualX = x - offset.x;
        const visualY = y - offset.y;
        this.dragTransform.set(`translate(${visualX}px, ${visualY - this.VISUAL_LIFT}px)`);
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
  
  private getSnappedPlacement(x: number, y: number): { r: number, c: number } | null {
    const board = this.boardComp();
    if (!board) return null;
    const bounds = board.getGridBounds();
    if (!bounds) return null;

    // Pointer must be over the board to snap
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
        return null;
    }

    const size = this.game.gridSize();
    const shape = this.game.draggedShape();
    if (!shape) return null;

    // Calculate grid cell under logical pointer
    const col = Math.floor(((x - bounds.left) / bounds.width) * size);
    const row = Math.floor(((y - bounds.top) / bounds.height) * size);

    // Center the shape's logic on the cursor's grid cell
    const rOffset = Math.floor(shape.matrix.length / 2);
    const cOffset = Math.floor(shape.matrix[0].length / 2);
    const targetR = row - rOffset;
    const targetC = col - cOffset;

    return { r: targetR, c: targetC };
  }

  private updateBombHover(x: number, y: number) {
    const board = this.boardComp();
    if (!board) return;
    const bounds = board.getGridBounds();
    if (!bounds) return;

    if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        const size = this.game.gridSize();
        const col = Math.floor(((x - bounds.left) / bounds.width) * size);
        const row = Math.floor(((y - bounds.top) / bounds.height) * size);

        if (row >= 0 && row < size && col >= 0 && col < size) {
            this.bombHoverPos.set({r: row, c: col});
        } else {
            this.bombHoverPos.set(null);
        }
    } else {
        this.bombHoverPos.set(null);
    }
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
