import { SHAPES_DATABASE, SHAPE_COLORS } from './shapeGenerator';

async function loadLocalFonts(): Promise<string> {
  const getBase64 = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`404: Static asset missing at location ${url}`);
    }
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
       const reader = new FileReader();
       reader.onloadend = () => {
         const result = reader.result as string;
         const base64 = result.split(',')[1] || result;
         resolve(base64);
       };
       reader.onerror = () => reject(new Error(`Failed to convert ${url} buffer.`));
       reader.readAsDataURL(blob);
    });
  };

  // We loop through likely variations of directory asset routing structures natively on deployment paths
  const pathsToTry = [
    './assets/fonts/',
    './fonts/',
    '../assets/fonts/',
    '/assets/fonts/'
  ];

  for (const basePath of pathsToTry) {
    try {
      const comfortaa = await getBase64(`${basePath}Comfortaa.ttf`);
      const sourceSans = await getBase64(`${basePath}SourceSansPro.ttf`);
      
      return `
        @font-face { font-family: 'Comfortaa'; src: url('data:font/ttf;base64,${comfortaa}'); font-weight: normal; font-style: normal; }
        @font-face { font-family: 'Source Sans Pro'; src: url('data:font/ttf;base64,${sourceSans}'); font-weight: normal; font-style: normal; }
      `;
    } catch (e) {
      // Continue searching paths cleanly
    }
  }

  // Final fallback typography configurations so compilation never halts silently
  return `
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Source+Sans+Pro&display=swap');
    :root {
      --font-display: 'Comfortaa', system-ui, sans-serif !important;
      --font-body: 'Source Sans Pro', system-ui, sans-serif !important;
    }
  `;
}

