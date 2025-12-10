/**
 * offline-progress.js
 * Offline-Fortschritt Berechnung und Anzeige
 */

import gameState from './game-state.js';

// Konfiguration
const CONFIG = {
  maxOfflineTime: 8 * 60 * 60, // Maximal 8 Stunden in Sekunden
  baseEfficiency: 0.5,          // 50% Basis-Effizienz offline
  tickInterval: 1               // Normale Tick-Interval in Sekunden
};

/**
 * Berechnet Offline-Fortschritt
 * @param {Game} game - Game-Instanz
 * @param {number} offlineTime - Zeit in Sekunden
 * @returns {Object} Offline-Erträge
 */
export function calculateOfflineProgress(game, offlineTime) {
  // Maximal-Zeit begrenzen
  const cappedTime = Math.min(offlineTime, CONFIG.maxOfflineTime);
  
  // Effizienz berechnen (Basis + Prestige-Upgrade)
  let efficiency = CONFIG.baseEfficiency;
  if (gameState.hasOfflineBonus) {
    efficiency = 1.0; // 100% mit Prestige-Upgrade
  }
  
  // Anzahl der Ticks berechnen
  const ticks = cappedTime / CONFIG.tickInterval;
  
  // Ressourcen-Ertrag berechnen
  const earnings = {};
  const prestigeMultiplier = game.achievementPrestigeBonus || 1;
  
  for (let key in game.resources) {
    const res = game.resources[key];
    if (res.unlocked && res.rps > 0) {
      const baseEarnings = res.rps * ticks * efficiency * prestigeMultiplier;
      earnings[key] = baseEarnings;
    }
  }
  
  return {
    time: cappedTime,
    efficiency: efficiency,
    ticks: ticks,
    earnings: earnings,
    wasCapped: offlineTime > CONFIG.maxOfflineTime
  };
}

/**
 * Wendet Offline-Fortschritt auf das Spiel an
 * @param {Game} game - Game-Instanz
 * @param {Object} progress - Berechneter Fortschritt
 */
export function applyOfflineProgress(game, progress) {
  for (let key in progress.earnings) {
    const res = game.getResource(key);
    if (res) {
      res.add(progress.earnings[key]);
    }
  }
  
  // Speichern
  game.syncToState();
  gameState.save();
}

/**
 * Formatiert Zeitdauer in lesbare Form
 * @param {number} seconds - Zeit in Sekunden
 * @returns {string} Formatierte Zeit
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Prüft ob Offline-Progress angezeigt werden soll
 * @param {number} offlineTime - Zeit in Sekunden
 * @returns {boolean}
 */
export function shouldShowOfflineProgress(offlineTime) {
  // Nur anzeigen wenn mindestens 60 Sekunden offline
  return offlineTime >= 60;
}
