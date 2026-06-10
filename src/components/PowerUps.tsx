/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCw, Shuffle, Bomb, Coins } from 'lucide-react';
import audioService from '../services/audioService';

interface PowerUpsProps {
  currency: number;
  activePowerUp: 'bomb' | null;
  onRotateHand: () => void;
  onRefreshHand: () => void;
  onToggleBombMode: () => void;
  handHasCards: boolean;
}

export default function PowerUps({
  currency,
  activePowerUp,
  onRotateHand,
  onRefreshHand,
  onToggleBombMode,
  handHasCards
}: PowerUpsProps) {
  
  const rotateCost = 50;
  const refreshCost = 100;
  const bombCost = 200;

  const canAffordRotate = currency >= rotateCost;
  const canAffordRefresh = currency >= refreshCost;
  const canAffordBomb = currency >= bombCost;

  return (
    <div 
      id="power-ups-tray"
      className="w-full max-w-[420px] mx-auto bg-neutral-950/80 border border-neutral-900 rounded-2xl p-3 shadow-xl mt-3 flex items-center justify-between"
    >
      <div className="flex flex-col">
        <span className="font-sans font-bold text-xs text-neutral-300 tracking-tight">Tactical Lifelines</span>
        <span className="text-[10px] text-neutral-500 font-medium">Use coins to trigger grid modifiers</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Rotate Hand Power-Up */}
        <button
          id="powerup-rotate"
          disabled={!canAffordRotate || !handHasCards}
          onClick={() => {
            audioService.playClick();
            onRotateHand();
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all relative ${
            canAffordRotate && handHasCards
              ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 hover:scale-105 active:scale-95'
              : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
          }`}
          title="Rotate Hand Shapes (Cost: 50)"
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold leading-none">
            <RotateCw className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">{rotateCost}</span>
          </div>
          <span className="text-[9px] font-sans text-neutral-400">Rotate Hand</span>
        </button>

        {/* Refresh Hand Power-Up */}
        <button
          id="powerup-refresh"
          disabled={!canAffordRefresh}
          onClick={() => {
            audioService.playClick();
            onRefreshHand();
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all relative ${
            canAffordRefresh
              ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 hover:scale-105 active:scale-95'
              : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
          }`}
          title="Refresh Hand Items (Cost: 100)"
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold leading-none">
            <Shuffle className="w-4 h-4 text-violet-400" />
            <span className="font-mono">{refreshCost}</span>
          </div>
          <span className="text-[9px] font-sans text-neutral-400">Reroll Hand</span>
        </button>

        {/* Bomb Power-Up */}
        <button
          id="powerup-bomb"
          disabled={!canAffordBomb && activePowerUp !== 'bomb'}
          onClick={() => {
            audioService.playClick();
            onToggleBombMode();
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all relative ${
            activePowerUp === 'bomb'
              ? 'bg-red-500/20 border-red-500 text-red-100 ring-2 ring-red-500/30 scale-105 animate-pulse'
              : canAffordBomb
                ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 hover:scale-105 active:scale-95'
                : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
          }`}
          title="Active 3x3 Grid Bomb (Cost: 200)"
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold leading-none">
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="font-mono">{bombCost}</span>
          </div>
          <span className="text-[9px] font-sans text-neutral-400">
            {activePowerUp === 'bomb' ? 'Cancel' : '3x3 Bomb'}
          </span>
        </button>
      </div>
    </div>
  );
}
