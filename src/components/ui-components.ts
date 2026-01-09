import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-btn',
  standalone: true,
  template: `
    <button (click)="action.emit()" 
            [disabled]="disabled()"
            class="p-3 rounded-full bg-current/10 hover:bg-current/20 text-inherit disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/5">
      <ng-content></ng-content>
      @if (badge()) {
        <span class="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{{badge()}}</span>
      }
    </button>
  `
})
export class IconBtnComponent {
  action = output<void>();
  disabled = input(false);
  badge = input<string | number | null>(null);
}

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pop-in">
      <div class="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
        <button (click)="close.emit()" class="absolute top-4 right-4 text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/></svg>
        </button>
        <h2 class="text-2xl font-bold mb-4 text-white">{{ title() }}</h2>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class ModalComponent {
  title = input.required<string>();
  close = output<void>();
}
