/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Theme } from '../types';
import audioService, { SoundProfileType } from '../services/audioService';
import { Sparkles, Coins, Check, Lock, ChevronRight, Play, Volume2 } from 'lucide-react';
import CellBlock from './CellBlock';

interface CosmeticShopProps {
  currency: number;
  onClose: () => void;
  initialTab?: 'sizes' | 'themes' | 'skins' | 'audio';
  
  // Board Sizes
  unlockedSizes: number[];
  onPurchaseSize: (size: number, price: number) => void;
  boardSize: number;
  onSelectSize: (size: number) => void;
  
  // Themes
  themes: Theme[];
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onPurchaseTheme: (themeId: string, price: number) => void;
  
  // Skins
  unlockedSkinIds: string[];
  selectedSkinId: string;
  onSelectSkin: (skinId: string) => void;
  onPurchaseSkin: (skinId: string, price: number) => void;
  
  // Audio Packs
  unlockedAudioPackIds: string[];
  selectedAudioPackId: string;
  onSelectAudioPack: (audioPackId: string) => void;
  onPurchaseAudioPack: (audioPackId: string, price: number) => void;
}

// Fixed lists for static products
export interface SkinProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  color: string;
}

export const SKIN_PRODUCTS: SkinProduct[] = [
  { id: 'classic', name: 'Classic Slate', price: 0, description: 'Sleek bevel margins with soft surface glare highlights.', color: '#3b82f6' },
  { id: 'timber', name: 'Warm Timber', price: 100, description: 'Wood rings with concentric layers and dark core.', color: '#d97706' },
  { id: 'neko', name: 'Neko Pack', price: 150, description: 'Mimic adorable kitty paws and stylized whiskers overlays.', color: '#ff9494' },
  { id: 'bricks', name: 'Toy Bricks', price: 200, description: 'Raised studs and physical plastic tactile style.', color: '#ef4444' },
  { id: 'iron', name: 'Iron Fortress', price: 250, description: 'Brushed steel sheets featuring corner backing rivets.', color: '#64748b' },
  { id: 'tetris', name: 'Tetris Classic', price: 300, description: 'Glossy double-beveled traditional arcade style block.', color: '#a855f7' },
  { id: 'neon', name: 'Cosmic Neon', price: 200, description: 'Deep dark core center with fluorescent outer glow border.', color: '#10b981' },
  { id: 'obsidian', name: 'Dark Obsidian', price: 250, description: 'Sleek dark charcoal with razor fine carbon textures.', color: '#f59e0b' }
];

export interface AudioProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  demoProfile: SoundProfileType;
}

export const AUDIO_PRODUCTS: AudioProduct[] = [
  { id: 'classic', name: 'Classic Synthesizer', price: 0, description: 'Sweet pure sine chime bells and mellow triangular thuds.', demoProfile: 'classic' },
  { id: 'wood', name: 'Wooden Blocks', price: 80, description: 'Warm organic triangle frequencies and physical wooden claps.', demoProfile: 'wood' },
  { id: 'neko', name: 'Neko Paw Sounds', price: 100, description: 'Cheerful cat meows and sweet vibrating purrs.', demoProfile: 'neko' },
  { id: 'retro', name: 'Retro Arcade', price: 120, description: 'Glorious vintage square waves with fast arpeggiator slides.', demoProfile: 'retro' },
  { id: 'water', name: 'Water Droplets', price: 120, description: 'Gentle bandpass filtered white noise bubble ripples.', demoProfile: 'water' },
  { id: 'cyber', name: 'Cyber Synth', price: 150, description: 'Modern resonant sweeping sawtooth synth plucks.', demoProfile: 'cyber' },
  { id: 'ambient', name: 'Ambient Breeze', price: 150, description: 'Slow-attack smooth sub-octaves and deep atmospheric decay pads.', demoProfile: 'ambient' },
  { id: 'forest', name: 'Forest Nature', price: 180, description: 'Lively bird-like chirps and hollow wooden windchimes.', demoProfile: 'forest' }
];

export interface SizeProduct {
  size: number;
  name: string;
  price: number;
  description: string;
}

export const SIZE_PRODUCTS: SizeProduct[] = [
  { size: 6, name: '6x6 Micro Grid', price: 200, description: 'Ultra fast matches. Gates giant shapes! High tension.' },
  { size: 8, name: '8x8 Classic Arena', price: 0, description: 'The traditional game size. Balanced safety and difficulty.' },
  { size: 10, name: '10x10 Master Matrix', price: 300, description: 'Allows larger 1x5 shapes. Modest threat piece spawn.' },
  { size: 12, name: '12x12 Infinite Board', price: 400, description: 'Huge board with plenty of space for massive combos.' }
];

