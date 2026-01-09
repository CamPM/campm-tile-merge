import { Component, inject, output, signal } from '@angular/core';
import { GameService } from '../services/game.service';
import { ModalComponent } from './ui-components';

type Tab = 'boards' | 'sounds' | 'skins' | 'themes';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal title="Shop" (close)="close.emit()">
      <!-- Wallet Header in Shop -->
      <div class="absolute top-6 right-16 flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full text-sm font-bold border border-white/5">
         <span class="text-yellow-400">$</span> <span class="text-white">{{ game.currency() }}</span>
      </div>

      <!-- Tabs -->
      <div class="flex p-1 bg-black/20 rounded-lg mb-4 overflow-x-auto gap-1">
        <button (click)="activeTab.set('boards')" 
                class="flex-1 min-w-[60px] py-2 rounded-md text-xs font-bold transition-colors"
                [class]="activeTab() === 'boards' ? 'bg-white text-slate-900 shadow' : 'text-white/60 hover:text-white'">
          Boards
        </button>
        <button (click)="activeTab.set('sounds')" 
                class="flex-1 min-w-[60px] py-2 rounded-md text-xs font-bold transition-colors"
                [class]="activeTab() === 'sounds' ? 'bg-white text-slate-900 shadow' : 'text-white/60 hover:text-white'">
          Sounds
        </button>
        <button (click)="activeTab.set('skins')" 
                class="flex-1 min-w-[60px] py-2 rounded-md text-xs font-bold transition-colors"
                [class]="activeTab() === 'skins' ? 'bg-white text-slate-900 shadow' : 'text-white/60 hover:text-white'">
          Skins
        </button>
        <button (click)="activeTab.set('themes')" 
                class="flex-1 min-w-[60px] py-2 rounded-md text-xs font-bold transition-colors"
                [class]="activeTab() === 'themes' ? 'bg-white text-slate-900 shadow' : 'text-white/60 hover:text-white'">
          Themes
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        
        <!-- Boards (Grids) -->
        @if (activeTab() === 'boards') {
          @for (grid of game.gridOptions; track grid.size) {
             <div class="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer relative"
                  (click)="game.buyGrid(grid.size)"
                  [class.ring-2]="game.gridSize() === grid.size"
                  [class.ring-green-400]="game.gridSize() === grid.size">
                
                <div class="h-16 w-full rounded mb-2 bg-black/20 flex items-center justify-center font-mono text-xl font-bold text-white/80">
                   {{ grid.size }}x{{ grid.size }}
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="font-bold text-xs text-white truncate">{{ grid.name }}</span>
                  @if (game.ownedGrids().includes(grid.size)) {
                    <span class="text-[10px] uppercase font-bold text-green-400">Owned</span>
                  } @else {
                    <div class="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                      <span>$</span><span>{{ grid.cost }}</span>
                    </div>
                  }
                </div>
             </div>
          }
        }

        <!-- Sounds (Audio) -->
        @if (activeTab() === 'sounds') {
          @for (pack of game.soundPacks; track pack.id) {
             <div class="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer relative"
                  (click)="game.buySoundPack(pack.id)"
                  [class.ring-2]="game.currentSoundPackId() === pack.id"
                  [class.ring-green-400]="game.currentSoundPackId() === pack.id">
                
                <div class="h-16 w-full rounded mb-2 bg-black/20 flex items-center justify-center text-white/60 relative overflow-hidden">
                   <!-- Visualizer effect placeholder -->
                   <div class="flex gap-1 items-end h-8">
                     <div class="w-1 bg-current animate-pulse h-4 rounded-full"></div>
                     <div class="w-1 bg-current animate-pulse h-8 rounded-full" style="animation-delay: 0.1s"></div>
                     <div class="w-1 bg-current animate-pulse h-6 rounded-full" style="animation-delay: 0.2s"></div>
                     <div class="w-1 bg-current animate-pulse h-3 rounded-full" style="animation-delay: 0.3s"></div>
                   </div>
                </div>
                
                <div class="flex flex-col">
                  <span class="font-bold text-xs text-white truncate">{{ pack.name }}</span>
                  <span class="text-[10px] text-white/50 truncate mb-1">{{ pack.description }}</span>
                  
                  <div class="flex justify-between items-center w-full">
                     @if (game.ownedSoundPacks().includes(pack.id)) {
                        <span class="text-[10px] uppercase font-bold text-green-400">Owned</span>
                     } @else {
                        <div class="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                           <span>$</span><span>{{ pack.cost }}</span>
                        </div>
                     }
                  </div>
                </div>
             </div>
          }
        }

        <!-- Skins (Blocks) -->
        @if (activeTab() === 'skins') {
          @for (skin of game.blockSkins; track skin.id) {
             <div class="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer relative"
                  (click)="game.buySkin(skin.id)"
                  [class.ring-2]="game.currentSkinId() === skin.id"
                  [class.ring-green-400]="game.currentSkinId() === skin.id">
                
                <div class="h-16 w-full rounded mb-2 bg-black/20 flex items-center justify-center gap-1">
                   <!-- Better Preview block style -->
                   <div class="w-10 h-10 bg-blue-500 relative flex items-center justify-center" [class]="skin.cellStyle">
                     @if(skin.id === 'toy') {
                       <div class="w-[60%] h-[60%] rounded-full bg-white/20 shadow-sm border border-black/5"></div>
                     }
                     @if(skin.id === 'voxel') {
                       <div class="absolute inset-0 border-t-4 border-l-4 border-white/40 border-b-4 border-r-4 border-black/20"></div>
                       <div class="absolute inset-[4px] border border-black/10 bg-gradient-to-br from-white/10 to-transparent"></div>
                     }
                   </div>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="font-bold text-xs text-white truncate">{{ skin.name }}</span>
                  @if (game.ownedSkins().includes(skin.id)) {
                    <span class="text-[10px] uppercase font-bold text-green-400">Owned</span>
                  } @else {
                    <div class="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                      <span>$</span><span>{{ skin.cost }}</span>
                    </div>
                  }
                </div>
             </div>
          }
        }

        <!-- Themes (Colors) -->
        @if (activeTab() === 'themes') {
          @for (theme of game.themes; track theme.id) {
            <div class="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer relative"
                 (click)="game.buyTheme(theme.id)"
                 [class.ring-2]="game.currentThemeId() === theme.id"
                 [class.ring-green-400]="game.currentThemeId() === theme.id">
              
              <div class="h-16 w-full rounded mb-2 flex flex-wrap gap-1 p-1 bg-black/20 content-center justify-center overflow-hidden">
                @for (color of theme.colors; track $index) {
                  <div class="w-3 h-3 rounded-full shadow-sm" [style.background-color]="color"></div>
                }
              </div>
              
              <div class="flex justify-between items-center">
                <span class="font-bold text-xs text-white truncate max-w-[70px]">{{ theme.name }}</span>
                @if (game.ownedThemes().includes(theme.id)) {
                   <span class="text-[10px] uppercase font-bold text-green-400">Owned</span>
                } @else {
                   <div class="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                     <span>$</span><span>{{ theme.cost }}</span>
                   </div>
                }
              </div>
            </div>
          }
        }

      </div>
    </app-modal>
  `
})
export class StoreComponent {
  game = inject(GameService);
  close = output<void>();
  activeTab = signal<Tab>('boards');
}