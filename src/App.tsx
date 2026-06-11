/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cell, Shape, Theme, BoardSize } from './types';
import GameBoard from './components/GameBoard';
import HandQueue from './components/HandQueue';
import PowerUps from './components/PowerUps';
import CosmeticShop from './components/CosmeticShop';
import CellBlock from './components/CellBlock';
import audioService from './services/audioService';
import { 
  generateVerifiedHand, 
  canFitAt, 
  canFitAnywhere, 
  rotateMatrixClockwise,
  getBoardDensity
} from './utils/shapeGenerator';
import { generateOfflineBundle } from './utils/offlineCompiler';
import { 
  Volume2, 
  VolumeX, 
  Coins, 
  Sparkles, 
  RotateCcw, 
  Flame, 
  Grid,
  Settings,
  Lock,
  Store,
  X,
  Share,
  PlusSquare,
  Bomb
} from 'lucide-react';
import {
  isInstallable,
  isInstalledMode,
  getDeferredPrompt,
  clearDeferredPrompt
} from './services/game.service';

const STATIC_THEMES: Theme[] = [
  { 
    id: 'classic', 
    name: 'Classic Slate', 
    price: 0, 
    unlocked: true, 
    primaryColor: '#3b82f6', 
    bgClass: 'bg-[#121212]', 
    boardBg: 'bg-[#0a0a0a]', 
    cellClass: 'classic', 
    soundProfile: 'classic', 
    description: 'Minimal slate tiles styled with linear-bevel light-shimmers.' 
  },
  { 
    id: 'cosmic', 
    name: 'Cosmic Slate', 
    price: 0, 
    unlocked: true, 
    primaryColor: '#f43f5e', 
    bgClass: 'bg-[#0f0e14]', 
    boardBg: 'bg-[#060508]', 
    cellClass: 'cosmic', 
    soundProfile: 'classic', 
    description: 'Dynamic nebula slate featuring gentle rose ultraviolet glows.' 
  },
  { 
    id: 'timber', 
    name: 'Warm Timber', 
    price: 50, 
    unlocked: false, 
    primaryColor: '#d97706', 
    bgClass: 'bg-[#1b140e]', 
    boardBg: 'bg-[#120b06]', 
    cellClass: 'timber', 
    soundProfile: 'wood', 
    description: 'Rustic wooden plates featuring concentric grain ring carvings.' 
  },
  { 
    id: 'glass', 
    name: 'Neko Kingdom', 
    price: 60, 
    unlocked: false, 
    primaryColor: '#ff9494', 
    bgClass: 'bg-[#1c0e0f]', 
    boardBg: 'bg-[#100607]', 
    cellClass: 'neko', 
    soundProfile: 'neko', 
    description: 'Cozy kitty kingdom bathed in warm pastel pinks and soft purrs.' 
  },
  { 
    id: 'bricks', 
    name: 'Toy Bricks', 
    price: 70, 
    unlocked: false, 
    primaryColor: '#dc2626', 
    bgClass: 'bg-[#1d0e0e]', 
    boardBg: 'bg-[#110505]', 
    cellClass: 'bricks', 
    soundProfile: 'retro', 
    description: 'Physical plastic construction blocks styled with central raised studs.' 
  },
  { 
    id: 'iron', 
    name: 'Iron Fortress', 
    price: 80, 
    unlocked: false, 
    primaryColor: '#64748b', 
    bgClass: 'bg-[#18191d]', 
    boardBg: 'bg-[#0d0e11]', 
    cellClass: 'iron', 
    soundProfile: 'water', 
    description: 'Heavy industrial panels textured with corner rivets.' 
  },
  { 
    id: 'emerald', 
    name: 'Emerald Oasis', 
    price: 85, 
    unlocked: false, 
    primaryColor: '#10b981', 
    bgClass: 'bg-[#061c14]', 
    boardBg: 'bg-[#020d09]', 
    cellClass: 'emerald', 
    soundProfile: 'forest', 
    description: 'Deep forest shades with sparkling bright jade gemstones.' 
  },
  { 
    id: 'ruby', 
    name: 'Ruby Inferno', 
    price: 90, 
    unlocked: false, 
    primaryColor: '#e11d48', 
    bgClass: 'bg-[#1b080b]', 
    boardBg: 'bg-[#0d0305]', 
    cellClass: 'ruby', 
    soundProfile: 'cyber', 
    description: 'Chamber magma styles featuring bright crimson highlights.' 
  },
  { 
    id: 'sapphire', 
    name: 'Sapphire Depths', 
    price: 95, 
    unlocked: false, 
    primaryColor: '#2563eb', 
    bgClass: 'bg-[#091124]', 
    boardBg: 'bg-[#030610]', 
    cellClass: 'sapphire', 
    soundProfile: 'water', 
    description: 'Abyssal deep sea tones pairing with fluorescent blue neon spikes.' 
  },
  { 
    id: 'amethyst', 
    name: 'Amethyst Glimmer', 
    price: 100, 
    unlocked: false, 
    primaryColor: '#a855f7', 
    bgClass: 'bg-[#150a21]', 
    boardBg: 'bg-[#0a0411]', 
    cellClass: 'amethyst', 
    soundProfile: 'ambient', 
    description: 'Mellifluous lavender and purple quartz crystal matrices.' 
  },
  { 
    id: 'sunset', 
    name: 'Sunset Horizon', 
    price: 105, 
    unlocked: false, 
    primaryColor: '#f97316', 
    bgClass: 'bg-[#1c1109]', 
    boardBg: 'bg-[#0f0803]', 
    cellClass: 'sunset', 
    soundProfile: 'ambient', 
    description: 'Gorging warm solar horizons featuring dark amber details.' 
  },
  { 
    id: 'aurora', 
    name: 'Aurora Borealis', 
    price: 110, 
    unlocked: false, 
    primaryColor: '#14b8a6', 
    bgClass: 'bg-[#07191a]', 
    boardBg: 'bg-[#030c0d]', 
    cellClass: 'aurora', 
    soundProfile: 'glass', 
    description: 'Chilling polar skies featuring shifting northern borealis light waves.' 
  },
  { 
    id: 'midnight', 
    name: 'Midnight Orchid', 
    price: 115, 
    unlocked: false, 
    primaryColor: '#d946ef', 
    bgClass: 'bg-[#16071c]', 
    boardBg: 'bg-[#0b030e]', 
    cellClass: 'midnight', 
    soundProfile: 'glass', 
    description: 'Subtle high-fashion velvet palettes with carbon black inlays.' 
  },
  { 
    id: 'sakura', 
    name: 'Sakura Breeze', 
    price: 120, 
    unlocked: false, 
    primaryColor: '#f472b6', 
    bgClass: 'bg-[#1c0e14]', 
    boardBg: 'bg-[#0f060a]', 
    cellClass: 'sakura', 
    soundProfile: 'forest', 
    description: 'Traditional Kyoto spring breezes dressed in soft petal pinks.' 
  },
  { 
    id: 'gold', 
    name: 'Golden Elixir', 
    price: 125, 
    unlocked: false, 
    primaryColor: '#fbbf24', 
    bgClass: 'bg-[#1c1709]', 
    boardBg: 'bg-[#0f0c03]', 
    cellClass: 'gold', 
    soundProfile: 'classic', 
    description: 'Luxurious heavy bullion solid gold tiles with specular flare glints.' 
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk Neon', 
    price: 130, 
    unlocked: false, 
    primaryColor: '#f43f5e', 
    bgClass: 'bg-[#0a0b10]', 
    boardBg: 'bg-[#040508]', 
    cellClass: 'cyberpunk', 
    soundProfile: 'cyber', 
    description: 'Vaporwave gridscapes of heavy cyan and glowing magenta highlights.' 
  },
  { 
    id: 'monolith', 
    name: 'Dark Monolith', 
    price: 135, 
    unlocked: false, 
    primaryColor: '#4b5563', 
    bgClass: 'bg-[#0d0d0d]', 
    boardBg: 'bg-[#050505]', 
    cellClass: 'monolith', 
    soundProfile: 'wood', 
    description: 'Brutalist concrete block slabs carved with rigid structural lines.' 
  },
  { 
    id: 'coral', 
    name: 'Coral Reef', 
    price: 140, 
    unlocked: false, 
    primaryColor: '#ffedd5', 
    bgClass: 'bg-[#071318]', 
    boardBg: 'bg-[#02080a]', 
    cellClass: 'coral', 
    soundProfile: 'water', 
    description: 'Teeming turquoise lagoons styled with bright sunset reef stones.' 
  },
  { 
    id: 'frozen', 
    name: 'Frozen Tundra', 
    price: 145, 
    unlocked: false, 
    primaryColor: '#38bdf8', 
    bgClass: 'bg-[#0c1622]', 
    boardBg: 'bg-[#040910]', 
    cellClass: 'frozen', 
    soundProfile: 'glass', 
    description: 'Solid ancient glacial ice with frozen air bubbles locked inside.' 
  },
  { 
    id: 'parchment', 
    name: 'Vintage Parchment', 
    price: 160, 
    unlocked: false, 
    primaryColor: '#78350f', 
    bgClass: 'bg-[#1e1a13]', 
    boardBg: 'bg-[#120f09]', 
    cellClass: 'parchment', 
    soundProfile: 'wood', 
    description: 'Ancient scroll papers weathered beautifully over centuries.' 
  },
  { 
    id: 'solar', 
    name: 'Solar Flare', 
    price: 175, 
    unlocked: false, 
    primaryColor: '#ea580c', 
    bgClass: 'bg-[#1a0c05]', 
    boardBg: 'bg-[#0d0501]', 
    cellClass: 'solar', 
    soundProfile: 'retro', 
    description: 'Swirling high energy solar wind and golden plasma chambers.' 
  },
  { 
    id: 'celestial', 
    name: 'Celestial Void', 
    price: 185, 
    unlocked: false, 
    primaryColor: '#6366f1', 
    bgClass: 'bg-[#06050e]', 
    boardBg: 'bg-[#020106]', 
    cellClass: 'celestial', 
    soundProfile: 'cyber', 
    description: 'The edge of the deep cosmos featuring radiant violet pulsar rays.' 
  }
];

