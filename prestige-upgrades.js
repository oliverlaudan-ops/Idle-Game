// prestige-upgrades.js

export class PrestigeUpgrade {
  constructor(opts) {
    this.id = opts.id;
    this.name = opts.name;
    this.desc = opts.desc;
    this.prestigeCost = opts.prestigeCost; // Wieviel Prestige-Punkte kostet das Upgrade?
    this.single = !!opts.single; // Nur einmal kaufbar?
    this.applyFn = opts.apply;
    this.level = 0;
  }

  canBuy(gameState) {
    if (this.single && this.level > 0) return false;
    return (gameState.prestige ?? 0) >= this.getCurrentCost();
  }

  getCurrentCost() {
    // Du könntest auch skalierende Kosten pro Stufe umsetzen
    return this.prestigeCost;
  }

  buy(game, gameState) {
    if (!this.canBuy(gameState)) return false;
    gameState.prestige -= this.getCurrentCost();
    this.level++;
    if (typeof this.applyFn === 'function') this.applyFn(game, gameState, this.level);
    return true;
  }
}

// Beispiel-Liste für Prestige-Upgrades
const prestigeUpgradesList = [
  new PrestigeUpgrade({
  id: "global-mult-2x",
  name: "Globaler Multiplikator 2x",
  desc: "Alle Ressourcen-Produktion dauerhaft x2.",
  prestigeCost: 5,
  single: true,
  apply: (game, gameState, level) => {
    gameState.prestigeUpgradeMult = (gameState.prestigeUpgradeMult ?? 1) * 2;
  }
}),

  new PrestigeUpgrade({
    id: "auto-click",
    name: "Automatischer Klicker",
    desc: "Alle 5 Sekunden erhältst du automatisch einen Klick auf die zuletzt freigeschaltete Ressource.",
    prestigeCost: 8,
    single: true,
    apply: (game, gameState) => {
      if (game.autoClickerTimer) clearInterval(game.autoClickerTimer);
      game.autoClickerTimer = setInterval(() => {
        // Wichtig: auf die höchste freigeschaltete Ressource anwenden!
        const unlocked = Object.values(game.resources).filter(r => r.unlocked);
        const last = unlocked[unlocked.length - 1];
        if (last) last.add(last.rpc * (gameState.prestigeBonus ?? 1));
        game.renderStatsBar();
      }, 5000);
    }
  }),
  new PrestigeUpgrade({
    id: "offline-bonus",
    name: "Offline-Erträge",
    desc: "Du erhältst bei Rückkehr zusätzliche Ressourcen basierend auf deiner Spielzeit.",
    prestigeCost: 12,
    single: true,
    apply: (game, gameState) => {
      gameState.hasOfflineBonus = true;
    }
  })
];

export default prestigeUpgradesList;

