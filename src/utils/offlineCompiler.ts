import { SHAPES_DATABASE, SHAPE_COLORS } from './shapeGenerator';

/**
 * RE-ARCHITECTED STANDALONE BUNDLER ENGINE
 * Purpose: 100% dynamic browser asset resolution with zero hardcoded static strings.
 * Author: Cameron Michalak
 * Version: 2.2.0 (Dynamic Path Alignment)
 */

// 1. Automatically calculate the absolute base path (handles local dev and GitHub Pages subfolders)
const getDynamicRepoBaseUrl = (): string => {
  const origin = window.location.origin; // e.g., "https://campm.github.io" or "http://localhost:3000"
  const pathname = window.location.pathname; // e.g., "/campm-tile-merge/" or "/"
  
  // Ensure we capture the base directory cleanly without trailing slashes
  const baseDirectory = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  
  return `${origin}${baseDirectory}`;
};

const REPO_BASE_URL = getDynamicRepoBaseUrl();

const ASSETS = {
  htmlLayout: `${REPO_BASE_URL}/index.html`,
  globalStyles: `${REPO_BASE_URL}/index.css`,
  gameLogic: `${REPO_BASE_URL}/src/main.tsx`,
  fontDisplay: `${REPO_BASE_URL}/assets/fonts/Comfortaa.ttf`,
  fontBody: `${REPO_BASE_URL}/assets/fonts/SourceSansPro.ttf`
};

/**
 * Client Asset Fetch Engine with strict verification checkpoints
 */
async function fetchRawText(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.text();
  } catch (error) {
    console.error(`[Bundler Fetch Error] Failed to retrieve text layer from: ${url}`, error);
    throw new Error(`BUILD_FAILURE: Failed to ingest asset [${url}] - Verify repository structure.`);
  }
}

async function fetchBinaryAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1] || result;
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error(`Conversion failure processing base64 from asset url: ${url}`));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[Font Fallback Engine] Asset conversion skipped for: ${url}. Falling back to system sans-serif rules.`);
    return 'FALLBACK';
  }
}

/**
 * Shape Generation Filter & Optimization Rules
 */
function compileFilteredShapes(gridSize: number): string {
  const filteredDatabase = JSON.parse(JSON.stringify(SHAPES_DATABASE));
  
  if (gridSize === 6) {
    for (const key in filteredDatabase) {
      if (Object.prototype.hasOwnProperty.call(filteredDatabase, key)) {
        const matrix = filteredDatabase[key];
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        if (rows >= 5 || cols >= 5) {
          delete filteredDatabase[key];
        }
      }
    }
  }
  return JSON.stringify(filteredDatabase);
}

/**
 * DOM-Based Asset Stitching Pipeline
 */
export async function generateOfflineBundle(selectedGridSize: number): Promise<string> {
  console.log(`[Offline Compiler] Resolving assets dynamically from root: ${REPO_BASE_URL}`);

  // Concurrently fetch all source dependencies
  const [rawHtml, rawCss, fontDisplayB64, fontBodyB64] = await Promise.all([
    fetchRawText(ASSETS.htmlLayout),
    fetchRawText(ASSETS.globalStyles).catch(() => '/* Production CSS bundle fallback active */'),
    fetchBinaryAsBase64(ASSETS.fontDisplay),
    fetchBinaryAsBase64(ASSETS.fontBody)
  ]);

  // Safely parse html structure inside browser memory
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Strip pre-existing networked script tags
  const activeScripts = doc.querySelectorAll('script');
  activeScripts.forEach(script => script.remove());

  // Embed font definitions dynamically
  let injectedFontStyles = '';
  if (fontDisplayB64 !== 'FALLBACK' && fontBodyB64 !== 'FALLBACK') {
    injectedFontStyles = `
      @font-face { font-family: 'Comfortaa'; src: url('data:font/ttf;base64,${fontDisplayB64}'); font-weight: 700; font-style: normal; }
      @font-face { font-family: 'Source Sans Pro'; src: url('data:font/ttf;base64,${fontBodyB64}'); font-weight: normal; font-style: normal; }
    `;
  } else {
    injectedFontStyles = `@import url("https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap");`;
  }

  // Responsive layout constraints
  const alignmentResponsiveStyles = `
    ${injectedFontStyles}
    :root {
      --grid-cell-empty: rgba(17, 24, 39, 0.6);
      --border-ui: rgba(51, 65, 85, 0.5);
    }
    body, html {
      margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden;
      touch-action: none; -webkit-overflow-scrolling: none;
      display: flex; align-items: center; justify-content: center;
      background-color: #0b0f19; color: #f8fafc;
    }
    #root, #game-container {
      width: 100%; max-width: 480px; height: 100%; max-height: 850px;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 16px; box-sizing: border-box; position: relative;
    }
    .grid-board-wrapper {
      width: 100%; aspect-ratio: 1 / 1; display: grid; gap: 6px;
      background: #1e293b; border: 2px solid #334155; padding: 8px;
      border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); position: relative;
    }
    .game-over-modal {
      position: absolute; inset: 0; background: rgba(11,15,25,0.95);
      backdrop-filter: blur(8px); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 150;
      border-radius: 14px; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .game-over-modal.active { opacity: 1; pointer-events: auto; }
  `;

  const styleNode = doc.createElement('style');
  styleNode.textContent = `${rawCss}\n${alignmentResponsiveStyles}`;
  doc.head.appendChild(styleNode);

  // Compile standalone global variables and engine states
  const compiledShapesJson = compileFilteredShapes(selectedGridSize);
  const offlineRuntimeCode = `
    (function() {
      window.OFFLINE_COMPILATION_ENV = true;
      window.FORCED_GRID_SIZE = ${selectedGridSize};
      window.SHAPES_OVERRIDE = ${compiledShapesJson};
      window.PALETTES_OVERRIDE = ${JSON.stringify(SHAPE_COLORS)};
      
      console.log("[Offline Runtime] Application configurations injected successfully.");

      window.checkOfflineGameOver = function(currentBoard, activeHand) {
        const activePieces = activeHand.filter(p => p !== null);
        if (activePieces.length === 0) return false;

        const size = currentBoard.length;
        
        for (let piece of activePieces) {
          const cells = piece.cells;
          for (let r = 0; r <= size - cells.length; r++) {
            for (let c = 0; c <= size - cells[0].length; c++) {
              let canFit = true;
              
              for (let pr = 0; pr < cells.length; pr++) {
                for (let pc = 0; pc < cells[0].length; pc++) {
                  if (cells[pr][pc]) {
                    if ((r + pr) >= size || (c + pc) >= size || currentBoard[r + pr][c + pc].filled) {
                      canFit = false;
                      break;
                    }
                  }
                }
                if (!canFit) break;
              }
              if (canFit) return false;
            }
          }
        }
        return true;
      };
    })();
  `;

  const scriptNode = doc.createElement('script');
  scriptNode.textContent = offlineRuntimeCode;
  doc.body.appendChild(scriptNode);

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

/**
 * File Container Manager
 */
export function downloadOfflineGameFile(htmlContent: string, selectedGridSize: number) {
  const timestamp = new Date().toISOString().slice(0,10);
  const formattedFileName = `block-blast-offline-${selectedGridSize}x${selectedGridSize}-${timestamp}.html`;
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = formattedFileName;
  
  document.body.appendChild(anchor);
  anchor.click();
  
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }, 150);
}
