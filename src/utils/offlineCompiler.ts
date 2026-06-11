import { SHAPES_DATABASE, SHAPE_COLORS } from './shapeGenerator';

async function loadLocalFonts(): Promise<string> {
  const getBase64 = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`BUILD_FAILURE: Failed to read local font file from '${url}'`);
    }
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
       const reader = new FileReader();
       reader.onloadend = () => {
         const result = reader.result as string;
         // Strip the data:font/ttf;base64, prefix if FileReader returns it, to ensure correct raw base64 injection
         const base64 = result.split(',')[1] || result;
         resolve(base64);
       };
       reader.onerror = () => reject(new Error(`BUILD_FAILURE: Failed to convert '${url}' to Base64.`));
       reader.readAsDataURL(blob);
    });
  };

  try {
    const comfortaaBase64 = await getBase64('/assets/fonts/Comfortaa.ttf');
    const sourceSansBase64 = await getBase64('/assets/fonts/SourceSansPro.ttf');
    
    return `
   <style>
     @font-face { font-family: 'Comfortaa'; src: url('data:font/ttf;base64,${comfortaaBase64}'); }
     @font-face { font-family: 'Source Sans Pro'; src: url('data:font/ttf;base64,${sourceSansBase64}'); }
     body { font-family: 'Source Sans Pro', sans-serif; }
     h1, h2, .title { font-family: 'Comfortaa', sans-serif; }
   </style>
    `.trim();
  } catch (err: any) {
    const errMsg = err.message || "BUILD_FAILURE: Local fonts conversion failed!";
    alert(errMsg);
    throw new Error(errMsg);
  }
}

