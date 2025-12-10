/**
 * game.js
 * Entry-Point - Koordiniert alle Module und startet das Spiel
 */

import Game from './game-core.js';
import { initializeGame } from './ui-init.js';
import gameState from './game-state.js';

// ========== Global Game Instance ==========

let gameInstance = null;

// ========== Game Start ==========

function startGame() {
  console.log('🚀 Starte Idle Game...');
  
  try {
    // Game-Instanz erstellen
    gameInstance = new Game();
    
    // Vollständige Initialisierung
    initializeGame(gameInstance);
    
    // Global verfügbar machen (für Debugging in Console)
    window.game = gameInstance;
    window.gameState = gameState;
    
    console.log('✨ Game erfolgreich gestartet!');
    console.log('💡 Tipp: Du kannst "game" und "gameState" in der Console verwenden');
    
  } catch (error) {
    console.error('❌ Fehler beim Starten des Spiels:', error);
    showErrorScreen(error);
  }
}

// ========== Error Handling ==========

function showErrorScreen(error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f44336;
    color: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    z-index: 99999;
    max-width: 500px;
  `;
  
  errorDiv.innerHTML = `
    <h2>⚠️ Fehler beim Laden</h2>
    <p>${error.message}</p>
    <p style="font-size: 0.9em; margin-top: 20px;">
      Bitte überprüfe die Browser-Console für Details.
    </p>
    <button onclick="location.reload()" style="
      margin-top: 20px;
      padding: 10px 20px;
      background: white;
      color: #f44336;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">Seite neu laden</button>
  `;
  
  document.body.appendChild(errorDiv);
}

// ========== Page Load Event ==========

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  // DOM bereits geladen
  startGame();
}

// ========== Page Unload - Autosave ==========

window.addEventListener('beforeunload', () => {
  if (gameInstance) {
    gameInstance.syncToState();
    gameState.save(); // ← WICHTIG!
    console.log('💾 Spiel vor dem Schließen gespeichert');
  }
});

// ========== Visibility Change - Pause/Resume ==========

document.addEventListener('visibilitychange', () => {
  if (!gameInstance) return;
  
  if (document.hidden) {
    console.log('⏸️ Tab inaktiv - Game Loop pausiert');
    gameInstance.stopGameLoop();
    gameInstance.syncToState();
  } else {
    console.log('▶️ Tab aktiv - Game Loop fortgesetzt');
    gameInstance.startGameLoop();
  }
});

// ========== Export für andere Module ==========

export function getGameInstance() {
  return gameInstance;
}

export { gameInstance };
