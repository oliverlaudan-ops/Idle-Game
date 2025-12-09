/**
 * game-core.js
 * Kernspiellogik ohne DOM-Manipulation
 */

import gameState from './game-state.js';
import resourcesList from './resources-def.js';
import upgradesList from './upgrades-def.js';
import researchUpgradesList from './research-def.js';
import prestigeUpgradesList, { PrestigeUpgrade } from './prestige-upgrades.js';
import { calculatePrestigePoints, doPrestige, getEffectivePrestigeBonus } from './prestige.js';

class Game {
  constructor() {
    this.resources = {};
    this.upgrades = [];
    this.prestigeUpgrades = [];
    this.tickMs = 1000;
    this.tickTimer = null;
    
    // DOM-Referenzen (werden von ui-init.js gesetzt)
    this.statsBarEl = null;
    this.actionsEl = null;
    this.upgradeGridEl = null;
    this.researchGridEl = null;
  }

  // ========== Resource Management ==========
  
  addResource(res) {
    this.resources[res.id] = res;
  }

  getResource(id) {
    return this.resources[id];
  }

  // ========== Upgrade Management ==========
  
  addUpgrade(upg) {
    this.upgrades.push(upg);
  }

  // ========== Game Data Setup ==========
  
  setupGameData() {
    // Resources laden
    for (const res of resourcesList) {
      this.addResource(Object.assign(Object.create(Object.getPrototypeOf(res)), res));
    }

    // Standard-Upgrades laden
    for (const upg of upgradesList) {
      this.addUpgrade(Object.assign(Object.create(Object.getPrototypeOf(upg)), upg));
    }

    // Forschungs-Upgrades laden
    for (const upg of researchUpgradesList) {
      this.addUpgrade(Object.assign(Object.create(Object.getPrototypeOf(upg)), upg));
    }

    // Prestige-Upgrades laden
    this.prestigeUpgrades = prestigeUpgradesList.map(
      upg => Object.assign(new PrestigeUpgrade({}), upg)
    );
  }

  // ========== Game Logic ==========
  
  recalculateResourceBonuses() {
    // Alle Ressourcen zurücksetzen
    for (const key in this.resources) {
      this.resources[key].rpc = (key === 'stein') ? 1 : 0;
      this.resources[key].rps = 0;
    }

    // Upgrade-Effekte anwenden
    for (let upg of this.upgrades) {
      if (upg.level > 0) {
        for (let i = 0; i < upg.level; ++i) {
          if (typeof upg.applyFn === 'function') {
            upg.applyFn(this);
          }
        }
      }
    }

    // Ressourcen freischalten
    for (let upg of this.upgrades) {
      if (upg.level > 0 && upg.unlocksResourceId) {
        const res = this.getResource(upg.unlocksResourceId);
        if (res) {
          res.unlocked = true;
          if (res.rpc === 0) res.rpc = 1;
        }
      }
    }
  }

  // ========== Game Loop ==========
  
  tick() {
    const mult = getEffectivePrestigeBonus(gameState);
    
    for (let key in this.resources) {
      const res = this.resources[key];
      if (res.unlocked && res.rps > 0) {
        res.add(res.rps * mult);
      }
    }
  }

  startGameLoop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    
    this.tickTimer = setInterval(() => {
      this.tick();
      // Callback für UI-Update (wird von außen gesetzt)
      if (this.onTick) {
        this.onTick();
      }
    }, this.tickMs);
  }

  stopGameLoop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  // ========== Save/Load State ==========
  
  syncToState() {
    for (let key in this.resources) {
      gameState[key] = this.resources[key].amount;
    }
    
    gameState.upgrades = this.upgrades.map(u => ({
      id: u.id,
      level: u.level
    }));
    
    gameState.prestigeUpgrades = this.prestigeUpgrades.map(u => ({
      id: u.id,
      level: u.level
    }));
  }

  syncFromState() {
    // Ressourcen-Mengen laden
    for (let key in this.resources) {
      this.resources[key].amount = gameState[key] ?? 0;
    }

    // Upgrade-Levels laden
    if (Array.isArray(gameState.upgrades)) {
      for (let u of this.upgrades) {
        let saved = gameState.upgrades.find(su => su.id === u.id);
        u.level = saved ? saved.level : 0;
      }
    }

    // Prestige-Upgrade-Levels laden
    if (Array.isArray(gameState.prestigeUpgrades)) {
      for (let u of this.prestigeUpgrades) {
        let saved = gameState.prestigeUpgrades.find(su => su.id === u.id);
        u.level = saved ? saved.level : 0;
      }
    }

    this.recalculateResourceBonuses();
  }

  // ========== Prestige Logic ==========
  
  canPrestige() {
    const steinRes = this.getResource('stein');
    return steinRes && steinRes.amount >= 1000;
  }

  performPrestige() {
    if (!this.canPrestige()) return false;

    const pointsGained = calculatePrestigePoints(gameState);
    doPrestige(gameState);
    
    // Game neu initialisieren
    this.syncFromState();
    
    return true;
  }

  getPrestigeInfo() {
    const pointsNow = calculatePrestigePoints(gameState);
    const currentPoints = gameState.prestige || 0;
    const gained = pointsNow - currentPoints;
    const effBonus = getEffectivePrestigeBonus(gameState);
    
    return {
      currentPoints,
      pointsAfterPrestige: pointsNow,
      gained,
      effectiveBonus: effBonus
    };
  }
}

export default Game;
