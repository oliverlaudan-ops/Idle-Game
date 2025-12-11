// prestige.js

export const resourcePrestigeValue = {
  stein:    1,  // 1 Mio Stein = 1 Punkt
  holz:     2,  // 0.5 Mio Holz = 1 Punkt
  ton:      4,  // 0.25 Mio Ton = 1 Punkt
  metall:  10,  // 0.1 Mio Metall = 1 Punkt
  kristall: 50  // 20k Kristall = 1 Punkt
};

// Zentraler Helper: effektiver Prestige-Bonus
export function getEffectivePrestigeBonus(gameState) {
  const base = gameState.prestigeBaseBonus  ?? 1;
  const upg  = gameState.prestigeUpgradeMult ?? 1;
  return base * upg;
}

export function calculatePrestigePoints(gameState) {
  let total = 0;

  for (const res in resourcePrestigeValue) {
    const limitFactor = resourcePrestigeValue[res];

    // Gesamtverdienst bevorzugen, sonst aktueller Stand
    const earned =
      (gameState.totalEarned &&
        typeof gameState.totalEarned[res] === "number"
        ? gameState.totalEarned[res]
        : 0) ||
      gameState[res] ||
      0;

    // Beispiel: 2.000.000 Stein / (1.000.000 / 1) = 2 Punkte
    total += earned / (1_000_000 / limitFactor);
  }

  return Math.floor(total); // nur ganze Punkte
}

export function doPrestige(game, gameState) {
  const totalPrestige = calculatePrestigePoints(gameState);
  const gained = totalPrestige - (gameState.prestige || 0);
  if (gained <= 0) return false;

  // Prestige-Zähler aktualisieren
  gameState.prestige = totalPrestige;

  // Basis-Bonus nur aus Prestige-Punkten (sanfte Wurzel-Skalierung)
  const p = gameState.prestige;
  gameState.prestigeBaseBonus = 1 + Math.sqrt(p) * 0.1;

  // Ressourcen soft-resetten
  for (const key in game.resources) {
    game.resources[key].amount = 0;
    gameState[key] = 0;
    if (key !== "stein") {
      game.resources[key].unlocked = false;
    }
  }

  // TotalEarned zurücksetzen
  if (gameState.totalEarned) {
    for (const res in gameState.totalEarned) {
      gameState.totalEarned[res] = 0;
    }
  }

  // Alle normalen Upgrades zurücksetzen
  game.upgrades.forEach(u => (u.level = 0));
  
  // Prestige-Upgrades nur zurücksetzen, wenn nicht persistent
  game.prestigeUpgrades.forEach(u => {
    if (!u.persistent) u.level = 0;
  });

  // WICHTIG: hasOfflineBonus NICHT zurücksetzen - bleibt bestehen!
  // gameState.hasOfflineBonus bleibt wie es ist

  // Boni neu berechnen und speichern
  game.recalculateResourceBonuses();
  game.syncToState();
  gameState.save();

  const effBonus = getEffectivePrestigeBonus(gameState);
  alert(
    `Du hast ${gained} Prestige-Punkte erhalten!\nBonus jetzt: x${effBonus.toFixed(2)}`
  );
  return true;
}

