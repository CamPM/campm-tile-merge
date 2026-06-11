/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CellBlockProps {
  filled: boolean;
  color?: string;       // Background solid hex fallback
  styleId: string;       // Active skin theme ID
  flash?: boolean;       // Clear flash animation state
  isEmptySlot?: boolean; // For empty board background grid boxes
  ghost?: boolean;       // Semi-translucent layout layout preview
  invalid?: boolean;     // Glowing red overlap error highlight
  isSingle?: boolean;    // Custom prop for Neko skin single cell identification
  isEndCap?: boolean;    // Custom prop for Neko skin endcap cell identification
  endCapDir?: 'up' | 'down' | 'left' | 'right'; // Rotation direction for paws
}

export default function CellBlock({
  filled,
  color = '#4b5563', // Slate gray default
  styleId,
  flash = false,
  isEmptySlot = false,
  ghost = false,
  invalid = false,
  isSingle = false,
  isEndCap = false,
  endCapDir = 'down'
}: CellBlockProps) {
  
  // 1. If it's an empty cell on the board background
  if (isEmptySlot) {
    return (
      <div 
        className="w-full aspect-square border rounded-md transition-colors duration-200 flex items-center justify-center"
        style={{ backgroundColor: 'var(--grid-cell-empty)', borderColor: 'var(--border-ui)' }}
      >
        {/* Subtle decorative dot structure inside empty cells */}
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-800/20 dark:bg-neutral-650/10" />
      </div>
    );
  }

  // 2. If it is an invalid placement shadow, render a red visual footprint
  if (invalid) {
    return (
      <div 
        className="w-full aspect-square bg-red-500/40 border-2 border-red-500 rounded-md animate-pulse flex items-center justify-center"
        style={{ boxShadow: '0 0 8px #ef4444' }}
      >
        <div className="w-2 h-2 rounded-full bg-red-400" />
      </div>
    );
  }

  // 3. Set standard styles based on theme style ID
  let styleClasses = '';
  let inlineStyles: React.CSSProperties = {};

  if (ghost) {
    inlineStyles.opacity = 0.55;
  }

  // Apply clear flashing animation if active
  if (flash) {
    styleClasses += ' animate-ping scale-110 !bg-white !border-white z-10 duration-100 ';
  }

  // Set hex backings
  if (filled || ghost) {
    inlineStyles.backgroundColor = color;
    if (!ghost) {
      inlineStyles.boxShadow = 'var(--theme-block-shadow)';
    }
  }

  // Render individual structural overlays based on Theme IDs
  switch (styleId) {
    case 'timber': {
      // Warm timber style has natural wooden lines
      styleClasses += ' rounded-md border-2 border-amber-900/70 shadow-sm relative overflow-hidden flex items-center justify-center ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={inlineStyles}
        >
          {/* Circular growth rings overlay */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-amber-950/20 pointer-events-none" />
          <div className="absolute w-[45%] h-[45%] rounded-full border border-amber-950/20 pointer-events-none" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-950/25 pointer-events-none" />
        </div>
      );
    }

    case 'glass':
    case 'neko': {
      // Neko (Cat Face / Paw) Pack skin overlaying the dynamic active theme colors
      styleClasses += ' rounded-[12px] border-t-2 border-l-2 border-white/35 border-b-2 border-r-2 border-black/35 shadow-md relative overflow-hidden flex items-center justify-center ';
      
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={inlineStyles}
        >
          {isSingle && (
            <>
              {/* Cute inner cat ear silhouettes at the top corners of the block */}
              <div className="absolute top-[1px] left-[3px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-black/25 pointer-events-none transform -rotate-12" />
              <div className="absolute top-[1px] right-[3px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-black/25 pointer-events-none transform rotate-12" />
            </>
          )}
          
          {isSingle ? (
            /* Minimalist stylized cat face overlay (eyes, nose, whiskers) */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 pointer-events-none">
              {/* Cute little eyes */}
              <div className="flex gap-2.5 mb-0.5">
                <div className="w-[3px] h-[3px] rounded-full bg-black/60" />
                <div className="w-[3px] h-[3px] rounded-full bg-black/60" />
              </div>
              {/* Cute little nose/mouth */}
              <div className="w-1.5 h-1 bg-[#ff9494] rounded-full" />
              <div className="text-[6px] font-bold leading-none text-black/60 mt-[-1.5px] font-sans">w</div>
              
              {/* Left and Right whiskers */}
              <div className="absolute left-1 w-2 h-[1px] bg-black/30 transform rotate-6" />
              <div className="absolute left-1 w-2 h-[1px] bg-black/30 top-[54%] transform -rotate-6" />
              <div className="absolute right-1 w-2 h-[1px] bg-black/30 transform -rotate-6" />
              <div className="absolute right-1 w-2 h-[1px] bg-black/30 top-[54%] transform rotate-6" />
            </div>
          ) : isEndCap ? (
            /* Soft rounded pink/accent "toe beans" resembling a cat paw */
            <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transform ${endCapDir === 'up' ? 'rotate-180' : endCapDir === 'left' ? 'rotate-90' : endCapDir === 'right' ? '-rotate-90' : ''}`}>
              {/* Smaller toe beans */}
              <div className="flex gap-[3px] mb-0.5 justify-center">
                <div className="w-[3.5px] h-[3.5px] rounded-full bg-pink-300 border-[0.5px] border-pink-400" />
                <div className="w-[4.5px] h-[4.5px] rounded-full bg-pink-300 border-[0.5px] border-pink-400 -translate-y-[1px]" />
                <div className="w-[4.5px] h-[4.5px] rounded-full bg-pink-300 border-[0.5px] border-pink-400 -translate-y-[1px]" />
                <div className="w-[3.5px] h-[3.5px] rounded-full bg-pink-300 border-[0.5px] border-pink-400" />
              </div>
              {/* Larger main paw pad */}
              <div className="w-3.5 h-3 bg-pink-300 border-[0.5px] border-pink-400 rounded-[5px] shadow-sm transform translate-y-[0.5px]" />
            </div>
          ) : (
            /* Inside tiles of a large shape: smooth, minimal block texture */
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            </div>
          )}
        </div>
      );
    }

    case 'bricks': {
      // Toy bricks has Lego-like stud button
      styleClasses += ' rounded-xs border-b-2 border-r-2 border-black/30 relative flex items-center justify-center p-[12%] ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={inlineStyles}
        >
          {/* LEGO-like round stud dot */}
          <div 
            className="w-full h-full rounded-full border border-black/20 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 1px rgba(0,0,0,0.25)'
            }}
          >
            {/* Extremely tiny center ring for stud decoration */}
            <div className="w-[30%] h-[30%] rounded-full bg-black/10" />
          </div>
        </div>
      );
    }

    case 'iron': {
      // Industrial heavy iron panels - 4px structural borders, bevel overlays and noise
      styleClasses += ' rounded-xs border-4 border-black/40 shadow-inner relative flex items-center justify-center ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={{
            ...inlineStyles,
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), inset 0 -1px 3px rgba(0,0,0,0.5)'
          }}
        >
          {/* Corner structural rivets */}
          <div className="absolute top-0.5 left-0.5 w-[3px] h-[3px] rounded-full bg-black/30" />
          <div className="absolute top-0.5 right-0.5 w-[3px] h-[3px] rounded-full bg-black/30" />
          <div className="absolute bottom-0.5 left-0.5 w-[3px] h-[3px] rounded-full bg-black/30" />
          <div className="absolute bottom-0.5 right-0.5 w-[3px] h-[3px] rounded-full bg-black/30" />
          
          {/* Noise/beveled texture overlay */}
          <div className="w-[60%] h-[60%] border-[1px] border-black/25 bg-black/5 flex items-center justify-center rounded-xs">
            <div className="w-[4px] h-[4px] bg-black/35 rounded-full" />
          </div>
        </div>
      );
    }

    case 'tetris': {
      // Classic gaming beveled blocks with solid outer frames and glossy diagonal reflection
      styleClasses += ' rounded-md border-t-[3px] border-l-[3px] border-white/40 border-b-[3px] border-r-[3px] border-black/45 relative overflow-hidden flex items-center justify-center ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={{
            ...inlineStyles,
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {/* Inner glossy rectangle */}
          <div className="absolute inset-[10%] border border-white/20 bg-white/5 shadow-inner" />
          {/* Shiny glaze sheen */}
          <div className="absolute top-0 left-0 w-full h-[30%] bg-white/25 transform -skew-y-12" />
        </div>
      );
    }

    case 'neon': {
      // Cosmic Neon: High contrast deep glowing borders with dark center core
      styleClasses += ' rounded-lg border-2 relative flex items-center justify-center overflow-hidden bg-neutral-950/80 ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={{
            ...inlineStyles,
            borderColor: color,
            boxShadow: `0 0 8px ${color}, inset 0 0 4px ${color}`
          }}
        >
          {/* Glowing central core */}
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
        </div>
      );
    }

    case 'obsidian': {
      // Dark sleek obsidian with metallic hairline patterns and golden corner rivets
      // Using a composite styling method with semi-translucent dark gradient so the dynamic theme colors shine through as base hue
      styleClasses += ' rounded-xs border-2 border-neutral-900 shadow-2xl relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-black/40 to-black/75 ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={{
            ...inlineStyles,
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 3px rgba(0,0,0,0.4)'
          }}
        >
          {/* Sleek diagonal metallic lines */}
          <div className="absolute top-0 left-[-50%] w-[200%] h-full bg-repeating-linear-gradient opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 5px)' }} />
          {/* Amber neon micro core */}
          <div className="w-[45%] h-[45%] border border-[#f59e0b]/40 rounded-xs bg-[#f59e0b]/5 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full shadow-[0_0_4px_#f59e0b]" />
          </div>
        </div>
      );
    }

    case 'classic':
    default: {
      // Classic flat color block with light bevel gleam
      styleClasses += ' rounded-sm border-t border-l border-white/25 border-b border-r border-black/30 shadow-xs relative overflow-hidden ';
      return (
        <div 
          className={`w-full aspect-square ${styleClasses}`}
          style={inlineStyles}
        >
          {/* Elegant top light shine */}
          <div className="absolute top-0 left-0 w-full h-[15%] bg-white/10" />
        </div>
      );
    }
  }
}
