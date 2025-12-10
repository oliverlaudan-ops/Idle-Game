// prestige-upgrades.js

import { getEffectivePrestigeBonus } from "./prestige.js";

export class PrestigeUpgrade {
  constructor(opts) {
    this.id           = opts.id;
    this.name         = opts.name;
    this.desc         = opts.desc;
    this.prestigeCost = opts.prestigeCost; // Kosten in Prestige-Punkten
    this.single       = !!opts.single;     // Nur einmal kaufbar?
    this.applyFn      = opts.apply;
    this.level        = 0;
    this.persistent   = opts.persistent ?? true; // Standard: bleibt über Prestiges erhalten
  }

  canBuy(gameState) {
    if (this.single && this.level > 0) return false;
    return (gameState.prestige ?? 0) >= this.getCurrentCost();
  }

  getCurrentCost() {
    // aktuell feste Kosten, könnte später skalieren
    return this.prestigeCost;
  }

  buy(game, gameState) {
    if (!this.canBuy(gameState)) return false;

    gameState.prestige -= this.getCurrentCost();
    this.level++;

    if (typeof this.applyFn === "function") {
      this.applyFn(game, gameState, this.level);
    }

    gameState.save();
    return true;
  }
}

// Beispiel-Liste für Prestige-Upgrades
const prestigeUpgradesList = [
  // 1) Globaler Multiplikator – wirkt nur auf prestigeUpgradeMult
  new PrestigeUpgrade({
    id: "global-mult-2x",
    name: "Globaler Multiplikator 2x",
    desc: "Verdoppelt dauerhaft deinen Prestige-Upgrade-Multiplikator.",
    prestigeCost: 5,
    single: true,
    apply: (game, gameState, level) => {
      gameState.prestigeUpgradeMult =
        (gameState.prestigeUpgradeMult ?? 1) * 2;
    }
  }),

  // 2) Automatischer Klicker
  new PrestigeUpgrade({
    id: "auto-click",
    name: "Automatischer Klicker",
    desc: "Alle 5 Sekunden ein automatischer Klick auf die zuletzt freigeschaltete Ressource.",
    prestigeCost: 8,
    single: true,
    apply: (game, gameState) => {
      if (game.autoClickerTimer) clearInterval(game.autoClickerTimer);

      game.autoClickerTimer = setInterval(() => {
        const unlocked = Object.values(game.resources).filter(
          r => r.unlocked
        );
        const last = unlocked[unlocked.length - 1];
        if (!last) return;

        const mult = getEffectivePrestigeBonus(gameState);
        last.add(last.rpc * mult);
        game.renderStatsBar();
      }, 5000);
    }
  }),

  // 3) Offline-Erträge (Flag im State)
  new PrestigeUpgrade({
  id: "offline-bonus",
  name: "Offline-Erträge",
  desc: "Offline-Produktion: 100% statt 50% Effizienz. Maximale Offline-Zeit erhöht auf 8 Stunden.",
  prestigeCost: 12,
  single: true,
  persistent: true, // ← WICHTIG: Bleibt nach Prestige erhalten
  apply: (game, gameState) => {
    gameState.hasOfflineBonus = true;
  }
})
];

export default prestigeUpgradesList;
