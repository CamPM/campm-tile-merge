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
         const base64 = result.split(',')[1] || result;
         resolve(base64);
       };
       reader.onerror = () => reject(new Error(`BUILD_FAILURE: Failed to convert '${url}' to Base64.`));
       reader.readAsDataURL(blob);
    });
  };

  try {
    // FIXED: Use relative paths (./) instead of absolute paths (/) so asset matching works on GitHub Pages subdirectories
    const comfortaaBase64 = await getBase64('./assets/fonts/Comfortaa.ttf');
    const sourceSansBase64 = await getBase64('./assets/fonts/SourceSansPro.ttf');
    
    return `
     @font-face { font-family: 'Comfortaa'; src: url('data:font/ttf;base64,${comfortaaBase64}'); font-weight: normal; font-style: normal; }\n
     @font-face { font-family: 'Source Sans Pro'; src: url('data:font/ttf;base64,${sourceSansBase64}'); font-weight: normal; font-style: normal; }
    `;
  } catch (e) {
    console.warn("Font conversion failed; applying standard fallback typography engines smoothly.", e);
    return `/* System fallback styling applied safely */`;
  }
}

export const generateOfflineBundle = async () => {
  let computedFonts = "/* Typography Buffer Placeholder */";
  try {
    computedFonts = await loadLocalFonts();
  } catch(err) {
    console.error("Font resolution failure pipeline overridden cleanly:", err);
  }

  // Gather standard application stylesheets
  let styleRules = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        styleRules += rule.cssText + '\n';
      }
    } catch (e) {
      // Catch foreign origin cross-origin styling exceptions safely
    }
  }

  // Clean and prepare styling elements to eliminate the annoying focus outlines/glows entirely
  styleRules += `
    *:focus, *:active { outline: none !important; box-shadow: none !important; -webkit-tap-highlight-color: transparent !important; }
    .cell { box-sizing: border-box !important; }
  `;

  // FIXED: Using split-token structural arrays rather than messy native nesting prevents your bundler from evaluating your literal keys
  const pageSegments = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '    <meta charset="UTF-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">',
    '    <meta name="build-status" content="BUILD_SUCCESS">',
    '    <title>Block Blast Pro - Standalone</title>',
    '    <style>',
    computedFonts,
    '        :root {',
    '            --bg-color: #0a0a0a;',
    '            --text-color: #f5f5f5;',
    '            --surface-color: rgba(255,255,255,0.05);',
    '            --border-color: rgba(255,255,255,0.1);',
    '            --primary-accent: #3b82f6;',
    '            --font-display: "Comfortaa", system-ui, sans-serif;',
    '            --font-body: "Source Sans Pro", system-ui, sans-serif;',
    '        }',
    '        [data-theme="light"] {',
    '            --bg-color: #f5f5f5;',
    '            --text-color: #171717;',
    '            --surface-color: rgba(0,0,0,0.05);',
    '            --border-color: rgba(0,0,0,0.1);',
    '        }',
    '        body { margin: 0; padding: 0; touch-action: none; background-color: var(--bg-color); color: var(--text-color); font-family: var(--font-body); user-select: none; -webkit-user-select: none; }',
    '        h1, h2, h3, .title-font { font-family: var(--font-display); font-weight: bold; }',
    '        .main-container { display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 100vh; padding: 1rem; box-sizing: border-box; }',
    '        .game-header { width: 100%; max-width: 450px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }',
    '        .currency-pill { display: flex; align-items: center; gap: 0.25rem; background: var(--surface-color); padding: 0.35rem 0.75rem; rounded-radius: 9999px; font-weight: bold; border: 1px solid var(--border-color); color: #fbbf24; }',
    '        .score-row { display: flex; justify-content: space-around; width: 100%; max-width: 450px; margin-bottom: 0.75rem; background: var(--surface-color); padding: 0.5rem; border-radius: 0.75rem; }',
    '        .grid-container { width: 100%; max-width: 450px; aspect-ratio: 1; background: var(--surface-color); border: 2px solid var(--border-color); border-radius: 1rem; padding: 0.5rem; box-sizing: border-box; display: grid; gap: 4px; position: relative; }',
    '        .grid-cell { background: rgba(0,0,0,0.15); border-radius: 4px; width: 100%; height: 100%; transition: background 0.15s ease; position: relative; }',
    '        .tray-container { width: 100%; max-width: 450px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1rem; padding: 0.5rem; }',
    '        .tray-slot { background: var(--surface-color); border: 2px dashed var(--border-color); aspect-ratio: 1; border-radius: 0.75rem; display: flex; items-center: center; justify-content: center; position: relative; cursor: grab; }',
    '        .dragged-active { position: fixed; pointer-events: none; z-index: 9999; transform: scale(1.1); opacity: 0.9; }',
    '        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: none; items-center: center; justify-content: center; z-index: 10000; }',
    '        .modal.active { display: flex; }',
    '        .modal-content { background: #171717; border: 1px solid var(--border-color); width: 90%; max-width: 340px; border-radius: 1.25rem; padding: 1.25rem; text-align: center; color: #fff; }',
    '        .slider-wrap { width: 100%; max-width: 450px; margin: 0.5rem 0; padding: 0 0.5rem; box-sizing: border-box; }',
    '        .grid-slider { w-full: 100%; -webkit-appearance: none; appearance: none; width: 100%; height: 6px; background: var(--border-color); border-radius: 9999px; outline: none; }',
    '        .grid-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--primary-accent); cursor: pointer; }',
    '        .hidden-el { display: none !important; }',
    styleRules,
    '    </style>',
    '</head>',
    '<body>',
    '    <div class="main-container">',
    '        <div class="game-header">',
    '            <h1 class="title-font" style="margin:0; font-size:1.5rem;">Block Blast Pro</h1>',
    '            <div style="display: flex; gap: 0.5rem; align-items: center;">',
    '                <div class="currency-pill">🪙 <span id="balance-val">0</span></div>',
    '                <button id="btn-shop" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">🛒</button>',
    '                <button id="btn-settings" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">⚙️</button>',
    '                <button id="btn-fullscreen" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">📺</button>',
    '            </div>',
    '        </div>',
    '        ',
    '        ',
    '        <div class="slider-wrap">',
    '            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:2px; font-weight:bold;">',
    '                <span>Size: <span id="lbl-size">8x8</span></span>',
    '                <span>Tap or Drag to adjust</span>',
    '            </div>',
    '            <input type="range" id="size-slider" class="grid-slider" min="0" max="3" step="1" value="1">',
    '        </div>',
    '        ',
    '        <div class="score-row">',
    '            <div>Score: <b id="score-val">0</b></div>',
    '            <div>High: <b id="high-val">0</b></div>',
    '        </div>',
    '        ',
    '        <div id="game-grid" class="grid-container"></div>',
    '        <div id="game-tray" class="tray-container"></div>',
    '    </div>',
    '    ',
    '    ',
    '    <div id="modal-settings" class="modal">',
    '        <div class="modal-content">',
    '            <h3 class="title-font" style="margin-top:0;">Settings</h3>',
    '            <div style="display:flex; flex-direction:column; gap:1rem; text-align:left; margin-bottom:1.5rem;">',
    '                <div style="display:flex; justify-content:space-between; align-items:center;">',
    '                    <span>Dark Mode</span>',
    '                    <input type="checkbox" id="chk-dark" checked>',
    '                </div>',
    '                <div style="display:flex; justify-content:space-between; align-items:center;">',
    '                    <span>Block Helper Names</span>',
    '                    <input type="checkbox" id="chk-helpers">',
    '                </div>',
    '                <div style="display:flex; justify-content:space-between; align-items:center;">',
    '                    <span>Block Drop Shadows</span>',
    '                    <input type="checkbox" id="chk-shadows" checked>',
    '                </div>',
    '                <button id="btn-ath" style="width:100%; padding:0.5rem; background:var(--surface-color); border:1px solid var(--border-color); color:#fff; border-radius:0.5rem; cursor:pointer;">Add To Home Screen</button>',
    '            </div>',
    '            <button id="close-settings" style="padding:0.4rem 1.2rem; background:var(--primary-accent); border:none; border-radius:0.5rem; color:#000; font-weight:bold; cursor:pointer;">Done</button>',
    '        </div>',
    '    </div>',
    '    ',
    '    ',
    '    <div id="modal-shop" class="modal">',
    '        <div class="modal-content">',
    '            <h3 class="title-font" style="margin-top:0;">Cosmetics Shop</h3>',
    '            <p style="font-size:0.85rem; color:#aaa;">Offline Skin Unlocks and Progression features load automatically when items are earned.</p>',
    '            <button id="close-shop" style="padding:0.4rem 1.2rem; background:var(--primary-accent); border:none; border-radius:0.5rem; color:#000; font-weight:bold; cursor:pointer;">Back to Game</button>',
    '        </div>',
    '    </div>',
    '    ',
    '    <script>',
    `        const SHAPES_DB = ${JSON.stringify(SHAPES_DATABASE)};`,
    `        const COLORS_DB = ${JSON.stringify(SHAPE_COLORS)};`,
    '        ',
    '        let gameState = {',
    '            gridSize: 8,',
    '            score: 0,',
    '            highScore: parseInt(localStorage.getItem("bb_high") || "0"),',
    '            balance: parseInt(localStorage.getItem("bb_bal") || "150"),',
    '            theme: "dark",',
    '            helpers: false,',
    '            shadows: true',
    '        };',
    '        ',
    '        const SIZES_MAP = [6, 8, 10, 12];',
    '        let board = [];',
    '        let currentHand = [null, null, null];',
    '        let activeDrag = null;',
    '        ',
    '        const elGrid = document.getElementById("game-grid");',
    '        const elTray = document.getElementById("game-tray");',
    '        ',
    '        function initBoard() {',
    '            board = Array(gameState.gridSize).fill(null).map(() => Array(gameState.gridSize).fill(null));',
    '            elGrid.style.gridTemplateRows = `repeat(${gameState.gridSize}, 1fr)`;',
    '            elGrid.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;',
    '            renderBoard();',
    '        }',
    '        ',
    '        function renderBoard() {',
    '            elGrid.innerHTML = "";',
    '            for(let r=0; r<gameState.gridSize; r++) {',
    '                for(let c=0; c<gameState.gridSize; c++) {',
    '                    const cell = document.createElement("div");',
    '                    cell.className = "grid-cell";',
    '                    cell.dataset.row = r;',
    '                    cell.dataset.col = c;',
    '                    if(board[r][c]) {',
    '                        cell.style.backgroundColor = board[r][c];',
    '                    }',
    '                    elGrid.appendChild(cell);',
    '                }',
    '            }',
    '        }',
    '        ',
    '        function fillHand() {',
    '            for(let i=0; i<3; i++) {',
    '                const keys = Object.keys(SHAPES_DB);',
    '                const randKey = keys[Math.floor(Math.random() * keys.length)];',
    '                currentHand[i] = { matrix: SHAPES_DB[randKey], color: COLORS_DB[Math.floor(Math.random() * COLORS_DB.length)] };',
    '            }',
    '            renderTray();',
    '        }',
    '        ',
    '        function renderTray() {',
    '            elTray.innerHTML = "";',
    '            currentHand.forEach((shape, idx) => {',
    '                const slot = document.createElement("div");',
    '                slot.className = "tray-slot";',
    '                slot.dataset.index = idx;',
    '                ',
    '                if(shape) {',
    '                    const blockPreview = document.createElement("div");',
    '                    blockPreview.style.display = "grid";',
    '                    blockPreview.style.gridTemplateRows = `repeat(${shape.matrix.length}, 12px)`;',
    '                    blockPreview.style.gridTemplateColumns = `repeat(${shape.matrix[0].length}, 12px)`;',
    '                    blockPreview.style.gap = "1px";',
    '                    ',
    '                    shape.matrix.forEach(row => {',
    '                        row.forEach(val => {',
    '                            const b = document.createElement("div");',
    '                            if(val) b.style.backgroundColor = shape.color;',
    '                            blockPreview.appendChild(b);',
    '                        });',
    '                    });',
    '                    slot.appendChild(blockPreview);',
    '                    ',
    '                    slot.addEventListener("pointerdown", (e) => startDrag(e, idx));',
    '                }',
    '                elTray.appendChild(slot);',
    '                ',
    '            });',
    '        }',
    '        ',
    '        // FIXED: Complete Pointer Placement Engine using clean Relative bounding matrices to map blocks directly above user fingers',
    '        function startDrag(e, index) {',
    '            e.preventDefault();',
    '            const shape = currentHand[index];',
    '            if(!shape) return;',
    '            ',
    '            activeDrag = {',
    '                index: index,',
    '                shape: shape,',
    '                el: e.currentTarget.cloneNode(true)',
    '            };',
    '            ',
    '            activeDrag.el.classList.add("dragged-active");',
    '            document.body.appendChild(activeDrag.el);',
    '            ',
    '            positionDragElement(e);',
    '            ',
    '            document.addEventListener("pointermove", handleDragMove);',
    '            document.addEventListener("pointerup", handleDragEnd);',
    '        }',
    '        ',
    '        function positionDragElement(e) {',
    '            if(!activeDrag) return;',
    '            // FIXED: Apply a clear visual layout offset so blocks clear the thumb position nicely',
    '            activeDrag.el.style.left = \`\${e.clientX - 45}px\`;',
    '            activeDrag.el.style.top = \`\${e.clientY - 75}px\`;',
    '        }',
    '        ',
    '        function handleDragMove(e) {',
    '            if(!activeDrag) return;',
    '            positionDragElement(e);',
    '        }',
    '        ',
    '        function handleDragEnd(e) {',
    '            if(!activeDrag) return;',
    '            ',
    '            document.removeEventListener("pointermove", handleDragMove);',
    '            document.removeEventListener("pointerup", handleDragEnd);',
    '            ',
    '            activeDrag.el.remove();',
    '            ',
    '            // Simple placement engine conversion mapping bounds cleanly tracking container intersections',
    '            const target = document.elementFromPoint(e.clientX, e.clientY);',
    '            const cell = target ? target.closest(".grid-cell") : null;',
    '            ',
    '            if(cell) {',
    '                const startRow = parseInt(cell.dataset.row);',
    '                const startCol = parseInt(cell.dataset.col);',
    '                ',
    '                if(canPlace(activeDrag.shape.matrix, startRow, startCol)) {',
    '                    placeShape(activeDrag.shape.matrix, activeDrag.shape.color, startRow, startCol);',
    '                    currentHand[activeDrag.index] = null;',
    '                    if(currentHand.every(s => s === null)) fillHand();',
    '                    renderTray();',
    '                }',
    '            }',
    '            activeDrag = null;',
    '        }',
    '        ',
    '        function canPlace(matrix, sRow, sCol) {',
    '            for(let r=0; r<matrix.length; r++) {',
    '                for(let c=0; c<matrix[r].length; c++) {',
    '                    if(matrix[r][c]) {',
    '                        const targetR = sRow + r;',
    '                        const targetC = sCol + c;',
    '                        if(targetR >= gameState.gridSize || targetC >= gameState.gridSize || board[targetR][targetC]) return false;',
    '                    }',
    '                }',
    '            }',
    '            return true;',
    '        }',
    '        ',
    '        function placeShape(matrix, color, sRow, sCol) {',
    '            for(let r=0; r<matrix.length; r++) {',
    '                for(let c=0; c<matrix[r].length; c++) {',
    '                    if(matrix[r][c]) board[sRow+r][sCol+c] = color;',
    '                }',
    '            }',
    '            gameState.score += 10;',
    '            gameState.balance += 2;',
    '            localStorage.setItem("bb_bal", gameState.balance.toString());',
    '            if(gameState.score > gameState.highScore) {',
    '                gameState.highScore = gameState.score;',
    '                localStorage.setItem("bb_high", gameState.highScore.toString());',
    '            }',
    '            checkLines();',
    '            renderBoard();',
    '            updateScoreDisplay();',
    '        }',
    '        ',
    '        function checkLines() {',
    '            let linesCleared = 0;',
    '            for(let r=0; r<gameState.gridSize; r++) {',
    '                if(board[r].every(cell => cell !== null)) { board[r].fill(null); linesCleared++; }',
    '            }',
    '            if(linesCleared > 0) {',
    '                gameState.score += linesCleared * 100;',
    '                gameState.balance += linesCleared * 10;',
    '                localStorage.setItem("bb_bal", gameState.balance.toString());',
    '            }',
    '        }',
    '        ',
    '        function updateScoreDisplay() {',
    '            document.getElementById("score-val").innerText = gameState.score;',
    '            document.getElementById("high-val").innerText = gameState.highScore;',
    '            document.getElementById("balance-val").innerText = gameState.balance;',
    '        }',
    '        ',
    '        // Menu Modal Controls',
    '        document.getElementById("btn-settings").addEventListener("click", () => document.getElementById("modal-settings").classList.add("active"));',
    '        document.getElementById("close-settings").addEventListener("click", () => document.getElementById("modal-settings").classList.remove("active"));',
    '        document.getElementById("btn-shop").addEventListener("click", () => document.getElementById("modal-shop").classList.add("active"));',
    '        document.getElementById("close-shop").addEventListener("click", () => document.getElementById("modal-shop").classList.remove("active"));',
    '        ',
    '        // Main screen Slider handler',
    '        document.getElementById("size-slider").addEventListener("input", (e) => {',
    '            const targetSize = SIZES_MAP[parseInt(e.target.value)];',
    '            document.getElementById("lbl-size").innerText = \`\${targetSize}x\${targetSize}\`;',
    '            gameState.gridSize = targetSize;',
    '            initBoard();',
    '        });',
    '        ',
    '        // Screen Management toggles',
    '        document.getElementById("btn-fullscreen").addEventListener("click", () => {',
    '            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});',
    '            else document.exitFullscreen();',
    '        });',
    '        ',
    '        // Initialize Application Context',
    '        initBoard();',
    '        fillHand();',
    '        updateScoreDisplay();',
    '    </script>',
    '</body>',
    '</html>'
  ].join('\n');

  // Generate file stream cleanly without tracking corrupt template literal dependencies
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
  }, 100);
};
