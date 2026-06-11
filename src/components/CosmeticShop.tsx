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

// Fixed lists for static skin products
export interface SkinProduct {
  id: string;
  name: string;
  description: string;
  price: number;
}

const SKIN_PRODUCTS: SkinProduct[] = [
  { id: 'classic', name: 'Classic Gloss', description: 'Default sharp bevel tiles', price: 0 },
  { id: 'neko', name: 'Neko Kingdom', description: 'Cute cat ears and little toe paws', price: 60 },
  { id: 'timber', name: 'Warm Timber', description: 'Concentric rustic wooden log textures', price: 100 },
  { id: 'fortress', name: 'Iron Fortress', description: 'Industrial riveted armor cladding plates', price: 120 }
];

// Fixed lists for static sound pack products
export interface AudioProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  type: SoundProfileType;
}

const AUDIO_PRODUCTS: AudioProduct[] = [
  { id: 'classic', name: 'Classic Synthesizer', description: 'Default melodic retro digital bells', price: 0, type: 'classic' },
  { id: 'ambient', name: 'Ambient Breeze', description: 'Calm sweeping lowpass filter winds', price: 50, type: 'ambient' },
  { id: 'wood', name: 'Wooden Blocks', description: 'Organic hollow percussion block snaps', price: 80, type: 'wood' },
  { id: 'water', name: 'Water Droplets', description: 'Liquid high-frequency pitch-sweeping pops', price: 90, type: 'water' }
];

// Economy Helper: Multiplies base database prices by 5x and rounds to nearest 50 coins
function getBalancedPrice(basePrice: number): number {
  if (basePrice === 0) return 0;
  const scaled = basePrice * 5;
  return Math.round(scaled / 50) * 50;
}