export default function App() {
  // --- Persistent States ---
  const [boardSize, setBoardSize] = useState<BoardSize>(() => {
    const saved = localStorage.getItem('block_blast_board_size');
    return saved ? (parseInt(saved, 10) as BoardSize) : 8;
  });

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('block_blast_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [currency, setCurrency] = useState<number>(() => {
    const saved = localStorage.getItem('block_blast_currency');
    return saved ? parseInt(saved, 10) : 100; // Gift 100 on start to let them test!
  });

  const [unlockedThemeIds, setUnlockedThemeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('block_blast_unlocked_theme_ids');
    return saved ? JSON.parse(saved) : ['classic', 'cosmic'];
  });

  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('block_blast_selected_theme_id');
    return saved ? saved : 'classic';
  });

  // --- New Settings Toggles ---
  const [blockNamesEnabled, setBlockNamesEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('block_blast_block_names_enabled');
    return saved ? saved === 'true' : false;
  });

  const [blockHighlightEnabled, setBlockHighlightEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('block_blast_block_highlight_enabled');
    return saved ? saved === 'true' : true;
  });

  // --- Purchase Unlock Lists ---
  const [unlockedSizes, setUnlockedSizes] = useState<number[]>(() => {
    const saved = localStorage.getItem('block_blast_unlocked_sizes');
    return saved ? JSON.parse(saved) : [8];
  });

  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('block_blast_unlocked_skin_ids');
    return saved ? JSON.parse(saved) : ['classic'];
  });

  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    const saved = localStorage.getItem('block_blast_selected_skin_id');
    return saved ? saved : 'classic';
  });

  const [unlockedAudioPackIds, setUnlockedAudioPackIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('block_blast_unlocked_audio_pack_ids');
    return saved ? JSON.parse(saved) : ['classic'];
  });

  const [selectedAudioPackId, setSelectedAudioPackId] = useState<string>(() => {
    const saved = localStorage.getItem('block_blast_selected_audio_pack_id');
    return saved ? saved : 'classic';
  });

  // --- Grid and Game Play States ---
  const [board, setBoard] = useState<Cell[][]>(() => {
    return Array.from({ length: 8 }, () => 
      Array.from({ length: 8 }, () => ({ filled: false, color: '', styleId: '' }))
    );
  });

  const [hand, setHand] = useState<(Shape | null)[]>([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [movesSinceLastClear, setMovesSinceLastClear] = useState<number>(0);
  const [activePowerUp, setActivePowerUp] = useState<'bomb' | null>(null);

  // --- Mute UI State ---
  const [isMuted, setIsMuted] = useState<boolean>(() => audioService.getMuteState());

  // --- Panel/Modal states ---
  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [shopTab, setShopTab] = useState<'sizes' | 'themes' | 'skins' | 'audio'>('sizes');
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [activeHelpTab, setActiveHelpTab] = useState<'opts' | 'how'>('opts');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // --- Collision Hover States ---
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // --- Custom Coordinate Dragging States ---
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingBomb, setIsDraggingBomb] = useState<boolean>(false);
  const [draggedShape, setDraggedShape] = useState<Shape | null>(null);
  const [draggedHandIndex, setDraggedHandIndex] = useState<number | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- Modal and Board Switcher State ---
  const [pendingBoardSize, setPendingBoardSize] = useState<number | null>(null);

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const val = localStorage.getItem('block_blast_dark_mode');
    return val ? val === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('block_blast_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // --- Fullscreen and Screen-Fit States ---
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // --- PWA State Tracking & Installation Flows ---
  const [installable, setInstallable] = useState<boolean>(isInstallable.get());
  const [installedMode, setInstalledMode] = useState<boolean>(isInstalledMode.get());
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('block_blast_pwa_banner_dismissed') === 'true';
  });

  useEffect(() => {
    const unsubInstallable = isInstallable.subscribe(setInstallable);
    const unsubInstalled = isInstalledMode.subscribe(setInstalledMode);
    return () => {
      unsubInstallable();
      unsubInstalled();
    };
  }, []);

  const triggerInstallFlow = async () => {
    // Check if Apple device / iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    const promptEvent = getDeferredPrompt();
    if (!promptEvent) {
      // Prompt event not fired yet or not supported, play safe fallback (show ios-like guide)
      setShowIosGuide(true);
      return;
    }

    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    console.log('Install prompt result:', result);
    clearDeferredPrompt();
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || 
                      !!(document as any).webkitFullscreenElement || 
                      !!(document as any).mozFullScreenElement || 
                      !!(document as any).msFullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      audioService.playClick();
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        } else if ((el as any).mozRequestFullScreen) {
          (el as any).mozRequestFullScreen();
        } else if ((el as any).msRequestFullscreen) {
          (el as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen request blocked or unsupported in sandbox iframe', e);
    }
  };

  // --- Load Master Themes list with Unlock Status ---
  const currentThemes: Theme[] = STATIC_THEMES.map(theme => ({
    ...theme,
    unlocked: unlockedThemeIds.includes(theme.id)
  }));

  const activeTheme = currentThemes.find(t => t.id === selectedThemeId) || currentThemes[0];

  // --- Run Board initialization on startup or grid size change ---
  useEffect(() => {
    initializeNewGame(boardSize);
  }, [boardSize]);

  // --- Persistence handlers ---
  useEffect(() => {
    localStorage.setItem('block_blast_board_size', boardSize.toString());
  }, [boardSize]);

  useEffect(() => {
    localStorage.setItem('block_blast_unlocked_theme_ids', JSON.stringify(unlockedThemeIds));
  }, [unlockedThemeIds]);

  useEffect(() => {
    localStorage.setItem('block_blast_selected_theme_id', selectedThemeId);
  }, [selectedThemeId]);

  useEffect(() => {
    localStorage.setItem('block_blast_currency', currency.toString());
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('block_blast_block_names_enabled', String(blockNamesEnabled));
  }, [blockNamesEnabled]);

  useEffect(() => {
    localStorage.setItem('block_blast_block_highlight_enabled', String(blockHighlightEnabled));
  }, [blockHighlightEnabled]);

  useEffect(() => {
    localStorage.setItem('block_blast_unlocked_sizes', JSON.stringify(unlockedSizes));
  }, [unlockedSizes]);

  useEffect(() => {
    localStorage.setItem('block_blast_unlocked_skin_ids', JSON.stringify(unlockedSkinIds));
  }, [unlockedSkinIds]);

  useEffect(() => {
    localStorage.setItem('block_blast_selected_skin_id', selectedSkinId);
  }, [selectedSkinId]);

  useEffect(() => {
    localStorage.setItem('block_blast_unlocked_audio_pack_ids', JSON.stringify(unlockedAudioPackIds));
  }, [unlockedAudioPackIds]);

  useEffect(() => {
    localStorage.setItem('block_blast_selected_audio_pack_id', selectedAudioPackId);
  }, [selectedAudioPackId]);

  // --- Setup global Pointer dragging safety triggers ---
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDragging && draggedShape) {
        // Update running visual drag cursor tracking coordinates
        setDragCoords({ x: e.clientX, y: e.clientY });

        // Target Collision Check: Compute cell coordinates mathematically with bounding rect
        const gridEl = document.getElementById('game-board-grid');
        let r: number | null = null;
        let c: number | null = null;

        if (gridEl) {
          const rect = gridEl.getBoundingClientRect();
          const rows = draggedShape.cells.length;
          const cols = draggedShape.cells[0].length;
          
          // The dragged floating preview is translated visually by -translate-x-[40%] and -translate-y-[120%].
          // To align, we match the visual top-left corner of the shape to the corresponding grid cell coordinate.
          const previewCellSize = 40; // Approx 40px width per cell in drag overlay
          const xOffset = cols * previewCellSize * 0.4;
          const yOffset = rows * previewCellSize * 1.25; // Adjusted offset for absolute precision and finger clearance
          
          const targetX = e.clientX - xOffset;
          const targetY = e.clientY - yOffset;
          
          const relativeX = targetX - rect.left;
          const relativeY = targetY - rect.top;
          
          const cellWidth = rect.width / boardSize;
          const cellHeight = rect.height / boardSize;
          
          const colIndex = Math.floor(relativeX / cellWidth);
          const rowIndex = Math.floor(relativeY / cellHeight);
          
          if (rowIndex >= 0 && rowIndex < boardSize && colIndex >= 0 && colIndex < boardSize) {
            r = rowIndex;
            c = colIndex;
          }
        }

        if (r !== null && c !== null) {
          if (hoveredRow !== r || hoveredCol !== c) {
            setHoveredRow(r);
            setHoveredCol(c);
          }
        } else {
          if (hoveredRow !== null || hoveredCol !== null) {
            setHoveredRow(null);
            setHoveredCol(null);
          }
        }
      } else if (isDraggingBomb) {
        // Bomb dragging!
        setDragCoords({ x: e.clientX, y: e.clientY });

        const gridEl = document.getElementById('game-board-grid');
        let r: number | null = null;
        let c: number | null = null;

        if (gridEl) {
          const rect = gridEl.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const relativeY = e.clientY - rect.top;
          
          const cellWidth = rect.width / boardSize;
          const cellHeight = rect.height / boardSize;
          
          const colIndex = Math.floor(relativeX / cellWidth);
          const rowIndex = Math.floor(relativeY / cellHeight);
          
          if (rowIndex >= 0 && rowIndex < boardSize && colIndex >= 0 && colIndex < boardSize) {
            r = rowIndex;
            c = colIndex;
          }
        }

        if (r !== null && c !== null) {
          if (hoveredRow !== r || hoveredCol !== c) {
            setHoveredRow(r);
            setHoveredCol(c);
          }
        } else {
          if (hoveredRow !== null || hoveredCol !== null) {
            setHoveredRow(null);
            setHoveredCol(null);
          }
        }
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (isDragging) {
        // Stop drag and check placing coordinates inside board boundary
        if (draggedShape && draggedHandIndex !== null && hoveredRow !== null && hoveredCol !== null) {
          const isValid = canFitAt(board, draggedShape, hoveredRow, hoveredCol);
          if (isValid) {
            placeShapeDirectly(hoveredRow, hoveredCol, draggedShape, draggedHandIndex);
          } else {
            audioService.playClick();
          }
        }

        setIsDragging(false);
        setDraggedShape(null);
        setDraggedHandIndex(null);
        setHoveredRow(null);
        setHoveredCol(null);
      } else if (isDraggingBomb) {
        // Bomb drop release logic
        if (hoveredRow !== null && hoveredCol !== null) {
          handleExecuteBombAt(hoveredRow, hoveredCol);
        } else {
          audioService.playClick();
          setActivePowerUp(null);
        }
        setIsDraggingBomb(false);
        setHoveredRow(null);
        setHoveredCol(null);
      }
    };

    if (isDragging || isDraggingBomb) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, isDraggingBomb, draggedShape, draggedHandIndex, hoveredRow, hoveredCol, board, boardSize]);


  // --- Game Engine Action Controllers ---
  const initializeNewGame = (size: BoardSize) => {
    // 1. Instantiates standard blank cells matrix
    const newBoard = Array.from({ length: size }, () => 
      Array.from({ length: size }, () => ({ filled: false, color: '', styleId: '' }))
    );
    
    setBoard(newBoard);
    
    // 2. Clear score, streak values, active modals
    setScore(0);
    setCombo(1);
    setMovesSinceLastClear(0);
    setSelectedShapeIndex(null);
    setActivePowerUp(null);
    setIsGameOver(false);

    // 3. Replenish safe, verified shape pocket items
    const startHand = generateVerifiedHand(newBoard, 1, 0);
    setHand(startHand);
  };

  // Drag initiation from pocket shapes card
  const handleStartDrag = (e: React.PointerEvent, shape: Shape, index: number) => {
    e.preventDefault();
    if (activePowerUp) return; // Cannot drag shapes while aiming a bomb!

    audioService.playPickup(selectedAudioPackId as any);

    // Save placement mouse anchor offsets relative to block element bounds
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;

    setDragOffset({ x: ox, y: oy });
    setDragCoords({ x: e.clientX, y: e.clientY });
    setDraggedShape(shape);
    setDraggedHandIndex(index);
    setSelectedShapeIndex(index);
    setIsDragging(true);
  };

  // Direct physical layout modifier when placing a shape in-grid
  const placeShapeDirectly = (r: number, c: number, shape: Shape, handIndex: number) => {
    audioService.playDrop(selectedAudioPackId as any);

    // Copy grid array data
    const nextBoard = board.map(row => row.map(cell => ({ ...cell })));

    // Calculate count of blocks placed
    let shapeBlocksCount = 0;
    const shapeRows = shape.cells.length;
    const shapeCols = shape.cells[0].length;

    const activeCellSkinId = selectedSkinId;

    for (let sr = 0; sr < shapeRows; sr++) {
      for (let sc = 0; sc < shapeCols; sc++) {
        if (shape.cells[sr][sc] === 1) {
          nextBoard[r + sr][c + sc] = {
            filled: true,
            color: shape.color,
            styleId: activeCellSkinId
          };
          shapeBlocksCount++;
        }
      }
    }

    // Award initial placement points (2 point per block placed)
    let movePoints = shapeBlocksCount * 2;

    // Eliminate placed shape from pocket slot hand
    const nextHand = [...hand];
    nextHand[handIndex] = null;

    // Evaluate Row and Column completions
    const size = board.length;
    const completedRows: number[] = [];
    const completedCols: number[] = [];

    // Evaluate rows
    for (let rowIdx = 0; rowIdx < size; rowIdx++) {
      let isRowComplete = true;
      for (let colIdx = 0; colIdx < size; colIdx++) {
        if (!nextBoard[rowIdx][colIdx].filled) {
          isRowComplete = false;
          break;
        }
      }
      if (isRowComplete) completedRows.push(rowIdx);
    }

    // Evaluate columns
    for (let colIdx = 0; colIdx < size; colIdx++) {
      let isColComplete = true;
      for (let rowIdx = 0; rowIdx < size; rowIdx++) {
        if (!nextBoard[rowIdx][rowIdx] || !nextBoard[rowIdx][colIdx].filled) {
          isColComplete = false;
          break;
        }
      }
      if (isColComplete) completedCols.push(colIdx);
    }

    const linesCleared = completedRows.length + completedCols.length;

    if (linesCleared > 0) {
      // 1. Set temporary flash state triggers across completed lines
      completedRows.forEach(rowIdx => {
        for (let colIdx = 0; colIdx < size; colIdx++) {
          nextBoard[rowIdx][colIdx].flash = true;
        }
      });
      completedCols.forEach(colIdx => {
        for (let rowIdx = 0; rowIdx < size; rowIdx++) {
          nextBoard[rowIdx][colIdx].flash = true;
        }
      });

      // Show immediate flash backings
      setBoard(nextBoard);

      // Play procedural high multi-arpeggio clearing synth sequence!
      audioService.playClear(linesCleared, selectedAudioPackId as any);

      // 2. Solve scoring allocations with combo streaks applied
      const baseLinesScore = linesCleared * 10;
      // Compounding bonus multiplier for simultaneous line clears: Math.pow(2, linesCleared - 1)
      const simultaneousMult = linesCleared > 1 ? Math.pow(2, linesCleared - 1) : 1;
      const turnLinesScore = baseLinesScore * simultaneousMult * combo;
      
      const totalTurnScore = movePoints + turnLinesScore;
      const nextScore = score + totalTurnScore;

      // Economy conversion calculation (exact 20% point payoff)
      const payCoinsOutput = Math.max(1, Math.floor(turnLinesScore * 0.20));
      const nextCurrency = currency + payCoinsOutput;

      setScore(nextScore);
      setCurrency(nextCurrency);

      // Save high score bounds
      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('block_blast_high_score', nextScore.toString());
      }

      // Progression Win Streak / Consecutive counters
      setCombo(prev => prev + 1);
      setMovesSinceLastClear(0);

      // 3. Clear flashed line cells after short 250ms styling animations!
      setTimeout(() => {
        setBoard(currentBoard => {
          const clearedBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
          
          completedRows.forEach(rowIdx => {
            for (let colIdx = 0; colIdx < size; colIdx++) {
              clearedBoard[rowIdx][colIdx] = { filled: false, color: '', styleId: '' };
            }
          });

          completedCols.forEach(colIdx => {
            for (let rowIdx = 0; rowIdx < size; rowIdx++) {
              clearedBoard[rowIdx][colIdx] = { filled: false, color: '', styleId: '' };
            }
          });

          // Evaluate trailing Game Over triggers after cells are fully blanked!
          evaluateGameOverTraps(clearedBoard, nextHand);

          // Check for complete screen wipe perfect clear (all tiles removed)
          let activeCells = 0;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (clearedBoard[r][c].filled) {
                activeCells++;
              }
            }
          }

          if (activeCells === 0 && unlockedThemeIds.length > 0) {
            // Read index of currently active theme and automatically increment/loop it
            const currentIdx = unlockedThemeIds.indexOf(selectedThemeId);
            if (currentIdx !== -1) {
              const nextIdx = (currentIdx + 1) % unlockedThemeIds.length;
              const nextThemeId = unlockedThemeIds[nextIdx];
              setSelectedThemeId(nextThemeId);
            }
          }

          return clearedBoard;
        });
      }, 250);

    } else {
      // No lines cleared in this move, proceed cleanly!
      setBoard(nextBoard);
      
      // Calculate Combo streak depletion check (must clear within 3 moves)
      const nextMoveCount = movesSinceLastClear + 1;
      setMovesSinceLastClear(nextMoveCount);

      if (nextMoveCount >= 3) {
        setCombo(1); // Break streak Multiplier
      }

      const nextScore = score + movePoints;
      setScore(nextScore);

      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('block_blast_high_score', nextScore.toString());
      }

      evaluateGameOverTraps(nextBoard, nextHand);
    }

    const predictedMovesCount = linesCleared > 0 ? 0 : movesSinceLastClear + 1;
    const predictedCombo = linesCleared > 0 ? combo + 1 : (predictedMovesCount >= 3 ? 1 : combo);

    // Refresh shape pocket queue if all three choices have been placed
    const countRemaining = nextHand.filter(s => s !== null).length;
    if (countRemaining === 0) {
      const replenishedHand = generateVerifiedHand(nextBoard, predictedCombo, predictedMovesCount);
      setHand(replenishedHand);
    } else {
      setHand(nextHand);
    }

    // Clear toggles
    setSelectedShapeIndex(null);
  };

  // Click-To-Place cell grid placement handler
  const handlePlaceShapeAtBoard = (r: number, c: number) => {
    if (selectedShapeIndex === null) return;
    const shape = hand[selectedShapeIndex];
    if (shape) {
      const isValid = canFitAt(board, shape, r, c);
      if (isValid) {
        placeShapeDirectly(r, c, shape, selectedShapeIndex);
      }
    }
  };

  // Evaluate if board is locked and player suffer a Grid Lock Game Over.
  const evaluateGameOverTraps = (currBoard: Cell[][], currHand: (Shape | null)[]) => {
    const activeShapes = currHand.filter(s => s !== null);
    if (activeShapes.length === 0) return; // Hand is fully empty, replenishment will solve

    // Check if even ONE remaining shape can fit anywhere on the active board
    let aShapeFits = false;
    for (const shape of activeShapes) {
      if (shape && canFitAnywhere(currBoard, shape)) {
        aShapeFits = true;
        break;
      }
    }

    if (!aShapeFits) {
      // All remaining shape options are locked out!
      setIsGameOver(true);
      audioService.playDrop('retro'); // Deep thud Retro Game Over chime
    }
  };


  // --- Power Ups Trigger Handlers ---
  
  // 1) Rotate Current Hand (Cost: 50)
  const handleRotateHand = () => {
    if (currency < 50) return;
    
    const nextHand = hand.map(s => {
      if (!s) return null;
      const rotCells = rotateMatrixClockwise(s.cells);
      return {
        ...s,
        cells: rotCells,
        name: s.name.startsWith('Rotated') ? s.name : `Rotated ${s.name}`
      };
    });

    setHand(nextHand);
    setCurrency(prev => prev - 50);
    setSelectedShapeIndex(null);

    // Refresh collision check immediately in case players can now unlock themselves!
    evaluateGameOverTraps(board, nextHand);
  };

  // 2) Refresh Hand Options (Cost: 100)
  const handleRefreshHand = () => {
    if (currency < 100) return;

    const freshHand = generateVerifiedHand(board, combo, movesSinceLastClear);
    setHand(freshHand);
    setCurrency(prev => prev - 100);
    setSelectedShapeIndex(null);

    // Solve game over status
    setIsGameOver(false);
    evaluateGameOverTraps(board, freshHand);
  };

  // 3) Bomb Mode activation and initiating drag sequence (Cost: 200)
  const handleBombPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (currency < 200) {
      audioService.playClick();
      return;
    }
    e.preventDefault();
    audioService.playPickup(selectedAudioPackId as any);

    setIsDraggingBomb(true);
    setDragCoords({ x: e.clientX, y: e.clientY });
    setActivePowerUp('bomb');
    setSelectedShapeIndex(null);
  };

  const handleExecuteBombAt = (r: number, c: number) => {
    if (currency < 200) return;

    audioService.playDrop(selectedAudioPackId as any);

    const size = board.length;
    const nextBoard = board.map(row => row.map(cell => ({ ...cell })));

    // Set flash animation indicators on targeted 3x3 tiles
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          nextBoard[tr][tc] = {
            ...nextBoard[tr][tc],
            flash: true
          };
        }
      }
    }
    setBoard(nextBoard);

    // After 150ms of intense flashing visual feedback, wipe the nodes fully
    setTimeout(() => {
      setBoard(currentBoard => {
        const clearedBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const tr = r + dr;
            const tc = c + dc;
            if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
              clearedBoard[tr][tc] = { filled: false, color: '', styleId: '' };
            }
          }
        }
        setIsGameOver(false);
        evaluateGameOverTraps(clearedBoard, hand);
        return clearedBoard;
      });
    }, 150);

    setCurrency(prev => prev - 200);
    setActivePowerUp(null);
  };


  // --- Shop Unlocking and Selecting Logic ---
  const handlePurchaseTheme = (themeId: string, price: number) => {
    if (currency >= price && !unlockedThemeIds.includes(themeId)) {
      audioService.playStoreUnlock();
      const updatedUnlocks = [...unlockedThemeIds, themeId];
      setUnlockedThemeIds(updatedUnlocks);
      setCurrency(prev => prev - price);
      setSelectedThemeId(themeId);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    if (unlockedThemeIds.includes(themeId)) {
      setSelectedThemeId(themeId);
    }
  };

  // 1. Board Sizes Shop Actions
  const handlePurchaseSize = (size: number, price: number) => {
    if (currency >= price && !unlockedSizes.includes(size)) {
      audioService.playStoreUnlock();
      const nextSizes = [...unlockedSizes, size];
      setUnlockedSizes(nextSizes);
      setCurrency(prev => prev - price);
      setBoardSize(size as BoardSize);
    }
  };

  const handleSelectSize = (size: number) => {
    if (unlockedSizes.includes(size) || size === 8) {
      setBoardSize(size as BoardSize);
    }
  };

  // 2. Skins Shop Actions
  const handlePurchaseSkin = (skinId: string, price: number) => {
    if (currency >= price && !unlockedSkinIds.includes(skinId)) {
      audioService.playStoreUnlock();
      const nextSkins = [...unlockedSkinIds, skinId];
      setUnlockedSkinIds(nextSkins);
      setCurrency(prev => prev - price);
      setSelectedSkinId(skinId);
    }
  };

  const handleSelectSkin = (skinId: string) => {
    if (unlockedSkinIds.includes(skinId)) {
      setSelectedSkinId(skinId);
    }
  };

  // 3. Audio Pack Shop Actions
  const handlePurchaseAudioPack = (audioPackId: string, price: number) => {
    if (currency >= price && !unlockedAudioPackIds.includes(audioPackId)) {
      audioService.playStoreUnlock();
      const nextAudios = [...unlockedAudioPackIds, audioPackId];
      setUnlockedAudioPackIds(nextAudios);
      setCurrency(prev => prev - price);
      setSelectedAudioPackId(audioPackId);
    }
  };

  const handleSelectAudioPack = (audioPackId: string) => {
    if (unlockedAudioPackIds.includes(audioPackId)) {
      setSelectedAudioPackId(audioPackId);
    }
  };

  const toggleMuteState = () => {
    const isMutedNow = audioService.toggleMute();
    setIsMuted(isMutedNow);
  };


  // --- Component Template Visual Builders ---

  // Renders the floating drag bomb overlay following finger coordinates (isDraggingBomb)
  const renderFloatingBombOverlay = () => {
    if (!isDraggingBomb) return null;

    return (
      <div 
        className="fixed z-50 pointer-events-none transform -translate-x-[50%] -translate-y-[120%] scale-100 transition-transform flex flex-col items-center"
        style={{
          left: `${dragCoords.x}px`,
          top: `${dragCoords.y}px`,
        }}
      >
        <div className="w-16 h-16 bg-red-650/90 border-2 border-red-450 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
          <Bomb className="w-9 h-9 text-red-200" />
        </div>
        <span className="mt-1.5 px-2.5 py-0.5 rounded-md font-sans text-[10px] font-bold text-red-100 tracking-wider uppercase bg-red-950/90 border border-red-800/60 shadow-md">
          Release to Explode
        </span>
      </div>
    );
  };

  // Renders the floating drag card overlays following mouse tracking coordinates (isDragging)
  const renderFloatingDragOverlay = () => {
    if (!isDragging || !draggedShape) return null;

    const rows = draggedShape.cells.length;
    const cols = draggedShape.cells[0].length;

    // Center the piece slightly above the fingertip for maximum viewing visibility on touch screens
    return (
      <div 
        className="fixed z-50 pointer-events-none transform -translate-x-[40%] -translate-y-[120%] scale-100 transition-transform"
        style={{
          left: `${dragCoords.x}px`,
          top: `${dragCoords.y}px`,
        }}
      >
        <div 
          className="grid gap-1 pointer-events-none"
          style={{
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {draggedShape.cells.map((rowArr, r) =>
            rowArr.map((val, c) => {
              const activeSkin = selectedSkinId;
              if (val === 1) {
                let isSingle = false;
                let isEndCap = false;
                let endCapDir: 'up' | 'down' | 'left' | 'right' | undefined;
                if (activeSkin === 'neko' || activeSkin === 'glass') {
                  let filledCount = 0;
                  for (let sr = 0; sr < draggedShape.cells.length; sr++) {
                    for (let sc = 0; sc < draggedShape.cells[0].length; sc++) {
                      if (draggedShape.cells[sr][sc] === 1) filledCount++;
                    }
                  }
                  if (filledCount === 1) {
                    isSingle = true;
                  } else {
                    let shapeNeighbors = 0;
                    let neighborDir = '';
                    if (r > 0 && draggedShape.cells[r - 1]?.[c] === 1) { shapeNeighbors++; neighborDir = 'up'; }
                    if (r < draggedShape.cells.length - 1 && draggedShape.cells[r + 1]?.[c] === 1) { shapeNeighbors++; neighborDir = 'down'; }
                    if (c > 0 && draggedShape.cells[r]?.[c - 1] === 1) { shapeNeighbors++; neighborDir = 'left'; }
                    if (c < draggedShape.cells[0].length - 1 && draggedShape.cells[r]?.[c + 1] === 1) { shapeNeighbors++; neighborDir = 'right'; }

                    if (shapeNeighbors === 1) {
                      isEndCap = true;
                      if (neighborDir === 'up') endCapDir = 'down';
                      if (neighborDir === 'down') endCapDir = 'up';
                      if (neighborDir === 'left') endCapDir = 'right';
                      if (neighborDir === 'right') endCapDir = 'left';
                    }
                  }
                }
                return (
                  <div key={`${r}-${c}`} className="w-10 h-10">
                    <CellBlock 
                      filled={true} 
                      color={draggedShape.color} 
                      styleId={activeSkin} 
                      isSingle={isSingle}
                      isEndCap={isEndCap}
                      endCapDir={endCapDir}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={`${r}-${c}`} className="w-10 h-10 opacity-0" />
                );
              }
            })
          )}
        </div>
      </div>
    );
  };

  const getThemeCSS = (): React.CSSProperties => {
    const primary = activeTheme.primaryColor;
    
    const darken = (hex: string, percent: number) => {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      let r = parseInt(hex.substring(0,2), 16);
      let g = parseInt(hex.substring(2,4), 16);
      let b = parseInt(hex.substring(4,6), 16);
      r = Math.max(0, Math.min(255, Math.floor(r * (100 - percent) / 100)));
      g = Math.max(0, Math.min(255, Math.floor(g * (100 - percent) / 100)));
      b = Math.max(0, Math.min(255, Math.floor(b * (100 - percent) / 100)));
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    };

    const borderAccent = isDarkMode ? primary : darken(primary, 40);

    // Dynamic light mode background tints customized per-theme to prevent standard harsh white
    const lightBgTints: { [key: string]: string } = {
      classic: '#f4f6fa',
      cosmic: '#fcf5f6',
      timber: '#faf5ef',
      glass: '#fef6f6',
      bricks: '#fdf4f4',
      iron: '#f1f3f5',
      emerald: '#f4faf7',
      ruby: '#fcf2f4',
      sapphire: '#f2f5fd',
      amethyst: '#faf4fe',
      sunset: '#faf4ef',
      aurora: '#f2faf9',
      midnight: '#fbf5fd',
      sakura: '#fef5fa',
      gold: '#fbf9f2',
      cyberpunk: '#faf2f5',
      monolith: '#f1f3f5',
      coral: '#fdf5f5',
      frozen: '#f2fafc',
      parchment: '#faf8f4',
      solar: '#faf3ee',
      celestial: '#faf5fd'
    };

    // Full 22 dynamic block color mappings hand-tailored for ideal contrast in light & dark modes
    const themeColorsMap: { [key: string]: { dark: string[], light: string[] } } = {
      classic: {
        dark: ['#3b82f6', '#60a5fa', '#4f46e5', '#14b8a6', '#06b6d4', '#8b5cf6', '#64748b', '#a78bfa'],
        light: ['#2563eb', '#1d4ed8', '#4338ca', '#0f766e', '#0891b2', '#6d28d9', '#475569', '#7c3aed']
      },
      cosmic: {
        dark: ['#f43f5e', '#ec4899', '#8b5cf6', '#6366f1', '#a855f7', '#ef4444', '#d946ef', '#f97316'],
        light: ['#e11d48', '#db2777', '#7c3aed', '#4f46e5', '#891c9f', '#dc2626', '#c026d3', '#ea580c']
      },
      timber: {
        dark: ['#d97706', '#ea580c', '#b45309', '#f59e0b', '#c2410c', '#ca8a04', '#a16207', '#78350f'],
        light: ['#b45309', '#c2410c', '#92400e', '#d97706', '#9a3412', '#a16207', '#854d0e', '#78350f']
      },
      glass: {
        dark: ['#ff9494', '#fca5a5', '#fda4af', '#f472b6', '#c084fc', '#93c5fd', '#fed7aa', '#f472b6'],
        light: ['#f43f5e', '#e11d48', '#be185d', '#db2777', '#9333ea', '#2563eb', '#ea580c', '#be123c']
      },
      bricks: {
        dark: ['#dc2626', '#eab308', '#2563eb', '#84cc16', '#f97316', '#a855f7', '#06b6d4', '#10b981'],
        light: ['#b91c1c', '#ca8a04', '#1d4ed8', '#65a30d', '#ea580c', '#7e22ce', '#0891b2', '#047857']
      },
      iron: {
        dark: ['#64748b', '#94a3b8', '#b45309', '#cbd5e1', '#475569', '#a16207', '#334155', '#94a3b8'],
        light: ['#334155', '#475569', '#9a3412', '#1e293b', '#0f172a', '#854d0e', '#111827', '#4b5563']
      },
      emerald: {
        dark: ['#10b981', '#34d399', '#0d9488', '#059669', '#a3e635', '#06b6d4', '#2dd4bf', '#047857'],
        light: ['#059669', '#047857', '#0d9488', '#065f46', '#4d7c0f', '#0891b2', '#0f766e', '#115e59']
      },
      ruby: {
        dark: ['#e11d48', '#f43f5e', '#f97316', '#ef4444', '#be185d', '#ea580c', '#9f1239', '#fda4af'],
        light: ['#9f1239', '#be185d', '#ea580c', '#cc1133', '#93003a', '#d04000', '#810020', '#db2777']
      },
      sapphire: {
        dark: ['#2563eb', '#3b82f6', '#06b6d4', '#1d4ed8', '#1e40af', '#a855f7', '#14b8a6', '#0284c7'],
        light: ['#1d4ed8', '#1e40af', '#0891b2', '#1e3a8a', '#172554', '#7e22ce', '#0f766e', '#0369a1']
      },
      amethyst: {
        dark: ['#a855f7', '#d946ef', '#c084fc', '#8b5cf6', '#6366f1', '#e879f9', '#7c3aed', '#be185d'],
        light: ['#7e22ce', '#a21caf', '#9333ea', '#6d28d9', '#4f46e5', '#c026d3', '#5b21b6', '#9d174d']
      },
      sunset: {
        dark: ['#f43f5e', '#f97316', '#fbbf24', '#a855f7', '#f59e0b', '#ea580c', '#ec4899', '#8b5cf6'],
        light: ['#be185d', '#ea580c', '#ca8a04', '#7e22ce', '#d97706', '#c2410c', '#db2777', '#6d28d9']
      },
      aurora: {
        dark: ['#14b8a6', '#0d9488', '#2dd4bf', '#06b6d4', '#84cc16', '#d946ef', '#3b82f6', '#10b981'],
        light: ['#0f766e', '#115e59', '#0d9488', '#0891b2', '#4d7c0f', '#a21caf', '#1d4ed8', '#047857']
      },
      midnight: {
        dark: ['#d946ef', '#7c3aed', '#4f46e5', '#be185d', '#f472b6', '#6b21a8', '#c026d3', '#8b5cf6'],
        light: ['#a21caf', '#5b21b6', '#3730a3', '#9d174d', '#db2777', '#581c87', '#c026d3', '#6d28d9']
      },
      sakura: {
        dark: ['#f472b6', '#fda4af', '#ec4899', '#e9d5ff', '#9d174d', '#fce7f3', '#fbcfe8', '#fae8ff'],
        light: ['#db2777', '#f43f5e', '#be185d', '#7e22ce', '#be123c', '#be185d', '#db2777', '#9d174d']
      },
      gold: {
        dark: ['#fbbf24', '#f59e0b', '#d97706', '#ca8a04', '#eab308', '#fcd34d', '#fef08a', '#a16207'],
        light: ['#ca8a04', '#d97706', '#b45309', '#a16207', '#ca8a04', '#b45309', '#854d0e', '#78350f']
      },
      cyberpunk: {
        dark: ['#06b6d4', '#ec4899', '#a3e635', '#f43f5e', '#3b82f6', '#f97316', '#a855f7', '#ef4444'],
        light: ['#0891b2', '#db2777', '#65a30d', '#e11d48', '#1d4ed8', '#ea580c', '#7e22ce', '#b91c1c']
      },
      monolith: {
        dark: ['#334155', '#4b5563', '#1e293b', '#b45309', '#111827', '#1e3a8a', '#374151', '#64748b'],
        light: ['#1e293b', '#374151', '#0f172a', '#9a3412', '#111827', '#1e3a8a', '#1f2937', '#4b5563']
      },
      coral: {
        dark: ['#ffedd5', '#14b8a6', '#fda4af', '#06b6d4', '#fbcfe8', '#ff9f43', '#3b82f6', '#10b981'],
        light: ['#ff7f50', '#0f766e', '#f43f5e', '#0891b2', '#db2777', '#e67e22', '#1d4ed8', '#047857']
      },
      frozen: {
        dark: ['#38bdf8', '#2563eb', '#60a5fa', '#93c5fd', '#cbd5e1', '#14b8a6', '#4f46e5', '#06b6d4'],
        light: ['#0284c7', '#1d4ed8', '#2563eb', '#1e40af', '#475569', '#0f766e', '#3730a3', '#0891b2']
      },
      parchment: {
        dark: ['#b45309', '#78350f', '#d97706', '#a16207', '#ca8a04', '#c2410c', '#4b5320', '#9a3412'],
        light: ['#78350f', '#451a03', '#92400e', '#7c2d12', '#854d0e', '#9a3412', '#111827', '#7c2d12']
      },
      solar: {
        dark: ['#ea580c', '#f97316', '#fbbf24', '#f59e0b', '#e11d48', '#ef4444', '#ec4899', '#b45309'],
        light: ['#c2410c', '#ea580c', '#ca8a04', '#d97706', '#be185d', '#b91c1c', '#db2777', '#92400e']
      },
      celestial: {
        dark: ['#6366f1', '#8b5cf6', '#a855f7', '#f43f5e', '#06b6d4', '#4f46e5', '#ec4899', '#fbbf24'],
        light: ['#4f46e5', '#6d28d9', '#7e22ce', '#e11d48', '#0891b2', '#3730a3', '#db2777', '#ca8a04']
      }
    };

    // Extract dark background and board solid values from theme config safely
    const themeDarkBgMatch = activeTheme.bgClass.match(/#([a-fA-F0-9]{3,6})/);
    const themeDarkBg = themeDarkBgMatch ? themeDarkBgMatch[0] : '#0f172a';

    const themeDarkSolidMatch = activeTheme.boardBg.match(/#([a-fA-F0-9]{3,6})/);
    const themeDarkSolid = themeDarkSolidMatch ? themeDarkSolidMatch[0] : '#1e293b';

    const lightBg = lightBgTints[activeTheme.id] || '#f8fafc';

    // Map the 8 colors belonging to the chosen model
    const palette = themeColorsMap[activeTheme.id] || themeColorsMap.classic;
    const blockList = isDarkMode ? palette.dark : palette.light;

    const customVars: Record<string, string> = {
      '--theme-primary': primary,
      '--theme-accent': primary,
      '--theme-accent-border': borderAccent,
      '--border-ui': isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.15)',
      '--grid-line-color': isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.15)',
      '--theme-border': 'var(--border-ui)', // Legacy alias
      '--bg-app': isDarkMode ? themeDarkBg : lightBg,
      '--theme-bg-main': 'var(--bg-app)',
      '--bg-main': 'var(--bg-app)',
      '--bg-panel': isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.75)',
      '--theme-bg-panel': 'var(--bg-panel)',
      '--theme-bg-panel-solid': isDarkMode ? themeDarkBg : '#f1f5f9',
      '--theme-bg-solid': isDarkMode ? themeDarkSolid : '#ffffff',
      '--grid-cell-empty': isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
      '--theme-text-muted': isDarkMode ? 'rgba(255,255,255,0.5)' : '#475569',
      '--text-primary': isDarkMode ? '#f8fafc' : '#0f172a',
      '--theme-text-main': 'var(--text-primary)',
      '--theme-block-shadow': isDarkMode ? 'none' : 'inset 0 -3px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.6)',
    };

    // Inject individual --block-color-1 to --block-color-8
    for (let i = 0; i < 8; i++) {
      customVars[`--block-color-${i + 1}`] = blockList[i];
    }

    return customVars as React.CSSProperties;
  };

  return (
    <div 
      className={`min-h-[100dvh] h-auto w-full flex flex-col justify-between p-2.5 sm:p-4 overflow-y-auto select-none transition-colors duration-500 font-sans`}
      style={{ ...getThemeCSS(), backgroundColor: 'var(--theme-bg-main)', color: 'var(--theme-text-main)' }}
    >
      {/* Background visual ambience circle glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] aspect-square rounded-full blur-3xl opacity-5" style={{ backgroundColor: 'var(--theme-primary)' }} />
        <div className="absolute top-[40%] right-[-10%] w-[40%] aspect-square rounded-full blur-3xl opacity-5" style={{ backgroundColor: 'var(--theme-primary)' }} />
      </div>

      {/* Renders Custom Coordinate Floating shape while dragging */}
      {renderFloatingDragOverlay()}
      {renderFloatingBombOverlay()}

      {/* --- Header Dashboard segment --- */}
      <header className="relative z-10 w-full max-w-[420px] mx-auto flex items-center justify-between pb-1.5 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 sm:p-2 bg-gradient-to-tr from-[var(--theme-primary)] to-accent-blue rounded-xl text-neutral-900 shadow-md">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-neutral-950" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 
              className="font-display font-black text-base sm:text-lg tracking-tight leading-none"
              style={{
                color: 'var(--text-primary)',
                textShadow: isDarkMode ? 'none' : '0 1px 3px rgba(15, 23, 42, 0.2), 0 1px 1px rgba(15, 23, 42, 0.1)'
              }}
            >
              Block Blast Pro
            </h1>
          </div>
        </div>

        {/* Global actions: settings/sound toggles list */}
        <div className="flex items-center gap-1.5">
          {/* Read-Only Wallet Indicator */}
          <div 
            className="flex items-center gap-1.5 px-2 py-1 bg-accent-blue/10 dark:bg-accent-blue/20 border border-accent-blue/30 rounded-xl select-none"
            title="Your Coins"
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-accent-blue" />
            <span className="font-mono text-[11px] sm:text-xs font-bold text-sky-700 dark:text-accent-blue">{currency}</span>
          </div>

          {/* Standalone highly visible Store Button (with storefront icon) */}
          <button 
            onClick={() => {
              audioService.playClick();
              setShopTab('themes');
              setShopOpen(true);
            }} 
            className="p-1.5 sm:p-2 bg-gradient-to-tr from-accent-blue-dim to-accent-blue hover:from-accent-blue hover:to-accent-blue-dim text-neutral-950 font-display font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1 transition-all hover:scale-[1.03] active:scale-95 z-10"
            title="Open Cosmetic Store"
          >
            <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden xs:inline font-extrabold">Store</span>
          </button>

          <button 
            onClick={() => {
              audioService.playClick();
              setHelpOpen(true);
            }} 
            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-xl text-neutral-450 hover:text-neutral-200 transition-all z-10"
            title="Help & Settings"
          >
            <Settings className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px]" />
          </button>
          
          <button 
            onClick={toggleMuteState} 
            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-neutral-200 transition-all z-10"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] text-red-400" /> : <Volume2 className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* --- Score stats indicators area --- */}
      <section className="relative z-10 w-full max-w-[420px] mx-auto grid grid-cols-3 gap-2 py-2">
        <div className="bg-[var(--theme-bg-panel)] p-2 border border-[var(--theme-border)] rounded-xl flex flex-col items-center justify-center">
          <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Score</span>
          <span id="score-text" className="text-xl font-display font-black text-[var(--theme-text-main)]" style={{ color: 'var(--theme-primary)' }}>{score}</span>
        </div>
        
        <div className="bg-[var(--theme-bg-panel)] p-2 border border-[var(--theme-border)] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Best</span>
          <span id="high-score-text" className="text-xl font-display font-black text-[var(--theme-primary)]" style={{ color: 'var(--theme-primary)' }}>{highScore}</span>
        </div>

        {/* Combo Multiplier status cell */}
        <div className="bg-[var(--theme-bg-panel)] p-2 border border-[var(--theme-border)] rounded-xl flex flex-col items-center justify-center relative">
          <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-0.5">
            Streak <Flame className={`w-2.5 h-2.5 ${combo > 1 ? 'text-accent-blue animate-bounce' : 'text-neutral-500'}`} />
          </span>
          <div className="flex items-baseline">
            <span id="combo-text" className={`text-xl font-mono font-black ${combo > 1 ? 'text-accent-blue animate-pulse' : 'text-[var(--theme-text-main)]'}`}>
              x{combo}
            </span>
          </div>
          {/* Visual depletion dots indicating remaining safety moves */}
          {combo > 1 && (
            <div className="absolute bottom-1 w-full flex justify-center gap-1">
              <div className={`w-1 h-1 rounded-full ${movesSinceLastClear < 1 ? 'bg-accent-blue' : 'bg-neutral-800'}`} />
              <div className={`w-1 h-1 rounded-full ${movesSinceLastClear < 2 ? 'bg-accent-blue' : 'bg-neutral-800'}`} />
              <div className={`w-1 h-1 rounded-full ${movesSinceLastClear < 3 ? 'bg-accent-blue' : 'bg-neutral-800'}`} />
            </div>
          )}
        </div>
      </section>

      {/* --- PWA Install Dashboard Banner --- */}
      {!installedMode && !isBannerDismissed && (
        <section className="relative z-10 w-full max-w-[420px] mx-auto mb-2 animate-fade-in px-1">
          <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-3 rounded-xl flex justify-between items-center text-sm shadow-lg backdrop-blur-xs transition-all duration-300 text-[var(--theme-text-main)]">
            <div className="flex items-center gap-2.5 flex-1 pr-2">
              <div className="p-2 bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-primary-dim)] rounded-lg text-white shadow-md select-none shrink-0" style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="leading-tight">
                <p className="font-sans font-bold">Install Block Blast Pro</p>
                <p className="text-[10px] text-[var(--theme-text-muted)] mt-0.5">Play offline, full screen, and fast anywhere!</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  audioService.playClick();
                  triggerInstallFlow();
                }}
                className="px-2.5 py-1.5 font-sans font-bold uppercase text-[10px] tracking-wider rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--theme-primary)', color: '#fff' }}
              >
                Install Now
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsBannerDismissed(true);
                  localStorage.setItem('block_blast_pwa_banner_dismissed', 'true');
                }}
                className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] rounded-md hover:bg-black/5 transition-all cursor-pointer"
                title="Dismiss installer banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- Dynamic Grid Scaling Selection controls --- */}
      <section className="relative z-10 w-full max-w-[420px] mx-auto flex items-center justify-between px-1 py-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl">
        <div className="flex items-center gap-1.5 pl-1">
          <Grid className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-mono text-[10px] text-[var(--theme-text-muted)] uppercase tracking-tight">Dimensions</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--theme-bg-solid)] p-0.5 rounded-lg border border-[var(--theme-border)]">
          {([6, 8, 10, 12] as BoardSize[]).map((size) => {
            const isSel = size === boardSize;
            const isUnlocked = size === 8 || unlockedSizes.includes(size);
            return (
              <button
                key={size}
                id={`grid-size-btn-${size}`}
                onClick={() => {
                  audioService.playClick();
                  if (isUnlocked) {
                    if (size === boardSize) return;
                    const isGameActive = score > 0 || board.some(row => row.some(cell => cell.filled));
                    if (!isGameActive) {
                      setBoardSize(size);
                    } else {
                      setPendingBoardSize(size);
                    }
                  } else {
                    setShopTab('sizes');
                    setShopOpen(true);
                  }
                }}
                className={`py-1 px-2.5 text-xs font-display font-bold rounded-md transition-all flex items-center gap-0.5 ${
                  isSel 
                    ? 'bg-accent-blue text-neutral-950 shadow-xs' 
                    : isUnlocked
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                      : 'text-neutral-500 hover:text-accent-blue hover:bg-neutral-800/80'
                }`}
                title={isUnlocked ? `${size}x${size} Grid Size` : `Locked - Click to unlock in the Store`}
              >
                <span>{size}x{size}</span>
                {!isUnlocked && <Lock className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* --- Game Board grid arena --- */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center py-1 sm:py-2">
        <GameBoard
          board={board}
          selectedThemeId={selectedThemeId}
          selectedSkinId={selectedSkinId}
          draggedShape={isDragging ? draggedShape : (selectedShapeIndex !== null ? hand[selectedShapeIndex] : null)}
          activePowerUp={activePowerUp}
          hoveredRow={hoveredRow}
          hoveredCol={hoveredCol}
          setHoveredCell={(r, c) => {
            setHoveredRow(r);
            setHoveredCol(c);
          }}
          onPlaceShapeAt={handlePlaceShapeAtBoard}
          onBombCells={handleExecuteBombAt}
          blockHighlightEnabled={blockHighlightEnabled}
        />
      </main>

      {/* --- In-Hand Pocket queue cards section --- */}
      <section className="relative z-10 w-full py-1">
        <HandQueue
          hand={hand}
          selectedShapeIndex={selectedShapeIndex}
          selectedThemeId={selectedThemeId}
          selectedSkinId={selectedSkinId}
          blockNamesEnabled={blockNamesEnabled}
          onSelectShape={(index) => {
            audioService.playClick();
            if (activePowerUp) {
              // Cancel bomb mode if selecting normal shapes
              setActivePowerUp(null);
            }
            setSelectedShapeIndex(prev => prev === index ? null : index);
          }}
          onStartDrag={handleStartDrag}
        />
      </section>

      {/* --- Power Ups trigger tray --- */}
      <footer className="relative z-10 w-full pb-2">
        <PowerUps
          currency={currency}
          activePowerUp={activePowerUp}
          onRotateHand={handleRotateHand}
          onRefreshHand={handleRefreshHand}
          onBombPointerDown={handleBombPointerDown}
          handHasCards={hand.filter(s => s !== null).length > 0}
        />
      </footer>

      {/* --- MODAL 1: Cosmetic Shop popups --- */}
      {shopOpen && (
        <CosmeticShop
          currency={currency}
          onClose={() => setShopOpen(false)}
          initialTab={shopTab}
          
          // Board Sizes
          unlockedSizes={unlockedSizes}
          onPurchaseSize={handlePurchaseSize}
          boardSize={boardSize}
          onSelectSize={handleSelectSize}
          
          // Themes
          themes={currentThemes}
          selectedThemeId={selectedThemeId}
          onSelectTheme={handleSelectTheme}
          onPurchaseTheme={handlePurchaseTheme}
          
          // Skins
          unlockedSkinIds={unlockedSkinIds}
          selectedSkinId={selectedSkinId}
          onSelectSkin={handleSelectSkin}
          onPurchaseSkin={handlePurchaseSkin}
          
          // Audio Packs
          unlockedAudioPackIds={unlockedAudioPackIds}
          selectedAudioPackId={selectedAudioPackId}
          onSelectAudioPack={handleSelectAudioPack}
          onPurchaseAudioPack={handlePurchaseAudioPack}
        />
      )}

      {/* --- MODAL 2: Help & Settings Modal Panel --- */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 text-neutral-300 flex flex-col max-h-[85vh]">
            
            {/* Header Dialog */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h2 className="font-display font-black text-lg text-neutral-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-blue" />
                <span>Help & Settings</span>
              </h2>
              <button
                onClick={() => {
                  audioService.playClick();
                  setHelpOpen(false);
                }}
                className="text-xs bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-lg border border-neutral-750 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Inner Switch Sub-Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--theme-bg-panel)] rounded-xl border border-[var(--theme-border)] mb-4 text-center">
              <button
                onClick={() => {
                  audioService.playClick();
                  setActiveHelpTab('opts');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeHelpTab === 'opts'
                    ? "bg-[var(--theme-primary)] text-white shadow-xs"
                    : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)]"
                }`}
                style={activeHelpTab === 'opts' ? { backgroundColor: 'var(--theme-primary)', color: '#fff' } : undefined}
              >
                Game Options
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  setActiveHelpTab('how');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeHelpTab === 'how'
                    ? "bg-[var(--theme-primary)] text-white shadow-xs"
                    : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)]"
                }`}
                style={activeHelpTab === 'how' ? { backgroundColor: 'var(--theme-primary)', color: '#fff' } : undefined}
              >
                How to Play
              </button>
            </div>

            {/* Scrollable central panels */}
            <div className="flex-1 overflow-y-auto pr-1">
              
              {/* PANEL A: Game Options / Preferences */}
              {activeHelpTab === 'opts' && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="space-y-3.5 bg-[var(--theme-bg-panel)] p-4 border border-[var(--theme-border)] rounded-xl">
                    
                    {/* Option 1: Fullscreen Toggle */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Fullscreen Mode</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-none">Play the game in expanded scale</p>
                      </div>
                      <button
                        onClick={toggleFullscreen}
                        className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-lg border border-neutral-700 text-neutral-200 transition-all font-mono"
                      >
                        {isFullscreen ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Option 2: Dark Mode Toggle */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Application Theme</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-none">Toggle Light / Dark mode background</p>
                      </div>
                      <button
                        onClick={() => {
                          audioService.playClick();
                          setIsDarkMode(!isDarkMode);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all font-mono ${
                          isDarkMode 
                            ? "bg-accent-blue/15 text-sky-600 dark:text-accent-blue border-accent-blue/30" 
                            : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}
                      >
                        {isDarkMode ? "DARK" : "LIGHT"}
                      </button>
                    </div>

                    {/* Option 3: Sound FX Toggle */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Sound Synthesizer</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-none">Enable or mute pure wave audio sfx</p>
                      </div>
                      <button
                        onClick={() => {
                          toggleMuteState();
                          audioService.playClick();
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all font-mono ${
                          isMuted 
                            ? "bg-red-500/10 text-red-500 border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {!isMuted ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Option 4: Block Names Toggle */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Block Helper Names</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-none">Display text names like Giant Square</p>
                      </div>
                      <button
                        onClick={() => {
                          audioService.playClick();
                          setBlockNamesEnabled(!blockNamesEnabled);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all font-mono ${
                          blockNamesEnabled 
                            ? "bg-accent-blue/15 text-sky-600 dark:text-accent-blue border-accent-blue/30" 
                            : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}
                      >
                        {blockNamesEnabled ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Option 5: Block Highlight Toggle */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--theme-border)]">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Cast Silhouette Highlights</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-none">Follows beneath cards while dragging</p>
                      </div>
                      <button
                        onClick={() => {
                          audioService.playClick();
                          setBlockHighlightEnabled(!blockHighlightEnabled);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all font-mono ${
                          blockHighlightEnabled 
                            ? "bg-accent-blue/15 text-sky-600 dark:text-accent-blue border-accent-blue/30" 
                            : "bg-neutral-800 text-neutral-300 border-neutral-700"
                        }`}
                      >
                        {blockHighlightEnabled ? "ON" : "OFF"}
                      </button>
                    </div>

                    {/* Option 6: PWA Install Status / Shortcut */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="font-bold text-[var(--theme-text-main)] block mb-0.5">Offline App Mode</span>
                        <p className="text-[10px] text-[var(--theme-text-muted)] leading-normal max-w-[210px]">
                          {installedMode 
                            ? "✓ App Installed — Offline Play Enabled" 
                            : "Install App Shortcut — Play full screen and offline."}
                        </p>
                      </div>
                      {installedMode ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg select-none">
                          INSTALLED
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            audioService.playClick();
                            triggerInstallFlow();
                          }}
                          className="px-3 py-1.5 bg-[#e11d48] hover:bg-[#ff5577] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <PlusSquare className="w-3.5 h-3.5" />
                          <span>Install</span>
                        </button>
                      )}
                    </div>

                    {/* Option 7: Offline Editions Downloads */}
                    <div className="border-t border-[var(--theme-border)] pt-3.5 mt-3.5">
                      <span className="font-bold text-[var(--theme-text-main)] block mb-1">Backup Offline Releases</span>
                      <p className="text-[10px] text-[var(--theme-text-muted)] mb-3 leading-normal">
                        Keep playing even if internet connection is completely disconnected. Keep your sessions alive!
                      </p>
                      <div className="flex flex-col gap-2">
                        {/* Download Single-File Offline Page */}
                        <button
                          onClick={() => {
                            audioService.playClick();
                            generateOfflineBundle();
                          }}
                          className="flex items-center justify-center gap-1.5 w-full px-4 py-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-100 hover:text-white rounded-lg border border-[var(--theme-border)] transition-all text-[12px] font-bold text-center cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <span>Generate Offline Page</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* PANEL B: How to Play */}
              {activeHelpTab === 'how' && (
                <div className="space-y-3 text-xs leading-relaxed animate-fade-in text-[var(--theme-text-main)]">
                  <p>Welcome to <strong>Block Blast Pro</strong>! Here is how to rack up massive scores:</p>
                  
                  <div className="p-3 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl space-y-1">
                    <span className="font-bold block">1. Drag and Drop Pieces</span>
                    <p className="text-[var(--theme-text-muted)]">Drag geometric blocks directly from your bottom queue slots onto the grid, or click/tap a pocket shape to select it and click on any grid tile to place.</p>
                  </div>

                  <div className="p-3 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl space-y-1">
                    <span className="font-bold block">2. Complete Lines to Score</span>
                    <p className="text-[var(--theme-text-muted)]">Clear columns or rows completely to empty tiles, earning currency rewards, scores, and massive multipliers based on simultaneous completions!</p>
                  </div>

                  <div className="p-3 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl space-y-1">
                    <span className="font-bold block">3. Stack Multipliers</span>
                    <p className="text-[var(--theme-text-muted)]">Clear lines on consecutive moves to raise your <span className="text-orange-500 font-bold">Streak Multiplier</span>. Place 3 shapes in a row without a clear, and your streak resets.</p>
                  </div>

                  <div className="p-3 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl space-y-1">
                    <span className="font-bold block">4. Deploy Power Ups</span>
                    <ul className="list-disc pl-4 text-[var(--theme-text-muted)] space-y-0.5">
                      <li><strong>Rotate:</strong> Circular-shift the grids of hand blocks. (Cost: 50)</li>
                      <li><strong>Reroll Hand:</strong> Refresh pocket shapes instantly. (Cost: 100)</li>
                      <li><strong>3x3 Quadrant Bomb:</strong> Erases any grid sections. (Cost: 200)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                audioService.playClick();
                setHelpOpen(false);
              }}
              className="mt-4 w-full py-2.5 bg-accent-blue text-neutral-950 hover:bg-accent-blue-dim transition-all rounded-xl font-display font-bold text-xs shadow-md"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Game Over screen --- */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-950 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[5px] bg-red-500 animate-pulse"></div>
            
            <h2 className="font-sans font-black text-3xl text-red-500 tracking-tighter uppercase mb-1">
              Grid Locked
            </h2>
            <p className="text-xs text-neutral-400 mb-6 font-mono leading-none">All moves exhausted concurrently</p>
            
            <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450">Final Score:</span>
                <span className="font-mono font-bold text-white text-sm">{score}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450">Best Record:</span>
                <span className="font-mono font-bold text-accent-blue text-sm">{highScore}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450">Available Coins:</span>
                <span className="font-mono font-bold text-accent-blue text-sm flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-accent-blue" />
                  {currency}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  audioService.playClick();
                  initializeNewGame(boardSize);
                }}
                className="flex-1 py-3 bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 text-xs font-display font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: iOS PWA Installation Guide --- */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="font-sans font-black text-sm text-neutral-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e11d48] animate-pulse" />
                <span>Install Block Blast Pro</span>
              </h3>
              <button
                onClick={() => {
                  audioService.playClick();
                  setShowIosGuide(false);
                }}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
              <p>Play the game beautifully in standalone full-screen and offline on your iPad or iPhone device:</p>
              
              <div className="p-3.5 bg-neutral-950/60 border border-neutral-850 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-neutral-800 rounded-lg text-rose-450 shrink-0">
                  <Share className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">1. Tap the Share Menu</span>
                  <p className="text-neutral-400 mt-0.5">Press the browser's native **Share** action button at the top/bottom of your Safari browser screens.</p>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950/60 border border-neutral-850 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-neutral-800 rounded-lg text-emerald-450 shrink-0">
                  <PlusSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold text-neutral-200 block">2. Select Add to Home Screen</span>
                  <p className="text-neutral-400 mt-0.5">Scroll down slightly or expand options to find and select **'Add to Home Screen'** option.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClick();
                setShowIosGuide(false);
              }}
              className="mt-5 w-full py-2 bg-rose-600 text-white font-sans font-black uppercase tracking-wider rounded-xl hover:bg-rose-500 transition-colors shadow-md text-xs cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Grid Size Switch Confirmation --- */}
      {pendingBoardSize !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="w-full max-w-[320px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 text-center">
            <h3 className="font-sans font-black text-lg text-neutral-100 mb-2">Change Grid Size?</h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Switching sizes now will discard your current score and active run.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  audioService.playClick();
                  setPendingBoardSize(null);
                }}
                className="flex-1 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-bold transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  if (pendingBoardSize) setBoardSize(pendingBoardSize as BoardSize);
                  setPendingBoardSize(null);
                }}
                className="flex-1 py-2 rounded-xl bg-accent-blue hover:bg-accent-blue-dim text-neutral-950 font-display font-bold transition-all text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