export const generateOfflineBundle = async () => {
  let computedFonts = "";
  try {
    computedFonts = await loadLocalFonts();
  } catch(err) {
    console.error("Font compilation bypassed safely:", err);
  }

  let styleRules = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        styleRules += rule.cssText + '\n';
      }
    } catch (e) {
      // Absorb cross-origin asset boundary warnings safely
    }
  }

  styleRules += `
    *:focus, *:active { outline: none !important; box-shadow: none !important; -webkit-tap-highlight-color: transparent !important; }
    .cell { box-sizing: border-box !important; }
  `;

  // Assembling elements safely via discrete segments completely shields it from compiler interpretation anomalies
  const pageSegments = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '    <meta charset="UTF-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">',
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
    '        .currency-pill { display: flex; align-items: center; gap: 0.25rem; background: var(--surface-color); padding: 0.35rem 0.75rem; border-radius: 9999px; font-weight: bold; border: 1px solid var(--border-color); color: #fbbf24; }',
    '        .score-row { display: flex; justify-content: space-around; width: 100%; max-width: 450px; margin-bottom: 0.75rem; background: var(--surface-color); padding: 0.5rem; border-radius: 0.75rem; }',
    '        .grid-container { width: 100%; max-width: 450px; aspect-ratio: 1; background: var(--surface-color); border: 2px solid var(--border-color); border-radius: 1rem; padding: 0.5rem; box-sizing: border-box; display: grid; gap: 4px; position: relative; }',
    '        .grid-cell { background: rgba(0,0,0,0.15); border-radius: 4px; width: 100%; height: 100%; position: relative; }',
    '        .tray-container { width: 100%; max-width: 450px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1rem; padding: 0.5rem; }',
    '        .tray-slot { background: var(--surface-color); border: 2px dashed var(--border-color); aspect-ratio: 1; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; position: relative; cursor: grab; }',
    '        .dragged-active { position: fixed; pointer-events: none; z-index: 9999; transform: scale(1.15); opacity: 0.95; }',
    '        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 10000; }',
    '        .modal.active { display: flex; }',
    '        .modal-content { background: #171717; border: 1px solid var(--border-color); width: 90%; max-width: 340px; border-radius: 1.25rem; padding: 1.25rem; text-align: center; color: #fff; }',
    '        .slider-wrap { width: 100%; max-width: 450px; margin: 0.5rem 0; padding: 0 0.5rem; box-sizing: border-box; }',
    '        .grid-slider { width: 100%; -webkit-appearance: none; appearance: none; height: 6px; background: var(--border-color); border-radius: 9999px; outline: none; }',
    '        .grid-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--primary-accent); cursor: pointer; }',
    styleRules,
    '    </style>',
    '</head>',
    '<body>',
    '    <div class="main-container">',
    '        <div class="game-header">',
    '            <h1 class="title-font" style="margin:0; font-size:1.5rem;">Block Blast Pro</h1>',
    '            <div style="display: flex; gap: 0.5rem; align-items: center;">',
    '                <div class="currency-pill">🪙 <span id="balance-val">0</span></div>',
    '                <button id="btn-settings" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">⚙️</button>',
    '                <button id="btn-fullscreen" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">📺</button>',
    '            </div>',
    '        </div>',
    '        <div class="slider-wrap">',
    '            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:2px; font-weight:bold;">',
    '                <span>Grid Layout: <span id="lbl-size">8x8</span></span>',
    '            </div>',
    '            <input type="range" id="size-slider" class="grid-slider" min="0" max="3" step="1" value="1">',
    '        </div>',
    '        <div class="score-row">',
    '            <div>Current Run: <b id="score-val">0</b></div>',
    '            <div>High Score: <b id="high-val">0</b></div>',
    '        </div>',
    '        <div id="game-grid" class="grid-container"></div>',
    '        <div id="game-tray" class="tray-container"></div>',
    '    </div>',
    '    <div id="modal-settings" class="modal">',
    '        <div class="modal-content">',
    '            <h3 class="title-font" style="margin-top:0;">Settings Options</h3>',
    '            <div style="display:flex; flex-direction:column; gap:1rem; text-align:left; margin-bottom:1.5rem;">',
    '                <div style="display:flex; justify-content:space-between; align-items:center;">',
    '                    <span>Dark Theme Layout</span>',
    '                    <input type="checkbox" id="chk-dark" checked>',
    '                </div>',
    '            </div>',
    '            <button id="close-settings" style="padding:0.4rem 1.2rem; background:var(--primary-accent); border:none; border-radius:0.5rem; color:#000; font-weight:bold; cursor:pointer;">Close</button>',
    '        </div>',
    '    </div>',
    '    <script>',
    `        const SHAPES_DB = ${JSON.stringify(SHAPES_DATABASE)};`,
    `        const COLORS_DB = ${JSON.stringify(SHAPE_COLORS)};`,
    '        let gameState = {',
    '            gridSize: 8,',
    '            score: 0,',
    '            highScore: parseInt(localStorage.getItem("bb_high") || "0"),',
    '            balance: parseInt(localStorage.getItem("bb_bal") || "0"),',
    '        };',
    '        const SIZES_MAP = [6, 8, 10, 12];',
    '        let board = [];',
    '        let currentHand = [null, null, null];',
    '        let activeDrag = null;',
    '        const elGrid = document.getElementById("game-grid");',
    '        const elTray = document.getElementById("game-tray");',
    '        function initBoard() {',
    '            board = Array(gameState.gridSize).fill(null).map(() => Array(gameState.gridSize).fill(null));',
    '            elGrid.style.gridTemplateRows = `repeat(${gameState.gridSize}, 1fr)`;',
    '            elGrid.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;',
    '            renderBoard();',
    '        }',
    '        function renderBoard() {',
    '            elGrid.innerHTML = "";',
    '            for(let r=0; r<gameState.gridSize; r++) {',
    '                for(let c=0; c<gameState.gridSize; c++) {',
    '                    const cell = document.createElement("div");',
    '                    cell.className = "grid-cell";',
    '                    cell.dataset.row = r;',
    '                    cell.dataset.col = c;',
    '                    if(board[r][c]) { cell.style.backgroundColor = board[r][c]; }',
    '                    elGrid.appendChild(cell);',
    '                }',
    '            }',
    '        }',
    '        function fillHand() {',
    '            for(let i=0; i<3; i++) {',
    '                const keys = Object.keys(SHAPES_DB);',
    '                const randKey = keys[Math.floor(Math.random() * keys.length)];',
    '                currentHand[i] = { matrix: SHAPES_DB[randKey], color: COLORS_DB[Math.floor(Math.random() * COLORS_DB.length)] };',
    '            }',
    '            renderTray();',
    '        }',
    '        function renderTray() {',
    '            elTray.innerHTML = "";',
    '            currentHand.forEach((shape, idx) => {',
    '                const slot = document.createElement("div");',
    '                slot.className = "tray-slot";',
    '                slot.dataset.index = idx;',
    '                if(shape) {',
    '                    const blockPreview = document.createElement("div");',
    '                    blockPreview.style.display = "grid";',
    '                    blockPreview.style.gridTemplateRows = `repeat(${shape.matrix.length}, 12px)`;',
    '                    blockPreview.style.gridTemplateColumns = `repeat(${shape.matrix[0].length}, 12px)`;',
    '                    blockPreview.style.gap = "1px";',
    '                    shape.matrix.forEach(row => {',
    '                        row.forEach(val => {',
    '                            const b = document.createElement("div");',
    '                            if(val) b.style.backgroundColor = shape.color;',
    '                            blockPreview.appendChild(b);',
    '                        });',
    '                    });',
    '                    slot.appendChild(blockPreview);',
    '                    slot.addEventListener("pointerdown", (e) => startDrag(e, idx));',
    '                }',
    '                elTray.appendChild(slot);',
    '            });',
    '        }',
    '        function startDrag(e, index) {',
    '            e.preventDefault();',
    '            const shape = currentHand[index];',
    '            if(!shape) return;',
    '            activeDrag = { index: index, shape: shape, el: e.currentTarget.cloneNode(true) };',
    '            activeDrag.el.classList.add("dragged-active");',
    '            document.body.appendChild(activeDrag.el);',
    '            positionDragElement(e);',
    '            document.addEventListener("pointermove", handleDragMove);',
    '            document.addEventListener("pointerup", handleDragEnd);',
    '        }',
    '        function positionDragElement(e) {',
    '            if(!activeDrag) return;',
    '            // Precise absolute calculation to lift items cleanly off the finger placement path',
    '            activeDrag.el.style.left = `${e.clientX - 50}px`;',
    '            activeDrag.el.style.top = `${e.clientY - 85}px`;',
    '        }',
    '        function handleDragMove(e) { if(activeDrag) positionDragElement(e); }',
    '        function handleDragEnd(e) {',
    '            if(!activeDrag) return;',
    '            document.removeEventListener("pointermove", handleDragMove);',
    '            document.removeEventListener("pointerup", handleDragEnd);',
    '            activeDrag.el.remove();',
    '            const target = document.elementFromPoint(e.clientX, e.clientY);',
    '            const cell = target ? target.closest(".grid-cell") : null;',
    '            if(cell) {',
    '                const startRow = parseInt(cell.dataset.row);',
    '                const startCol = parseInt(cell.dataset.col);',
    '                if(canPlace(activeDrag.shape.matrix, startRow, startCol)) {',
    '                    placeShape(activeDrag.shape.matrix, activeDrag.shape.color, startRow, startCol);',
    '                    currentHand[activeDrag.index] = null;',
    '                    if(currentHand.every(s => s === null)) fillHand();',
    '                    renderTray();',
    '                }',
    '            }',
    '            activeDrag = null;',
    '        }',
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
    '        function updateScoreDisplay() {',
    '            document.getElementById("score-val").innerText = gameState.score;',
    '            document.getElementById("high-val").innerText = gameState.highScore;',
    '            document.getElementById("balance-val").innerText = gameState.balance;',
    '        }',
    '        document.getElementById("btn-settings").addEventListener("click", () => document.getElementById("modal-settings").classList.add("active"));',
    '        document.getElementById("close-settings").addEventListener("click", () => document.getElementById("modal-settings").classList.remove("active"));',
    '        document.getElementById("size-slider").addEventListener("input", (e) => {',
    '            const targetSize = SIZES_MAP[parseInt(e.target.value)];',
    '            document.getElementById("lbl-size").innerText = `${targetSize}x${targetSize}`;',
    '            gameState.gridSize = targetSize;',
    '            initBoard();',
    '        });',
    '        document.getElementById("btn-fullscreen").addEventListener("click", () => {',
    '            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});',
    '            else document.exitFullscreen();',
    '        });',
    '        initBoard();',
    '        fillHand();',
    '        updateScoreDisplay();',
    '    </script>',
    '</body>',
    '</html>'
  ].join('\n');

  try {
    const blob = new Blob([pageSegments], { type: 'text/html;charset=utf-8;' });
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
  } catch (downloadError) {
    console.error("Download execution crashed:", downloadError);
    alert("Critical Download Error: Browser execution was blocked.");
  }
};