export default function CosmeticShop({
  currency,
  onClose,
  initialTab = 'sizes',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 flex flex-col max-h-[85vh] transform scale-100 transition-all">
        
        {/* HEADER BLOCK */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-850">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-[#95e2fc]/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#95e2fc]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-neutral-50 tracking-tight">Cosmetic Marketplace</h2>
              <p className="text-[11px] text-neutral-400 font-body">Personalize your grids, blocks, and sounds</p>
            </div>
          </div>
          
          {/* ENHANCED ACCESS/TOUCH HITBOX CLOSE BUTTON */}
          <button
            onClick={() => {
              audioService.playClick();
              onClose();
            }}
            className="p-3 -m-3 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-neutral-800/50"
            aria-label="Close Marketplace"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ACCESS-ENHANCED WALLET HEADER ACCENT COUNTER */}
        <div className="mt-3 p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between min-h-[48px]">
          <span className="text-xs text-neutral-400 font-body">Your Account Balance</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <Coins className="w-4 h-4 text-[#95e2fc]" />
            <span className="text-sm font-black font-mono text-[#95e2fc]">{currency}</span>
          </div>
        </div>

        {/* ACCESSIBILITY VIEW NAVIGATION TAB STRIP */}
        <div className="mt-4 flex gap-1 p-1 bg-neutral-950 border border-neutral-850 rounded-xl overflow-x-auto scrollbar-none min-h-[46px]">
          {(['sizes', 'themes', 'skins', 'audio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                audioService.playClick();
                setActiveTab(tab);
              }}
              className={`flex-1 text-center py-2 px-1 text-xs font-bold rounded-lg transition-all capitalize min-h-[38px] flex items-center justify-center ${
                activeTab === tab
                  ? 'bg-[#95e2fc] text-neutral-950 shadow-md scale-[1.02]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              {tab === 'audio' ? 'SFX Packs' : tab}
            </button>
          ))}
        </div>

        {/* SCROLLABLE MARKETPLACE INVENTORY MODULE SLOTS */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[45vh] scrollbar-thin">
          
          {/* TAB CATEGORY 1: GRID DIMENSIONS */}
          {activeTab === 'sizes' && (
            <div className="space-y-2">
              {[6, 8, 10, 12].map((size) => {
                const isUnlocked = size === 8 || unlockedSizes.includes(size);
                const isEquipped = boardSize === size;
                // Base dimension size evaluations scaled and rounded via economy rule
                const basePrice = size === 6 ? 30 : size === 10 ? 50 : size === 12 ? 80 : 0;
                const dynamicPrice = getBalancedPrice(basePrice);
                const canAfford = currency >= dynamicPrice;

                return (
                  <div key={size} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped ? 'bg-neutral-850/40 border-[#95e2fc]/40' : 'bg-neutral-950/30 border-neutral-850'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center border border-neutral-800 text-xs font-black font-mono text-neutral-300">
                        {size}x{size}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-200 font-display">{size} x {size} Clean Matrix</h3>
                        <p className="text-[10px] text-neutral-400 font-body">
                          {size === 8 ? 'Standard balance framework' : `Alters spatial complexity layout to ${size * size} grids`}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#95e2fc]" /> Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectSize(size);
                            }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-lg transition-transform hover:scale-105"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseSize(size, dynamicPrice);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-[#95e2fc] hover:bg-[#95e2fc]/90 text-neutral-950 hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{dynamicPrice}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB CATEGORY 2: COLOR SCHEME THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-2">
              {themes.map((th) => {
                const isUnlocked = th.price === 0 || th.isUnlocked;
                const isEquipped = selectedThemeId === th.id;
                const dynamicPrice = getBalancedPrice(th.price);
                const canAfford = currency >= dynamicPrice;

                return (
                  <div key={th.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped ? 'bg-neutral-850/40 border-[#95e2fc]/40' : 'bg-neutral-950/30 border-neutral-850'
                  }`}>
                    <div className="flex items-center gap-3">
                      {/* Grid Mini-Preview Swatches */}
                      <div className="grid grid-cols-2 gap-0.5 p-1 w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="rounded-sm" style={{ backgroundColor: th.colors?.primary || '#3b82f6' }} />
                        <div className="rounded-sm" style={{ backgroundColor: th.colors?.accent || '#f43f5e' }} />
                        <div className="rounded-sm" style={{ backgroundColor: th.colors?.secondary || '#10b981' }} />
                        <div className="rounded-sm" style={{ backgroundColor: th.colors?.muted || '#eab308' }} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-200 font-display">{th.name}</h3>
                        <p className="text-[10px] text-neutral-400 font-body">Alters color highlights & interface palettes</p>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#95e2fc]" /> Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectTheme(th.id);
                            }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-lg transition-transform hover:scale-105"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseTheme(th.id, dynamicPrice);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-[#95e2fc] hover:bg-[#95e2fc]/90 text-neutral-950 hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{dynamicPrice}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB CATEGORY 3: BLOCK TEXTURE GEOMETRIC SKINS */}
          {activeTab === 'skins' && (
            <div className="space-y-2">
              {SKIN_PRODUCTS.map((sk) => {
                const isUnlocked = sk.price === 0 || unlockedSkinIds.includes(sk.id);
                const isEquipped = selectedSkinId === sk.id;
                const dynamicPrice = getBalancedPrice(sk.price);
                const canAfford = currency >= dynamicPrice;

                return (
                  <div key={sk.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped ? 'bg-neutral-850/40 border-[#95e2fc]/40' : 'bg-neutral-950/30 border-neutral-850'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center p-1.5">
                        <CellBlock type={1} skinOverride={sk.id} isSamplePreview={true} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-200 font-display">{sk.name}</h3>
                        <p className="text-[10px] text-neutral-400 font-body">{sk.description}</p>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#95e2fc]" /> Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              audioService.playClick();
                              onSelectSkin(sk.id);
                            }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-lg transition-transform hover:scale-105"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            audioService.playClick();
                            onPurchaseSkin(sk.id, dynamicPrice);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-[#95e2fc] hover:bg-[#95e2fc]/90 text-neutral-950 hover:scale-[1.02]'
                              : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-mono">{dynamicPrice}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB CATEGORY 4: PREMIUM PRE-BUILT SOUND PACKS */}
{activeTab === 'audio' && (
  <div className="space-y-2">
    {AUDIO_PRODUCTS.map((ap) => {
      const isUnlocked = ap.price === 0 || unlockedAudioPackIds.includes(ap.id);
      const isEquipped = selectedAudioPackId === ap.id;
      const dynamicPrice = getBalancedPrice(ap.price);
      const canAfford = currency >= dynamicPrice;

      return (
        <div key={ap.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
          isEquipped ? 'bg-neutral-850/40 border-[#95e2fc]/40' : 'bg-neutral-950/30 border-neutral-850'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Audits preview notes using targeting profile mechanisms
                audioService.playCombo(1, ap.type);
              }}
              className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-[#95e2fc] hover:border-[#95e2fc]/30 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95"
              title="Preview audio chime"
            >
              <Play className="w-4 h-4 fill-current opacity-70 group-hover:opacity-100" />
            </button>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-bold text-neutral-200 font-display">{ap.name}</h3>
                <Volume2 className="w-3 h-3 text-neutral-500" />
              </div>
              <p className="text-[10px] text-neutral-400 font-body">{ap.description}</p>
            </div>
          </div>

          <div>
            {isUnlocked ? (
              isEquipped ? (
                <span className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-lg flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#95e2fc]" /> Equipped
                </span>
              ) : (
                <button
                  onClick={() => {
                    audioService.playClick();
                    onSelectAudioPack(ap.id);
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-lg transition-transform hover:scale-105"
                >
                  Equip
                </button>
              )
            ) : (
              <button
                disabled={!canAfford}
                onClick={() => {
                  audioService.playClick();
                  onPurchaseAudioPack(ap.id, dynamicPrice);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                  canAfford
                    ? 'bg-[#95e2fc] hover:bg-[#95e2fc]/90 text-neutral-950 hover:scale-[1.02]'
                    : 'bg-neutral-800 border border-neutral-750 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span className="font-mono">{dynamicPrice}</span>
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}
          
