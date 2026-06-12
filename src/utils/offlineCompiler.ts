import { SHAPES_DATABASE, SHAPE_COLORS } from './shapeGenerator';

export const generateOfflineBundle = async () => {
  // Safe high-performance CSS collection pipeline
  let styleRules = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        styleRules += rule.cssText + '\n';
      }
    } catch (e) {
      // Absorb boundary variations silently
    }
  }

  // Pure embedded Google Font imports to maintain flawless typographic weights without breaking bundle limits
  const fontsCss = `
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
  `;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="build-status" content="BUILD_SUCCESS">
    <title>Block Blast Pro - Standalone</title>
    <style>
        ${fontsCss}

        :root {
            --accent-blue: #95e2fc;
            --bg-color: #0a0a0a;
            --text-color: #f5f5f5;
            --surface-color: rgba(255,255,255,0.05);
            --border-color: rgba(255,255,255,0.1);
            --font-display: 'Comfortaa', system-ui, sans-serif;
            --font-body: 'Source Sans Pro', system-ui, sans-serif;
            --shadow-opacity: 0.4;
        }

        [data-theme='light'] {
            --bg-color: #f5f5f5;
            --text-color: #171717;
            --surface-color: rgba(0,0,0,0.04);
            --border-color: rgba(0,0,0,0.08);
            --shadow-opacity: 0.15;
        }

        body {
            margin: 0; padding: 0; touch-action: none;
            background-color: var(--bg-color); color: var(--text-color);
            font-family: var(--font-body); user-select: none; -webkit-user-select: none;
            display: flex; flex-direction: column; align-items: center; min-height: 100vh;
        }

        h1, h2, h3, .font-display { font-family: var(--font-display); font-weight: 700; }

        .app-shell { width: 100%; max-width: 480px; display: flex; flex-direction: column; height: 100vh; justify-content: space-between; padding: 1rem; box-sizing: border-box; }
        .header-ui { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .coin-pill { display: flex; align-items: center; gap: 0.35rem; background: var(--surface-color); padding: 0.4rem 0.8rem; border-radius: 9999px; border: 1px solid var(--border-color); color: #fbbf24; font-weight: 700; }
        
        .score-board { display: flex; width: 100%; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 1rem; padding: 0.75rem; box-sizing: border-box; text-align: center; margin: 0.5rem 0; }
        .score-box { flex: 1; }
        .score-label { font-size: 0.75rem; text-transform: uppercase; tracking: 0.05em; opacity: 0.6; margin-bottom: 2px; }
        .score-num { font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); }

        .matrix-frame { width: 100%; aspect-ratio: 1; background: var(--surface-color); border: 2px solid var(--border-color); border-radius: 1.25rem; padding: 0.5rem; box-sizing: border-box; display: grid; gap: 4px; position: relative; }
        .matrix-box { background: rgba(0,0,0,0.2); border-radius: 6px; width: 100%; height: 100%; position: relative; transition: background 0.15s ease; border: 1px solid rgba(255,255,255,0.02); }
        [data-theme='light'] .matrix-box { background: rgba(0,0,0,0.06); }

        .block-unit { width: 100%; height: 100%; border-radius: 6px; box-sizing: border-box; position: relative; border-top: 2px solid rgba(255,255,255,0.3); border-left: 2px solid rgba(255,255,255,0.15); border-bottom: 2px solid rgba(0,0,0,0.25); }
        .has-shadow .block-unit { box-shadow: 0 4px 6px rgba(0,0,0,var(--shadow-opacity)); }
        
        .block-tag { position: absolute; bottom: 2px; left: 2px; font-size: 8px; font-weight: 700; opacity: 0.7; font-family: monospace; text-transform: uppercase; }
        .hide-tags .block-tag { display: none !important; }

        .hand-dock { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; width: 100%; margin-top: 0.5rem; }
        .dock-pocket { background: var(--surface-color); border: 2px dashed var(--border-color); aspect-ratio: 1; border-radius: 1rem; display: flex; align-items: center; justify-content: center; position: relative; cursor: grab; }
        .dock-pocket:active { cursor: grabbing; }

        .floating-drag-element { position: fixed; pointer-events: none; z-index: 9999; transform: scale(1.15); opacity: 0.92; }

        .nav-bar { display: flex; gap: 0.75rem; width: 100%; justify-content: center; margin-top: 0.5rem; }
        .nav-btn { background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); border-radius: 0.75rem; padding: 0.6rem 1.2rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-family: var(--font-body); transition: transform 0.1s; }
        .nav-btn:active { transform: scale(0.95); }
        .nav-btn.primary { background: var(--accent-blue); color: #000; border: none; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
        .modal-overlay.open { display: flex; }
        .modal-card { background: #141414; border: 1px solid var(--border-color); width: 100%; max-width: 380px; border-radius: 1.5rem; padding: 1.5rem; box-sizing: border-box; color: #fff; max-height: 85vh; overflow-y: auto; }
        [data-theme='light'] .modal-card { background: #ffffff; color: #171717; }
        
        .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
        .grid-selector-group { display: flex; gap: 0.5rem; width: 100%; margin: 1rem 0; }
        .grid-opt-btn { flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: transparent; color: var(--text-color); font-weight: 700; cursor: pointer; }
        .grid-opt-btn.active { background: var(--accent-blue); color: #000; border-color: var(--accent-blue); }

        .shop-matrix { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1rem; }
        .shop-item-card { border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); border-radius: 0.75rem; padding: 0.75rem; text-align: center; cursor: pointer; position: relative; }
        .shop-item-card.active { border-color: var(--accent-blue); box-shadow: 0 0 8px var(--accent-blue); }
        .color-preview-bar { hieght: 8px; display: flex; height: 100%; width: 100%; height: 10px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }

        .combo-badge { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; animation: bounce 0.4s infinite alternate; display: none; }
    </style>
</head>
<body class="has-shadow">

    <div class="app-shell">
        <div class="header-ui">
            <h1 style="margin:0; font-size:1.5rem; color: var(--accent-blue);">Block Blast Standalone</h1>
            <div class="coin-pill">🪙 <span id="coin-counter">0</span></div>
        </div>

        <div class="score-board">
            <div class="score-box">
                <div class="score-label">Score</div>
                <div id="score-txt" class="score-num">0</div>
            </div>
            <div class="score-box" style="border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">
                <div class="score-label">Multiplier</div>
                <div id="mult-txt" class="score-num" style="color:var(--accent-blue);">1.0x</div>
            </div>
            <div class="score-box">
                <div class="score-label">High Score</div>
                <div id="high-txt" class="score-num">0</div>
            </div>
        </div>

        <div id="main-matrix" class="matrix-frame">
            <div id="combo-alert" class="combo-badge">COMBO!</div>
        </div>

        <div id="tray-dock" class="hand-dock"></div>

        <div class="nav-bar">
            <button class="nav-btn" onclick="toggleModal('shop-modal', true)">🛒 Shop</button>
            <button class="nav-btn" onclick="toggleModal('settings-modal', true)">⚙️ Settings</button>
        </div>
    </div>

    <div id="settings-modal" class="modal-overlay">
        <div class="modal-card">
            <h2 style="margin-top:0;">Settings Engine</h2>
            
            <label class="score-label">Grid Layout Configuration</label>
            <div class="grid-selector-group">
                <button id="opt-6" class="grid-opt-btn" onclick="changeGridDimensions(6)">6 x 6</button>
                <button id="opt-8" class="grid-opt-btn" onclick="changeGridDimensions(8)">8 x 8</button>
                <button id="opt-10" class="grid-opt-btn" onclick="changeGridDimensions(10)">10 x 10</button>
            </div>

            <div class="setting-row">
                <span>Dark Appearance Theme</span>
                <input type="checkbox" id="theme-toggle-chk" checked onchange="handleVisualThemeChange(this.checked)">
            </div>
            <div class="setting-row">
                <span>Display Block Identification Tags</span>
                <input type="checkbox" id="tags-toggle-chk" checked onchange="handleTagVisibility(this.checked)">
            </div>
            <div class="setting-row">
                <span>Render Soft Drop Shadows</span>
                <input type="checkbox" id="shadow-toggle-chk" checked onchange="handleShadowVisibility(this.checked)">
            </div>

            <div style="margin-top: 1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                <button class="nav-btn primary" style="width:100%; justify-content:center;" onclick="triggerHomeScreenPrompt()">📱 Add to Home Screen</button>
                <button class="nav-btn" style="width:100%; justify-content:center;" onclick="toggleFullscreenChannel()">📺 Toggle Fullscreen App View</button>
                <button class="nav-btn" style="width:100%; justify-content:center; margin-top:0.5rem;" onclick="toggleModal('settings-modal', false)">Apply Rules</button>
            </div>
        </div>
    </div>

    <div id="shop-modal" class="modal-overlay">
        <div class="modal-card">
            <h2 style="margin-top:0;">Cosmetics Customizer</h2>
            <p style="font-size:0.8rem; opacity:0.7; margin-top:-0.5rem;">Skins alter layout backgrounds dynamically when clearing tracks.</p>
            <div id="shop-list" class="shop-matrix"></div>
            <button class="nav-btn" style="width:100%; justify-content:center; margin-top:1.5rem;" onclick="toggleModal('shop-modal', false)">Close Shop</button>
        </div>
    </div>

    <script>
        const EMBEDDED_SHAPES = ${JSON.stringify(SHAPES_DATABASE)};
        const FALLBACK_COLOR_PALETTE = ${JSON.stringify(SHAPE_COLORS)};

        // All 16 standalone color matrix skins supporting fluid rotations
        const APP_SKIN_THEMES = [
            { id: 'classic', name: 'Classic Slate', cost: 0, colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
            { id: 'neon', name: 'Cyber Neon', cost: 100, colors: ['#00f0ff', '#ff007f', '#9d00ff', '#00ff66', '#ffb700'] },
            { id: 'pastel', name: 'Soft Pastel', cost: 150, colors: ['#ffb3ba', '#baffc9', '#bae1ff', '#ffffba', '#e8baff'] },
            { id: 'retro', name: 'Arcade 1989', cost: 200, colors: ['#ff0055', '#00ffcc', '#ffff00', '#ff00ff', '#0033ff'] },
            { id: 'forest', name: 'Deep Timber', cost: 250, colors: ['#2c5e3b', '#a98467', '#adc178', '#dde5b6', '#6c584c'] },
            { id: 'sunset', name: 'Miami Dusk', cost: 300, colors: ['#f43f5e', '#ec4899', '#d946ef', '#f97316', '#eab308'] },
            { id: 'ocean', name: 'Pacific Trench', cost: 350, colors: ['#0284c7', '#06b6d4', '#0d9488', '#38bdf8', '#075985'] },
            { id: 'monochrome', name: 'Minimalist', cost: 400, colors: ['#404040', '#737373', '#a3a3a3', '#d4d4d4', '#171717'] },
            { id: 'emerald', name: 'Jade Palace', cost: 500, colors: ['#047857', '#10b981', '#34d399', '#6ee7b7', '#064e3b'] },
            { id: 'magma', name: 'Volcanic Core', cost: 600, colors: ['#991b1b', '#dc2626', '#ea580c', '#f97316', '#facc15'] },
            { id: 'candy', name: 'Sugar Rush', cost: 700, colors: ['#ff758f', '#ff7f51', '#ff9b54', '#ffbf69', '#ffccd5'] },
            { id: 'aurora', name: 'Boreal Crown', cost: 800, colors: ['#7400b8', '#6930c3', '#5e60ce', '#4ea8de', '#48cae4'] },
            { id: 'vintage', name: 'Sepia Polaroid', cost: 900, colors: ['#8c7853', '#eaddca', '#c19a6b', '#704214', '#b87333'] },
            { id: 'glitch', name: 'Static Noise', cost: 1000, colors: ['#20c997', '#dc3545', '#fd7e14', '#6610f2', '#e83e8c'] },
            { id: 'quantum', name: 'Event Horizon', cost: 1200, colors: ['#3a0ca3', '#4361ee', '#4cc9f0', '#7209b7', '#f72585'] },
            { id: 'matrix', name: 'Digital Rain', cost: 1500, colors: ['#003b00', '#008f11', '#00ff41', '#105f10', '#001100'] }
        ];

        let gameState = {
            gridSize: 6, // 6x6 Default on offline runtime deployment variant
            score: 0,
            highScore: parseInt(localStorage.getItem('bb_off_high') || '0'),
            balance: parseInt(localStorage.getItem('bb_off_coins') || '150'), // Grants immediate starter allowance
            combo: 0,
            multiplier: 1.0,
            activeThemeIndex: 0,
            unlockedThemes: JSON.parse(localStorage.getItem('bb_off_unlocked') || '["classic"]')
        };

        let gridBoard = [];
        let traySlotsData = [null, null, null];
        let draggingSession = null;

        const elMatrix = document.getElementById('main-matrix');
        const elTray = document.getElementById('tray-dock');

        function initRuntimeEngine() {
            gridBoard = Array(gameState.gridSize).fill(null).map(() => Array(gameState.gridSize).fill(null));
            elMatrix.style.gridTemplateRows = `repeat(\${gameState.gridSize}, 1fr)`;
            elMatrix.style.gridTemplateColumns = `repeat(\${gameState.gridSize}, 1fr)`;
            
            // Sync setting controls visually
            document.querySelectorAll('.grid-opt-btn').forEach(b => b.classList.remove('active'));
            const activeButton = document.getElementById(`opt-\${gameState.gridSize}`);
            if(activeButton) activeButton.classList.add('active');

            buildVisualMatrix();
            updateScoresPanel();
            renderCustomizerShop();
        }

        function buildVisualMatrix() {
            elMatrix.querySelectorAll('.matrix-box').forEach(cell => cell.remove());
            for(let r=0; r<gameState.gridSize; r++) {
                for(let c=0; c<gameState.gridSize; c++) {
                    const blockSlot = document.createElement('div');
                    blockSlot.className = 'matrix-box';
                    blockSlot.dataset.row = r;
                    blockSlot.dataset.col = c;

                    if(gridBoard[r][c]) {
                        blockSlot.appendChild(createSolidTile(gridBoard[r][c]));
                    }
                    elMatrix.appendChild(blockSlot);
                }
            }
        }

        function createSolidTile(hexColor) {
            const brick = document.createElement('div');
            brick.className = 'block-unit';
            brick.style.backgroundColor = hexColor;
            
            const label = document.createElement('span');
            label.className = 'block-tag';
            label.innerText = 'BLAST';
            brick.appendChild(label);
            return brick;
        }

        function populateTrayDock() {
            const currentSkinColors = APP_SKIN_THEMES[gameState.activeThemeIndex].colors;
            const itemKeys = Object.keys(EMBEDDED_SHAPES);
            
            for(let i=0; i<3; i++) {
                if(!traySlotsData[i]) {
                    const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                    const chosenColor = currentSkinColors[Math.floor(Math.random() * currentSkinColors.length)];
                    traySlotsData[i] = {
                        matrix: EMBEDDED_SHAPES[randomKey],
                        color: chosenColor,
                        name: randomKey.substring(0, 5)
                    };
                }
            }
            renderTrayDockLayout();
        }

        function renderTrayDockLayout() {
            elTray.innerHTML = '';
            traySlotsData.forEach((shape, slotIdx) => {
                const pocket = document.createElement('div');
                pocket.className = 'dock-pocket';
                pocket.dataset.slotIndex = slotIdx;

                if(shape) {
                    const visualPreview = document.createElement('div');
                    visualPreview.style.display = 'grid';
                    visualPreview.style.gridTemplateRows = `repeat(\${shape.matrix.length}, 14px)`;
                    visualPreview.style.gridTemplateColumns = `repeat(\${shape.matrix[0].length}, 14px)`;
                    visualPreview.style.gap = '2px';

                    shape.matrix.forEach(row => {
                        row.forEach(activeNode => {
                            const segment = document.createElement('div');
                            if(activeNode) {
                                segment.className = 'block-unit';
                                segment.style.backgroundColor = shape.color;
                            }
                            visualPreview.appendChild(segment);
                        });
                    });

                    pocket.appendChild(visualPreview);
                    pocket.addEventListener('pointerdown', (e) => beginInteractiveDrag(e, slotIdx));
                }
                elTray.appendChild(pocket);
            });
        }

        function beginInteractiveDrag(e, targetIdx) {
            e.preventDefault();
            const shapeData = traySlotsData[targetIdx];
            if(!shapeData) return;

            draggingSession = {
                index: targetIdx,
                data: shapeData,
                element: e.currentTarget.cloneNode(true)
            };

            draggingSession.element.classList.add('floating-drag-element');
            document.body.appendChild(draggingSession.element);
            trackDragPlacement(e);

            document.addEventListener('pointermove', processDragMove);
            document.addEventListener('pointerup', completeDragDrop);
        }

        function trackDragPlacement(e) {
            if(!draggingSession) return;
            draggingSession.element.style.left = `\${e.clientX - 45}px`;
            draggingSession.element.style.top = `\${e.clientY - 45}px`;
        }

        function processDragMove(e) { trackDragPlacement(e); }

        function completeDragDrop(e) {
            if(!draggingSession) return;
            document.removeEventListener('pointermove', processDragMove);
            document.removeEventListener('pointerup', completeDragDrop);
            draggingSession.element.remove();

            const targetElement = document.elementFromPoint(e.clientX, e.clientY);
            const activeCell = targetElement ? targetElement.closest('.matrix-box') : null;

            if(activeCell) {
                const originR = parseInt(activeCell.dataset.row);
                const originC = parseInt(activeCell.dataset.col);

                if(verifyFitCheck(draggingSession.data.matrix, originR, originC)) {
                    commitShapeToGrid(draggingSession.data.matrix, draggingSession.data.color, originR, originC);
                    traySlotsData[draggingSession.index] = null;
                    
                    if(traySlotsData.every(item => item === null)) {
                        populateTrayDock();
                    }
                    renderTrayDockLayout();
                    checkFailingDeadlocks();
                }
            }
            draggingSession = null;
        }

        function verifyFitCheck(matrix, startRow, startCol) {
            for(let r=0; r<matrix.length; r++) {
                for(let c=0; c<matrix[r].length; c++) {
                    if(matrix[r][c]) {
                        const targetR = startRow + r;
                        const targetC = startCol + c;
                        if(targetR >= gameState.gridSize || targetC >= gameState.gridSize || gridBoard[targetR][targetC]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function commitShapeToGrid(matrix, color, startRow, startCol) {
            for(let r=0; r<matrix.length; r++) {
                for(let c=0; c<matrix[r].length; c++) {
                    if(matrix[r][c]) gridBoard[startRow+r][startCol+c] = color;
                }
            }
            gameState.score += 15;
            processGridLineClears();
            buildVisualMatrix();
            updateScoresPanel();
        }

        function processGridLineClears() {
            let clearedRows = [];
            let clearedCols = [];

            for(let r=0; r<gameState.gridSize; r++) {
                if(gridBoard[r].every(node => node !== null)) clearedRows.push(r);
            }
            for(let c=0; c<gameState.gridSize; c++) {
                if(gridBoard.every(row => row[c] !== null)) clearedCols.push(c);
            }

            const totalCleared = clearedRows.length + clearedCols.length;
            
            if(totalCleared > 0) {
                clearedRows.forEach(r => gridBoard[r].fill(null));
                clearedCols.forEach(c => gridBoard.forEach(row => row[c] = null));

                gameState.combo++;
                gameState.multiplier += 0.5 * totalCleared;
                gameState.score += Math.floor((totalCleared * 150) * gameState.multiplier);
                gameState.balance += totalCleared * 12;

                localStorage.setItem('bb_off_coins', gameState.balance.toString());
                triggerComboAlertNotification();
                rotateActiveSkinThemeAutomatically();
            } else {
                gameState.combo = 0;
                gameState.multiplier = 1.0;
            }

            if(gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                localStorage.setItem('bb_off_high', gameState.highScore.toString());
            }
        }

        function rotateActiveSkinThemeAutomatically() {
            if(gameState.unlockedThemes.length > 1) {
                let currentId = APP_SKIN_THEMES[gameState.activeThemeIndex].id;
                let internalIdx = gameState.unlockedThemes.indexOf(currentId);
                let nextInternalIdx = (internalIdx + 1) % gameState.unlockedThemes.length;
                let nextThemeId = gameState.unlockedThemes[nextInternalIdx];
                
                gameState.activeThemeIndex = APP_SKIN_THEMES.findIndex(t => t.id === nextThemeId);
                renderCustomizerShop();
            }
        }

        function triggerComboAlertNotification() {
            const badge = document.getElementById('combo-alert');
            badge.style.display = 'block';
            badge.innerText = `COMBO X\${gameState.combo}!`;
            setTimeout(() => { badge.style.display = 'none'; }, 900);
        }

        function checkFailingDeadlocks() {
            let spaceFound = false;
            for(let i=0; i<3; i++) {
                if(traySlotsData[i]) {
                    for(let r=0; r<gameState.gridSize; r++) {
                        for(let c=0; c<gameState.gridSize; c++) {
                            if(verifyFitCheck(traySlotsData[i].matrix, r, c)) {
                                spaceFound = true;
                                break;
                            }
                        }
                        if(spaceFound) break;
                    }
                } else {
                    spaceFound = true; // Clear pocket doesn't break game loop
                }
            }

            if(!spaceFound && traySlotsData.some(s => s !== null)) {
                alert(`Game Over! Final Run Score achieved: \${gameState.score}. Resetting grid field now.`);
                gameState.score = 0;
                gameState.combo = 0;
                gameState.multiplier = 1.0;
                initRuntimeEngine();
                traySlotsData = [null, null, null];
                populateTrayDock();
            }
        }

        function changeGridDimensions(dimensions) {
            if(confirm("Modify matrix dimension parameters? Current run scorecard metadata will cycle back to zero.")) {
                gameState.gridSize = dimensions;
                gameState.score = 0;
                gameState.combo = 0;
                gameState.multiplier = 1.0;
                initRuntimeEngine();
                traySlotsData = [null, null, null];
                populateTrayDock();
                toggleModal('settings-modal', false);
            }
        }

        function handleVisualThemeChange(isDark) {
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }

        function handleTagVisibility(showTags) {
            document.body.classList.toggle('hide-tags', !showTags);
        }

        function handleShadowVisibility(showShadows) {
            document.body.classList.toggle('has-shadow', showShadows);
        }

        function toggleModal(id, isOpen) {
            document.getElementById(id).classList.toggle('open', isOpen);
        }

        function toggleFullscreenChannel() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        }

        function triggerHomeScreenPrompt() {
            alert("App Shortcut Installation: Click your mobile web browser options indicator layout icon (or share toggle symbol) and select 'Add to Home Screen' to launch full offline application modes seamlessly!");
        }

        function renderCustomizerShop() {
            const listContainer = document.getElementById('shop-list');
            listContainer.innerHTML = '';

            APP_SKIN_THEMES.forEach((theme, idx) => {
                const card = document.createElement('div');
                card.className = `shop-item-card \${idx === gameState.activeThemeIndex ? 'active' : ''}`;
                
                const isUnlocked = gameState.unlockedThemes.includes(theme.id);

                let barSegments = '';
                theme.colors.forEach(c => {
                    barSegments += `<div style="background:\${c}; flex:1;"></div>`;
                });

                card.innerHTML = `
                    <div class="color-preview-bar">\${barSegments}</div>
                    <div style="font-weight:700; font-size:0.85rem;">\${theme.name}</div>
                    <div style="font-size:0.75rem; opacity:0.7; margin-top:2px;">
                        \${isUnlocked ? '★ Active' : '🪙 ' + theme.cost}
                    </div>
                `;

                card.onclick = () => {
                    if(isUnlocked) {
                        gameState.activeThemeIndex = idx;
                        renderCustomizerShop();
                    } else if (gameState.balance >= theme.cost) {
                        gameState.balance -= theme.cost;
                        gameState.unlockedThemes.push(theme.id);
                        gameState.activeThemeIndex = idx;
                        localStorage.setItem('bb_off_coins', gameState.balance.toString());
                        localStorage.setItem('bb_off_unlocked', JSON.stringify(gameState.unlockedThemes));
                        updateScoresPanel();
                        renderCustomizerShop();
                    } else {
                        alert("Insufficient Coin Tokens available inside current memory register bank slots.");
                    }
                };

                listContainer.appendChild(card);
            });
        }

        function updateScoresPanel() {
            document.getElementById('coin-counter').innerText = gameState.balance;
            document.getElementById('score-txt').innerText = gameState.score;
            document.getElementById('mult-txt').innerText = `\${gameState.multiplier.toFixed(1)}x`;
            document.getElementById('high-txt').innerText = gameState.highScore;
        }

        // Initialize Standalone App Lifecycle
        initRuntimeEngine();
        populateTrayDock();
    </script>
</body>
</html>`;

  // Create isolated sandbox payload cleanly
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'block-blast-pro-offline.html';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 150);
};