export default function CosmeticShop({
  currency,
  onClose,
  initialTab = 'themes',
  unlockedSizes,
  onPurchaseSize,
  boardSize,
  onSelectSize,
  themes,
  selectedThemeId,
  onSelectTheme,
  onPurchaseTheme,
  unlockedSkinIds,
  selectedSkinId,
  onSelectSkin,
  onPurchaseSkin,
  unlockedAudioPackIds,
  selectedAudioPackId,
  onSelectAudioPack,
  onPurchaseAudioPack
}: CosmeticShopProps) {
  
  const [activeTab, setActiveTab] = useState<'sizes' | 'themes' | 'skins' | 'audio'>(initialTab);

  // Play audio pack test chord for great player interaction
  const handleTestAudio = (e: React.MouseEvent, profile: SoundProfileType) => {
    e.stopPropagation();
    // Re-verify sound doesn't get blocked by master volume, just play a clean arpeggio
    audioService.playClear(2, profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 xs:p-4 animate-fade-in select-none">
      <div 
        id="cosmetic-shop-panel" 
        className="relative w-full max-w-xl bg-[var(--theme-bg-solid)] border border-[var(--theme-border)] rounded-2xl shadow-2xl p-4 sm:p-5 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-all"
        style={{ touchAction: 'auto' }}
      >
        {/* Glow ambient backdrops */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-2xl"></div>

        {/* TOP STATUS BAR: Wallet and Close control */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--theme-bg-panel)] rounded-lg text-accent-blue border border-[var(--theme-border)]">
              <Sparkles className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-100 tracking-tight leading-none">Cosmetics Marketplace</h2>
              <p className="text-[10px] text-neutral-405 mt-1">Unlock premium themes, board difficulty templates, visual block skins & procedural sfx packs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-blue/15 border border-accent-blue/30 rounded-lg">
              <Coins className="w-4 h-4 text-sky-600 dark:text-accent-blue animate-pulse" />
              <span className="font-mono text-xs font-bold text-sky-700 dark:text-accent-blue">{currency}</span>
            </div>
            <button 
              onClick={() => {
                audioService.playClick();
                onClose();
              }}
              className="text-xs font-bold bg-neutral-800 hover:bg-neutral-700 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-750 transition-colors font-display"
            >
              Close
            </button>
          </div>
        </div>

        {/* COMPACT VIEW TAB MATRIX */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-850 mb-4 text-center font-display">
          <button
            onClick={() => { audioService.playClick(); setActiveTab('sizes'); }}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${activeTab === 'sizes' ? 'bg-accent-blue text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900'}`}
          >
            Grids
          </button>
          <button
            onClick={() => { audioService.playClick(); setActiveTab('themes'); }}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${activeTab === 'themes' ? 'bg-accent-blue text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900'}`}
          >
            Themes
          </button>
          <button
            onClick={() => { audioService.playClick(); setActiveTab('skins'); }}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${activeTab === 'skins' ? 'bg-accent-blue text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900'}`}
          >
            Skins
          </button>
          <button
            onClick={() => { audioService.playClick(); setActiveTab('audio'); }}
            className={`py-1.5 px-0.5 rounded-lg text-[10px] sm:text-xs font-black transition-all ${activeTab === 'audio' ? 'bg-accent-blue text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900'}`}
          >
            SFX Packs
          </button>
        </div>

        {/* CENTRAL SCROLL CATALOG */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin max-h-[55vh]">
          
          {/* TAB 1: BOARD DIFFICULTY SIZES */}
          {activeTab === 'sizes' && (
            <div className="space-y-2">
              {SIZE_PRODUCTS.map((prod) => {
                const isUnlocked = prod.size === 8 || unlockedSizes.includes(prod.size);
                const isSelected = prod.size === boardSize;
                const canAfford = currency >= prod.price;

                return (
                  <div
                    key={prod.size}
                    onClick={() => {
                      if (isUnlocked && !isSelected) {
                        onSelectSize(prod.size);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-blue/15 border-accent-blue shadow-md'
                        : isUnlocked
                          ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-800/20'
                          : 'bg-neutral-950/20 border-neutral-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Grid representation avatar */}
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center font-mono font-black text-accent-blue text-xs shadow-inner">
                        {prod.size}x{prod.size}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-sans font-bold text-neutral-200 text-sm leading-none">{prod.name}</h3>
                          {prod.size === 8 && (
                            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-750 rounded text-[8px] text-neutral-450 uppercase tracking-widest font-mono">Starter</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 max-w-[260px] sm:max-w-md">{prod.description}</p>
                      </div>
                    </div>

                    {/* CTA Controller */}
                    <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      {isUnlocked ? (
                        isSelected ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectSize(prod.size);
                            }}
                            className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg text-xs font-bold transition-all font-display"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseSize(prod.size, prod.price);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 shadow-lg hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{prod.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: THEMES (24 TOTAL) */}
          {activeTab === 'themes' && (
            <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {themes.map((theme) => {
                const isSelected = theme.id === selectedThemeId;
                const canAfford = currency >= theme.price;

                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      if (theme.unlocked && !isSelected) {
                        onSelectTheme(theme.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-blue/15 border-accent-blue shadow-md'
                        : theme.unlocked
                          ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-805/30'
                          : 'bg-neutral-950/20 border-neutral-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Round theme preview */}
                      <div className={`w-9 h-9 rounded-lg ${theme.bgClass} border border-white/5 flex items-center justify-center shadow-inner relative overflow-hidden flex-shrink-0`}>
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: theme.primaryColor, boxShadow: `0 0 6px ${theme.primaryColor}` }} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-sans font-bold text-neutral-200 text-xs truncate max-w-[100px] leading-tight">{theme.name}</h3>
                          {theme.price === 0 && (
                            <span className="text-[7px] font-mono text-accent-blue border border-accent-blue/30 px-1 py-0.2 rounded uppercase leading-none bg-accent-blue/10">Free</span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-450 mt-0.5 truncate max-w-[140px] leading-none">{theme.description}</p>
                      </div>
                    </div>

                    {/* Control column */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {theme.unlocked ? (
                        isSelected ? (
                          <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-[10px] font-bold">
                            Active
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectTheme(theme.id);
                            }}
                            className="px-2.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-[10px] font-bold transition-all font-display"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseTheme(theme.id, theme.price);
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1.5 transition-all ${
                            canAfford
                              ? 'bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 font-bold hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span className="font-mono">{theme.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: SKINS (CELL OVERRIDES) */}
          {activeTab === 'skins' && (
            <div className="space-y-2">
              {SKIN_PRODUCTS.map((skin) => {
                const isUnlocked = unlockedSkinIds.includes(skin.id);
                const isSelected = skin.id === selectedSkinId;
                const canAfford = currency >= skin.price;

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      if (isUnlocked && !isSelected) {
                        onSelectSkin(skin.id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-blue/15 border-accent-blue shadow-md'
                        : isUnlocked
                          ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-800/20'
                          : 'bg-neutral-950/20 border-neutral-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Exact CellBlock preview of active Skin style */}
                      <div className="w-11 h-11 bg-neutral-900 p-1 rounded-xl border border-neutral-850 flex items-center justify-center shadow-inner flex-shrink-0">
                        <div className="w-8 h-8">
                           <CellBlock filled={true} color={skin.color} styleId={skin.id} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-sans font-bold text-neutral-200 text-sm leading-none">{skin.name}</h3>
                          {skin.price === 0 && (
                            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-750 rounded text-[8px] text-neutral-450 uppercase tracking-widest font-mono">Starter</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 max-w-[240px] sm:max-w-md">{skin.description}</p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      {isUnlocked ? (
                        isSelected ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectSkin(skin.id);
                            }}
                            className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg text-xs font-bold transition-all font-display"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseSkin(skin.id, skin.price);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{skin.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: AUDIO SYNTHESIZER PACKS */}
          {activeTab === 'audio' && (
            <div className="space-y-2">
              {AUDIO_PRODUCTS.map((ap) => {
                const isUnlocked = unlockedAudioPackIds.includes(ap.id);
                const isSelected = ap.id === selectedAudioPackId;
                const canAfford = currency >= ap.price;

                return (
                  <div
                    key={ap.id}
                    onClick={() => {
                      if (isUnlocked && !isSelected) {
                        onSelectAudioPack(ap.id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-blue/15 border-accent-blue shadow-md'
                        : isUnlocked
                          ? 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-800/20'
                          : 'bg-neutral-950/20 border-neutral-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Play Demo Button */}
                      <button
                        onClick={(e) => handleTestAudio(e, ap.demoProfile)}
                        className="w-10 h-10 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-accent-blue border border-neutral-800 flex items-center justify-center shadow-md active:scale-95 transition-all group"
                        title="Play Test Sound"
                      >
                        <Volume2 className="w-4 h-4 text-accent-blue group-hover:scale-110" />
                      </button>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-sans font-bold text-neutral-200 text-sm leading-none">{ap.name}</h3>
                          {ap.price === 0 && (
                            <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-750 rounded text-[8px] text-neutral-450 uppercase tracking-widest font-mono">Starter</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 max-w-[220px] sm:max-w-md">{ap.description}</p>
                      </div>
                    </div>

                    {/* CTA Trigger */}
                    <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      {isUnlocked ? (
                        isSelected ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectAudioPack(ap.id);
                            }}
                            className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg text-xs font-bold transition-all font-display"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseAudioPack(ap.id, ap.price);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{ap.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* BOTTOM METRIC: Wallet Affordability Guidance */}
        <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-450">
          <span>Achieve streaks and clear grid columns to earn precious gold coins!</span>
          <span className="font-mono">Catalog: 4 Modules</span>
        </div>
      </div>
    </div>
  );
}