export const generateOfflineBundle = async () => {
  let styleRules = '';
  // Traverse style sheets to inline all active CSS.
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      if (sheet.href && !sheet.href.startsWith(window.location.origin)) continue;
      
      const rules = sheet.cssRules || sheet.rules;
      if (rules) {
        for (let j = 0; j < rules.length; j++) {
          let cssText = rules[j].cssText;
          if (cssText.startsWith('@import')) continue;
          styleRules += cssText + '\\n';
        }
      }
    } catch (e) {
      console.warn('Could not read stylesheet', e);
    }
  }

  const escapedStyleRules = styleRules.replace(/`/g, '\\\\`');

  const fontsCss = await loadLocalFonts();

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    \${fontsCss}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="build-status" content="BUILD_SUCCESS">
    <title>Block Blast - Offline Runtime Engine</title>
    <style>
        :root {
            --bg-color: #0a0a0a;
            --text-color: #f5f5f5;
            --surface-color: rgba(255,255,255,0.05);
            --border-color: rgba(255,255,255,0.1);
            --primary-accent: #3b82f6;
            --font-display: 'Comfortaa', system-ui, sans-serif;
            --font-body: 'Source Sans Pro', system-ui, sans-serif;
            --font-mono: monospace;
        }

        [data-theme='light'] {
            --bg-color: #f5f5f5;
            --text-color: #171717;
            --surface-color: rgba(0,0,0,0.05);
            --border-color: rgba(0,0,0,0.1);
        }

        body { 
            margin: 0; padding: 0;
            background-color: var(--bg-color); 
            color: var(--text-color);
            transition: background-color 0.3s, color 0.3s; 
        }
        .hide { display: none !important; }
        * { box-sizing: border-box; }
        *:focus { outline: none !important; box-shadow: none !important; }
        button { font-family: inherit; cursor: pointer; }
        h1, h2, h3, .title, .modal-title { font-family: var(--font-display); }
        
        .container { touch-action: none; max-width: 400px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .title { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1px; }
        .nav-buttons { display: flex; gap: 8px; }
        .icon-btn { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-color); display: flex; justify-content: center; align-items: center; color: var(--text-color); }
        
        .dashboard { width: 100%; display: flex; gap: 12px; margin-bottom: 24px; }
        .stat-box { flex: 1; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--border-color); background: var(--surface-color); }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 4px; font-weight: bold; }
        .stat-value { font-size: 24px; font-weight: bold; font-family: var(--font-mono); }
        
        .game-board-container { width: 100%; aspect-ratio: 1; position: relative; border-radius: 16px; padding: 8px; border: 1px solid var(--border-color); background: var(--surface-color); }
        .game-board { display: grid; gap: 2px; width: 100%; height: 100%; touch-action: none; position: relative; }
        .cell { box-sizing: border-box; border-radius: 4px; background: var(--surface-color); transition: background-color 0.1s; outline: none; box-shadow: none; border: 1px solid transparent; }
        
        .shape-tray { width: 100%; height: 100px; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding: 12px; border-radius: 20px; background: var(--surface-color); border: 1px solid var(--border-color); }
        .draggable-shape { width: 70px; height: 70px; border-radius: 12px; display: flex; justify-content: center; align-items: center; background: var(--surface-color); border: 1px solid var(--border-color); touch-action: none; cursor: grab; outline: none; box-shadow: none; }
        .draggable-shape:active { cursor: grabbing; }
        .shape-grid { display: grid; gap: 1px; }
        .shape-cell { width: 14px; height: 14px; border-radius: 2px; }

        .grid-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-color); color: var(--text-color); font-weight: bold; font-family: var(--font-mono); }
        .grid-btn.active { background: var(--primary-accent); color: white; border-color: var(--primary-accent); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 16px; backdrop-filter: blur(4px); }
        .modal-content { width: 100%; max-width: 360px; border-radius: 24px; padding: 24px; position: relative; border: 1px solid var(--border-color); background: var(--bg-color); max-height: 85vh; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-title { font-size: 20px; font-weight: bold; margin: 0; }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: inherit; opacity: 0.7; }
        .modal-body { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        
        .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-color); }
        
        .shop-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-color); }
        .shop-item-preview { width: 32px; height: 32px; border-radius: 50%; margin-right: 12px; border: 2px solid var(--border-color); }
        .shop-item-info { display: flex; flex-direction: column; }
        .shop-item-name { font-weight: bold; font-size: 14px; }
        .shop-item-price { font-size: 12px; opacity: 0.7; font-family: var(--font-mono); color: #10b981; }
        .shop-btn { padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; border: none; }
        .shop-btn.equip { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .shop-btn.equipped { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .shop-btn.buy { background: #10b981; color: white; }
        .shop-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        #drop-shadow { pointer-events: none; position: absolute; display: grid; z-index: 10; opacity: 0.5; }
        #drop-shadow > div { border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5); }
        
        \${escapedStyleRules}
    </style>
</head>
<body data-theme="dark">
    <div class="container">
        <!-- HEADER -->
        <div class="header">
           <h1 class="title">BLOCK BLAST</h1>
           <div id="main-currency-display" style="display:flex;align-items:center;font-weight:bold;color:#eab308;font-family:var(--font-mono);font-size:16px;">
             <span><svg style="width:16px;height:16px;margin-right:4px;vertical-align:middle;" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg></span>
             <span id="balance-value">0</span>
           </div>
           <div class="nav-buttons">
             <button id="nav-shop" class="icon-btn" title="Marketplace">
               <svg style="width:20px;height:20px;color:#10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
             </button>
             <button id="nav-settings" class="icon-btn" title="Settings">
               <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             </button>
           </div>
        </div>

        <!-- DASHBOARD -->
        <div class="dashboard">
           <div class="stat-box">
             <span class="stat-label">Score</span>
             <div style="display:flex;align-items:baseline;gap:4px;">
               <span id="score-display" class="stat-value" style="color:var(--primary-accent);">0</span>
               <span id="multiplier-display" class="hide" style="font-size:12px;font-weight:bold;color:#f97316;">x1</span>
             </div>
           </div>
           <div class="stat-box">
             <span class="stat-label">High Score</span>
             <span id="highscore-display" class="stat-value">0</span>
           </div>
        </div>

        <!-- GRID SELECTOR -->
        <div class="grid-selector" id="grid-selector" style="display:flex; justify-content:center; gap:8px; margin-bottom: 24px; width: 100%;">
           <button class="grid-btn" data-size="6">6x6</button>
           <button class="grid-btn" data-size="8">8x8</button>
           <button class="grid-btn" data-size="10">10x10</button>
           <button class="grid-btn" data-size="12">12x12</button>
        </div>

        <!-- BOARD -->
        <div class="game-board-container" id="board-bounds">
            <div id="game-board" class="game-board"></div>
            <div id="drop-shadow" class="hide"></div>
        </div>

        <!-- TRAY -->
        <div class="shape-tray" id="shape-tray">
             <!-- Generated by JS -->
        </div>

        <p style="margin-top:24px;font-size:10px;font-family:var(--font-mono);opacity:0.5;">OFFLINE MODE • NO EXTERNAL RESOURCES</p>

    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="modal-overlay hide">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Settings</h2>
                <button class="close-btn nav-close">✕</button>
            </div>
            <div class="modal-body">
                <div class="setting-row">
                    <span style="font-weight:bold;font-size:14px;">Color Mode</span>
                    <button id="toggle-mode-btn" style="background:var(--primary-accent);color:white;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;">Dark</button>
                </div>
                <div class="setting-row">
                    <span style="font-weight:bold;font-size:14px;">Block Drop Shadows</span>
                    <button id="toggle-shadow-btn" style="background:var(--surface-color);color:inherit;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;">On</button>
                </div>
                <div class="setting-row">
                    <span style="font-weight:bold;font-size:14px;">Block Helper Names</span>
                    <button id="toggle-helpers-btn" style="background:var(--surface-color);color:inherit;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;">Off</button>
                </div>
                <div class="setting-row" id="fullscreen-row">
                    <span style="font-weight:bold;font-size:14px;">Full Screen</span>
                    <button id="toggle-fullscreen-btn" style="background:var(--surface-color);color:inherit;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;">Enable</button>
                </div>
                <div class="setting-row" style="flex-direction: column; align-items: stretch; gap: 8px; margin-top: 12px;">
                    <button id="add-to-home-btn" style="background:#10b981;color:white;border:none;padding:12px;border-radius:8px;font-weight:bold;width:100%;">Add to Home Screen</button>
                    <p id="pwa-instructions" class="hide" style="font-size:11px; opacity:0.7; text-align:center; margin:0;">Instructions: Use browser menu "Add to Home Screen"</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Shop Modal -->
    <div id="shop-modal" class="modal-overlay hide">
        <div class="modal-content">
            <div class="modal-header" style="margin-bottom:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">
                <div>
                    <h2 class="modal-title">Marketplace</h2>
                    <div id="shop-balance" style="font-size:12px;font-weight:bold;color:#10b981;font-family:var(--font-mono);margin-top:4px;">Balance: 0</div>
                </div>
                <button class="close-btn nav-close">✕</button>
            </div>
            <div id="shop-items" class="modal-body">
                <!-- Generated by JS -->
            </div>
        </div>
    </div>

    <!-- LOGIC -->
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        console.log("Game Engine Initialized");

        const SHAPES_DATABASE = ${JSON.stringify(SHAPES_DATABASE) || 'null'};
        const SHAPE_COLORS = ${JSON.stringify(SHAPE_COLORS) || 'null'};

        console.log("=== BUILD INTEGRITY LOG ===");
        console.log("SHAPES_DATABASE Loaded:", SHAPES_DATABASE ? Object.keys(SHAPES_DATABASE).length + " shapes" : "Failed");
        console.log("SHAPE_COLORS Loaded:", SHAPE_COLORS ? SHAPE_COLORS.length + " colors" : "Failed");
        console.log("===========================");

        const STATIC_THEMES = [
            { id: 'classic', name: 'Classic Blue', displayColor: '#3b82f6', price: 0, unlocked: true },
            { id: 'neon', name: 'Neon Purple', displayColor: '#a855f7', price: 100, unlocked: false },
            { id: 'sunset', name: 'Sunset Orange', displayColor: '#f97316', price: 100, unlocked: false },
            { id: 'forest', name: 'Deep Forest', displayColor: '#22c55e', price: 100, unlocked: false },
            { id: 'crimson', name: 'Crimson Red', displayColor: '#ef4444', price: 150, unlocked: false },
            { id: 'monochrome', name: 'Monochrome', displayColor: '#a3a3a3', price: 150, unlocked: false },
            { id: 'bubblegum', name: 'Bubblegum', displayColor: '#ec4899', price: 200, unlocked: false },
            { id: 'gold', name: 'Luxury Gold', displayColor: '#eab308', price: 300, unlocked: false }
        ];

        const OFFLINE_UI_CONFIG = {
            colorMode: 'dark',
            showDropShadows: true,
            showHelperNames: false
        };

        let gameState = {
            score: 0,
            highScore: 0,
            balance: 0,
            multiplier: 1,
            combo: 0,
            activeThemeId: 'classic',
            unlockedThemes: ['classic'],
            gridSize: 10,
            ...OFFLINE_UI_CONFIG
        };

        let board = null;
        let hand = null;

        function loadGame() {
            try {
                const saved = window.localStorage.getItem('blockBlastOfflineState');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.gameState) gameState = Object.assign(gameState, parsed.gameState);
                    if (parsed.board) board = parsed.board;
                    if (parsed.hand) hand = parsed.hand;
                }
            } catch(e) {}

            if (!board || board.length !== gameState.gridSize) {
                board = Array(gameState.gridSize).fill(null).map(() => Array(gameState.gridSize).fill(false));
            }
            if (!hand) {
                hand = [null, null, null];
            }
        }
        
        loadGame();

        const shadowBtn = document.getElementById('toggle-shadow-btn');
        if (shadowBtn) shadowBtn.innerText = gameState.showDropShadows ? 'On' : 'Off';
        const helpersBtn = document.getElementById('toggle-helpers-btn');
        if (helpersBtn) helpersBtn.innerText = gameState.showHelperNames ? 'On' : 'Off';

        function saveGame() {
            try {
                window.localStorage.setItem('blockBlastOfflineState', JSON.stringify({
                    gameState: gameState,
                    board: board,
                    hand: hand
                }));
            } catch(e) {}
        }

        // Elements
        const elGrid = document.getElementById('game-board');
        const elTray = document.getElementById('shape-tray');
        const elScore = document.getElementById('score-display');
        const elHighscore = document.getElementById('highscore-display');
        const elMult = document.getElementById('multiplier-display');
        const elBalance = document.getElementById('shop-balance');
        const elSettingsModal = document.getElementById('settings-modal');
        const elShopModal = document.getElementById('shop-modal');
        const elShopItems = document.getElementById('shop-items');
        const dropShadow = document.getElementById('drop-shadow');

        function getTheme() {
            return STATIC_THEMES.find(t => t.id === gameState.activeThemeId) || STATIC_THEMES[0];
        }

        function toggleColorMode() {
            gameState.colorMode = gameState.colorMode === 'dark' ? 'light' : 'dark';
            applyColorMode();
            saveGame();
        }

        function applyColorMode() {
            document.body.setAttribute('data-theme', gameState.colorMode);
            const btn = document.getElementById('toggle-mode-btn');
            if (btn) btn.innerText = gameState.colorMode === 'dark' ? 'Dark' : 'Light';
        }

        function generateRandomShape() {
            let keys = Object.keys(SHAPES_DATABASE || {});
            if (!keys.length) return null;
            if (gameState.gridSize <= 8) {
                keys = keys.filter(k => k !== 'giant_line_h' && k !== 'giant_line_v');
            }
            if (!keys.length) return null;
            const chosenKey = keys[Math.floor(Math.random() * keys.length)];
            const colorChoices = SHAPE_COLORS && SHAPE_COLORS.length ? SHAPE_COLORS : [getTheme().displayColor];
            return {
                id: Math.random().toString(),
                matrix: SHAPES_DATABASE[chosenKey],
                color: colorChoices[Math.floor(Math.random() * colorChoices.length)]
            };
        }

        function fillHand() {
            for(let i=0; i<3; i++) {
                if(!hand[i]) hand[i] = generateRandomShape();
            }
        }

        function renderBoard() {
            elGrid.style.gridTemplateColumns = \`repeat(\${gameState.gridSize}, 1fr)\`;
            const activeColor = getTheme().displayColor;
            
            elGrid.innerHTML = board.map((row) => 
                row.map((cell) => {
                    const bgContent = cell ? \`style="background-color: \${activeColor}; border-color: transparent;"\` : "";
                    return \`<div class="cell" \${bgContent}></div>\`;
                }).join('')
            ).join('');
        }

        function renderTray() {
            elTray.innerHTML = hand.map((shape, idx) => {
                if (!shape) return \`<div style="width:70px;height:70px;"></div>\`;
                const rows = shape.matrix.length;
                const cols = shape.matrix[0].length;
                let gridHTML = shape.matrix.map(r => r.map(cell => \`<div class="shape-cell" style="\${cell ? 'background-color: '+getTheme().displayColor : 'opacity:0'}"></div>\`).join('')).join('');

                const helperInfo = Object.keys(SHAPES_DATABASE || {}).find(k => JSON.stringify(SHAPES_DATABASE[k]) === JSON.stringify(shape.matrix));
                const nameStr = (gameState.showHelperNames && helperInfo) ? \`<div style="position:absolute; bottom:-20px; font-size:9px; text-transform:uppercase; font-family:var(--font-mono); font-weight:bold; opacity:0.8; white-space:nowrap; pointer-events:none;">\${helperInfo.replace(/_/g, ' ')}</div>\` : '';

                return \`<div class="draggable-shape" data-idx="\${idx}" style="position:relative;">
                    <div class="shape-grid" style="grid-template-columns: repeat(\${cols}, 1fr)">\${gridHTML}</div>
                    \${nameStr}
                </div>\`;
            }).join('');
        }

        function renderScore() {
            elScore.innerText = gameState.score;
            document.documentElement.style.setProperty('--primary-accent', getTheme().displayColor);
            elScore.style.color = getTheme().displayColor;
            elHighscore.innerText = gameState.highScore;
            
            if (gameState.multiplier > 1) {
                elMult.innerText = \`x\${gameState.multiplier}\`;
                elMult.classList.remove('hide');
            } else {
                elMult.classList.add('hide');
            }
            elBalance.innerText = \`Balance: \${gameState.balance}\`;
            const headerBalance = document.getElementById('balance-value');
            if (headerBalance) headerBalance.innerText = gameState.balance;
        }

        function renderShop() {
            elShopItems.innerHTML = STATIC_THEMES.map(theme => {
                const isUnlocked = gameState.unlockedThemes.includes(theme.id) || theme.unlocked;
                const isEquipped = gameState.activeThemeId === theme.id;
                const canAfford = gameState.balance >= theme.price;
                
                const itemStyle = isEquipped ? 'border-color: #10b981;' : '';
                
                let btnHtml = '';
                if (isUnlocked) {
                    const btnClass = isEquipped ? 'equipped' : 'equip';
                    btnHtml = \`<button class="shop-btn \${btnClass}" data-action="equip" data-tid="\${theme.id}">\${isEquipped ? 'Equipped' : 'Equip'}</button>\`;
                } else {
                    btnHtml = \`<button class="shop-btn buy" data-action="buy" data-tid="\${theme.id}" \${!canAfford?'disabled':''}>Buy (\${theme.price})</button>\`;
                }

                return \`<div class="shop-item" style="\${itemStyle}">
                    <div style="display:flex;align-items:center;">
                        <div class="shop-item-preview" style="background-color: \${theme.displayColor}"></div>
                        <div class="shop-item-info">
                            <span class="shop-item-name">\${theme.name}</span>
                            \${!isUnlocked ? \`<span class="shop-item-price">\${theme.price} credits</span>\` : ''}
                        </div>
                    </div>
                    \${btnHtml}
                </div>\`;
            }).join('');
        }

        // Event Delegation for UI
        document.body.addEventListener('click', (e) => {
            const tgt = e.target;
            
            // Toggle Mode
            if (tgt.id === 'toggle-mode-btn') {
                toggleColorMode();
            }
            // Toggle Fullscreen
            if (tgt.id === 'toggle-fullscreen-btn') {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('Error attempting to enable full-screen mode: ' + err.message);
                    });
                    tgt.innerText = 'Disable';
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                    tgt.innerText = 'Enable';
                }
            }
            // Toggle Drop Shadows
            if (tgt.id === 'toggle-shadow-btn') {
                gameState.showDropShadows = !gameState.showDropShadows;
                tgt.innerText = gameState.showDropShadows ? 'On' : 'Off';
                saveGame();
            }
            // Toggle Helper Names
            if (tgt.id === 'toggle-helpers-btn') {
                gameState.showHelperNames = !gameState.showHelperNames;
                tgt.innerText = gameState.showHelperNames ? 'On' : 'Off';
                saveGame();
                renderTray(); // Re-render to show/hide names
            }
            // Add to Home Screen
            if (tgt.id === 'add-to-home-btn') {
                document.getElementById('pwa-instructions').classList.remove('hide');
            }
            // Grid Size Bar
            if (tgt.classList.contains('grid-btn')) {
                const size = parseInt(tgt.getAttribute('data-size'));
                if (size !== gameState.gridSize) {
                    gameState.gridSize = size;
                    board = Array(size).fill(null).map(() => Array(size).fill(false));
                    gameState.score = 0;
                    gameState.multiplier = 1;
                    gameState.combo = 0;
                    fillHand();
                    saveGame();
                    renderBoard();
                    renderScore();
                    renderTray();
                }
                renderGridSelector();
            }
            // Nav Shop
            if (tgt.closest('#nav-shop')) {
                renderShop();
                elShopModal.classList.remove('hide');
            }
            // Nav Settings
            if (tgt.closest('#nav-settings')) {
                elSettingsModal.classList.remove('hide');
            }
            // Close Modals
            if (tgt.closest('.nav-close')) {
                elSettingsModal.classList.add('hide');
                elShopModal.classList.add('hide');
            }
            // Shop Buttons
            if (tgt.closest('.shop-btn')) {
                const btn = tgt.closest('.shop-btn');
                const tId = btn.getAttribute('data-tid');
                const action = btn.getAttribute('data-action');
                if (action === 'equip') {
                    gameState.activeThemeId = tId;
                    saveGame();
                    renderScore();
                    renderGridSelector();
                    renderBoard();
                    renderTray();
                    renderShop();
                } else if (action === 'buy') {
                    const theme = STATIC_THEMES.find(t=>t.id===tId);
                    if (theme && gameState.balance >= theme.price) {
                        gameState.balance -= theme.price;
                        gameState.unlockedThemes.push(tId);
                        gameState.activeThemeId = tId;
                        saveGame();
                        renderScore();
                        renderGridSelector();
                        renderBoard();
                        renderTray();
                        renderShop();
                    }
                }
            }
        });

        function renderGridSelector() {
            document.querySelectorAll('.grid-btn').forEach(btn => {
                const s = parseInt(btn.getAttribute('data-size'));
                if (s === gameState.gridSize) {
                    btn.classList.add('active');
                    btn.style.backgroundColor = getTheme().displayColor;
                    btn.style.borderColor = getTheme().displayColor;
                    btn.style.color = "white";
                } else {
                    btn.classList.remove('active');
                    btn.style.backgroundColor = "var(--surface-color)";
                    btn.style.borderColor = "var(--border-color)";
                    btn.style.color = "var(--text-color)";
                }
            });
        }

        // Drag Handling Delegate
        let activeIdx = null;
        let dragGhost = null;
        let shapeMatrix = null;

        function updateSilhouette(targetRow, targetCol) {
            if(!shapeMatrix) {
                dropShadow.classList.add('hide');
                return;
            }
            
            const isValidCoord = targetRow >= 0 && targetRow < gameState.gridSize && targetCol >= 0 && targetCol < gameState.gridSize;
            let fits = true;
            const rows = shapeMatrix.length;
            const cols = shapeMatrix[0].length;
            
            if(isValidCoord) {
                for(let r=0; r<rows; r++){
                    for(let c=0; c<cols; c++){
                        if(shapeMatrix[r][c]) {
                            const tr = targetRow + r;
                            const tc = targetCol + c;
                            if(tr < 0 || tr >= gameState.gridSize || tc < 0 || tc >= gameState.gridSize || board[tr][tc]) fits = false;
                        }
                    }
                }
            } else {
                fits = false;
            }

            if (fits && isValidCoord && gameState.showDropShadows) {
                dropShadow.classList.remove('hide');
                dropShadow.style.gridTemplateColumns = \`repeat(\${cols}, 1fr)\`;
                dropShadow.style.gap = '2px';
                
                const cellW = elGrid.clientWidth / gameState.gridSize;

                dropShadow.style.left = \`\${(targetCol * cellW)}px\`;
                dropShadow.style.top = \`\${(targetRow * cellW)}px\`;
                dropShadow.style.width = \`\${cols * cellW}px\`;
                dropShadow.style.height = \`\${rows * cellW}px\`;

                dropShadow.innerHTML = shapeMatrix.map(r => r.map(c => 
                    \`<div style="background-color: \${c ? getTheme().displayColor : 'transparent'}; width:100%; height:100%; border-radius:4px;"></div>\`
                ).join('')).join('');
            } else {
                dropShadow.classList.add('hide');
            }
        }

        document.addEventListener('pointerdown', (e) => {
            const tgt = e.target;
            const shapeDiv = tgt.closest('.draggable-shape');
            if (shapeDiv) {
                e.preventDefault();
                if(e.target.releasePointerCapture) {
                    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
                }

                activeIdx = parseInt(shapeDiv.getAttribute('data-idx'));
                if (hand[activeIdx]) {
                    shapeMatrix = hand[activeIdx].matrix;
                    
                    dragGhost = shapeDiv.cloneNode(true);
                    dragGhost.style.position = 'fixed';
                    dragGhost.style.zIndex = '9999';
                    dragGhost.style.pointerEvents = 'none';
                    dragGhost.style.transform = 'translate(-50%, -50%) scale(1)';
                    dragGhost.style.opacity = '0.9';
                    dragGhost.style.left = e.clientX + 'px';
                    dragGhost.style.top = e.clientY + 'px';
                    dragGhost.style.margin = '0';

                    const color = getTheme().displayColor;
                    dragGhost.querySelectorAll('.shape-cell').forEach(c => {
                        if (c.style.opacity !== '0') c.style.backgroundColor = color;
                    });

                    document.body.appendChild(dragGhost);
                    shapeDiv.style.opacity = '0.1';
                }
            }
        }, { passive: false });

        document.addEventListener('pointermove', (e) => {
            if(dragGhost && shapeMatrix) {
                e.preventDefault(); // Stop touch scrolling
                dragGhost.style.left = e.clientX + 'px';
                dragGhost.style.top = e.clientY + 'px';

                const rect = elGrid.getBoundingClientRect();
                const cellW = rect.width / gameState.gridSize;
                const blockWidth = shapeMatrix[0].length * cellW;
                const blockHeight = shapeMatrix.length * cellW;
                const x = e.clientX - rect.left - (blockWidth / 2);
                const y = e.clientY - rect.top - (blockHeight / 2);
                
                const col = Math.round(x / cellW);
                const row = Math.round(y / cellW);
                
                updateSilhouette(row, col);
            }
        }, { passive: false });

        document.addEventListener('pointerup', (e) => {
            if(activeIdx !== null && dragGhost && shapeMatrix) {
                const rect = elGrid.getBoundingClientRect();
                const cellW = rect.width / gameState.gridSize;
                const blockWidth = shapeMatrix[0].length * cellW;
                const blockHeight = shapeMatrix.length * cellW;
                const x = e.clientX - rect.left - (blockWidth / 2);
                const y = e.clientY - rect.top - (blockHeight / 2);
                
                const col = Math.round(x / cellW);
                const row = Math.round(y / cellW);
                
                let canPlace = false;

                if(row >= 0 && row < gameState.gridSize && col >= 0 && col < gameState.gridSize) {
                    let fits = true;
                    const rows = shapeMatrix.length;
                    const cols = shapeMatrix[0].length;
                    for(let r=0; r<rows; r++){
                        for(let c=0; c<cols; c++){
                            if(shapeMatrix[r][c]) {
                                const tr = row + r;
                                const tc = col + c;
                                if(tr < 0 || tr >= gameState.gridSize || tc < 0 || tc >= gameState.gridSize || board[tr][tc]) fits = false;
                            }
                        }
                    }
                    if(fits) {
                        canPlace = true;
                        for(let r=0; r<rows; r++){
                            for(let c=0; c<cols; c++){
                                if(shapeMatrix[r][c]) board[row+r][col+c] = true;
                            }
                        }
                        gameState.score += (shapeMatrix.flat().filter(x=>x).length * 10 * gameState.multiplier);
                    }
                }

                if(canPlace) {
                    hand[activeIdx] = null;
                    checkLines();
                    saveGame();
                    if(hand.every(h => h === null)) fillHand();
                    
                    if (!checkAnyFits()) {
                        setTimeout(() => {
                            alert("Game Over! Final Score: " + gameState.score);
                            board = Array(gameState.gridSize).fill(null).map(() => Array(gameState.gridSize).fill(false));
                            gameState.score = 0;
                            gameState.multiplier = 1;
                            gameState.combo = 0;
                            fillHand();
                            saveGame();
                            renderTray();
                            renderBoard();
                            renderScore();
                        }, 300);
                    }
                }
                
                dragGhost.remove();
                dragGhost = null;
                activeIdx = null;
                shapeMatrix = null;
                updateSilhouette(-1, -1);
                
                renderTray();
                renderBoard();
                renderScore();
            }
        });

        function checkAnyFits() {
            for(let i=0; i<hand.length; i++){
                const shape = hand[i];
                if(!shape) continue;
                const rows = shape.matrix.length;
                const cols = shape.matrix[0].length;
                
                for(let r=0; r<=gameState.gridSize-rows; r++){
                    for(let c=0; c<=gameState.gridSize-cols; c++){
                        let fits = true;
                        for(let sr=0; sr<rows; sr++){
                            for(let sc=0; sc<cols; sc++){
                                if(shape.matrix[sr][sc] && board[r+sr][c+sc]) fits = false;
                            }
                        }
                        if(fits) return true;
                    }
                }
            }
            return false;
        }

        function checkLines() {
            let cleared = false;
            let rowsToClear = [];
            let colsToClear = [];

            for(let r=0; r<gameState.gridSize; r++) {
                if(board[r].every(c => c)) { rowsToClear.push(r); cleared = true; }
            }
            for(let c=0; c<gameState.gridSize; c++) {
                if(board.every(r => r[c])) { colsToClear.push(c); cleared = true; }
            }
            
            const totalClears = rowsToClear.length + colsToClear.length;
            rowsToClear.forEach(r => board[r].fill(false));
            colsToClear.forEach(c => board.forEach(r => r[c] = false));
            
            if (cleared) {
                gameState.combo++;
                let points = totalClears * 100;
                if(totalClears > 1) points += (totalClears * 50);
                gameState.score += Math.floor(points * gameState.multiplier);
                gameState.multiplier += 0.5 * totalClears;
                gameState.balance += totalClears * 5;
            } else {
                gameState.combo = 0;
                gameState.multiplier = 1;
            }

            if(gameState.score > gameState.highScore) gameState.highScore = gameState.score;
        }

        // Run setup
        applyColorMode();
        fillHand();
        renderTray();
        renderBoard();
        renderScore();
        renderShop();

        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            const fsRow = document.getElementById('fullscreen-row');
            if (fsRow) fsRow.classList.add('hide');
        }
      });
    </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'block-blast-offline.html';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);

  return htmlContent;
};

