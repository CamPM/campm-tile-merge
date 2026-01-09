import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-shape',
  standalone: true,
  template: `
    <div class="grid gap-[2px]" 
         [style.grid-template-columns]="gridCols()"
         [style.width]="'fit-content'">
      @for (row of matrix(); track $index) {
        @for (cell of row; track $index) {
          <div [style.width.px]="cellSize()" 
               [style.height.px]="cellSize()"
               [class]="cell ? 'opacity-100' : 'opacity-0'"
               [style.background-color]="cell ? color() : 'transparent'"
               class="rounded-sm transition-colors duration-200">
          </div>
        }
      }
    </div>
  `
})
export class ShapeComponent {
  matrix = input.required<number[][]>();
  color = input.required<string>();
  cellSize = input<number>(20);

  gridCols = computed(() => `repeat(${this.matrix()[0].length}, 1fr)`);
}